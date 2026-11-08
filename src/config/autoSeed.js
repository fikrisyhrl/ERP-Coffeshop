const {
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  Supplier,
  Barang,
  Department,
  JobPosition,
  Employee,
  Attendance,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseInvoice,
  User
} = require('../models');

/**
 * Otomatis mengisi data awal jika database baru atau masih kosong
 * Memastikan tabel Finance & COA langsung memiliki data valid dan siap digunakan.
 */
const autoSeedDatabase = async () => {
  try {
    // 1. Chart of Accounts (Bagan Akun Standar Coffee Shop)
    const coaCount = await ChartOfAccount.count();
    let accountsMap = {};

    const defaultAccounts = [
      { kode_akun: '1-1001', nama_akun: 'Kas Toko / Kasir', tipe_akun: 'ASET', saldo_normal: 'DEBET' },
      { kode_akun: '1-1002', nama_akun: 'Bank BCA Operasional', tipe_akun: 'ASET', saldo_normal: 'DEBET' },
      { kode_akun: '1-1020', nama_akun: 'Persediaan Bahan Baku & Kemasan', tipe_akun: 'ASET', saldo_normal: 'DEBET' },
      { kode_akun: '2-1001', nama_akun: 'Hutang Usaha / Supplier', tipe_akun: 'KEWAJIBAN', saldo_normal: 'KREDIT' },
      { kode_akun: '3-1001', nama_akun: 'Modal Pemilik', tipe_akun: 'EKUITAS', saldo_normal: 'KREDIT' },
      { kode_akun: '4-1001', nama_akun: 'Pendapatan Penjualan Kopi & Makanan', tipe_akun: 'PENDAPATAN', saldo_normal: 'KREDIT' },
      { kode_akun: '5-1001', nama_akun: 'Beban Pokok Penjualan (HPP Bahan)', tipe_akun: 'BEBAN', saldo_normal: 'DEBET' },
      { kode_akun: '6-1001', nama_akun: 'Beban Gaji & Upah Karyawan', tipe_akun: 'BEBAN', saldo_normal: 'DEBET' },
      { kode_akun: '6-1002', nama_akun: 'Beban Operasional Kas Kecil', tipe_akun: 'BEBAN', saldo_normal: 'DEBET' }
    ];

    for (const acc of defaultAccounts) {
      const [saved] = await ChartOfAccount.findOrCreate({
        where: { kode_akun: acc.kode_akun },
        defaults: acc
      });
      accountsMap[acc.kode_akun] = saved;
    }

    // 2. Initial Journal Entry (Saldo Awal Kasir & Bank BCA)
    const journalCount = await JournalEntry.count();
    if (journalCount === 0) {
      const kasAccount = accountsMap['1-1001'];
      const bankAccount = accountsMap['1-1002'];
      const modalAccount = accountsMap['3-1001'];

      if (kasAccount && bankAccount && modalAccount) {
        const initJournal = await JournalEntry.create({
          nomor_jurnal: 'JV-INIT-001',
          tanggal_jurnal: new Date().toISOString().split('T')[0],
          tipe_referensi: 'INITIAL_BALANCE',
          keterangan: 'Penetapan Saldo Awal Modal & Kasir Coffee Shop (Kas Toko Rp 15 Juta + Bank BCA Rp 85 Juta)',
          total_debet: 100000000,
          total_kredit: 100000000,
          status: 'POSTED'
        });

        await JournalEntryLine.create({
          jurnal_id: initJournal.id_jurnal,
          akun_id: kasAccount.id_akun,
          debet: 15000000,
          kredit: 0,
          catatan: 'Saldo Awal Kas Toko / Kasir'
        });

        await JournalEntryLine.create({
          jurnal_id: initJournal.id_jurnal,
          akun_id: bankAccount.id_akun,
          debet: 85000000,
          kredit: 0,
          catatan: 'Saldo Awal Bank BCA Operasional'
        });

        await JournalEntryLine.create({
          jurnal_id: initJournal.id_jurnal,
          akun_id: modalAccount.id_akun,
          debet: 0,
          kredit: 100000000,
          catatan: 'Penyetoran Modal Awal Pemilik Coffee Shop'
        });

        console.log('✓ Jurnal awal saldo kas & bank (JV-INIT-001) berhasil diisi ke database.');
      }
    }

    // 3. Suppliers
    const supplierCount = await Supplier.count();
    if (supplierCount === 0) {
      const defaultSuppliers = [
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

      for (const sup of defaultSuppliers) {
        await Supplier.findOrCreate({ where: { id_supplier: sup.id_supplier }, defaults: sup });
      }
    }

    // 4. Master Bahan Baku (Barang)
    const barangCount = await Barang.count();
    if (barangCount === 0) {
      const defaultBarangs = [
        {
          id_barang: 1,
          nama_barang: 'Arabica Gayo Wine Roasted Beans',
          kategori: 'Coffee Beans',
          satuan: 'gr',
          stok_saat_ini: 1500,
          batas_safety_stock: 2000,
          harga_satuan: 350,
          supplier_id: 1
        },
        {
          id_barang: 2,
          nama_barang: 'Greenfields Fresh Milk Pasteurized',
          kategori: 'Dairy',
          satuan: 'ml',
          stok_saat_ini: 12000,
          batas_safety_stock: 10000,
          harga_satuan: 28,
          supplier_id: 2
        },
        {
          id_barang: 3,
          nama_barang: 'Monin Salted Caramel Syrup 700ml',
          kategori: 'Syrup',
          satuan: 'ml',
          stok_saat_ini: 800,
          batas_safety_stock: 1400,
          harga_satuan: 210,
          supplier_id: 3
        },
        {
          id_barang: 4,
          nama_barang: 'Robusta Temanggung Natural Beans',
          kategori: 'Coffee Beans',
          satuan: 'gr',
          stok_saat_ini: 4500,
          batas_safety_stock: 2500,
          harga_satuan: 180,
          supplier_id: 1
        },
        {
          id_barang: 5,
          nama_barang: 'Hot Paper Cup 8oz Double Wall + Lid',
          kategori: 'Packaging',
          satuan: 'pcs',
          stok_saat_ini: 300,
          batas_safety_stock: 500,
          harga_satuan: 1250,
          supplier_id: 3
        },
        {
          id_barang: 6,
          nama_barang: 'Oatside Barista Blend Oat Milk 1L',
          kategori: 'Dairy',
          satuan: 'ml',
          stok_saat_ini: 8000,
          batas_safety_stock: 6000,
          harga_satuan: 42,
          supplier_id: 2
        }
      ];

      for (const b of defaultBarangs) {
        await Barang.findOrCreate({ where: { id_barang: b.id_barang }, defaults: b });
      }
    }

    // 5. Users (Manager, Finance, HR, Procurement)
    const userCount = await User.count();
    if (userCount === 0) {
      const defaultUsers = [
        {
          nama_lengkap: 'Fikri (Store Manager & Owner)',
          username: 'manager',
          password: 'manager123',
          role: 'MANAGER'
        },
        {
          nama_lengkap: 'Staff Finance & Accounting',
          username: 'finance',
          password: 'finance123',
          role: 'FINANCE'
        },
        {
          nama_lengkap: 'Staff HR & People Operations',
          username: 'hr',
          password: 'hr123',
          role: 'HR'
        },
        {
          nama_lengkap: 'Staff Procurement & Purchasing',
          username: 'procurement',
          password: 'procurement123',
          role: 'PROCUREMENT'
        }
      ];

      for (const u of defaultUsers) {
        await User.findOrCreate({ where: { username: u.username }, defaults: u });
      }
    }

    // 6. Departemen, Posisi & Karyawan
    const deptCount = await Department.count();
    if (deptCount === 0) {
      const [deptBar] = await Department.findOrCreate({
        where: { nama_departemen: 'Bar & Floor' },
        defaults: { nama_departemen: 'Bar & Floor', deskripsi: 'Operasional Barista & Pelayanan Meja' }
      });
      const [deptFinance] = await Department.findOrCreate({
        where: { nama_departemen: 'Finance & Admin' },
        defaults: { nama_departemen: 'Finance & Admin', deskripsi: 'Pengelolaan Keuangan & Akuntansi' }
      });

      const [posisiBarista] = await JobPosition.findOrCreate({
        where: { nama_jabatan: 'Head Barista' },
        defaults: {
          nama_jabatan: 'Head Barista',
          departemen_id: deptBar.id_departemen,
          gaji_pokok_standar: 4500000
        }
      });
      const [posisiFinance] = await JobPosition.findOrCreate({
        where: { nama_jabatan: 'Finance Specialist' },
        defaults: {
          nama_jabatan: 'Finance Specialist',
          departemen_id: deptFinance.id_departemen,
          gaji_pokok_standar: 5500000
        }
      });

      await Employee.findOrCreate({
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
    }

    // 7. Purchase Order & Invoices Tagihan Demo
    const poCount = await PurchaseOrder.count();
    if (poCount === 0) {
      const gayoItem = await Barang.findByPk(1);
      const newPo = await PurchaseOrder.create({
        nomor_po: `PO-REQ-001`,
        supplier_id: 1,
        tanggal_po: new Date().toISOString().split('T')[0],
        status: 'PENDING_APPROVAL',
        total_estimasi: 1750000,
        is_auto_generated: true,
        catatan: 'Reorder otomatis: Stok Arabica Gayo mendekati safety stock. Menunggu persetujuan Finance.'
      });

      if (gayoItem) {
        await PurchaseOrderItem.create({
          po_id: newPo.id_po,
          id_barang: gayoItem.id_barang,
          jumlah_pesan: 5000,
          harga_satuan_estimasi: 350
        });
      }
    }

    console.log('✓ Auto-seeding database selesai. Semua tabel ERP terisi data terverifikasi.');
  } catch (err) {
    console.warn('⚠️ Catatan auto-seeding:', err.message);
  }
};

module.exports = { autoSeedDatabase };
