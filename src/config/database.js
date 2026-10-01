const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'erp_coffeeshop',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+07:00' // WIB (Waktu Indonesia Barat)
  }
);

// Fungsi untuk mengetes koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Koneksi ke database MySQL berhasil terhubung.');
  } catch (error) {
    console.error('✗ Gagal menghubungkan ke database MySQL:', error.message);
  }
};

module.exports = { sequelize, testConnection };
