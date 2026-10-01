const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define(
  'Attendance',
  {
    id_absensi: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    pegawai_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tanggal_absensi: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    nama_shift: {
      type: DataTypes.STRING(50),
      defaultValue: 'Shift Normal'
    },
    jam_masuk: {
      type: DataTypes.DATE
    },
    jam_keluar: {
      type: DataTypes.DATE
    },
    status_kehadiran: {
      type: DataTypes.ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'),
      allowNull: false,
      defaultValue: 'HADIR'
    },
    menit_terlambat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Jumlah menit keterlambatan masuk kerja'
    },
    jam_lembur: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Total jam lembur'
    },
    catatan: {
      type: DataTypes.TEXT
    }
  },
  {
    tableName: 'attendances',
    timestamps: true,
    underscored: true
  }
);

module.exports = Attendance;
