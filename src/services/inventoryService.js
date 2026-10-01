const { sequelize, Barang, StockMutation, PurchaseOrder, PurchaseOrderItem, Supplier } = require('../models');

/**
 * Service untuk operasi inventaris & integrasi ke procurement
 */
const inventoryService = {
  /**
   * Mengurangi stok bahan baku dan secara otomatis mengecek batas safety stock
   * Jika stok <= batas_safety_stock, otomatis membuat Draft Purchase Order (PO).
   *
   * @param {Object} params
   * @param {number} params.id_barang - ID barang yang keluar
   * @param {number} params.jumlah_keluar - Kuantitas bahan baku yang keluar (misal: gram bubuk kopi, ml susu)
   * @param {string} params.tipe_mutasi - 'OUT_SALES_POS' | 'OUT_WASTE_SPOILAGE' | 'OUT_ADJUSTMENT'
   * @param {string} [params.referensi_tipe] - Contoh: 'POS_ORDER', 'WASTE_LOG'
   * @param {number} [params.referensi_id] - ID pesanan kasir / ID form waste
   * @param {string} [params.keterangan] - Catatan tambahan
   */
  kurangiStokBahan: async ({
    id_barang,
    jumlah_keluar,
    tipe_mutasi = 'OUT_SALES_POS',
    referensi_tipe = 'POS_ORDER',
    referensi_id = null,
    keterangan = 'Pengurangan stok dari operasional coffee shop'
  }) => {
    const t = await sequelize.transaction();

    try {
      const parsedQty = parseFloat(jumlah_keluar);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        throw new Error('Jumlah keluar harus berupa angka lebih besar dari 0');
      }

      // 1. Kunci baris barang dengan LOCK.UPDATE agar thread-safe terhadap penjualan bersamaan
      const barang = await Barang.findByPk(id_barang, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!barang) {
        throw new Error(`Barang dengan ID ${id_barang} tidak ditemukan`);
      }

      const stokLama = parseFloat(barang.stok_saat_ini);
      if (stokLama < parsedQty) {
        throw new Error(
          `Stok tidak mencukupi untuk '${barang.nama_barang}'. Sisa stok: ${stokLama} ${barang.satuan}, diminta: ${parsedQty} ${barang.satuan}`
        );
      }

      // 2. Hitung saldo stok baru
      const stokBaru = Math.round((stokLama - parsedQty) * 1000) / 1000;

      // 3. Update stok fisik di master barang
      await barang.update(
        {
          stok_saat_ini: stokBaru
        },
        { transaction: t }
      );

      // 4. Catat mutasi keluar di Kartu Stok (StockMutation)
      const mutasi = await StockMutation.create(
        {
          id_barang: barang.id_barang,
          tipe_mutasi,
          jumlah_masuk: 0,
          jumlah_keluar: parsedQty,
          saldo_akhir: stokBaru,
          harga_satuan: barang.harga_satuan,
          referensi_tipe,
          referensi_id,
          keterangan
        },
        { transaction: t }
      );

      // 5. EVALUASI SAFETY STOCK & AUTO-PO DRAFT
      let autoPoCreated = false;
      let poDetails = null;

      const safetyStockLevel = parseFloat(barang.batas_safety_stock);

      if (stokBaru <= safetyStockLevel) {
        // Cek apakah sudah ada PO yang berstatus PENDING_APPROVAL, DRAFT, atau CONFIRMED untuk barang ini
        // Hal ini untuk mencegah pembuatan draf PO berulang kali setiap ada cup kopi terjual
        const existingActivePo = await PurchaseOrderItem.findOne({
          where: { id_barang: barang.id_barang },
          include: [
            {
              model: PurchaseOrder,
              where: {
                status: ['DRAFT', 'PENDING_APPROVAL', 'CONFIRMED']
              }
            }
          ],
          transaction: t
        });

        if (!existingActivePo) {
          // Cari supplier yang ditunjuk, jika belum diset ambil supplier pertama yang aktif
          let supplierId = barang.supplier_id;
          if (!supplierId) {
            const firstSupplier = await Supplier.findOne({ transaction: t });
            supplierId = firstSupplier ? firstSupplier.id_supplier : 1;
          }

          // Formula kuantitas pemesanan otomatis (Re-order Quantity):
          // Misal: Pesan 2x lipat dari batas safety stock agar aman sampai siklus berikutnya
          const reorderQty = safetyStockLevel > 0 ? safetyStockLevel * 2 : 10;
          const hargaSatuanEstimasi = parseFloat(barang.harga_satuan);
          const totalEstimasi = reorderQty * hargaSatuanEstimasi;

          const nomorPoOtomatis = `PO-AUTO-${Date.now().toString().slice(-6)}`;

          // Buat Header Purchase Order (PENDING_APPROVAL masuk ke Finance)
          const newPo = await PurchaseOrder.create(
            {
              nomor_po: nomorPoOtomatis,
              supplier_id: supplierId,
              tanggal_po: new Date(),
              status: 'PENDING_APPROVAL',
              total_estimasi: totalEstimasi,
              is_auto_generated: true,
              catatan: `[AUTO-GENERATED ERP] Stok barang '${barang.nama_barang}' tersisa ${stokBaru} ${barang.satuan} (Batas Safety Stock: ${safetyStockLevel} ${barang.satuan}). Permintaan pembelian diteruskan ke Modul Finance untuk persetujuan (approval).`
            },
            { transaction: t }
          );

          // Buat Detail Item PO
          const newPoItem = await PurchaseOrderItem.create(
            {
              po_id: newPo.id_po,
              id_barang: barang.id_barang,
              jumlah_pesan: reorderQty,
              jumlah_diterima: 0,
              harga_satuan_estimasi: hargaSatuanEstimasi,
              subtotal: totalEstimasi
            },
            { transaction: t }
          );

          autoPoCreated = true;
          poDetails = {
            id_po: newPo.id_po,
            nomor_po: newPo.nomor_po,
            jumlah_pesan: newPoItem.jumlah_pesan,
            status: newPo.status,
            catatan: newPo.catatan
          };
        }
      }

      await t.commit();

      return {
        success: true,
        message: 'Pengurangan stok berhasil dicatat',
        data: {
          id_barang: barang.id_barang,
          nama_barang: barang.nama_barang,
          stok_sebelumnya: stokLama,
          jumlah_keluar: parsedQty,
          stok_sekarang: stokBaru,
          batas_safety_stock: safetyStockLevel,
          satuan: barang.satuan,
          status_stok: stokBaru <= safetyStockLevel ? 'WARNING_SAFETY_STOCK_REACHED' : 'SAFE',
          auto_po_triggered: autoPoCreated,
          po_info: poDetails,
          mutasi_id: mutasi.id_mutasi
        }
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
};

module.exports = inventoryService;
