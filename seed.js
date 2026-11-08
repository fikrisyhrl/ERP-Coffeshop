const dotenv = require('dotenv');
dotenv.config();

const { sequelize, testConnection, isPostgres, isSqlite } = require('./src/config/database');
const { autoSeedDatabase } = require('./src/config/autoSeed');

async function runSeed() {
  const dbName = isSqlite ? 'SQLite Lokal (database.sqlite)' : isPostgres ? 'Supabase (PostgreSQL)' : 'MySQL';
  console.log('==============================================');
  console.log(`🌱 Memulai Seeding Data ke Database ${dbName}...`);
  console.log('==============================================');

  try {
    await testConnection();
    await sequelize.sync();
    console.log('✓ Struktur tabel berhasil disinkronkan.');

    await autoSeedDatabase();

    console.log('==============================================');
    console.log('🎉 SEEDING SELESAI DENGAN SUKSES! DATA FINANCE & ERP LENGKAP.');
    console.log('==============================================');
    process.exit(0);
  } catch (error) {
    console.error('✗ Gagal melakukan seeding database:', error);
    process.exit(1);
  }
}

runSeed();
