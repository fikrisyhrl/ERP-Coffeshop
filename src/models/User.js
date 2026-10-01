const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const User = sequelize.define(
  'User',
  {
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_lengkap: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nama lengkap tidak boleh kosong' }
      }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Username sudah digunakan, silakan pilih username lain'
      },
      validate: {
        notEmpty: { msg: 'Username tidak boleh kosong' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password tidak boleh kosong' }
      }
    },
    role: {
      type: DataTypes.ENUM('MANAGER', 'FINANCE', 'HR', 'PROCUREMENT'),
      allowNull: false,
      defaultValue: 'MANAGER',
      validate: {
        isIn: {
          args: [['MANAGER', 'FINANCE', 'HR', 'PROCUREMENT']],
          msg: 'Role harus berupa MANAGER, FINANCE, HR, atau PROCUREMENT'
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (user) => {
        if (user.changed('password')) {
          const salt = 'kafeina_erp_secure_salt_2026';
          user.password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
        }
      }
    }
  }
);

// Method untuk verifikasi password
User.prototype.verifyPassword = function (inputPassword) {
  const salt = 'kafeina_erp_secure_salt_2026';
  const hashedInput = crypto.pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha512').toString('hex');
  return this.password === hashedInput;
};

module.exports = User;
