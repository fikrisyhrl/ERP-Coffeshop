const accountingService = require('../services/accountingService');
const procurementService = require('../services/procurementService');
const {
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Barang,
  PurchaseInvoice
} = require('../models');

const accountingController = {
  /**
   * POST /api/finance/seed-coa
   * Inisialisasi Akun Standar (CoA) untuk Coffee Shop
   */
  seedCoA: async (req, res, next) => {
    try {
      const coaList = await accountingService.seedStandardCoA();
      return res.status(200).json({
        success: true,
        message: 'Chart of Accounts (CoA) standar Coffee Shop berhasil dibuat',
        data: coaList
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finance/coa
   * Mengambil daftar seluruh akun (auto-seed jika masih kosong)
   */
  getAllCoA: async (req, res, next) => {
    try {
      let accounts = await ChartOfAccount.findAll({ order: [['kode_akun', 'ASC']] });
      if (accounts.length === 0) {
        await accountingService.seedStandardCoA();
        accounts = await ChartOfAccount.findAll({ order: [['kode_akun', 'ASC']] });
      }
      return res.status(200).json({
        success: true,
        data: accounts
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/finance/coa
   * Tambah Akun Baru di Chart of Accounts (CRUD Create)
   */
  createCoA: async (req, res, next) => {
    try {
      const { kode_akun, nama_akun, tipe_akun, saldo_normal } = req.body;
      if (!kode_akun || !nama_akun || !tipe_akun || !saldo_normal) {
        return res.status(400).json({
          success: false,
          message: 'kode_akun, nama_akun, tipe_akun, dan saldo_normal wajib diisi'
        });
      }

      const existing = await ChartOfAccount.findOne({ where: { kode_akun: kode_akun.trim() } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Kode akun ${kode_akun} sudah terdaftar dalam sistem`
        });
      }

      const newAccount = await ChartOfAccount.create({
        kode_akun: kode_akun.trim(),
        nama_akun: nama_akun.trim(),
        tipe_akun: tipe_akun.toUpperCase(),
        saldo_normal: saldo_normal.toUpperCase(),
        is_active: true
      });

      return res.status(201).json({
        success: true,
        message: `Akun CoA [${newAccount.kode_akun}] ${newAccount.nama_akun} berhasil ditambahkan ke database!`,
        data: newAccount
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/finance/coa/:id
   * Perbarui Akun CoA (CRUD Update)
   */
  updateCoA: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nama_akun, tipe_akun, saldo_normal, is_active } = req.body;

      const account = await ChartOfAccount.findByPk(id);
      if (!account) {
        return res.status(404).json({ success: false, message: 'Akun CoA tidak ditemukan' });
      }

      if (nama_akun) account.nama_akun = nama_akun.trim();
      if (tipe_akun) account.tipe_akun = tipe_akun.toUpperCase();
      if (saldo_normal) account.saldo_normal = saldo_normal.toUpperCase();
      if (typeof is_active === 'boolean') account.is_active = is_active;
      await account.save();

      return res.status(200).json({
        success: true,
        message: `Akun [${account.kode_akun}] berhasil diperbarui`,
        data: account
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/finance/coa/:id
   * Hapus / Nonaktifkan Akun CoA (CRUD Delete)
   */
  deleteCoA: async (req, res, next) => {
    try {
      const { id } = req.params;
      const account = await ChartOfAccount.findByPk(id);
      if (!account) {
        return res.status(404).json({ success: false, message: 'Akun CoA tidak ditemukan' });
      }

      // Cek apakah akun sudah digunakan dalam jurnal
      const usageCount = await JournalEntryLine.count({ where: { akun_id: id } });
      if (usageCount > 0) {
        account.is_active = false;
        await account.save();
        return res.status(200).json({
          success: true,
          message: `Akun [${account.kode_akun}] telah digunakan dalam ${usageCount} jurnal transaksi, sehingga statusnya dinonaktifkan (soft delete) demi integritas buku besar.`
        });
      }

      await account.destroy();
      return res.status(200).json({
        success: true,
        message: `Akun [${account.kode_akun}] ${account.nama_akun} berhasil dihapus permanen dari sistem.`
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/finance/jurnal/payroll
   * SKENARIO 1: Pencatatan Jurnal Pembayaran Gaji Karyawan
   * (Debet: Beban Gaji, Kredit: Kas/Bank)
   */
  jurnalPayroll: async (req, res, next) => {
    try {
      const { payroll_id, akun_beban_gaji_id, akun_kas_bank_id, tanggal_bayar } = req.body;

      if (!payroll_id) {
        return res.status(400).json({
          success: false,
          message: 'payroll_id wajib disertakan'
        });
      }

      const hasil = await accountingService.catatJurnalPayroll({
        payroll_id,
        akun_beban_gaji_id,
        akun_kas_bank_id,
        tanggal_bayar: tanggal_bayar || new Date()
      });

      return res.status(200).json(hasil);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/finance/jurnal/pembelian-tunai
   * SKENARIO 2: Pencatatan Jurnal Pembelian Bahan Baku Tunai
   * (Debet: Persediaan Bahan Baku, Kredit: Kas)
   */
  jurnalPembelianTunai: async (req, res, next) => {
    try {
      const { id_barang, jumlah_beli, harga_satuan_beli, akun_persediaan_id, akun_kas_id, keterangan } = req.body;

      if (!id_barang || !jumlah_beli || !harga_satuan_beli) {
        return res.status(400).json({
          success: false,
          message: 'id_barang, jumlah_beli, dan harga_satuan_beli wajib diisi'
        });
      }

      const hasil = await accountingService.catatJurnalPembelianTunai({
        id_barang,
        jumlah_beli,
        harga_satuan_beli,
        akun_persediaan_id,
        akun_kas_id,
        keterangan
      });

      return res.status(200).json(hasil);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/finance/jurnal/manual
   * Pencatatan Jurnal Umum Kustom (dengan validasi Debet == Kredit)
   */
  jurnalManual: async (req, res, next) => {
    try {
      const { tanggal_jurnal, keterangan, lines } = req.body;

      if (!keterangan || !lines || lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'keterangan dan lines jurnal wajib diisi'
        });
      }

      const jurnal = await accountingService.catatJurnalUmum({
        tanggal_jurnal: tanggal_jurnal || new Date(),
        tipe_referensi: 'MANUAL',
        keterangan,
        lines
      });

      return res.status(201).json({
        success: true,
        message: 'Jurnal umum berhasil dicatat (Debet dan Kredit seimbang)',
        data: jurnal
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/finance/jurnal/:id
   * Hapus Jurnal Manual (CRUD Delete)
   */
  deleteJurnal: async (req, res, next) => {
    try {
      const { id } = req.params;
      const jurnal = await JournalEntry.findByPk(id);
      if (!jurnal) {
        return res.status(404).json({ success: false, message: 'Data jurnal tidak ditemukan' });
      }

      await JournalEntryLine.destroy({ where: { jurnal_id: id } });
      await jurnal.destroy();

      return res.status(200).json({
        success: true,
        message: `Jurnal #${jurnal.nomor_jurnal} berhasil dihapus dari riwayat jurnal umum.`
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finance/jurnal
   * Mengambil semua daftar jurnal umum beserta baris debet-kreditnya
   */
  getAllJurnal: async (req, res, next) => {
    try {
      const jurnalList = await JournalEntry.findAll({
        include: [
          {
            model: JournalEntryLine,
            as: 'lines',
            include: [{ model: ChartOfAccount, as: 'akun', attributes: ['kode_akun', 'nama_akun', 'tipe_akun'] }]
          }
        ],
        order: [['tanggal_jurnal', 'DESC'], ['id_jurnal', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: jurnalList
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finance/pengajuan-po
   * Mengambil daftar pengajuan pembelian dari procurement yang masuk ke Finance
   * Default mengambil status 'PENDING_APPROVAL', atau sesuai query status
   */
  getPengajuanPO: async (req, res, next) => {
    try {
      const { status } = req.query;
      const whereClause = {};

      if (status && status !== 'ALL') {
        whereClause.status = status;
      } else if (!status) {
        whereClause.status = 'PENDING_APPROVAL';
      }

      const pengajuanList = await PurchaseOrder.findAll({
        where: whereClause,
        include: [
          { model: Supplier, as: 'supplier', attributes: ['id_supplier', 'nama_supplier', 'telepon', 'email'] },
          {
            model: PurchaseOrderItem,
            as: 'items',
            include: [{ model: Barang, as: 'barang', attributes: ['id_barang', 'nama_barang', 'satuan', 'harga_satuan', 'stok_saat_ini'] }]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: pengajuanList
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/finance/pengajuan-po/:id/setujui
   * Tim Finance menyetujui pengajuan pembelian (Status -> CONFIRMED)
   * Setelah disetujui, pembelian masuk daftar aktif procurement dan dapat dilaksanakan.
   */
  setujuiPengajuanPO: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { disetujui_oleh, catatan_finance } = req.body || {};

      const po = await procurementService.setujuiPengajuanFinance(id, {
        disetujui_oleh: disetujui_oleh || 'Finance Manager / Tim Keuangan',
        catatan_finance
      });

      return res.status(200).json({
        success: true,
        message: `Pengajuan pembelian PO #${po.nomor_po} BERHASIL DISETUJUI oleh Finance. Pembelian telah dimasukkan ke daftar aktif procurement dan siap dilaksanakan.`,
        data: po
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/finance/pengajuan-po/:id/tolak
   * Tim Finance menolak pengajuan pembelian (Status -> REJECTED)
   * Jika ditolak, pengajuan resmi dibatalkan dan tidak dapat diproses lebih lanjut.
   */
  tolakPengajuanPO: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { ditolak_oleh, alasan_penolakan } = req.body || {};

      const po = await procurementService.tolakPengajuanFinance(id, {
        ditolak_oleh: ditolak_oleh || 'Finance Manager / Tim Keuangan',
        alasan_penolakan: alasan_penolakan || 'Anggaran tidak mencukupi / pengadaan ditunda.'
      });

      return res.status(200).json({
        success: true,
        message: `Pengajuan pembelian PO #${po.nomor_po} DITOLAK oleh Finance. Pengajuan resmi dibatalkan.`,
        data: po
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finance/invoices
   * Mengambil daftar invoice tagihan pembelian barang dari supplier
   */
  getAllInvoices: async (req, res, next) => {
    try {
      const { status } = req.query;
      const whereClause = {};
      if (status && status !== 'ALL') {
        whereClause.status_pembayaran = status;
      }

      let invoices = await PurchaseInvoice.findAll({
        where: whereClause,
        include: [
          {
            model: PurchaseOrder,
            as: 'purchase_order',
            include: [
              {
                model: PurchaseOrderItem,
                as: 'items',
                include: [{ model: Barang, as: 'barang', attributes: ['id_barang', 'nama_barang', 'satuan'] }]
              }
            ]
          },
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id_supplier', 'nama_supplier', 'telepon', 'email', 'alamat']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Jika database belum memiliki invoice sama sekali, auto-generate dari PO yang ada
      if (invoices.length === 0 && (!status || status === 'ALL')) {
        const poList = await PurchaseOrder.findAll({
          include: [{ model: Supplier, as: 'supplier' }]
        });
        if (poList.length > 0) {
          for (let i = 0; i < poList.length; i++) {
            const p = poList[i];
            const invStatus = p.status === 'COMPLETED' ? 'PAID' : 'UNPAID';
            const invDueDate = new Date();
            invDueDate.setDate(invDueDate.getDate() + 7);

            try {
              await PurchaseInvoice.create({
                nomor_invoice: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
                po_id: p.id_po,
                supplier_id: p.supplier_id,
                tanggal_invoice: p.tanggal_po || new Date(),
                tanggal_jatuh_tempo: invDueDate,
                total_tagihan: p.total_estimasi,
                status_pembayaran: invStatus,
                metode_pembayaran: invStatus === 'PAID' ? 'TRANSFER_BCA' : null,
                tanggal_bayar: invStatus === 'PAID' ? new Date() : null,
                dibayar_oleh: invStatus === 'PAID' ? 'Finance Specialist' : null,
                catatan: `Invoice Tagihan Pembelian Barang PO #${p.nomor_po}`
              });
            } catch { }
          }
          invoices = await PurchaseInvoice.findAll({
            include: [
              {
                model: PurchaseOrder,
                as: 'purchase_order',
                include: [
                  {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [{ model: Barang, as: 'barang', attributes: ['id_barang', 'nama_barang', 'satuan'] }]
                  }
                ]
              },
              { model: Supplier, as: 'supplier' }
            ],
            order: [['created_at', 'DESC']]
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/finance/invoices
   * Terbitkan invoice baru dari PO
   */
  createInvoice: async (req, res, next) => {
    try {
      const { po_id, supplier_id, tanggal_invoice, tanggal_jatuh_tempo, total_tagihan, catatan } = req.body;

      if (!po_id || !supplier_id || !total_tagihan) {
        return res.status(400).json({
          success: false,
          message: 'po_id, supplier_id, dan total_tagihan wajib diisi'
        });
      }

      const nomorInvoice = `INV-${Date.now().toString().slice(-6)}`;
      const dueDate = tanggal_jatuh_tempo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invoice = await PurchaseInvoice.create({
        nomor_invoice: nomorInvoice,
        po_id,
        supplier_id,
        tanggal_invoice: tanggal_invoice || new Date(),
        tanggal_jatuh_tempo: dueDate,
        total_tagihan,
        status_pembayaran: 'UNPAID',
        catatan: catatan || 'Tagihan pengadaan bahan baku'
      });

      const fullInvoice = await PurchaseInvoice.findByPk(invoice.id_invoice, {
        include: [
          {
            model: PurchaseOrder,
            as: 'purchase_order',
            include: [{ model: PurchaseOrderItem, as: 'items', include: ['barang'] }]
          },
          { model: Supplier, as: 'supplier' }
        ]
      });

      return res.status(201).json({
        success: true,
        message: `Invoice #${nomorInvoice} berhasil diterbitkan`,
        data: fullInvoice
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/finance/invoices/:id/bayar
   * Tim Finance memproses pembayaran invoice tagihan barang
   * Otomatis memotong saldo kas/bank dan mencatat di Jurnal Pengeluaran Kas
   */
  bayarInvoice: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        metode_pembayaran = 'TRANSFER_BCA',
        dibayar_oleh = 'Staff Finance',
        akun_kas_id = 2,
        catatan = ''
      } = req.body || {};

      const invoice = await PurchaseInvoice.findByPk(id, {
        include: [
          { model: PurchaseOrder, as: 'purchase_order' },
          { model: Supplier, as: 'supplier' }
        ]
      });

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });
      }

      if (invoice.status_pembayaran === 'PAID') {
        return res.status(400).json({ success: false, message: 'Invoice ini sudah lunas dibayarkan sebelumnya' });
      }

      invoice.status_pembayaran = 'PAID';
      invoice.metode_pembayaran = metode_pembayaran;
      invoice.tanggal_bayar = new Date();
      invoice.dibayar_oleh = dibayar_oleh;
      if (catatan) invoice.catatan = catatan;
      await invoice.save();

      // Buat entri Jurnal Pembayaran Invoice Otomatis
      // Debet: Hutang Usaha (akun 4 / 2-1001)
      // Kredit: Kas Toko (akun 1) atau Bank BCA (akun 2)
      const kasAkunId = parseInt(akun_kas_id) === 1 ? 1 : 2;
      const nominal = parseFloat(invoice.total_tagihan);

      const nomorJurnal = `JV-INV-${Date.now().toString().slice(-6)}`;
      const jurnalEntry = await JournalEntry.create({
        nomor_jurnal: nomorJurnal,
        tanggal_jurnal: new Date(),
        tipe_referensi: 'PURCHASE_INVOICE',
        referensi_id: invoice.id_invoice,
        keterangan: `Pelunasan Invoice #${invoice.nomor_invoice} untuk Supplier ${invoice.supplier?.nama_supplier || ''} (PO #${invoice.purchase_order?.nomor_po || ''})`,
        total_debet: nominal,
        total_kredit: nominal,
        status: 'POSTED'
      });

      await JournalEntryLine.create({
        jurnal_id: jurnalEntry.id_jurnal,
        akun_id: 4, // 2-1001 Hutang Usaha / Supplier
        debet: nominal,
        kredit: 0.00,
        catatan: `Pelunasan hutang supplier ${invoice.supplier?.nama_supplier || ''}`
      });

      await JournalEntryLine.create({
        jurnal_id: jurnalEntry.id_jurnal,
        akun_id: kasAkunId, // 1-1001 Kas Toko atau 1-1002 Bank BCA
        debet: 0.00,
        kredit: nominal,
        catatan: `Pengeluaran ${kasAkunId === 1 ? 'Kas Tunai Toko' : 'Bank BCA'} untuk Invoice #${invoice.nomor_invoice}`
      });

      return res.status(200).json({
        success: true,
        message: `Invoice #${invoice.nomor_invoice} berhasil dibayar lunas sebesar Rp ${nominal.toLocaleString('id-ID')}. Saldo kas/bank telah disesuaikan dan tercatat di buku jurnal.`,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finance/cash-balance
   * Menghitung saldo uang yang tersedia secara realtime (Kas Toko, Bank BCA, Total Dana Tersedia)
   */
  getCashBalance: async (req, res, next) => {
    try {
      const balanceData = await accountingService.hitungSaldoKasBank();
      return res.status(200).json({
        success: true,
        data: balanceData
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/finance/cash-mutation
   * Finance memasukkan data keuangan secara realtime (Set saldo awal, tambah modal, pemasukan kasir harian)
   */
  catatMutasiKas: async (req, res, next) => {
    try {
      const tipe_transaksi = req.body.tipe_transaksi || req.body.tipe || 'PEMASUKAN_MODAL';
      const rawAkunId = req.body.akun_id || req.body.akun_kas_id || 2;
      const nominal = parseFloat(req.body.nominal);
      const keterangan = req.body.keterangan || '';
      const tanggal = req.body.tanggal || new Date();

      const parsedNominal = parseFloat(nominal);
      if (isNaN(parsedNominal) || parsedNominal <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Nominal uang harus berupa angka lebih dari 0'
        });
      }

      // Cari akun Kas Toko dan Bank BCA dari DB
      const akunKas = await ChartOfAccount.findOne({ where: { kode_akun: '1-1001' } });
      const akunBank = await ChartOfAccount.findOne({ where: { kode_akun: '1-1002' } });

      const kasId = akunKas ? akunKas.id_akun : 1;
      const bankId = akunBank ? akunBank.id_akun : 2;

      const isTargetKas = String(rawAkunId) === '1' || String(rawAkunId) === String(kasId) || String(rawAkunId) === '1-1001';
      const targetAkun = isTargetKas ? (akunKas || { id_akun: kasId, nama_akun: 'Kas Toko / Kasir' }) : (akunBank || { id_akun: bankId, nama_akun: 'Bank BCA Operasional' });

      // Tentukan akun kredit lawan
      let kreditKode = '3-1001'; // Modal Pemilik
      let tipeJurnal = 'CAPITAL_INJECTION';
      let defaultDesc = 'Setoran Modal Pemilik / Penambahan Dana Kas';

      if (tipe_transaksi === 'PENJUALAN_KASIR') {
        kreditKode = '4-1001';
        tipeJurnal = 'SALES_CASH';
        defaultDesc = 'Pemasukan Penjualan Harian Kasir Kedai Kopi';
      } else if (tipe_transaksi === 'PENDAPATAN_LAIN') {
        kreditKode = '4-1001';
        tipeJurnal = 'OTHER_INCOME';
        defaultDesc = 'Pemasukan Operasional / Pendapatan Lain';
      } else if (tipe_transaksi === 'SET_SALDO_AWAL') {
        kreditKode = '3-1001';
        tipeJurnal = 'INITIAL_BALANCE';
        defaultDesc = 'Penetapan Saldo Awal Kas / Bank';
      }

      let kreditAkun = await ChartOfAccount.findOne({ where: { kode_akun: kreditKode } });
      if (!kreditAkun) {
        kreditAkun = (await ChartOfAccount.findOne({ where: { tipe_akun: 'EKUITAS' } })) || { id_akun: 5, nama_akun: 'Modal Pemilik' };
      }

      const nomorJurnal = `JV-CASH-${Date.now().toString().slice(-6)}`;
      const descFinal = keterangan || defaultDesc;

      // Simpan Jurnal Header
      const jurnal = await JournalEntry.create({
        nomor_jurnal: nomorJurnal,
        tanggal_jurnal: tanggal || new Date(),
        tipe_referensi: tipeJurnal,
        keterangan: `${descFinal} (${targetAkun.nama_akun})`,
        total_debet: parsedNominal,
        total_kredit: parsedNominal,
        status: 'POSTED'
      });

      // Debet: Kas/Bank (Aset bertambah)
      await JournalEntryLine.create({
        jurnal_id: jurnal.id_jurnal,
        akun_id: targetAkun.id_akun,
        debet: parsedNominal,
        kredit: 0.00,
        catatan: `Penambahan saldo ${targetAkun.nama_akun}`
      });

      // Kredit: Modal / Pendapatan (Ekuitas / Pendapatan bertambah)
      await JournalEntryLine.create({
        jurnal_id: jurnal.id_jurnal,
        akun_id: kreditAkun.id_akun,
        debet: 0.00,
        kredit: parsedNominal,
        catatan: `Pengakuan ${descFinal}`
      });

      // Ambil data jurnal lengkap dengan lines & akun relasi
      const fullJurnal = await JournalEntry.findByPk(jurnal.id_jurnal, {
        include: [
          {
            model: JournalEntryLine,
            as: 'lines',
            include: [{ model: ChartOfAccount, as: 'akun', attributes: ['id_akun', 'kode_akun', 'nama_akun', 'tipe_akun'] }]
          }
        ]
      });

      // Hitung saldo kas/bank terbaru secara realtime
      const newBalances = await accountingService.hitungSaldoKasBank();

      return res.status(201).json({
        success: true,
        message: `Data keuangan berhasil ditambahkan! Saldo ${targetAkun.nama_akun} bertambah Rp ${parsedNominal.toLocaleString('id-ID')}.`,
        data: {
          nomor_jurnal: nomorJurnal,
          nominal: parsedNominal,
          target_akun: targetAkun.nama_akun,
          jurnal: fullJurnal,
          balances: newBalances
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = accountingController;
