const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Barang = sequelize.define(
  'Barang',
  {
    id_barang: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Primary Key ID unik barang'
    },
    nama_barang: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nama barang tidak boleh kosong'
        }
      }
    },
    kategori: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Kategori tidak boleh kosong'
        }
      },
      comment: 'Contoh: Coffee Beans, Dairy, Syrup, Packaging, dll.'
    },
    satuan: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Satuan tidak boleh kosong'
        }
      },
      comment: 'Contoh: gr, kg, ml, liter, pcs, box'
    },
    stok_saat_ini: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        isDecimal: {
          msg: 'Stok saat ini harus berupa angka/desimal'
        }
      },
      comment: 'Jumlah fisik stok saat ini yang tersedia'
    },
    harga_satuan: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: {
          msg: 'Harga satuan harus berupa angka/desimal'
        },
        min: {
          args: [0],
          msg: 'Harga satuan tidak boleh bernilai negatif'
        }
      },
      comment: 'Harga pokok rata-rata bergerak (Moving Average Cost) per satuan'
    },
    batas_safety_stock: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        isDecimal: {
          msg: 'Batas safety stock harus berupa angka/desimal'
        },
        min: {
          args: [0],
          msg: 'Batas safety stock tidak boleh bernilai negatif'
        }
      },
      comment: 'Ambang batas minimum persediaan sebelum harus re-order'
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Supplier utama yang ditunjuk untuk auto-order bahan baku ini'
    }
  },
  {
    tableName: 'master_barang',
    timestamps: true,
    underscored: true
  }
);

module.exports = Barang;
