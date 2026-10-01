const {
  sequelize,
  Barang,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  StockMutation,
  Supplier
} = require('../models');

/**
 * Service untuk menangani operasional Procurement & Goods Receipt
 */
const procurementService = {
  /**
   * Mengajukan PO dari status DRAFT menjadi PENDING_APPROVAL ke Modul Finance
   */
  ajukanKeFinance: async (po_id) => {
    const po = await PurchaseOrder.findByPk(po_id);
    if (!po) {
      throw new Error(`Purchase Order dengan ID ${po_id} tidak ditemukan`);
    }

    if (po.status !== 'DRAFT') {
      throw new Error(`Hanya PO berstatus 'DRAFT' yang dapat diajukan. Status saat ini: ${po.status}`);
    }

    po.status = 'PENDING_APPROVAL';
    await po.save();

    return po;
  },

  /**
   * Menyetujui pengajuan pembelian oleh pihak Finance (Status -> CONFIRMED)
   * Setelah disetujui, pembelian dapat dimasukkan ke daftar aktif dan dilaksanakan.
   */
  setujuiPengajuanFinance: async (po_id, { disetujui_oleh = 'Finance Officer', catatan_finance = '' } = {}) => {
    const po = await PurchaseOrder.findByPk(po_id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Barang, as: 'barang' }] }
      ]
    });

    if (!po) {
      throw new Error(`Pengajuan Purchase Order dengan ID ${po_id} tidak ditemukan`);
    }

    if (po.status === 'CONFIRMED') {
      return po; // Sudah disetujui sebelumnya
    }

    if (po.status === 'REJECTED') {
      throw new Error(`Pengajuan PO #${po.nomor_po} sudah pernah DITOLAK oleh Finance dan tidak dapat disetujui kembali.`);
    }

    if (po.status !== 'PENDING_APPROVAL' && po.status !== 'DRAFT') {
      throw new Error(`Hanya PO berstatus 'PENDING_APPROVAL' atau 'DRAFT' yang dapat disetujui oleh Finance. Status saat ini: '${po.status}'`);
    }

    po.status = 'CONFIRMED';
    po.disetujui_oleh = disetujui_oleh;
    po.tanggal_approval = new Date();
    po.catatan_finance = catatan_finance || 'Disetujui oleh Bagian Finance. Pembelian siap dilaksanakan.';
    await po.save();

    return po;
  },

  /**
   * Menolak pengajuan pembelian oleh pihak Finance (Status -> REJECTED)
   * Jika ditolak, pengajuan dibatalkan dan tidak dapat diproses lebih lanjut.
   */
  tolakPengajuanFinance: async (po_id, { ditolak_oleh = 'Finance Officer', alasan_penolakan = '' } = {}) => {
    const po = await PurchaseOrder.findByPk(po_id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Barang, as: 'barang' }] }
      ]
    });

    if (!po) {
      throw new Error(`Pengajuan Purchase Order dengan ID ${po_id} tidak ditemukan`);
    }

    if (po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'COMPLETED') {
      throw new Error(`PO #${po.nomor_po} sudah disetujui/sedang berjalan (${po.status}) dan tidak dapat ditolak.`);
    }

    po.status = 'REJECTED';
    po.disetujui_oleh = ditolak_oleh;
    po.tanggal_approval = new Date();
    po.catatan_finance = alasan_penolakan || 'Pengajuan pembelian DITOLAK oleh Bagian Finance (Pengajuan Dibatalkan).';
    await po.save();

    return po;
  },

  /**
   * Mengonfirmasi PO (Kompatibilitas mundur, kini diteruskan sebagai persetujuan Finance)
   */
  konfirmasiPO: async (po_id, opts = {}) => {
    return procurementService.setujuiPengajuanFinance(po_id, opts);
  },

  /**
   * Fungsi 'Terima Barang' (Goods Receipt / GRN)
   * 1. Menambah stok fisik di tabel Inventory (master_barang & stock_mutations)
   * 2. Menghitung ulang Harga Pokok Penjualan (HPP / Moving Average Cost)
   * 3. Memperbarui status penerimaan pada Purchase Order (PO)
   *
   * @param {Object} payload
   * @param {number} payload.po_id - ID Purchase Order yang diterima
   * @param {string} payload.nomor_surat_jalan - No surat jalan dari vendor
   * @param {string} payload.diterima_oleh - Nama penerima (Barista / Store Manager)
   * @param {string} [payload.catatan] - Catatan kondisi barang
   * @param {Array<Object>} payload.items - Daftar barang yang diterima
   */
  terimaBarang: async ({ po_id, nomor_surat_jalan, diterima_oleh, catatan = '', items = [] }) => {
    if (!items || items.length === 0) {
      throw new Error('Daftar barang yang diterima (items) tidak boleh kosong');
    }

    const t = await sequelize.transaction();

    try {
      // 1. Validasi PO
      const po = await PurchaseOrder.findByPk(po_id, {
        include: [{ model: PurchaseOrderItem, as: 'items' }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!po) {
        throw new Error(`Purchase Order dengan ID ${po_id} tidak ditemukan`);
      }

      // Validasi Alur Approval Finance
      if (po.status === 'PENDING_APPROVAL') {
        throw new Error(
          `Barang belum dapat diterima. Purchase Order #${po.nomor_po} masih MENUNGGU PERSETUJUAN dari Tim Finance.`
        );
      }

      if (po.status === 'REJECTED') {
        throw new Error(
          `Barang tidak dapat diterima. Purchase Order #${po.nomor_po} telah DITOLAK oleh Tim Finance (Pengajuan Dibatalkan).`
        );
      }

      if (po.status !== 'CONFIRMED' && po.status !== 'PARTIALLY_RECEIVED') {
        throw new Error(
          `Barang hanya dapat diterima untuk PO dengan status 'CONFIRMED' (disetujui Finance) atau 'PARTIALLY_RECEIVED'. Status saat ini: '${po.status}'`
        );
      }

      // 2. Buat Header Penerimaan Barang (Goods Receipt)
      const nomorPenerimaan = `GRN-${Date.now().toString().slice(-6)}`;
      const goodsReceipt = await GoodsReceipt.create(
        {
          nomor_penerimaan: nomorPenerimaan,
          po_id: po.id_po,
          nomor_surat_jalan,
          tanggal_terima: new Date(),
          diterima_oleh,
          catatan
        },
        { transaction: t }
      );

      const auditHasilPenerimaan = [];

      // 3. Proses setiap item barang yang masuk
      for (const item of items) {
        const { po_item_id, id_barang, jumlah_diterima, harga_beli_satuan, batch_number, tanggal_kadaluarsa } = item;

        const qtyMasuk = parseFloat(jumlah_diterima);
        const hargaBeliBaru = parseFloat(harga_beli_satuan);

        if (isNaN(qtyMasuk) || qtyMasuk <= 0) {
          throw new Error(`Jumlah diterima untuk item ID ${id_barang} harus lebih dari 0`);
        }
        if (isNaN(hargaBeliBaru) || hargaBeliBaru < 0) {
          throw new Error(`Harga beli satuan untuk item ID ${id_barang} tidak valid`);
        }

        // Cari item baris pada PO
        const poItem = await PurchaseOrderItem.findOne({
          where: { id_po_item: po_item_id, po_id: po.id_po },
          transaction: t
        });

        if (!poItem) {
          throw new Error(`Item PO ID ${po_item_id} tidak terdaftar pada PO #${po.nomor_po}`);
        }

        // Kunci baris master barang untuk kalkulasi atomik
        const barang = await Barang.findByPk(id_barang, {
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (!barang) {
          throw new Error(`Barang ID ${id_barang} tidak ditemukan`);
        }

        const stokLama = parseFloat(barang.stok_saat_ini);
        const hppLama = parseFloat(barang.harga_satuan);

        // ====================================================================
        // FORMULA METODE MOVING WEIGHTED AVERAGE COST (HPP RATA-RATA BERGERAK):
        // HPP Baru = ((Stok Lama * HPP Lama) + (Qty Masuk * Harga Beli Baru)) / (Stok Lama + Qty Masuk)
        // ====================================================================
        const stokValidLama = stokLama > 0 ? stokLama : 0;
        const totalNilaiPersediaanLama = stokValidLama * hppLama;
        const totalNilaiPembelianBaru = qtyMasuk * hargaBeliBaru;
        const totalStokBaru = stokValidLama + qtyMasuk;

        let hppBaru = hargaBeliBaru;
        if (totalStokBaru > 0) {
          hppBaru = (totalNilaiPersediaanLama + totalNilaiPembelianBaru) / totalStokBaru;
          hppBaru = Math.round(hppBaru * 100) / 100; // Pembulatan 2 desimal
        }

        const stokFisikBaru = Math.round((stokLama + qtyMasuk) * 1000) / 1000;

        // Update data master barang
        await barang.update(
          {
            stok_saat_ini: stokFisikBaru,
            harga_satuan: hppBaru
          },
          { transaction: t }
        );

        // Catat detail penerimaan barang (GoodsReceiptItem)
        await GoodsReceiptItem.create(
          {
            penerimaan_id: goodsReceipt.id_penerimaan,
            po_item_id: poItem.id_po_item,
            id_barang: barang.id_barang,
            jumlah_diterima: qtyMasuk,
            harga_beli_satuan: hargaBeliBaru,
            batch_number: batch_number || null,
            tanggal_kadaluarsa: tanggal_kadaluarsa || null
          },
          { transaction: t }
        );

        // Catat Mutasi Masuk pada Kartu Stok (StockMutation)
        await StockMutation.create(
          {
            id_barang: barang.id_barang,
            tipe_mutasi: 'IN_PROCUREMENT',
            jumlah_masuk: qtyMasuk,
            jumlah_keluar: 0,
            saldo_akhir: stokFisikBaru,
            harga_satuan: hppBaru,
            referensi_tipe: 'GOODS_RECEIPT',
            referensi_id: goodsReceipt.id_penerimaan,
            keterangan: `Penerimaan barang dari PO #${po.nomor_po}, No Surat Jalan: ${nomor_surat_jalan}`
          },
          { transaction: t }
        );

        // Update jumlah akumulasi diterima pada baris PO
        const akumulasiDiterima = parseFloat(poItem.jumlah_diterima) + qtyMasuk;
        await poItem.update({ jumlah_diterima: akumulasiDiterima }, { transaction: t });

        auditHasilPenerimaan.push({
          id_barang: barang.id_barang,
          nama_barang: barang.nama_barang,
          satuan: barang.satuan,
          stok_sebelumnya: stokLama,
          jumlah_masuk: qtyMasuk,
          stok_sekarang: stokFisikBaru,
          hpp_sebelumnya: hppLama,
          harga_beli_faktur: hargaBeliBaru,
          hpp_rata_rata_baru: hppBaru
        });
      }

      // 4. Periksa apakah seluruh item pada PO sudah terpenuhi
      const allPoItems = await PurchaseOrderItem.findAll({
        where: { po_id: po.id_po },
        transaction: t
      });

      const isAllCompleted = allPoItems.every(
        (pi) => parseFloat(pi.jumlah_diterima) >= parseFloat(pi.jumlah_pesan)
      );

      po.status = isAllCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
      await po.save({ transaction: t });

      await t.commit();

      return {
        success: true,
        message: 'Barang berhasil diterima, stok bertambah, dan HPP rata-rata berhasil dikalkulasi ulang',
        data: {
          goods_receipt: {
            id_penerimaan: goodsReceipt.id_penerimaan,
            nomor_penerimaan: goodsReceipt.nomor_penerimaan,
            nomor_surat_jalan: goodsReceipt.nomor_surat_jalan,
            diterima_oleh: goodsReceipt.diterima_oleh,
            tanggal_terima: goodsReceipt.tanggal_terima
          },
          po_status_terkini: po.status,
          rincian_barang: auditHasilPenerimaan
        }
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
};

module.exports = procurementService;
