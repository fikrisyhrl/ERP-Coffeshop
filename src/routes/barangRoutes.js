const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barangController');
const { validateBarangPayload } = require('../middlewares/barangValidator');

// GET /api/barang - Ambil semua barang
router.get('/', barangController.getAllBarang);

// GET /api/barang/:id - Ambil satu barang berdasarkan ID
router.get('/:id', barangController.getBarangById);

// POST /api/barang - Tambah barang baru (dengan validasi payload)
router.post('/', validateBarangPayload, barangController.createBarang);

// PUT /api/barang/:id - Update data barang (dengan validasi payload)
router.put('/:id', validateBarangPayload, barangController.updateBarang);

// DELETE /api/barang/:id - Hapus barang berdasarkan ID
router.delete('/:id', barangController.deleteBarang);

module.exports = router;
