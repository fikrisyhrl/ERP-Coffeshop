const inventoryService = require('../services/inventoryService');
const { StockMutation, Barang } = require('../models');

const inventoryController = {
  /**
   * POST /api/inventory/mutasi-keluar
   * Mencatat pemakaian bahan baku (penjualan kasir, resep kopi, waste/tumpah)
   * Otomatis memicu pembuatan Draft PO jika stok <= safety_stock
   */
  catatMutasiKeluar: async (req, res, next) => {
    try {
      const { id_barang, jumlah_keluar, tipe_mutasi, referensi_tipe, referensi_id, keterangan } = req.body;

      if (!id_barang || !jumlah_keluar) {
        return res.status(400).json({
          success: false,
          message: 'id_barang dan jumlah_keluar wajib diisi'
        });
      }

      const hasil = await inventoryService.kurangiStokBahan({
        id_barang,
        jumlah_keluar,
        tipe_mutasi: tipe_mutasi || 'OUT_SALES_POS',
        referensi_tipe,
        referensi_id,
        keterangan
      });

      return res.status(200).json(hasil);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/inventory/kartu-stok/:id_barang
   * Mengambil riwayat mutasi stok untuk satu bahan baku tertentu
   */
  getKartuStok: async (req, res, next) => {
    try {
      const { id_barang } = req.params;

      const barang = await Barang.findByPk(id_barang);
      if (!barang) {
        return res.status(404).json({
          success: false,
          message: `Barang dengan ID ${id_barang} tidak ditemukan`
        });
      }

      const riwayatMutasi = await StockMutation.findAll({
        where: { id_barang },
        order: [['created_at', 'DESC']],
        limit: 50
      });

      return res.status(200).json({
        success: true,
        data: {
          barang: {
            id_barang: barang.id_barang,
            nama_barang: barang.nama_barang,
            satuan: barang.satuan,
            stok_saat_ini: barang.stok_saat_ini,
            harga_satuan_hpp: barang.harga_satuan,
            batas_safety_stock: barang.batas_safety_stock
          },
          mutasi: riwayatMutasi
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/inventory/mutasi
   * Mengambil semua riwayat mutasi stok terbaru across all items
   */
  getAllMutasi: async (req, res, next) => {
    try {
      const mutasi = await StockMutation.findAll({
        include: [{ model: Barang, as: 'barang', attributes: ['id_barang', 'nama_barang', 'satuan'] }],
        order: [['created_at', 'DESC']],
        limit: 50
      });
      return res.status(200).json({ success: true, data: mutasi });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = inventoryController;
