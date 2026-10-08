/**
 * Middleware untuk menangani rute yang tidak ditemukan (404)
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint tidak ditemukan - ${req.originalUrl}`
  });
};

/**
 * Middleware terpusat untuk menangani semua error (Global Error Handler)
 */
const errorHandler = (err, req, res, next) => {
  console.error('--- Global Error Caught ---');
  console.error(err);

  // Penanganan error validasi Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errorDetails = err.errors.map((e) => ({
      field: e.path,
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal',
      errors: errorDetails
    });
  }

  // Penanganan error data duplikat (Unique Constraint)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Data dengan nilai tersebut sudah terdaftar di sistem',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message }))
    });
  }

  // Penanganan error relasi foreign key (Data terikat transaksi/riwayat lain)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Data tidak dapat dihapus karena masih terkait dengan data lain di sistem (misal riwayat slip gaji atau transaksi).'
    });
  }

  // Penanganan error koneksi database
  if (err.name === 'SequelizeConnectionError' || (err.name && err.name.includes('Connection'))) {
    const { isPostgres } = require('../config/database');
    const dbType = isPostgres ? 'Supabase (PostgreSQL)' : 'MySQL';
    return res.status(503).json({
      success: false,
      message: `Gagal terhubung ke database ${dbType}. Pastikan koneksi ${isPostgres ? 'internet/layanan Supabase' : 'MySQL server lokal'} aktif.`
    });
  }

  // Status code kustom atau default ke 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada internal server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
