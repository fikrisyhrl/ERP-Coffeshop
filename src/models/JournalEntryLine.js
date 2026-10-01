const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalEntryLine = sequelize.define(
  'JournalEntryLine',
  {
    id_jurnal_line: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    jurnal_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    akun_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    debet: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'Nilai debet tidak boleh negatif' }
      }
    },
    kredit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'Nilai kredit tidak boleh negatif' }
      }
    },
    catatan: {
      type: DataTypes.STRING(255)
    }
  },
  {
    tableName: 'journal_entry_lines',
    timestamps: true,
    underscored: true
  }
);

module.exports = JournalEntryLine;
