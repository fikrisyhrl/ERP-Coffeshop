const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GoodsReceiptItem = sequelize.define(
  'GoodsReceiptItem',
  {
    id_penerimaan_item: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    penerimaan_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    po_item_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    id_barang: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    jumlah_diterima: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: { args: [0.001], msg: 'Jumlah barang diterima harus lebih dari 0' }
      }
    },
    harga_beli_satuan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Harga beli satuan tidak boleh bernilai negatif' }
      },
      comment: 'Harga beli per unit dari faktur/tagihan vendor'
    },
    batch_number: {
      type: DataTypes.STRING(50)
    },
    tanggal_kadaluarsa: {
      type: DataTypes.DATEONLY,
      comment: 'Krusial untuk fresh milk, puree, beans'
    }
  },
  {
    tableName: 'goods_receipt_items',
    timestamps: true,
    underscored: true
  }
);

module.exports = GoodsReceiptItem;
