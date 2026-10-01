const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseInvoice = sequelize.define(
  'PurchaseInvoice',
  {
    id_invoice: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    nomor_invoice: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Nomor Faktur / Tagihan Invoice Supplier (cth: INV-2026-10-001)'
    },
    po_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Referensi ke Purchase Order terkait'
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Referensi ke Supplier rekanan'
    },
    tanggal_invoice: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    tanggal_jatuh_tempo: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_tagihan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status_pembayaran: {
      type: DataTypes.ENUM('UNPAID', 'PAID', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'UNPAID',
      comment: 'Status pembayaran tagihan oleh tim Finance'
    },
    metode_pembayaran: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'TRANSFER_BCA, KAS_TUNAI, GIRO'
    },
    tanggal_bayar: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dibayar_oleh: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nama staf / manajer finance yang memproses pembayaran'
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'purchase_invoices',
    timestamps: true,
    underscored: true
  }
);

module.exports = PurchaseInvoice;
