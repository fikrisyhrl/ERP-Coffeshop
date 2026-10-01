const dotenv = require('dotenv');
dotenv.config();

const { sequelize, testConnection, isPostgres } = require('./src/config/database');
const {
  Barang,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  ChartOfAccount,
  Department,
  JobPosition,
  Employee,
  Attendance
} = require('./src/models');
const accountingService = require('./src/services/accountingService');

async function runSeed() {
  console.log('==============================================');
  console.log(`🌱 Memulai Seeding Data ke Database ${isPostgres ? 'Supabase (PostgreSQL)' : 'MySQL'}...`);
  console.log('==============================================');

  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('✓ Struktur tabel berhasil disinkronkan.');

    // 1. Seed Chart of Accounts
    console.log('📌 1. Mengisi Chart of Accounts (Bagan Akun)...');
    await accountingService.seedStandardCoA();
    console.log('✓ CoA berhasil diisi.');

    // 2. Seed Suppliers
    console.log('📌 2. Mengisi Data Supplier...');
    const suppliers = [
      {
        id_supplier: 1,
        nama_supplier: 'CV Nusantara Coffee Roastery',
        kontak_person: 'Budi Santoso',
        telepon: '0812-3456-7890',
        email: 'order@nusantararoastery.com',
        alamat: 'Jl. Raya Kopi No. 45, Bandung'
      },
      {
        id_supplier: 2,
        nama_supplier: 'PT Sumber Dairy Sejahtera',
        kontak_person: 'Linda Kusuma',
        telepon: '0819-8765-4321',
        email: 'sales@sumberdairy.co.id',
        alamat: 'Kawasan Industri Cikarang Blok B2'
      },
      {
        id_supplier: 3,
        nama_supplier: 'Distributor Sirup Premium',
        kontak_person: 'Hendra Tan',
        telepon: '0811-2233-4455',
        email: 'hendra@syruppremium.id',
        alamat: 'Jl. Boulevard Kelapa Gading No. 12, Jakarta'
      }
    ];

    for (const sup of suppliers) {
      await Supplier.findOrCreate({
        where: { nama_supplier: sup.nama_supplier },
        defaults: sup
      });
    }
    console.log('✓ Data Supplier berhasil diisi.');

    // 3. Seed Master Barang
    console.log('📌 3. Mengisi Data Master Bahan Baku...');
    const barangList = [
      {
        nama_barang: 'Arabica Gayo Wine Roasted Beans',
        kategori: 'Coffee Beans',
        satuan: 'gr',
        stok_saat_ini: 1500,
        batas_safety_stock: 2000,
        harga_satuan: 350,
        supplier_id: 1
      },
      {
        nama_barang: 'Greenfields Fresh Milk Pasteurized',
        kategori: 'Dairy',
        satuan: 'ml',
        stok_saat_ini: 12000,
        batas_safety_stock: 10000,
        harga_satuan: 28,
        supplier_id: 2
      },
      {
        nama_barang: 'Monin Salted Caramel Syrup 700ml',
        kategori: 'Syrup',
        satuan: 'ml',
        stok_saat_ini: 800,
        batas_safety_stock: 1400,
        harga_satuan: 210,
        supplier_id: 3
      },
      {
        nama_barang: 'Robusta Temanggung Natural Beans',
        kategori: 'Coffee Beans',
        satuan: 'gr',
        stok_saat_ini: 4500,
        batas_safety_stock: 2500,
        harga_satuan: 180,
        supplier_id: 1
      },
      {
        nama_barang: 'Hot Paper Cup 8oz Double Wall + Lid',
        kategori: 'Packaging',
        satuan: 'pcs',
        stok_saat_ini: 300,
        batas_safety_stock: 500,
        harga_satuan: 1250,
        supplier_id: 3
      },
      {
        nama_barang: 'Oatside Barista Blend Oat Milk 1L',
        kategori: 'Dairy',
        satuan: 'ml',
        stok_saat_ini: 8000,
        batas_safety_stock: 6000,
        harga_satuan: 42,
        supplier_id: 2
      }
    ];

    for (const b of barangList) {
      await Barang.findOrCreate({
        where: { nama_barang: b.nama_barang },
        defaults: b
      });
    }
    console.log('✓ Data Master Bahan Baku berhasil diisi.');

    // 4. Seed Departemen, Posisi & Pegawai
    console.log('📌 4. Mengisi Data HCM & Pegawai...');
    const [deptBar] = await Department.findOrCreate({
      where: { nama_departemen: 'Bar & Floor' },
      defaults: { nama_departemen: 'Bar & Floor', deskripsi: 'Operasional Barista & Pelayanan Meja' }
    });

    const [posisiBarista] = await JobPosition.findOrCreate({
      where: { nama_jabatan: 'Head Barista' },
      defaults: {
        nama_jabatan: 'Head Barista',
        departemen_id: deptBar.id_departemen,
        gaji_pokok_standar: 4500000
      }
    });

    const [emp] = await Employee.findOrCreate({
      where: { kode_pegawai: 'EMP-001' },
      defaults: {
        kode_pegawai: 'EMP-001',
        nama_lengkap: 'Dimas Pratama',
        email: 'dimas@kafeinaerp.com',
        telepon: '081298765432',
        posisi_id: posisiBarista.id_posisi,
        status_kerja: 'FULL_TIME',
        tanggal_masuk: '2025-01-01',
        gaji_pokok: 4500000,
        nama_bank: 'BCA',
        nomor_rekening: '5270123456',
        is_active: true
      }
    });

    // Seed 24 hari absensi bulan lalu
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    for (let day = 1; day <= 24; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      await Attendance.findOrCreate({
        where: { pegawai_id: emp.id_pegawai, tanggal_absensi: dateStr },
        defaults: {
          pegawai_id: emp.id_pegawai,
          tanggal_absensi: dateStr,
          nama_shift: 'Morning Shift',
          jam_masuk: '07:55:00',
          jam_keluar: '16:00:00',
          status_kehadiran: 'HADIR',
          menit_terlambat: day === 5 ? 15 : day === 12 ? 20 : 0,
          jam_lembur: day === 10 ? 2 : day === 20 ? 2 : 0
        }
      });
    }
    console.log('✓ Data HCM & 24 Hari Absensi berhasil diisi.');

    // 5. Seed Purchase Order Demo
    console.log('📌 5. Mengisi Pengajuan Purchase Order (PO)...');
    const existingPo = await PurchaseOrder.findOne();
    if (!existingPo) {
      const gayoItem = await Barang.findOne({ where: { nama_barang: 'Arabica Gayo Wine Roasted Beans' } });
      const newPo = await PurchaseOrder.create({
        nomor_po: `PO-REQ-${Date.now().toString().slice(-4)}`,
        supplier_id: 1,
        tanggal_po: new Date().toISOString().split('T')[0],
        status: 'PENDING_APPROVAL',
        total_estimasi: 1750000,
        is_auto_generated: true,
        catatan: 'Reorder otomatis: Stok Arabica Gayo mendekati safety stock. Menunggu approval Finance.'
      });

      if (gayoItem) {
        await PurchaseOrderItem.create({
          po_id: newPo.id_po,
          id_barang: gayoItem.id_barang,
          jumlah_pesan: 5000,
          harga_satuan_estimasi: 350
        });
      }
      console.log('✓ Purchase Order demo berhasil dibuat.');
    } else {
      console.log('ℹ️ Purchase Order sudah ada di database.');
    }

    console.log('==============================================');
    console.log('🎉 SEEDING SELESAI DENGAN SUKSES! DATA REAL SUDAH TERSEDIA.');
    console.log('==============================================');
    process.exit(0);
  } catch (error) {
    console.error('✗ Gagal melakukan seeding database:', error);
    process.exit(1);
  }
}

runSeed();
