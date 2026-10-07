const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// GET, POST, DELETE /api/hcm/payroll/pegawai & /api/hcm/pegawai
router.get('/pegawai', payrollController.getAllPegawai);
router.post('/pegawai', payrollController.createPegawai);
router.delete('/pegawai/:id', payrollController.deletePegawai);

// GET /api/hcm/payroll/absensi & /api/hcm/absensi
router.get('/absensi', payrollController.getAllAbsensi);

// GET /api/hcm/payroll/list
router.get('/list', payrollController.getAllPayroll);
router.get('/', payrollController.getAllPayroll);

// POST /api/hcm/payroll/seed-demo - Buat data demo Pegawai & 24 hari Absensi untuk simulasi
router.post('/seed-demo', payrollController.seedDemoData);

// POST /api/hcm/payroll/hitung/:pegawai_id - Hitung otomatis slip gaji bulanan pegawai
router.post('/hitung/:pegawai_id', payrollController.hitungPayroll);

// GET /api/hcm/payroll/slip/:payroll_id - Ambil detail slip gaji tersimpan
router.get('/slip/:payroll_id', payrollController.getSlipGaji);

module.exports = router;
