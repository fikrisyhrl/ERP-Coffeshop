const express = require('express');
const router = express.Router();
const barangRoutes = require('./barangRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const procurementRoutes = require('./procurementRoutes');
const payrollRoutes = require('./payrollRoutes');
const accountingRoutes = require('./accountingRoutes');

// Mount Rute-rute ERP Moduler
router.use('/barang', barangRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/procurement', procurementRoutes);
router.use('/hcm/payroll', payrollRoutes);
router.use('/hcm', payrollRoutes);
router.use('/finance', accountingRoutes);

// Info Root API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang di API Sistem ERP Coffee Shop',
    dashboard_ui: 'Untuk membuka antarmuka visual website (UI), silakan akses http://localhost:5000 di browser Anda',
    version: '1.0.0',
    available_modules: {
      master_barang: '/api/barang',
      inventory: '/api/inventory',
      procurement: '/api/procurement',
      hcm_payroll: '/api/hcm/payroll',
      finance_accounting: '/api/finance'
    }
  });
});

module.exports = router;
