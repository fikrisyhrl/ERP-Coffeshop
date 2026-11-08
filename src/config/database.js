const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const pg = require('pg');
const mysql2 = require('mysql2');

dotenv.config();

const isVercel = Boolean(process.env.VERCEL);

// Di Vercel Serverless, SELALU gunakan PostgreSQL (Cloud Supabase/Neon).
// Jangan pernah memuat atau menggunakan native SQLite di Vercel Serverless.
let dialect;
if (isVercel) {
  dialect = 'postgres';
} else {
  dialect = (process.env.DB_DIALECT || '').toLowerCase();
  if (!dialect) {
    if (process.env.DATABASE_URL) {
      dialect = 'postgres';
    } else if (process.env.DB_HOST && process.env.DB_PORT === '3306') {
      dialect = 'mysql';
    } else {
      dialect = 'sqlite';
    }
  }
}

const isPostgres = dialect === 'postgres';
const isSqlite = dialect === 'sqlite' && !isVercel;
const isMysql = dialect === 'mysql';

// Path file SQLite lokal persisten (khusus local standalone)
const sqliteStoragePath = path.resolve(__dirname, '../../database.sqlite');

// Konfigurasi Pool Khusus Serverless (Vercel) vs Server Standalone
const poolConfig = {
  max: isVercel ? 1 : 10,
  min: 0,
  acquire: isVercel ? 8000 : 30000,
  idle: isVercel ? 2000 : 10000,
  evict: isVercel ? 1000 : 2000
};

let sequelize;

if (isSqlite) {
  // Mode 1: SQLite Lokal Persisten (Hanya di Komputer Lokal)
  let sqlite3;
  try {
    sqlite3 = require('sqlite3');
  } catch (err) {
    console.warn('⚠️ SQLite3 driver tidak dapat dimuat:', err.message);
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqlite3,
    storage: sqliteStoragePath,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (isPostgres) {
  // Mode 2: Supabase / Cloud PostgreSQL (Default & Wajib di Vercel)
  let activeDatabaseUrl = process.env.DATABASE_URL;
  let autoConvertedFromDirect = false;

  if (activeDatabaseUrl) {
    try {
      const urlObj = new URL(activeDatabaseUrl);
      if (urlObj.hostname.startsWith('db.') && urlObj.hostname.endsWith('.supabase.co')) {
        const projectRef = urlObj.hostname.split('.')[1];
        urlObj.hostname = 'aws-0-ap-northeast-1.pooler.supabase.com';
        urlObj.port = '6543';
        if (urlObj.username === 'postgres') {
          urlObj.username = `postgres.${projectRef}`;
        }
        activeDatabaseUrl = urlObj.toString();
        autoConvertedFromDirect = true;
      }
    } catch (err) {
      console.warn('Format DATABASE_URL tidak valid:', err.message);
    }
  }

  const effectiveHost = process.env.DB_HOST || 'localhost';
  const effectivePort = parseInt(process.env.DB_PORT, 10) || 5432;
  const effectiveUser = process.env.DB_USER || 'postgres';

  if (activeDatabaseUrl) {
    sequelize = new Sequelize(activeDatabaseUrl, {
      dialect: 'postgres',
      dialectModule: pg,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
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
        max: isVercel ? 1 : 3
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: poolConfig,
      timezone: '+07:00'
    });
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'postgres',
      effectiveUser,
      process.env.DB_PASSWORD || '',
      {
        host: effectiveHost,
        port: effectivePort,
        dialect: 'postgres',
        dialectModule: pg,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          },
          statement_timeout: isVercel ? 7000 : 30000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: poolConfig,
        timezone: '+07:00'
      }
    );
  }
} else {
  // Mode 3: MySQL Lokal (XAMPP)
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
      timezone: '+07:00'
    }
  );
}

// Helper diagnostik konfigurasi database
const getDbDiagnostics = () => {
  return {
    environment: isVercel ? 'Vercel Serverless' : 'Local Standalone',
    dialect: isSqlite ? 'sqlite' : isPostgres ? 'postgres' : 'mysql',
    isSqlite,
    isPostgres,
    isMysql,
    storage: isSqlite ? sqliteStoragePath : undefined,
    host: isSqlite ? 'local_file' : process.env.DB_HOST || 'localhost',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL)
  };
};

// Fungsi mengetes koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    const dbType = isSqlite
      ? 'SQLite Lokal Persisten (database.sqlite)'
      : isPostgres
      ? 'PostgreSQL (Supabase)'
      : 'MySQL (XAMPP)';
    console.log(`✓ Koneksi ke database ${dbType} berhasil terhubung.`);
    return { success: true, dbType };
  } catch (error) {
    const dbType = isSqlite
      ? 'SQLite Lokal'
      : isPostgres
      ? 'PostgreSQL (Supabase)'
      : 'MySQL';
    console.error(`✗ Gagal menghubungkan ke database ${dbType}:`, error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  isPostgres,
  isSqlite,
  isMysql,
  dialect,
  sqliteStoragePath,
  getDbDiagnostics
};
