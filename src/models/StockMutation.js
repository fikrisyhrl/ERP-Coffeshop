const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMutation = sequelize.define(
  'StockMutation',
  {
    id_mutasi: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    id_barang: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipe_mutasi: {
      type: DataTypes.ENUM(
        'IN_PROCUREMENT',     // Masuk dari penerimaan barang (Goods Receipt)
        'IN_ADJUSTMENT',      // Masuk dari opname
        'OUT_SALES_POS',      // Keluar dari penjualan POS (resep kopi)
        'OUT_WASTE_SPOILAGE', // Keluar karena terbuang/basi/kalibrasi
        'OUT_ADJUSTMENT'      // Keluar dari opname
      ),
      allowNull: false
    },
    jumlah_masuk: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    jumlah_keluar: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.000
    },
    saldo_akhir: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      comment: 'Saldo stok terkini setelah mutasi ini terjadi'
    },
    harga_satuan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'HPP saat transaksi mutasi ini terjadi'
    },
    referensi_tipe: {
      type: DataTypes.STRING(50),
      comment: 'GOODS_RECEIPT, POS_SALE, OPNAME, MANUAL'
    },
    referensi_id: {
      type: DataTypes.BIGINT,
      comment: 'ID dokumen referensi'
    },
    keterangan: {
      type: DataTypes.TEXT
    }
  },
  {
    tableName: 'stock_mutations',
    timestamps: true,
    underscored: true
  }
);

module.exports = StockMutation;
