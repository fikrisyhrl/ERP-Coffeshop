const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalEntry = sequelize.define(
  'JournalEntry',
  {
    id_jurnal: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    nomor_jurnal: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Contoh: JV/2026/09/0001'
    },
    tanggal_jurnal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    tipe_referensi: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'PAYROLL, PURCHASE_CASH, SALES, MANUAL'
    },
    referensi_id: {
      type: DataTypes.BIGINT,
      comment: 'ID dokumen transaksi terkait'
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    total_debet: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_kredit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'POSTED', 'CANCELLED'),
      defaultValue: 'POSTED'
    }
  },
  {
    tableName: 'journal_entries',
    timestamps: true,
    underscored: true
  }
);

module.exports = JournalEntry;
