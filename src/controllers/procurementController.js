const procurementService = require('../services/procurementService');
const { PurchaseOrder, PurchaseOrderItem, Supplier, GoodsReceipt, GoodsReceiptItem, Barang } = require('../models');

const procurementController = {
  /**
   * POST /api/procurement/terima-barang
   * Endpoint Goods Receipt untuk menerima fisik barang dari PO
   */
  terimaBarang: async (req, res, next) => {
    try {
      const { po_id, nomor_surat_jalan, diterima_oleh: rawDiterimaOleh, catatan, items } = req.body;
      const diterima_oleh = rawDiterimaOleh || 'Barista / QC Inspector';

      if (!po_id || !items) {
        return res.status(400).json({
          success: false,
          message: 'po_id dan items wajib diisi'
        });
      }

      const hasil = await procurementService.terimaBarang({
        po_id,
        nomor_surat_jalan,
        diterima_oleh,
        catatan,
        items
      });

      return res.status(200).json(hasil);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/procurement/po/:id/ajukan-finance
   * Mengajukan Draf PO ke Modul Finance
   */
  ajukanKeFinance: async (req, res, next) => {
    try {
      const { id } = req.params;
      const po = await procurementService.ajukanKeFinance(id);

      return res.status(200).json({
        success: true,
        message: `PO #${po.nomor_po} berhasil diajukan ke Modul Finance untuk persetujuan`,
        data: po
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/procurement/po/:id/konfirmasi
   * Menyetujui Draf PO agar siap diterima barangnya (kompatibilitas mundur)
   */
  konfirmasiPO: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { disetujui_oleh, catatan_finance } = req.body || {};
      const po = await procurementService.konfirmasiPO(id, { disetujui_oleh, catatan_finance });

      return res.status(200).json({
        success: true,
        message: `Purchase Order #${po.nomor_po} berhasil disetujui (CONFIRMED)`,
        data: po
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/procurement/po
   * Mengambil semua daftar Purchase Order
   */
  getAllPO: async (req, res, next) => {
    try {
      const { status } = req.query;
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const purchaseOrders = await PurchaseOrder.findAll({
        where: whereClause,
        include: [
          { model: Supplier, as: 'supplier', attributes: ['id_supplier', 'nama_supplier', 'telepon'] },
          {
            model: PurchaseOrderItem,
            as: 'items',
            include: [{ model: Barang, as: 'barang', attributes: ['id_barang', 'nama_barang', 'satuan'] }]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: purchaseOrders
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/procurement/po
   * Membuat Purchase Order / Pengajuan Pembelian baru
   * Secara otomatis masuk ke status PENDING_APPROVAL untuk ditinjau oleh Modul Finance
   */
  buatPO: async (req, res, next) => {
    try {
      const { supplier_id, catatan, items } = req.body;

      if (!supplier_id || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'supplier_id dan items wajib diisi'
        });
      }

      const nomorPo = `PO-MANUAL-${Date.now().toString().slice(-6)}`;
      let totalEstimasi = 0;

      const itemsToCreate = items.map((it) => {
        const subtotal = parseFloat(it.jumlah_pesan) * parseFloat(it.harga_satuan_estimasi || 0);
        totalEstimasi += subtotal;
        return {
          id_barang: it.id_barang,
          jumlah_pesan: it.jumlah_pesan,
          harga_satuan_estimasi: it.harga_satuan_estimasi || 0,
          subtotal
        };
      });

      const newPo = await PurchaseOrder.create(
        {
          nomor_po: nomorPo,
          supplier_id,
          tanggal_po: new Date(),
          status: 'PENDING_APPROVAL',
          total_estimasi: totalEstimasi,
          is_auto_generated: false,
          catatan,
          items: itemsToCreate
        },
        {
          include: [{ model: PurchaseOrderItem, as: 'items' }]
        }
      );

      const createdPoWithDetails = await PurchaseOrder.findByPk(newPo.id_po, {
        include: [
          { model: Supplier, as: 'supplier', attributes: ['id_supplier', 'nama_supplier', 'telepon'] },
          {
            model: PurchaseOrderItem,
            as: 'items',
            include: [{ model: Barang, as: 'barang', attributes: ['id_barang', 'nama_barang', 'satuan'] }]
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Permintaan pembelian (PO) berhasil diajukan dan masuk ke Modul Finance untuk persetujuan (Status: PENDING_APPROVAL)',
        data: createdPoWithDetails || newPo
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/procurement/supplier
   * Menambah Supplier baru
   */
  tambahSupplier: async (req, res, next) => {
    try {
      const { nama_supplier, kontak_person, telepon, email, alamat } = req.body;
      const supplier = await Supplier.create({
        nama_supplier,
        kontak_person,
        telepon,
        email,
        alamat
      });

      return res.status(201).json({
        success: true,
        message: 'Supplier baru berhasil ditambahkan',
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/procurement/supplier
   * Mengambil daftar supplier
   */
  getAllSuppliers: async (req, res, next) => {
    try {
      const suppliers = await Supplier.findAll();
      return res.status(200).json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = procurementController;
