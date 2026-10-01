const { User } = require('../models');

// Mapping hak akses modul berdasarkan role
const ROLE_PERMISSIONS = {
  MANAGER: {
    role_name: 'Manager / Owner',
    allowed_modules: ['dashboard', 'finance', 'hcm', 'procurement', 'inventory', 'users'],
    can_manage_users: true
  },
  FINANCE: {
    role_name: 'Finance & Accounting Specialist',
    allowed_modules: ['finance'],
    can_manage_users: false
  },
  HR: {
    role_name: 'Human Capital & HR Specialist',
    allowed_modules: ['hcm'],
    can_manage_users: false
  },
  PROCUREMENT: {
    role_name: 'Procurement & Purchasing Specialist',
    allowed_modules: ['procurement'],
    can_manage_users: false
  }
};

const userController = {
  /**
   * Seed 4 user default sesuai spesifikasi sistem
   */
  seedDefaultUsers: async () => {
    const defaultUsers = [
      {
        nama_lengkap: 'Fikri (Store Manager & Owner)',
        username: 'manager',
        password: 'manager123',
        role: 'MANAGER'
      },
      {
        nama_lengkap: 'Staff Finance & Accounting',
        username: 'finance',
        password: 'finance123',
        role: 'FINANCE'
      },
      {
        nama_lengkap: 'Staff HR & People Operations',
        username: 'hr',
        password: 'hr123',
        role: 'HR'
      },
      {
        nama_lengkap: 'Staff Procurement & Purchasing',
        username: 'procurement',
        password: 'procurement123',
        role: 'PROCUREMENT'
      }
    ];

    const results = [];
    for (const item of defaultUsers) {
      let user = await User.findOne({ where: { username: item.username } });
      if (!user) {
        user = await User.create(item);
      }
      results.push({
        id_user: user.id_user,
        nama_lengkap: user.nama_lengkap,
        username: user.username,
        role: user.role
      });
    }
    return results;
  },

  /**
   * POST /api/auth/login
   * Autentikasi user & pengembalian hak akses modul
   */
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password wajib diisi'
        });
      }

      // Pastikan user default ada
      await userController.seedDefaultUsers();

      const user = await User.findOne({ where: { username, is_active: true } });
      if (!user || !user.verifyPassword(password)) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah!'
        });
      }

      const permissions = ROLE_PERMISSIONS[user.role] || {
        role_name: user.role,
        allowed_modules: [],
        can_manage_users: false
      };

      res.status(200).json({
        success: true,
        message: `Selamat datang, ${user.nama_lengkap}! Berhasil masuk sebagai ${user.role}.`,
        data: {
          id_user: user.id_user,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          role: user.role,
          role_name: permissions.role_name,
          allowed_modules: permissions.allowed_modules,
          can_manage_users: permissions.can_manage_users
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/users
   * Ambil seluruh daftar user (Khusus role MANAGER)
   */
  getAllUsers: async (req, res, next) => {
    try {
      await userController.seedDefaultUsers();

      const users = await User.findAll({
        attributes: ['id_user', 'nama_lengkap', 'username', 'role', 'is_active', 'created_at'],
        order: [['id_user', 'ASC']]
      });

      res.status(200).json({
        success: true,
        message: 'Daftar pengguna sistem ERP',
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/users
   * Fitur Create User baru
   */
  createUser: async (req, res, next) => {
    try {
      const { nama_lengkap, username, password, role } = req.body;

      if (!nama_lengkap || !username || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap, username, password, dan role wajib diisi'
        });
      }

      const validRoles = ['MANAGER', 'FINANCE', 'HR', 'PROCUREMENT'];
      if (!validRoles.includes(role.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Role tidak valid! Harus salah satu dari: ${validRoles.join(', ')}`
        });
      }

      // Cek apakah username sudah ada
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Username '${username}' sudah digunakan. Silakan gunakan username lain.`
        });
      }

      const newUser = await User.create({
        nama_lengkap,
        username,
        password,
        role: role.toUpperCase(),
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: `Pengguna '${newUser.nama_lengkap}' dengan role ${newUser.role} berhasil dibuat!`,
        data: {
          id_user: newUser.id_user,
          nama_lengkap: newUser.nama_lengkap,
          username: newUser.username,
          role: newUser.role,
          created_at: newUser.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/users/:id
   * Hapus user
   */
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      if (user.username === 'manager') {
        return res.status(403).json({
          success: false,
          message: 'User utama Manager tidak dapat dihapus!'
        });
      }

      await user.destroy();

      res.status(200).json({
        success: true,
        message: `User '${user.nama_lengkap}' (${user.username}) berhasil dihapus.`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
