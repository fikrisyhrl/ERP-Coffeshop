const express = require('express');
const router = express.Router();
const barangRoutes = require('./barangRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const procurementRoutes = require('./procurementRoutes');
const payrollRoutes = require('./payrollRoutes');
const accountingRoutes = require('./accountingRoutes');
const userRoutes = require('./userRoutes');

// Mount Rute-rute ERP Moduler
router.use('/barang', barangRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/procurement', procurementRoutes);
router.use('/hcm/payroll', payrollRoutes);
router.use('/hcm', payrollRoutes);
router.use('/finance', accountingRoutes);
router.use('/users', userRoutes);
router.use('/auth', userRoutes);

// Endpoint Diagnostik Koneksi Database
router.get('/diagnostics', async (req, res) => {
  const { testConnection, getDbDiagnostics } = require('../config/database');
  const diagnostics = typeof getDbDiagnostics === 'function' ? getDbDiagnostics() : {};

  let connectionStatus = 'SUCCESS';
  let connectionError = null;

  try {
    await testConnection();
  } catch (err) {
    connectionStatus = 'FAILED';
    connectionError = err.message;
  }

  res.status(connectionStatus === 'SUCCESS' ? 200 : 503).json({
    status: connectionStatus === 'SUCCESS' ? 'HEALTHY' : 'UNHEALTHY',
    connection: connectionStatus,
    error: connectionError,
    diagnostics,
    timestamp: new Date().toISOString()
  });
});

// Info Root API
router.get('/', (req, res) => {
  const { getDbDiagnostics } = require('../config/database');
  res.json({
    success: true,
    message: 'Selamat datang di API Sistem ERP Coffee Shop',
    dashboard_ui: 'Untuk membuka antarmuka visual website (UI), silakan akses http://localhost:5000 di browser Anda',
    version: '1.0.0',
    diagnostics: typeof getDbDiagnostics === 'function' ? getDbDiagnostics() : {},
    available_modules: {
      master_barang: '/api/barang',
      inventory: '/api/inventory',
      procurement: '/api/procurement',
      hcm_payroll: '/api/hcm/payroll',
      finance_accounting: '/api/finance',
      diagnostics: '/api/diagnostics'
    }
  });
});

module.exports = router;
