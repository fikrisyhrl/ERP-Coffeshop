const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobPosition = sequelize.define(
  'JobPosition',
  {
    id_posisi: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    departemen_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nama_jabatan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Head Barista, Junior Barista, Cashier, Kitchen Cook, Store Manager'
    },
    gaji_pokok_standar: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  },
  {
    tableName: 'job_positions',
    timestamps: true,
    underscored: true
  }
);

module.exports = JobPosition;
