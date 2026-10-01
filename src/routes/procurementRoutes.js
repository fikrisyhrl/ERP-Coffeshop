const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');

// GET /api/procurement/supplier - Ambil daftar supplier
router.get('/supplier', procurementController.getAllSuppliers);

// POST /api/procurement/supplier - Tambah supplier baru
router.post('/supplier', procurementController.tambahSupplier);

// GET /api/procurement/po - Ambil semua daftar PO
router.get('/po', procurementController.getAllPO);

// POST /api/procurement/po - Buat PO pengajuan ke Finance
router.post('/po', procurementController.buatPO);

// PATCH /api/procurement/po/:id/ajukan-finance - Ajukan PO berstatus DRAFT ke Finance
router.patch('/po/:id/ajukan-finance', procurementController.ajukanKeFinance);

// PATCH /api/procurement/po/:id/konfirmasi - Konfirmasi status PO (DRAFT/PENDING -> CONFIRMED)
router.patch('/po/:id/konfirmasi', procurementController.konfirmasiPO);

// POST /api/procurement/terima-barang - Terima barang (Goods Receipt) & kalkulasi ulang HPP
router.post('/terima-barang', procurementController.terimaBarang);

module.exports = router;
