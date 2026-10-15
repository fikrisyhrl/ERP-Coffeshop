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

const isVercel = Boolean(process.env.VERCEL);

// Konfigurasi Pool Khusus Serverless (Vercel) vs Server Standalone
const poolConfig = {
  max: isVercel ? 1 : 10,                 // Di Vercel serverless, gunakan 1 koneksi per instance
  min: 0,
  acquire: isVercel ? 8000 : 30000,      // Timeout acquire maksimal 8 detik di Vercel agar tidak melebihi hard timeout 10-15s
  idle: isVercel ? 2000 : 10000,
  evict: isVercel ? 1000 : 2000
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
      keepAlive: true,
      statement_timeout: isVercel ? 7000 : 30000
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
      max: isVercel ? 1 : 3 // Di serverless batasi retry agar respon error cepat terkirim
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
        },
        statement_timeout: isVercel ? 7000 : 30000
      },
      retry: {
        max: isVercel ? 1 : 3
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

// Helper diagnostik konfigurasi database (Aman tanpa bocor password)
const getDbDiagnostics = () => {
  let maskedUrl = null;
  let host = null;
  let port = null;

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      host = parsed.hostname;
      port = parsed.port || '5432';
      maskedUrl = `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}:${port}${parsed.pathname}`;
    } catch {
      maskedUrl = 'INVALID_DATABASE_URL_FORMAT';
    }
  } else {
    host = process.env.DB_HOST || (isPostgres ? 'db.supabase.co' : 'localhost');
    port = process.env.DB_PORT || (isPostgres ? '5432' : '3306');
  }

  return {
    environment: isVercel ? 'Vercel Serverless' : 'Local Standalone',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    maskedUrl,
    host,
    port,
    dialect: isPostgres ? 'postgres' : 'mysql',
    isPostgres
  };
};

// Fungsi untuk mengetes koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    const dbType = isPostgres ? 'PostgreSQL (Supabase)' : 'MySQL';
    console.log(`✓ Koneksi ke database ${dbType} berhasil terhubung.`);
    return { success: true, dbType };
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
    throw error;
  }
};

module.exports = { sequelize, testConnection, isPostgres, getDbDiagnostics };
