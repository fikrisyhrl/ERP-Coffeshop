const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./src/config/database');
const apiRoutes = require('./src/routes');
const { notFoundHandler, errorHandler } = require('./src/middlewares/errorHandler');

// Inisialisasi dotenv untuk membaca file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
const path = require('path');

// 1. GLOBAL MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Sajikan UI Frontend Dashboard Statis
app.use(express.static(__dirname));

// Sajikan index.html pada root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==========================================
// 2. MOUNT API ROUTES
// ==========================================
app.use('/api', apiRoutes);

// ==========================================
// 3. ERROR HANDLING MIDDLEWARES
// ==========================================
// Tangani rute yang tidak terdaftar (404)
app.use(notFoundHandler);

// Tangani error terpusat (500, validasi, db error)
app.use(errorHandler);

// ==========================================
// 4. DATABASE SYNC & SERVER LAUNCH
// ==========================================
const startServer = async () => {
  try {
    // Uji koneksi ke database
    await testConnection();

    // Sinkronisasi model Sequelize ke tabel database
    // alter: true memperbarui kolom jika ada perubahan tanpa menghapus data
    try {
      await sequelize.sync();
      console.log('✓ Tabel database berhasil disinkronisasi (Sequelize sync).');
    } catch (dbErr) {
      console.warn('⚠️ Tidak dapat menyinkronkan database:', dbErr.message);
      console.warn('ℹ️ Server tetap berjalan untuk melayani UI Dashboard & mode fallback.');
    }

    // Jalankan server Express (hanya untuk local standalone server)
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 ERP Coffee Shop Backend Server Berjalan!`);
      console.log(`🖥️  Tampilan Website UI: http://localhost:${PORT}`);
      console.log(`📑  API Endpoints JSON:  http://localhost:${PORT}/api`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('✗ Gagal memulai server:', error);
    process.exit(1);
  }
};

// Jalankan standalone server hanya jika dieksekusi langsung (bukan di-import/require) dan bukan di Vercel
if (require.main === module && !process.env.VERCEL) {
  startServer();
}

// Export app untuk Vercel Serverless Functions
module.exports = app;

