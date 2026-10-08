const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const pg = require('pg');
const mysql2 = require('mysql2');

dotenv.config();

let sequelize;
const isPostgres = 
  Boolean(process.env.DATABASE_URL) || 
  process.env.DB_DIALECT === 'postgres' || 
  (process.env.DB_PORT && (process.env.DB_PORT === '5432' || process.env.DB_PORT === '6543')) ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('supabase'));

// Konfigurasi Pool Khusus Serverless (Vercel) vs Server Standalone
const poolConfig = {
  max: process.env.VERCEL ? 2 : 10,     // Di Vercel serverless, gunakan max 1-2 koneksi per instance
  min: 0,
  acquire: 60000,                       // Timeout mendapatkan koneksi dinaikkan ke 60 detik
  idle: 10000,
  evict: 2000
};

if (process.env.DATABASE_URL) {
  // Mode Supabase / Cloud Postgres menggunakan Connection String URL (Port 6543 Transaction Pooler)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Wajib untuk sertifikat cloud SSL Supabase
      },
      keepAlive: true
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /Connection terminated unexpectedly/,
        /TimeoutError/
      ],
      max: 3
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: poolConfig,
    timezone: '+07:00'
  });
} else if (isPostgres) {
  // Mode Supabase / Postgres dengan variabel terpisah
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      dialectModule: pg,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: poolConfig,
      timezone: '+07:00'
    }
  );
} else {
  // Fallback Mode MySQL Lokal (XAMPP)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'erp_coffeeshop',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      dialect: 'mysql',
      dialectModule: mysql2,
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
}

// Fungsi untuk mengetes koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    const dbType = isPostgres ? 'PostgreSQL (Supabase)' : 'MySQL';
    console.log(`✓ Koneksi ke database ${dbType} berhasil terhubung.`);
  } catch (error) {
    const dbType = isPostgres ? 'PostgreSQL (Supabase)' : 'MySQL';
    console.error(`✗ Gagal menghubungkan ke database ${dbType}:`, error.message);
    if (!isPostgres) {
      console.log('----------------------------------------------------');
      console.log('💡 CARA MENGATASI DATABASE TIDAK AKTIF:');
      console.log('👉 Pilihan A (MySQL Lokal): Buka XAMPP Control Panel, klik START pada MySQL, dan buat database "erp_coffeeshop".');
      console.log('👉 Pilihan B (Supabase Cloud): Isi DATABASE_URL di file .env dengan URI connection string Supabase Anda.');
      console.log('----------------------------------------------------\n');
    }
  }
};

module.exports = { sequelize, testConnection, isPostgres };
