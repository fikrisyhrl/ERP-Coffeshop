const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define(
  'Employee',
  {
    id_pegawai: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kode_pegawai: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      comment: 'EMP-001, EMP-002, dst.'
    },
    nama_lengkap: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      validate: { isEmail: true }
    },
    telepon: {
      type: DataTypes.STRING(30)
    },
    posisi_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status_kerja: {
      type: DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'PROBATION', 'CONTRACT'),
      defaultValue: 'FULL_TIME'
    },
    gaji_pokok: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Gaji pokok bulanan pegawai'
    },
    nama_bank: {
      type: DataTypes.STRING(50),
      defaultValue: 'BCA'
    },
    nomor_rekening: {
      type: DataTypes.STRING(50)
    },
    tanggal_masuk: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'employees',
    timestamps: true,
    underscored: true
  }
);

module.exports = Employee;
