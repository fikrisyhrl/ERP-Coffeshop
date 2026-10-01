const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GoodsReceipt = sequelize.define(
  'GoodsReceipt',
  {
    id_penerimaan: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    nomor_penerimaan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    po_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    nomor_surat_jalan: {
      type: DataTypes.STRING(100),
      comment: 'No Surat Jalan / Delivery Order dari vendor'
    },
    tanggal_terima: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    diterima_oleh: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nama personil/barista yang memeriksa dan menerima fisik barang'
    },
    catatan: {
      type: DataTypes.TEXT
    }
  },
  {
    tableName: 'goods_receipts',
    timestamps: true,
    underscored: true
  }
);

module.exports = GoodsReceipt;
