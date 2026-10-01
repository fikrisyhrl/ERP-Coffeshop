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

  // Penanganan error koneksi database
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Gagal terhubung ke database. Pastikan database MySQL aktif.'
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
