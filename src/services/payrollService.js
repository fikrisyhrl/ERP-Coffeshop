const { Op } = require('sequelize');
const {
  sequelize,
  Employee,
  JobPosition,
  Department,
  Attendance,
  Payroll,
  PayrollItem
} = require('../models');

/**
 * Helper untuk mengubah angka nominal rupiah menjadi teks terbilang bahasa Indonesia
 */
const terbilangRupiah = (angka) => {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas'
  ];

  const konversi = (n) => {
    n = Math.floor(n);
    if (n < 12) return bilangan[n];
    if (n < 20) return konversi(n - 10) + ' Belas';
    if (n < 100) return konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    if (n < 200) return 'Seratus ' + konversi(n - 100);
    if (n < 1000) return konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    if (n < 2000) return 'Seribu ' + konversi(n - 1000);
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    return konversi(Math.floor(n / 1000000000)) + ' Miliar ' + konversi(n % 1000000000);
  };

  const hasil = konversi(Math.abs(Math.round(angka))).replace(/\s+/g, ' ').trim();
  return (hasil ? hasil : 'Nol') + ' Rupiah';
};

/**
 * Helper untuk memformat angka desimal ke mata uang Rupiah
 */
const formatRupiah = (angka) => {
  return 'Rp ' + Number(angka).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const payrollService = {
  /**
   * Menghitung payroll bulanan untuk 1 pegawai berdasarkan absensi & jabatan
   */
  hitungPayrollPegawai: async ({
    pegawai_id,
    bulan,
    tahun,
    target_hari_kerja = 24,
    nominal_tunjangan_kehadiran = 500000,
    tarif_potongan_per_menit = 2000,
    tarif_lembur_per_jam = 25000
  }) => {
    const t = await sequelize.transaction();

    try {
      const targetBulan = parseInt(bulan, 10);
      const targetTahun = parseInt(tahun, 10);

      // 1. Ambil data pegawai beserta jabatan dan departemen
      const pegawai = await Employee.findByPk(pegawai_id, {
        include: [
          {
            model: JobPosition,
            as: 'posisi',
            include: [{ model: Department, as: 'departemen' }]
          }
        ],
        transaction: t
      });

      if (!pegawai) {
        throw new Error(`Data pegawai dengan ID ${pegawai_id} tidak ditemukan`);
      }

      // 2. Tentukan rentang tanggal awal dan akhir bulan (kebal pergeseran timezone UTC)
      const padZero = (n) => String(n).padStart(2, '0');
      const lastDay = new Date(targetTahun, targetBulan, 0).getDate();
      const periodeMulaiStr = `${targetTahun}-${padZero(targetBulan)}-01`;
      const periodeSelesaiStr = `${targetTahun}-${padZero(targetBulan)}-${padZero(lastDay)}`;

      // 3. Baca data absensi bulanan dari tabel attendances
      const dataAbsensi = await Attendance.findAll({
        where: {
          pegawai_id: pegawai.id_pegawai,
          tanggal_absensi: {
            [Op.between]: [periodeMulaiStr, periodeSelesaiStr]
          }
        },
        order: [['tanggal_absensi', 'ASC']],
        transaction: t
      });

      // 4. Hitung metrik absensi
      let totalHadir = 0;
      let totalTerlambatKali = 0;
      let totalMenitTerlambat = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlpha = 0;
      let totalJamLembur = 0;

      dataAbsensi.forEach((ab) => {
        if (ab.status_kehadiran === 'HADIR') {
          totalHadir += 1;
        } else if (ab.status_kehadiran === 'TERLAMBAT') {
          totalHadir += 1; // Terlambat tetap dihitung hadir
          totalTerlambatKali += 1;
          totalMenitTerlambat += ab.menit_terlambat || 0;
        } else if (ab.status_kehadiran === 'IZIN') {
          totalIzin += 1;
        } else if (ab.status_kehadiran === 'SAKIT') {
          totalSakit += 1;
        } else if (ab.status_kehadiran === 'ALPHA') {
          totalAlpha += 1;
        }

        totalJamLembur += parseFloat(ab.jam_lembur || 0);
      });

      // 5. KALKULASI GAJI SESUAI KETENTUAN:

      // (1) Gaji Pokok (Berdasarkan role/jabatan atau penetapan pegawai)
      const gajiPokok = parseFloat(pegawai.gaji_pokok) > 0 
        ? parseFloat(pegawai.gaji_pokok) 
        : parseFloat(pegawai.posisi?.gaji_pokok_standar || 0);

      // (2) Tunjangan Kehadiran (Diberikan penuh jika hari masuk memenuhi target)
      const isTargetKehadiranTercapai = totalHadir >= target_hari_kerja;
      const nominalTunjanganKehadiran = isTargetKehadiranTercapai 
        ? parseFloat(nominal_tunjangan_kehadiran) 
        : 0;

      // (Bonus) Uang Lembur
      const nominalUangLembur = Math.round(totalJamLembur * tarif_lembur_per_jam);

      // (3) Potongan Keterlambatan (Potong Rp X per menit keterlambatan)
      const nominalPotonganKeterlambatan = totalMenitTerlambat * tarif_potongan_per_menit;

      // 6. Ringkasan Pendapatan dan Potongan
      const listPendapatan = [
        {
          nama_komponen: 'Gaji Pokok',
          nominal: gajiPokok,
          keterangan: `Gaji pokok jabatan: ${pegawai.posisi?.nama_jabatan || '-'}`
        }
      ];

      if (nominalTunjanganKehadiran > 0) {
        listPendapatan.push({
          nama_komponen: 'Tunjangan Kehadiran',
          nominal: nominalTunjanganKehadiran,
          keterangan: `Target kehadiran terpenuhi (${totalHadir}/${target_hari_kerja} hari kerja)`
        });
      }

      if (nominalUangLembur > 0) {
        listPendapatan.push({
          nama_komponen: 'Uang Lembur (Overtime)',
          nominal: nominalUangLembur,
          keterangan: `${totalJamLembur} jam x ${formatRupiah(tarif_lembur_per_jam)}/jam`
        });
      }

      const listPotongan = [];
      if (nominalPotonganKeterlambatan > 0) {
        listPotongan.push({
          nama_komponen: 'Potongan Keterlambatan',
          nominal: nominalPotonganKeterlambatan,
          keterangan: `${totalMenitTerlambat} menit terlambat (${totalTerlambatKali}x) x ${formatRupiah(tarif_potongan_per_menit)}/menit`
        });
      }

      const totalPendapatanKotor = listPendapatan.reduce((acc, curr) => acc + curr.nominal, 0);
      const totalSemuaPotongan = listPotongan.reduce((acc, curr) => acc + curr.nominal, 0);
      const gajiBersih = Math.max(totalPendapatanKotor - totalSemuaPotongan, 0);

      // 7. Simpan atau Perbarui ke database (Tabel payrolls & payroll_items)
      const nomorSlip = `SLIP/${targetTahun}/${String(targetBulan).padStart(2, '0')}/${pegawai.kode_pegawai}`;

      // Cari apakah slip gaji untuk periode ini sudah pernah di-generate sebelumnya
      let payroll = await Payroll.findOne({
        where: {
          pegawai_id: pegawai.id_pegawai,
          bulan: targetBulan,
          tahun: targetTahun
        },
        transaction: t
      });

      if (payroll) {
        // Hapus item lama jika regenerate
        await PayrollItem.destroy({ where: { payroll_id: payroll.id_payroll }, transaction: t });

        await payroll.update(
          {
            total_hari_kerja_target: target_hari_kerja,
            total_hadir: totalHadir,
            total_menit_terlambat: totalMenitTerlambat,
            total_jam_lembur: totalJamLembur,
            total_pendapatan: totalPendapatanKotor,
            total_potongan: totalSemuaPotongan,
            gaji_bersih: gajiBersih
          },
          { transaction: t }
        );
      } else {
        payroll = await Payroll.create(
          {
            nomor_slip: nomorSlip,
            pegawai_id: pegawai.id_pegawai,
            bulan: targetBulan,
            tahun: targetTahun,
            periode_mulai: periodeMulaiStr,
            periode_selesai: periodeSelesaiStr,
            total_hari_kerja_target: target_hari_kerja,
            total_hadir: totalHadir,
            total_menit_terlambat: totalMenitTerlambat,
            total_jam_lembur: totalJamLembur,
            total_pendapatan: totalPendapatanKotor,
            total_potongan: totalSemuaPotongan,
            gaji_bersih: gajiBersih,
            status_pembayaran: 'DRAFT'
          },
          { transaction: t }
        );
      }

      // Masukkan item pendapatan
      for (const pend of listPendapatan) {
        await PayrollItem.create(
          {
            payroll_id: payroll.id_payroll,
            nama_komponen: pend.nama_komponen,
            tipe_komponen: 'PENDAPATAN',
            nominal: pend.nominal,
            keterangan: pend.keterangan
          },
          { transaction: t }
        );
      }

      // Masukkan item potongan
      for (const pot of listPotongan) {
        await PayrollItem.create(
          {
            payroll_id: payroll.id_payroll,
            nama_komponen: pot.nama_komponen,
            tipe_komponen: 'POTONGAN',
            nominal: pot.nominal,
            keterangan: pot.keterangan
          },
          { transaction: t }
        );
      }

      await t.commit();

      // 8. Bentuk Format JSON Payslip Lengkap & Rapi untuk Frontend
      const namaBulanIndo = [
        '',
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember'
      ];

      const formatResponseFrontend = {
        metadata: {
          slip_id: payroll.nomor_slip,
          id_payroll: payroll.id_payroll,
          status_pembayaran: payroll.status_pembayaran,
          tanggal_generate: new Date().toISOString()
        },
        periode: {
          bulan: namaBulanIndo[targetBulan],
          angka_bulan: targetBulan,
          tahun: targetTahun,
          tanggal_mulai: periodeMulaiStr,
          tanggal_selesai: periodeSelesaiStr
        },
        pegawai: {
          id_pegawai: pegawai.id_pegawai,
          kode_pegawai: pegawai.kode_pegawai,
          nama_lengkap: pegawai.nama_lengkap,
          departemen: pegawai.posisi?.departemen?.nama_departemen || '-',
          jabatan: pegawai.posisi?.nama_jabatan || '-',
          status_kerja: pegawai.status_kerja,
          informasi_pembayaran: {
            nama_bank: pegawai.nama_bank,
            nomor_rekening: pegawai.nomor_rekening
          }
        },
        ringkasan_absensi: {
          target_hari_kerja: target_hari_kerja,
          total_hadir: totalHadir,
          target_tercapai: isTargetKehadiranTercapai,
          persentase_kehadiran: `${Math.round((totalHadir / target_hari_kerja) * 100)}%`,
          frekuensi_terlambat: totalTerlambatKali,
          total_menit_terlambat: totalMenitTerlambat,
          total_jam_lembur: totalJamLembur,
          izin: totalIzin,
          sakit: totalSakit,
          alpha: totalAlpha
        },
        rincian_gaji: {
          pendapatan: listPendapatan.map((p) => ({
            komponen: p.nama_komponen,
            nominal: p.nominal,
            nominal_terformat: formatRupiah(p.nominal),
            keterangan: p.keterangan
          })),
          potongan: listPotongan.map((p) => ({
            komponen: p.nama_komponen,
            nominal: p.nominal,
            nominal_terformat: formatRupiah(p.nominal),
            keterangan: p.keterangan
          }))
        },
        ringkasan_finansial: {
          total_pendapatan_kotor: totalPendapatanKotor,
          total_pendapatan_kotor_terformat: formatRupiah(totalPendapatanKotor),
          total_potongan: totalSemuaPotongan,
          total_potongan_terformat: formatRupiah(totalSemuaPotongan),
          gaji_bersih: gajiBersih,
          gaji_bersih_terformat: formatRupiah(gajiBersih),
          terbilang: terbilangRupiah(gajiBersih)
        }
      };

      return formatResponseFrontend;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Mengambil data slip gaji yang sudah tersimpan
   */
  getSlipGajiById: async (payroll_id) => {
    const payroll = await Payroll.findByPk(payroll_id, {
      include: [
        {
          model: Employee,
          as: 'pegawai',
          include: [
            {
              model: JobPosition,
              as: 'posisi',
              include: [{ model: Department, as: 'departemen' }]
            }
          ]
        },
        { model: PayrollItem, as: 'items' }
      ]
    });

    if (!payroll) {
      throw new Error(`Slip gaji ID ${payroll_id} tidak ditemukan`);
    }

    return payroll;
  }
};

module.exports = payrollService;
