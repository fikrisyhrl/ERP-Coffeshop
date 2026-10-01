const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// POST /api/inventory/mutasi-keluar - Catat pemakaian stok (mengevaluasi safety stock & memicu auto-PO)
router.post('/mutasi-keluar', inventoryController.catatMutasiKeluar);

// GET /api/inventory/mutasi - Ambil semua riwayat mutasi stok
router.get('/mutasi', inventoryController.getAllMutasi);

// GET /api/inventory/kartu-stok/:id_barang - Ambil kartu stok riwayat mutasi
router.get('/kartu-stok/:id_barang', inventoryController.getKartuStok);

module.exports = router;
