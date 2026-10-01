const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define(
  'Payroll',
  {
    id_payroll: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    nomor_slip: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    pegawai_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bulan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    periode_mulai: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    periode_selesai: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_hari_kerja_target: {
      type: DataTypes.INTEGER,
      defaultValue: 24
    },
    total_hadir: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_menit_terlambat: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_jam_lembur: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 0.00
    },
    total_pendapatan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_potongan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    gaji_bersih: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status_pembayaran: {
      type: DataTypes.ENUM('DRAFT', 'APPROVED', 'PAID'),
      defaultValue: 'DRAFT'
    },
    tanggal_bayar: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'payrolls',
    timestamps: true,
    underscored: true
  }
);

module.exports = Payroll;
