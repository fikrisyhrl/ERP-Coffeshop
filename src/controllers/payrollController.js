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
   * GET /api/hcm/pegawai
   * Ambil daftar semua pegawai aktif beserta posisi dan departemen
   */
  getAllPegawai: async (req, res, next) => {
    try {
      const employees = await Employee.findAll({
        include: [
          {
            model: JobPosition,
            as: 'posisi',
            include: [{ model: Department, as: 'departemen' }]
          }
        ],
        order: [['id_pegawai', 'ASC']]
      });
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
  }
};

module.exports = payrollController;
