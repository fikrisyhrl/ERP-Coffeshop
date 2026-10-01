const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrder = sequelize.define(
  'PurchaseOrder',
  {
    id_po: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    nomor_po: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tanggal_po: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM(
        'DRAFT',
        'PENDING_APPROVAL',
        'CONFIRMED',
        'PARTIALLY_RECEIVED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL'
    },
    total_estimasi: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    is_auto_generated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'TRUE jika dibuat otomatis oleh sistem saat safety stock tercapai'
    },
    catatan: {
      type: DataTypes.TEXT
    },
    disetujui_oleh: {
      type: DataTypes.STRING(100),
      comment: 'Nama user / staf Finance yang menyetujui atau menolak pengajuan'
    },
    tanggal_approval: {
      type: DataTypes.DATE,
      comment: 'Waktu persetujuan atau penolakan oleh Finance'
    },
    catatan_finance: {
      type: DataTypes.TEXT,
      comment: 'Catatan atau alasan persetujuan/penolakan dari pihak Finance'
    }
  },
  {
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true
  }
);

module.exports = PurchaseOrder;
