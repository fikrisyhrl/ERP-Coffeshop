const payrollService = require('../services/payrollService');
const {
  Department,
  JobPosition,
  Employee,
  Attendance,
  Payroll,
  sequelize
} = require('../models');

const payrollController = {
  /**
   * POST /api/hcm/payroll/hitung/:pegawai_id
   * Menghitung dan menerbitkan slip gaji bulanan pegawai
   */
  hitungPayroll: async (req, res, next) => {
    try {
      const { pegawai_id } = req.params;
      const {
        bulan = new Date().getMonth() + 1,
        tahun = new Date().getFullYear(),
        target_hari_kerja = 24,
        nominal_tunjangan_kehadiran = 500000,
        tarif_potongan_per_menit = 2000,
        tarif_lembur_per_jam = 25000
      } = req.body;

      const slipGaji = await payrollService.hitungPayrollPegawai({
        pegawai_id,
        bulan,
        tahun,
        target_hari_kerja,
        nominal_tunjangan_kehadiran,
        tarif_potongan_per_menit,
        tarif_lembur_per_jam
      });

      return res.status(200).json({
        success: true,
        message: `Slip gaji berhasil dihitung untuk periode ${slipGaji.periode.bulan} ${slipGaji.periode.tahun}`,
        data: slipGaji
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/hcm/payroll/slip/:payroll_id
   * Mengambil rincian slip gaji berdasarkan ID Payroll
   */
  getSlipGaji: async (req, res, next) => {
    try {
      const { payroll_id } = req.params;
      const payroll = await payrollService.getSlipGajiById(payroll_id);

      return res.status(200).json({
        success: true,
        data: payroll
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/hcm/payroll/seed-demo
   * Endpoint pembantu untuk mengisi data master Jabatan, Pegawai, dan 1 bulan riwayat Absensi
   * agar sistem payroll siap langsung diuji tanpa input manual 24 hari absensi.
   */
  seedDemoData: async (req, res, next) => {
    try {
      // 1. Buat Departemen
      const [dept] = await Department.findOrCreate({
        where: { nama_departemen: 'Bar & Floor' },
        defaults: { deskripsi: 'Operasional Bar, Kasir, dan Pelayanan Meja' }
      });

      // 2. Buat Posisi / Jabatan
      const [posisi] = await JobPosition.findOrCreate({
        where: { nama_jabatan: 'Head Barista' },
        defaults: {
          departemen_id: dept.id_departemen,
          gaji_pokok_standar: 4500000.00
        }
      });

      // 3. Buat Data Pegawai
      const [pegawai] = await Employee.findOrCreate({
        where: { kode_pegawai: 'EMP-001' },
        defaults: {
          nama_lengkap: 'Dimas Pratama',
          email: 'dimas.barista@coffeeshop.com',
          telepon: '081298765432',
          posisi_id: posisi.id_posisi,
          status_kerja: 'FULL_TIME',
          gaji_pokok: 4500000.00,
          nama_bank: 'BCA',
          nomor_rekening: '5270123456',
          tanggal_masuk: '2025-01-10'
        }
      });

      // 4. Generate 24 Hari Absensi untuk September 2026
      // Skenario simulasi:
      // - 21 hari hadir tepat waktu (0 menit telat)
      // - 3 hari terlambat (total 35 menit telat)
      // - Ada 4 jam lembur
      const tahun = 2026;
      const bulan = 9; // September
      const attendanceRecords = [];

      for (let day = 1; day <= 24; day++) {
        const dayStr = String(day).padStart(2, '0');
        const tglStr = `${tahun}-09-${dayStr}`;

        let status = 'HADIR';
        let menitTelat = 0;
        let lembur = 0;

        // Simulasi keterlambatan di hari ke-5, ke-12, ke-19
        if (day === 5) {
          status = 'TERLAMBAT';
          menitTelat = 10;
        } else if (day === 12) {
          status = 'TERLAMBAT';
          menitTelat = 15;
        } else if (day === 19) {
          status = 'TERLAMBAT';
          menitTelat = 10;
        }

        // Simulasi lembur di hari ke-10 dan 20
        if (day === 10) lembur = 2.0;
        if (day === 20) lembur = 2.0;

        attendanceRecords.push({
          pegawai_id: pegawai.id_pegawai,
          tanggal_absensi: tglStr,
          nama_shift: 'Shift Opening (07:00 - 15:00)',
          jam_masuk: new Date(`${tglStr}T07:${String(menitTelat).padStart(2, '0')}:00`),
          jam_keluar: new Date(`${tglStr}T15:00:00`),
          status_kehadiran: status,
          menit_terlambat: menitTelat,
          jam_lembur: lembur,
          catatan: menitTelat > 0 ? `Keterlambatan ${menitTelat} menit` : 'Kehadiran normal'
        });
      }

      // Hapus absensi demo lama jika ada
      await Attendance.destroy({ where: { pegawai_id: pegawai.id_pegawai } });
      await Attendance.bulkCreate(attendanceRecords);

      return res.status(200).json({
        success: true,
        message: 'Data demo HCM (Jabatan, Pegawai, dan 24 record Absensi September 2026) berhasil dibuat!',
        data: {
          pegawai: {
            id_pegawai: pegawai.id_pegawai,
            kode_pegawai: pegawai.kode_pegawai,
            nama_lengkap: pegawai.nama_lengkap,
            jabatan: posisi.nama_jabatan,
            gaji_pokok: pegawai.gaji_pokok
          },
          total_absensi_digenerate: attendanceRecords.length,
          keterangan_simulasi: '21x Hadir Tepat Waktu, 3x Terlambat (Total 35 menit), 4 jam lembur.'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Seed 12 Karyawan Lengkap Coffee Shop (Head Barista, Roaster, Cashier, Pastry, dll)
   */
  seedDefaultEmployees: async () => {
    try {
      // 1. Departemen
      const departmentsData = [
        { nama_departemen: 'Management', deskripsi: 'Pengelola & Operasional Store' },
        { nama_departemen: 'Bar & Floor', deskripsi: 'Barista, Espresso Station, & Layanan Tamu' },
        { nama_departemen: 'Roastery', deskripsi: 'Roasting Biji Kopi & Quality Control' },
        { nama_departemen: 'Kitchen & Food', deskripsi: 'Dapur, Makanan Ringan, & Pastry' },
        { nama_departemen: 'Supply & Warehouse', deskripsi: 'Logistik, Gudang, & Pengadaan Bahan' },
        { nama_departemen: 'Back Office', deskripsi: 'Finance, Kasir & HR People Operations' },
        { nama_departemen: 'Maintenance', deskripsi: 'Kebersihan, Utilitas, & Perawatan Toko' }
      ];

      const deptMap = {};
      for (const d of departmentsData) {
        const [dept] = await Department.findOrCreate({
          where: { nama_departemen: d.nama_departemen },
          defaults: d
        });
        deptMap[d.nama_departemen] = dept.id_departemen;
      }

      // 2. Posisi Jabatan
      const positionsData = [
        { nama_jabatan: 'Store Manager & Owner', departemen: 'Management', gaji: 8500000 },
        { nama_jabatan: 'Head Barista & QC', departemen: 'Bar & Floor', gaji: 5200000 },
        { nama_jabatan: 'Senior Barista & Latte Artist', departemen: 'Bar & Floor', gaji: 4500000 },
        { nama_jabatan: 'Junior Barista', departemen: 'Bar & Floor', gaji: 3800000 },
        { nama_jabatan: 'Head Cashier & POS', departemen: 'Bar & Floor', gaji: 3900000 },
        { nama_jabatan: 'Master Coffee Roaster', departemen: 'Roastery', gaji: 6000000 },
        { nama_jabatan: 'Kitchen Head Cook', departemen: 'Kitchen & Food', gaji: 5500000 },
        { nama_jabatan: 'Pastry & Bakery Chef', departemen: 'Kitchen & Food', gaji: 4800000 },
        { nama_jabatan: 'Inventory & Warehouse Officer', departemen: 'Supply & Warehouse', gaji: 4200000 },
        { nama_jabatan: 'Finance & Cashier Supervisor', departemen: 'Back Office', gaji: 5000000 },
        { nama_jabatan: 'General Utility & Dishwasher', departemen: 'Maintenance', gaji: 3200000 },
        { nama_jabatan: 'HR & People Operations', departemen: 'Back Office', gaji: 4700000 }
      ];

      const posMap = {};
      for (const p of positionsData) {
        const [pos] = await JobPosition.findOrCreate({
          where: { nama_jabatan: p.nama_jabatan },
          defaults: {
            nama_jabatan: p.nama_jabatan,
            departemen_id: deptMap[p.departemen] || 1,
            gaji_pokok_standar: p.gaji
          }
        });
        posMap[p.nama_jabatan] = pos.id_posisi;
      }

      // 3. 12 Karyawan Lengkap Coffee Shop
      const defaultEmployees = [
        {
          kode_pegawai: 'EMP-001',
          nama_lengkap: 'Fikri Syahrial',
          email: 'fikri.manager@kafeinaerp.com',
          telepon: '0812-1111-2222',
          jabatan: 'Store Manager & Owner',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 8500000,
          nama_bank: 'BCA',
          nomor_rekening: '5270111222'
        },
        {
          kode_pegawai: 'EMP-002',
          nama_lengkap: 'Dimas Pratama',
          email: 'dimas.barista@kafeinaerp.com',
          telepon: '0812-9876-5432',
          jabatan: 'Head Barista & QC',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 5200000,
          nama_bank: 'BCA',
          nomor_rekening: '5270123456'
        },
        {
          kode_pegawai: 'EMP-003',
          nama_lengkap: 'Sarah Nabila',
          email: 'sarah.latte@kafeinaerp.com',
          telepon: '0813-2233-4455',
          jabatan: 'Senior Barista & Latte Artist',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 4500000,
          nama_bank: 'Mandiri',
          nomor_rekening: '131009876543'
        },
        {
          kode_pegawai: 'EMP-004',
          nama_lengkap: 'Rizky Ramadhan',
          email: 'rizky.barista@kafeinaerp.com',
          telepon: '0819-3344-5566',
          jabatan: 'Junior Barista',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 3800000,
          nama_bank: 'BRI',
          nomor_rekening: '012345678901'
        },
        {
          kode_pegawai: 'EMP-005',
          nama_lengkap: 'Anisa Rahmawati',
          email: 'anisa.cashier@kafeinaerp.com',
          telepon: '0818-4455-6677',
          jabatan: 'Head Cashier & POS',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 3900000,
          nama_bank: 'BCA',
          nomor_rekening: '5270998877'
        },
        {
          kode_pegawai: 'EMP-006',
          nama_lengkap: 'Bayu Nugroho',
          email: 'bayu.roaster@kafeinaerp.com',
          telepon: '0857-5566-7788',
          jabatan: 'Master Coffee Roaster',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 6000000,
          nama_bank: 'BNI',
          nomor_rekening: '0897654321'
        },
        {
          kode_pegawai: 'EMP-007',
          nama_lengkap: 'Hendra Wijaya',
          email: 'hendra.kitchen@kafeinaerp.com',
          telepon: '0877-6677-8899',
          jabatan: 'Kitchen Head Cook',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 5500000,
          nama_bank: 'BCA',
          nomor_rekening: '5270334455'
        },
        {
          kode_pegawai: 'EMP-008',
          nama_lengkap: 'Dewi Sartika',
          email: 'dewi.pastry@kafeinaerp.com',
          telepon: '0812-7788-9900',
          jabatan: 'Pastry & Bakery Chef',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 4800000,
          nama_bank: 'Mandiri',
          nomor_rekening: '131005544332'
        },
        {
          kode_pegawai: 'EMP-009',
          nama_lengkap: 'Agus Santoso',
          email: 'agus.inventory@kafeinaerp.com',
          telepon: '0821-8899-0011',
          jabatan: 'Inventory & Warehouse Officer',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 4200000,
          nama_bank: 'BRI',
          nomor_rekening: '012344556677'
        },
        {
          kode_pegawai: 'EMP-010',
          nama_lengkap: 'Maya Lestari',
          email: 'maya.finance@kafeinaerp.com',
          telepon: '0813-9900-1122',
          jabatan: 'Finance & Cashier Supervisor',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 5000000,
          nama_bank: 'BCA',
          nomor_rekening: '5270667788'
        },
        {
          kode_pegawai: 'EMP-011',
          nama_lengkap: 'Rudi Hartono',
          email: 'rudi.utility@kafeinaerp.com',
          telepon: '0852-0011-2233',
          jabatan: 'General Utility & Dishwasher',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 3200000,
          nama_bank: 'BRI',
          nomor_rekening: '012388990011'
        },
        {
          kode_pegawai: 'EMP-012',
          nama_lengkap: 'Siti Aisyah',
          email: 'siti.hr@kafeinaerp.com',
          telepon: '0819-1122-3344',
          jabatan: 'HR & People Operations',
          status_kerja: 'FULL_TIME',
          gaji_pokok: 4700000,
          nama_bank: 'BNI',
          nomor_rekening: '0897112233'
        }
      ];

      for (const e of defaultEmployees) {
        const posisiId = posMap[e.jabatan] || 1;
        await Employee.findOrCreate({
          where: { kode_pegawai: e.kode_pegawai },
          defaults: {
            kode_pegawai: e.kode_pegawai,
            nama_lengkap: e.nama_lengkap,
            email: e.email,
            telepon: e.telepon,
            posisi_id: posisiId,
            status_kerja: e.status_kerja,
            gaji_pokok: e.gaji_pokok,
            nama_bank: e.nama_bank,
            nomor_rekening: e.nomor_rekening,
            is_active: true
          }
        });
      }
      return true;
    } catch (err) {
      console.warn('⚠️ Gagal auto-seeding 12 pegawai default:', err.message);
      return false;
    }
  },

  /**
   * POST /api/hcm/pegawai
   * Fitur CRUD Tambah Karyawan Baru (Nama, Jabatan, Gaji Pokok)
   */
  createPegawai: async (req, res, next) => {
    try {
      const {
        nama_lengkap,
        jabatan,
        gaji_pokok,
        departemen = 'Bar & Floor',
        status_kerja = 'FULL_TIME',
        nama_bank = 'BCA',
        nomor_rekening = '5270' + Math.floor(100000 + Math.random() * 900000),
        telepon = '',
        email = ''
      } = req.body;

      if (!nama_lengkap || !jabatan || !gaji_pokok) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap, jabatan, dan nominal gaji wajib diisi!'
        });
      }

      // Pastikan Departemen ada
      const [dept] = await Department.findOrCreate({
        where: { nama_departemen: departemen },
        defaults: { nama_departemen: departemen, deskripsi: `Departemen ${departemen}` }
      });

      // Pastikan Posisi Jabatan ada
      const [posisi] = await JobPosition.findOrCreate({
        where: { nama_jabatan: jabatan },
        defaults: {
          nama_jabatan: jabatan,
          departemen_id: dept.id_departemen,
          gaji_pokok_standar: parseFloat(gaji_pokok)
        }
      });

      // Generate kode pegawai berurutan
      const count = await Employee.count();
      const nextNum = count + 1;
      const kode_pegawai = `EMP-${String(nextNum).padStart(3, '0')}`;

      const newEmployee = await Employee.create({
        kode_pegawai,
        nama_lengkap: nama_lengkap.trim(),
        posisi_id: posisi.id_posisi,
        status_kerja,
        gaji_pokok: parseFloat(gaji_pokok),
        nama_bank,
        nomor_rekening,
        telepon: telepon || '0812-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
        email: email || `${nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kafeinaerp.com`,
        is_active: true
      });

      const fullEmployee = await Employee.findByPk(newEmployee.id_pegawai, {
        include: [
          {
            model: JobPosition,
            as: 'posisi',
            include: [{ model: Department, as: 'departemen' }]
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: `Karyawan baru ${fullEmployee.nama_lengkap} (${posisi.nama_jabatan}) berhasil ditambahkan ke modul HR!`,
        data: fullEmployee
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET/POST /api/hcm/init-db
   * Endpoint inisialisasi & sinkronisasi struktur tabel HCM (Department, JobPosition, Employee, Attendance, Payroll)
   */
  initDatabase: async (req, res, next) => {
    try {
      await Department.sync({ alter: true });
      await JobPosition.sync({ alter: true });
      await Employee.sync({ alter: true });
      await Attendance.sync({ alter: true });
      await Payroll.sync({ alter: true });
      await PayrollItem.sync({ alter: true });

      const count = await Employee.count();
      if (count === 0) {
        await payrollController.seedDefaultEmployees();
      }

      const list = await Employee.findAll({
        include: [
          {
            model: JobPosition,
            as: 'posisi',
            include: [{ model: Department, as: 'departemen' }]
          }
        ],
        order: [['id_pegawai', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        message: 'Struktur database Human Resource berhasil disinkronkan ke PostgreSQL Supabase!',
        total_pegawai: list.length,
        data: list
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/hcm/pegawai
   * Ambil daftar semua pegawai aktif beserta posisi dan departemen
   */
  getAllPegawai: async (req, res, next) => {
    try {
      let employees;
      try {
        const count = await Employee.count();
        if (count === 0) {
          await payrollController.seedDefaultEmployees();
        }

        employees = await Employee.findAll({
          include: [
            {
              model: JobPosition,
              as: 'posisi',
              include: [{ model: Department, as: 'departemen' }]
            }
          ],
          order: [['id_pegawai', 'ASC']]
        });
      } catch (dbErr) {
        console.warn('⚠️ Query error pada getAllPegawai, mencoba sinkronisasi model Sequelize:', dbErr.message);
        try {
          await Department.sync({ alter: true });
          await JobPosition.sync({ alter: true });
          await Employee.sync({ alter: true });
          await Attendance.sync({ alter: true });
          await Payroll.sync({ alter: true });
          await PayrollItem.sync({ alter: true });

          const count = await Employee.count();
          if (count === 0) {
            await payrollController.seedDefaultEmployees();
          }
        } catch (syncErr) {
          console.warn('⚠️ Gagal auto-sync:', syncErr.message);
        }

        employees = await Employee.findAll({
          include: [
            {
              model: JobPosition,
              as: 'posisi',
              include: [{ model: Department, as: 'departemen' }]
            }
          ],
          order: [['id_pegawai', 'ASC']]
        });
      }

      return res.status(200).json({ success: true, data: employees });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/hcm/absensi
   * Ambil riwayat absensi pegawai terbaru
   */
  getAllAbsensi: async (req, res, next) => {
    try {
      const records = await Attendance.findAll({
        include: [{ model: Employee, as: 'pegawai', attributes: ['nama_lengkap', 'kode_pegawai'] }],
        order: [['tanggal_absensi', 'DESC'], ['id_absensi', 'DESC']],
        limit: 50
      });
      return res.status(200).json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/hcm/payroll/list
   * Ambil riwayat payroll bulanan
   */
  getAllPayroll: async (req, res, next) => {
    try {
      const list = await Payroll.findAll({
        include: [{ model: Employee, as: 'pegawai', attributes: ['nama_lengkap', 'kode_pegawai'] }],
        order: [['id_payroll', 'DESC']]
      });
      return res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/hcm/pegawai/:id
   * Menghapus data karyawan secara permanen beserta data absensi & slip gaji terkait
   */
  deletePegawai: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { Op } = require('sequelize');
      const isNum = !isNaN(id);
      const whereClause = isNum
        ? {
            [Op.or]: [
              { id_pegawai: parseInt(id, 10) },
              { kode_pegawai: String(id) }
            ]
          }
        : { kode_pegawai: String(id) };

      const employee = await Employee.findOne({ where: whereClause });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: `Karyawan dengan ID/Kode '${id}' tidak ditemukan di database.`
        });
      }

      const empId = employee.id_pegawai;
      const empName = employee.nama_lengkap;
      const empCode = employee.kode_pegawai;

      // Hapus absensi & payroll terkait terlebih dahulu
      try {
        await Attendance.destroy({ where: { pegawai_id: empId } });
      } catch (attErr) {
        console.warn('Attendance cleanup note:', attErr.message);
      }
      try {
        await Payroll.destroy({ where: { pegawai_id: empId } });
      } catch (payErr) {
        console.warn('Payroll cleanup note:', payErr.message);
      }

      // Hapus record karyawan secara permanen
      await Employee.destroy({ where: { id_pegawai: empId } });

      return res.status(200).json({
        success: true,
        message: `Karyawan '${empName}' (${empCode}) berhasil dihapus permanen dari database HR!`,
        data: { id_pegawai: empId, kode_pegawai: empCode, nama_lengkap: empName }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = payrollController;
