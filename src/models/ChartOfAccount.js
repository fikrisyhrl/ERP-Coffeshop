const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChartOfAccount = sequelize.define(
  'ChartOfAccount',
  {
    id_akun: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kode_akun: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      comment: 'Contoh: 1-1001, 1-1020, 2-1001, 5-1001, 6-1001'
    },
    nama_akun: {
      type: DataTypes.STRING(150),
      allowNull: false,
      comment: 'Kas Kasir, Bank BCA, Persediaan Bahan Baku, Beban Gaji, dll.'
    },
    tipe_akun: {
      type: DataTypes.ENUM('ASET', 'KEWAJIBAN', 'EKUITAS', 'PENDAPATAN', 'BEBAN'),
      allowNull: false
    },
    saldo_normal: {
      type: DataTypes.ENUM('DEBET', 'KREDIT'),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'chart_of_accounts',
    timestamps: true,
    underscored: true
  }
);

module.exports = ChartOfAccount;
