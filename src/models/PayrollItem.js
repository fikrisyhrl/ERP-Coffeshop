const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PayrollItem = sequelize.define(
  'PayrollItem',
  {
    id_payroll_item: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    payroll_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    nama_komponen: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tipe_komponen: {
      type: DataTypes.ENUM('PENDAPATAN', 'POTONGAN'),
      allowNull: false
    },
    nominal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    keterangan: {
      type: DataTypes.STRING(255)
    }
  },
  {
    tableName: 'payroll_items',
    timestamps: true,
    underscored: true
  }
);

module.exports = PayrollItem;
