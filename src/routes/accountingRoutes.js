const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');

// Inisialisasi & Daftar Chart of Accounts
router.post('/seed-coa', accountingController.seedCoA);
router.get('/coa', accountingController.getAllCoA);

// Pencatatan Jurnal
router.get('/jurnal', accountingController.getAllJurnal);
router.post('/jurnal/manual', accountingController.jurnalManual);

// Skenario 1: Jurnal Pembayaran Gaji Karyawan (Payroll)
router.post('/jurnal/payroll', accountingController.jurnalPayroll);

// Skenario 2: Jurnal Pembelian Bahan Baku Tunai (Procurement)
router.post('/jurnal/pembelian-tunai', accountingController.jurnalPembelianTunai);

// Verifikasi & Persetujuan Pengajuan Pembelian Procurement (Approval Finance)
router.get('/pengajuan-po', accountingController.getPengajuanPO);
router.patch('/pengajuan-po/:id/setujui', accountingController.setujuiPengajuanPO);
router.patch('/pengajuan-po/:id/tolak', accountingController.tolakPengajuanPO);

module.exports = router;
