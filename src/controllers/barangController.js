const { Op } = require('sequelize');
const Barang = require('../models/Barang');

/**
 * Controller untuk mengelola Master Barang (Inventory)
 */
const barangController = {
  /**
   * GET /api/barang
   * Mengambil semua daftar barang (dengan fitur pencarian, filter kategori, dan pagination)
   */
  getAllBarang: async (req, res, next) => {
    try {
      const { search, kategori, page = 1, limit = 10, sort_by = 'created_at', order = 'DESC' } = req.query;

      // Filter query dinamis
      const whereClause = {};

      if (search) {
        whereClause.nama_barang = {
          [Op.like]: `%${search}%`
        };
      }

      if (kategori) {
        whereClause.kategori = kategori;
      }

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const limitNumber = parseInt(limit, 10);

      const { count, rows } = await Barang.findAndCountAll({
        where: whereClause,
        order: [[sort_by, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
        limit: limitNumber,
        offset: offset
      });

      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil daftar barang',
        meta: {
          total_data: count,
          current_page: parseInt(page, 10),
          total_pages: Math.ceil(count / limitNumber),
          limit: limitNumber
        },
        data: rows
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/barang/:id
   * Mengambil rincian satu barang berdasarkan ID
   */
  getBarangById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const barang = await Barang.findByPk(id);

      if (!barang) {
        return res.status(404).json({
          success: false,
          message: `Barang dengan ID ${id} tidak ditemukan`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Rincian data barang berhasil ditemukan',
        data: barang
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/barang
   * Menambahkan barang baru ke master inventaris
   */
  createBarang: async (req, res, next) => {
    try {
      const {
        nama_barang,
        kategori,
        satuan,
        harga_satuan,
        batas_safety_stock,
        supplier_id,
        quality_grade,
        stok_saat_ini
      } = req.body;

      if (!nama_barang) {
        return res.status(400).json({
          success: false,
          message: 'Nama barang wajib diisi'
        });
      }

      // Buat data baru via Sequelize
      const barangBaru = await Barang.create({
        nama_barang: nama_barang.trim(),
        kategori: kategori ? kategori.trim() : 'Bahan Baku',
        satuan: satuan ? satuan.trim() : 'unit',
        harga_satuan: parseFloat(harga_satuan || 0),
        batas_safety_stock: parseFloat(batas_safety_stock || 0),
        stok_saat_ini: parseFloat(stok_saat_ini || 0),
        supplier_id: supplier_id ? parseInt(supplier_id) : null,
        quality_grade: quality_grade || 'GRADE_A'
      });

      return res.status(201).json({
        success: true,
        message: `Bahan baku '${barangBaru.nama_barang}' berhasil ditambahkan ke inventaris`,
        data: barangBaru
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/barang/:id
   * Memperbarui informasi barang yang sudah ada
   */
  updateBarang: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nama_barang, kategori, satuan, harga_satuan, batas_safety_stock } = req.body;

      const barang = await Barang.findByPk(id);

      if (!barang) {
        return res.status(404).json({
          success: false,
          message: `Barang dengan ID ${id} tidak ditemukan`
        });
      }

      // Perbarui atribut barang
      await barang.update({
        nama_barang: nama_barang ? nama_barang.trim() : barang.nama_barang,
        kategori: kategori ? kategori.trim() : barang.kategori,
        satuan: satuan ? satuan.trim() : barang.satuan,
        harga_satuan: harga_satuan !== undefined ? parseFloat(harga_satuan) : barang.harga_satuan,
        batas_safety_stock: batas_safety_stock !== undefined ? parseFloat(batas_safety_stock) : barang.batas_safety_stock
      });

      return res.status(200).json({
        success: true,
        message: `Data barang ID ${id} berhasil diperbarui`,
        data: barang
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/barang/:id
   * Menghapus barang dari database
   */
  deleteBarang: async (req, res, next) => {
    try {
      const { id } = req.params;

      const barang = await Barang.findByPk(id);

      if (!barang) {
        return res.status(404).json({
          success: false,
          message: `Barang dengan ID ${id} tidak ditemukan`
        });
      }

      await barang.destroy();

      return res.status(200).json({
        success: true,
        message: `Barang '${barang.nama_barang}' (ID: ${id}) berhasil dihapus dari inventaris`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = barangController;
