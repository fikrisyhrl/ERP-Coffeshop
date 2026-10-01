const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrderItem = sequelize.define(
  'PurchaseOrderItem',
  {
    id_po_item: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    po_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    id_barang: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    jumlah_pesan: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: { args: [0.001], msg: 'Jumlah pesan harus lebih besar dari 0' }
      }
    },
    jumlah_diterima: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    harga_satuan_estimasi: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  },
  {
    tableName: 'purchase_order_items',
    timestamps: true,
    underscored: true
  }
);

module.exports = PurchaseOrderItem;
