const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define(
  'Department',
  {
    id_departemen: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_departemen: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    deskripsi: {
      type: DataTypes.TEXT
    }
  },
  {
    tableName: 'departments',
    timestamps: true,
    underscored: true
  }
);

module.exports = Department;
