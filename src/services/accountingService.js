const {
  sequelize,
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  Payroll,
  Employee,
  Barang,
  StockMutation
} = require('../models');

/**
 * Service untuk Pembukuan Berpasangan (Double-Entry Bookkeeping)
 */
const accountingService = {
  /**
   * Fungsi Inti: Mencatat Jurnal Umum (Double-Entry)
   * WAJIB memvalidasi bahwa total Debet == total Kredit sebelum disimpan ke database.
   *
   * @param {Object} params
   * @param {string} params.tanggal_jurnal - Format YYYY-MM-DD
   * @param {string} params.tipe_referensi - 'PAYROLL' | 'PURCHASE_CASH' | 'MANUAL' | dll
   * @param {number} [params.referensi_id] - ID dokumen transaksi
   * @param {string} params.keterangan - Deskripsi transaksi
   * @param {Array<Object>} params.lines - Rincian baris akun, debet, kredit
   *   Contoh: [ { akun_id: 1, debet: 5000000, kredit: 0, catatan: '...' }, { akun_id: 2, debet: 0, kredit: 5000000, catatan: '...' } ]
   * @param {Object} [externalTransaction] - Opsional: Sequelize transaction jika bagian dari transaksi luar
   */
  catatJurnalUmum: async (
    { tanggal_jurnal = new Date(), tipe_referensi = 'MANUAL', referensi_id = null, keterangan, lines = [] },
    externalTransaction = null
  ) => {
    // 1. Validasi minimal 2 baris (Prinsip Double-Entry)
    if (!lines || lines.length < 2) {
      throw new Error('Jurnal umum memerlukan minimal 2 baris akun (minimal 1 Debet dan 1 Kredit).');
    }

    // 2. Hitung total Debet dan total Kredit
    let totalDebet = 0;
    let totalKredit = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const debetVal = parseFloat(line.debet || 0);
      const kreditVal = parseFloat(line.kredit || 0);

      if (isNaN(debetVal) || debetVal < 0) {
        throw new Error(`Baris ke-${i + 1}: Nilai debet tidak valid atau bernilai negatif.`);
      }
      if (isNaN(kreditVal) || kreditVal < 0) {
        throw new Error(`Baris ke-${i + 1}: Nilai kredit tidak valid atau bernilai negatif.`);
      }
      if (debetVal === 0 && kreditVal === 0) {
        throw new Error(`Baris ke-${i + 1}: Nilai debet atau kredit harus diisi lebih dari 0.`);
      }

      totalDebet += debetVal;
      totalKredit += kreditVal;
    }

    // Pembulatan presisi 2 desimal untuk mencegah selisih floating point
    totalDebet = Math.round(totalDebet * 100) / 100;
    totalKredit = Math.round(totalKredit * 100) / 100;

    // 3. VALIDASI BALANCE (Debet == Kredit)
    const selisih = Math.abs(totalDebet - totalKredit);
    if (selisih >= 0.01) {
      throw new Error(
        `JURNAL TIDAK SEIMBANG (UNBALANCED JOURNAL)! Total Debet (Rp ${totalDebet.toLocaleString('id-ID')}) tidak sama dengan Total Kredit (Rp ${totalKredit.toLocaleString('id-ID')}). Selisih: Rp ${selisih.toLocaleString('id-ID')}. Transaksi dibatalkan demi integritas akuntansi.`
      );
    }

    // 4. Proses Penyimpanan ke Database SQL
    const t = externalTransaction || (await sequelize.transaction());

    try {
      const nomorJurnal = `JV-${Date.now().toString().slice(-6)}`;

      // Simpan Header Jurnal
      const headerJurnal = await JournalEntry.create(
        {
          nomor_jurnal: nomorJurnal,
          tanggal_jurnal,
          tipe_referensi,
          referensi_id,
          keterangan,
          total_debet: totalDebet,
          total_kredit: totalKredit,
          status: 'POSTED'
        },
        { transaction: t }
      );

      // Simpan Baris Jurnal (Lines)
      const linesToCreate = lines.map((l) => ({
        jurnal_id: headerJurnal.id_jurnal,
        akun_id: l.akun_id,
        debet: parseFloat(l.debet || 0),
        kredit: parseFloat(l.kredit || 0),
        catatan: l.catatan || keterangan
      }));

      await JournalEntryLine.bulkCreate(linesToCreate, { transaction: t });

      if (!externalTransaction) {
        await t.commit();
      }

      // Ambil data jurnal lengkap dengan info nama akun
      const jurnalLengkap = await JournalEntry.findByPk(headerJurnal.id_jurnal, {
        transaction: externalTransaction ? t : null,
        include: [
          {
            model: JournalEntryLine,
            as: 'lines',
            include: [{ model: ChartOfAccount, as: 'akun', attributes: ['kode_akun', 'nama_akun', 'tipe_akun'] }]
          }
        ]
      });

      return jurnalLengkap;
    } catch (error) {
      if (!externalTransaction && t && !t.finished) {
        await t.rollback();
      }
      throw error;
    }
  },

  /**
   * SKENARIO 1: JURNAL PAYROLL (Saat gaji karyawan dibayarkan)
   * Logika:
   *   [DEBET]  Beban Gaji & Upah (Beban bertambah)
   *   [KREDIT] Kas Toko / Bank Operasional (Aset Kas berkurang)
   */
  catatJurnalPayroll: async ({
    payroll_id,
    akun_beban_gaji_id = null,
    akun_kas_bank_id = null,
    tanggal_bayar = new Date()
  }) => {
    const t = await sequelize.transaction();

    try {
      // 1. Ambil data slip gaji
      const payroll = await Payroll.findByPk(payroll_id, {
        include: [{ model: Employee, as: 'pegawai' }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!payroll) {
        throw new Error(`Data Payroll ID ${payroll_id} tidak ditemukan`);
      }

      if (payroll.status_pembayaran === 'PAID') {
        throw new Error(`Slip gaji #${payroll.nomor_slip} sudah pernah dibayarkan sebelumnya (PAID).`);
      }

      // 2. Tentukan Akun CoA
      // Default: 6-1001 (Beban Gaji) dan 1-1002 (Bank BCA)
      let bebanGajiAccount = null;
      if (akun_beban_gaji_id) {
        bebanGajiAccount = await ChartOfAccount.findByPk(akun_beban_gaji_id, { transaction: t });
      } else {
        bebanGajiAccount = await ChartOfAccount.findOne({ where: { kode_akun: '6-1001' }, transaction: t });
      }

      let kasBankAccount = null;
      if (akun_kas_bank_id) {
        kasBankAccount = await ChartOfAccount.findByPk(akun_kas_bank_id, { transaction: t });
      } else {
        kasBankAccount = await ChartOfAccount.findOne({ where: { kode_akun: '1-1002' }, transaction: t });
      }

      if (!bebanGajiAccount || !kasBankAccount) {
        throw new Error(
          'Akun Beban Gaji (6-1001) atau Akun Kas/Bank (1-1002) belum terdaftar di Chart of Accounts. Jalankan endpoint seed CoA terlebih dahulu.'
        );
      }

      const nominalGaji = parseFloat(payroll.gaji_bersih);

      // 3. Susun Baris Jurnal Double-Entry yang Seimbang
      const lines = [
        {
          akun_id: bebanGajiAccount.id_akun,
          debet: nominalGaji,
          kredit: 0,
          catatan: `Beban Gaji Karyawan ${payroll.pegawai?.nama_lengkap} (Periode ${payroll.bulan}/${payroll.tahun})`
        },
        {
          akun_id: kasBankAccount.id_akun,
          debet: 0,
          kredit: nominalGaji,
          catatan: `Pembayaran Gaji #${payroll.nomor_slip} via ${kasBankAccount.nama_akun}`
        }
      ];

      // 4. Catat Jurnal dengan validasi seimbang
      const jurnal = await accountingService.catatJurnalUmum(
        {
          tanggal_jurnal: tanggal_bayar,
          tipe_referensi: 'PAYROLL',
          referensi_id: payroll.id_payroll,
          keterangan: `Pembayaran Gaji Karyawan: ${payroll.pegawai?.nama_lengkap} (#${payroll.nomor_slip})`,
          lines
        },
        t
      );

      // 5. Update Status Payroll menjadi PAID
      await payroll.update(
        {
          status_pembayaran: 'PAID',
          tanggal_bayar: tanggal_bayar
        },
        { transaction: t }
      );

      await t.commit();

      return {
        success: true,
        message: 'Jurnal pembayaran gaji berhasil dicatat dan status slip gaji diubah menjadi PAID',
        data: {
          payroll_id: payroll.id_payroll,
          nomor_slip: payroll.nomor_slip,
          gaji_bersih: nominalGaji,
          status_pembayaran: 'PAID',
          jurnal: {
            id_jurnal: jurnal.id_jurnal,
            nomor_jurnal: jurnal.nomor_jurnal,
            tanggal_jurnal: jurnal.tanggal_jurnal,
            total_debet: jurnal.total_debet,
            total_kredit: jurnal.total_kredit,
            rincian_lines: jurnal.lines
          }
        }
      };
    } catch (error) {
      if (t && !t.finished) {
        await t.rollback();
      }
      throw error;
    }
  },

  /**
   * SKENARIO 2: JURNAL PEMBELIAN BAHAN BAKU TUNAI (Procurement Cash)
   * Logika:
   *   [DEBET]  Persediaan Bahan Baku (Aset Persediaan bertambah)
   *   [KREDIT] Kas Toko / Kasir (Aset Kas berkurang)
   * Sekaligus menambah kuantitas fisik persediaan dan menghitung HPP rata-rata baru di tabel Inventory.
   */
  catatJurnalPembelianTunai: async ({
    id_barang,
    jumlah_beli,
    harga_satuan_beli,
    akun_persediaan_id = null,
    akun_kas_id = null,
    keterangan = 'Pembelian bahan baku tunai di pasar / suplier lokal'
  }) => {
    const t = await sequelize.transaction();

    try {
      const qtyBeli = parseFloat(jumlah_beli);
      const hargaBeli = parseFloat(harga_satuan_beli);

      if (isNaN(qtyBeli) || qtyBeli <= 0) {
        throw new Error('Jumlah beli harus berupa angka lebih besar dari 0');
      }
      if (isNaN(hargaBeli) || hargaBeli <= 0) {
        throw new Error('Harga satuan beli harus berupa angka lebih besar dari 0');
      }

      // 1. Ambil data master barang
      const barang = await Barang.findByPk(id_barang, { lock: t.LOCK.UPDATE, transaction: t });
      if (!barang) {
        throw new Error(`Barang dengan ID ${id_barang} tidak ditemukan`);
      }

      // 2. Hitung total biaya pembelian
      const totalBiaya = Math.round(qtyBeli * hargaBeli * 100) / 100;

      // 3. Tentukan Akun CoA
      // Default: 1-1020 (Persediaan Bahan Baku) dan 1-1001 (Kas Toko)
      let persediaanAccount = null;
      if (akun_persediaan_id) {
        persediaanAccount = await ChartOfAccount.findByPk(akun_persediaan_id, { transaction: t });
      } else {
        persediaanAccount = await ChartOfAccount.findOne({ where: { kode_akun: '1-1020' }, transaction: t });
      }

      let kasAccount = null;
      if (akun_kas_id) {
        kasAccount = await ChartOfAccount.findByPk(akun_kas_id, { transaction: t });
      } else {
        kasAccount = await ChartOfAccount.findOne({ where: { kode_akun: '1-1001' }, transaction: t });
      }

      if (!persediaanAccount || !kasAccount) {
        throw new Error(
          'Akun Persediaan Bahan Baku (1-1020) atau Akun Kas Toko (1-1001) belum terdaftar di Chart of Accounts. Jalankan endpoint seed CoA terlebih dahulu.'
        );
      }

      // 4. Susun Baris Jurnal Double-Entry
      const lines = [
        {
          akun_id: persediaanAccount.id_akun,
          debet: totalBiaya,
          kredit: 0,
          catatan: `Penambahan Persediaan '${barang.nama_barang}' (+${qtyBeli} ${barang.satuan})`
        },
        {
          akun_id: kasAccount.id_akun,
          debet: 0,
          kredit: totalBiaya,
          catatan: `Pengeluaran Kas Toko untuk Pembelian '${barang.nama_barang}'`
        }
      ];

      // 5. Catat Jurnal dengan validasi seimbang
      const jurnal = await accountingService.catatJurnalUmum(
        {
          tanggal_jurnal: new Date().toISOString().split('T')[0],
          tipe_referensi: 'PURCHASE_CASH',
          referensi_id: barang.id_barang,
          keterangan: `${keterangan} - ${barang.nama_barang} (${qtyBeli} ${barang.satuan} @ Rp ${hargaBeli.toLocaleString('id-ID')})`,
          lines
        },
        t
      );

      // 6. Update Modul Inventory: Tambah stok & hitung ulang HPP Rata-Rata Bergerak
      const stokLama = Math.max(parseFloat(barang.stok_saat_ini), 0);
      const hppLama = parseFloat(barang.harga_satuan);
      const stokBaru = Math.round((stokLama + qtyBeli) * 1000) / 1000;

      const totalNilaiLama = stokLama * hppLama;
      const totalNilaiBaru = qtyBeli * hargaBeli;
      const hppBaru = Math.round(((totalNilaiLama + totalNilaiBaru) / stokBaru) * 100) / 100;

      await barang.update(
        {
          stok_saat_ini: stokBaru,
          harga_satuan: hppBaru
        },
        { transaction: t }
      );

      // 7. Catat di Kartu Stok (StockMutation)
      await StockMutation.create(
        {
          id_barang: barang.id_barang,
          tipe_mutasi: 'IN_PROCUREMENT',
          jumlah_masuk: qtyBeli,
          jumlah_keluar: 0,
          saldo_akhir: stokBaru,
          harga_satuan: hppBaru,
          referensi_tipe: 'JOURNAL_ENTRY',
          referensi_id: jurnal.id_jurnal,
          keterangan: `Pembelian tunai (${jurnal.nomor_jurnal})`
        },
        { transaction: t }
      );

      await t.commit();

      return {
        success: true,
        message: 'Pembelian bahan baku tunai berhasil dijurnal dan stok inventory bertambah',
        data: {
          barang: {
            id_barang: barang.id_barang,
            nama_barang: barang.nama_barang,
            stok_sebelumnya: stokLama,
            jumlah_dibeli: qtyBeli,
            stok_sekarang: stokBaru,
            hpp_lama: hppLama,
            hpp_baru: hppBaru
          },
          jurnal: {
            id_jurnal: jurnal.id_jurnal,
            nomor_jurnal: jurnal.nomor_jurnal,
            tanggal_jurnal: jurnal.tanggal_jurnal,
            total_debet: jurnal.total_debet,
            total_kredit: jurnal.total_kredit,
            rincian_lines: jurnal.lines
          }
        }
      };
    } catch (error) {
      if (t && !t.finished) {
        await t.rollback();
      }
      throw error;
    }
  },

  /**
   * Helper: Mengisi Akun Standar Bagan Akun (Chart of Accounts) khusus Coffee Shop
   */
  seedStandardCoA: async () => {
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

    const results = [];
    for (const acc of defaultAccounts) {
      const [account] = await ChartOfAccount.findOrCreate({
        where: { kode_akun: acc.kode_akun },
        defaults: acc
      });
      results.push(account);
    }

    return results;
  }
};

module.exports = accountingService;
