const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define(
  'Supplier',
  {
    id_supplier: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_supplier: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nama supplier tidak boleh kosong' }
      }
    },
    kontak_person: {
      type: DataTypes.STRING(100)
    },
    telepon: {
      type: DataTypes.STRING(30)
    },
    email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: { msg: 'Format email tidak valid' }
      }
    },
    alamat: {
      type: DataTypes.TEXT
    }
  },
  {
    tableName: 'suppliers',
    timestamps: true,
    underscored: true
  }
);

module.exports = Supplier;
