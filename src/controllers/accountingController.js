const accountingService = require('../services/accountingService');
const procurementService = require('../services/procurementService');
const { ChartOfAccount, JournalEntry, JournalEntryLine, PurchaseOrder, PurchaseOrderItem, Supplier, Barang } = require('../models');

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
   * Mengambil daftar seluruh akun
   */
  getAllCoA: async (req, res, next) => {
    try {
      const accounts = await ChartOfAccount.findAll({ order: [['kode_akun', 'ASC']] });
      return res.status(200).json({
        success: true,
        data: accounts
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
  }
};

module.exports = accountingController;
