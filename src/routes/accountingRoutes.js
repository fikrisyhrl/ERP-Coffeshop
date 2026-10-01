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

// Invoice Tagihan Pembelian Barang PO (Vendor Invoices)
router.get('/invoices', accountingController.getAllInvoices);
router.post('/invoices', accountingController.createInvoice);
router.patch('/invoices/:id/bayar', accountingController.bayarInvoice);

// Saldo Uang Tersedia & Manajemen Data Keuangan Realtime
router.get('/cash-balance', accountingController.getCashBalance);
router.post('/cash-mutation', accountingController.catatMutasiKas);

module.exports = router;
