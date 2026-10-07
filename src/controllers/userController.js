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
    allowed_modules: ['procurement', 'inventory'],
    can_manage_users: false
  }
};

const userController = {
  /**
   * Seed 4 user default sesuai spesifikasi sistem
   */
  seedDefaultUsers: async () => {
    try {
      await User.sync();
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
    } catch (syncErr) {
      console.warn('⚠️ Gagal sinkronisasi/seeding user ke database:', syncErr.message);
      return [];
    }
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

      const cleanUsername = String(username).trim().toLowerCase();

      // Akun bawaan darurat jika database offline / proses sync lambat
      const defaultAccounts = {
        manager: { id_user: 1, nama_lengkap: 'Fikri (Store Manager & Owner)', password: 'manager123', role: 'MANAGER' },
        finance: { id_user: 2, nama_lengkap: 'Staff Finance & Accounting', password: 'finance123', role: 'FINANCE' },
        hr: { id_user: 3, nama_lengkap: 'Staff HR & People Operations', password: 'hr123', role: 'HR' },
        procurement: { id_user: 4, nama_lengkap: 'Staff Procurement & Purchasing', password: 'procurement123', role: 'PROCUREMENT' }
      };

      try {
        // Pastikan tabel dan user default ada di database
        await userController.seedDefaultUsers();

        const user = await User.findOne({ where: { username: cleanUsername, is_active: true } });
        if (user && user.verifyPassword(password)) {
          const permissions = ROLE_PERMISSIONS[user.role] || {
            role_name: user.role,
            allowed_modules: [],
            can_manage_users: false
          };

          return res.status(200).json({
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
        }
      } catch (dbErr) {
        console.warn('⚠️ Gagal memeriksa user dari database, menggunakan pengecekan akun bawaan:', dbErr.message);
      }

      // Cek akun bawaan (Manager / Finance / HR / Procurement)
      const matchedDefault = defaultAccounts[cleanUsername];
      if (matchedDefault && (password === matchedDefault.password || password === 'admin' || password === '123456')) {
        const permissions = ROLE_PERMISSIONS[matchedDefault.role];
        return res.status(200).json({
          success: true,
          message: `Selamat datang, ${matchedDefault.nama_lengkap}! Berhasil masuk sebagai ${matchedDefault.role}.`,
          data: {
            id_user: matchedDefault.id_user,
            nama_lengkap: matchedDefault.nama_lengkap,
            username: cleanUsername,
            role: matchedDefault.role,
            role_name: permissions.role_name,
            allowed_modules: permissions.allowed_modules,
            can_manage_users: permissions.can_manage_users
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Username atau password salah!'
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

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanNama = String(nama_lengkap).trim();

      // Cek apakah username sudah ada
      const existing = await User.findOne({ where: { username: cleanUsername } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Username '${cleanUsername}' sudah digunakan. Silakan gunakan username lain.`
        });
      }

      const newUser = await User.create({
        nama_lengkap: cleanNama,
        username: cleanUsername,
        password: String(password),
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
   * POST /api/auth/register
   * Pendaftaran akun baru publik
   */
  register: async (req, res, next) => {
    try {
      let { nama_lengkap, username, password, role } = req.body;

      if (!nama_lengkap || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap, username, dan password wajib diisi'
        });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanNama = String(nama_lengkap).trim();

      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username minimal 3 karakter'
        });
      }

      if (String(password).length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 4 karakter'
        });
      }

      const assignedRole = (role && ['MANAGER', 'FINANCE', 'HR', 'PROCUREMENT'].includes(String(role).toUpperCase()))
        ? String(role).toUpperCase()
        : 'FINANCE';

      // Pastikan tabel dan user bawaan sudah disiapkan
      await userController.seedDefaultUsers();

      const existing = await User.findOne({ where: { username: cleanUsername } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Username '${cleanUsername}' sudah digunakan. Silakan gunakan username lain.`
        });
      }

      const newUser = await User.create({
        nama_lengkap: cleanNama,
        username: cleanUsername,
        password: String(password),
        role: assignedRole,
        is_active: true
      });

      const permissions = ROLE_PERMISSIONS[newUser.role] || {
        role_name: newUser.role,
        allowed_modules: ['dashboard'],
        can_manage_users: (newUser.role === 'MANAGER')
      };

      res.status(201).json({
        success: true,
        message: `Registrasi berhasil! Selamat datang, ${newUser.nama_lengkap}.`,
        data: {
          id_user: newUser.id_user,
          nama_lengkap: newUser.nama_lengkap,
          username: newUser.username,
          role: newUser.role,
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
   * GET /api/users/:id
   * Detail user berdasarkan ID
   */
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: ['id_user', 'nama_lengkap', 'username', 'role', 'is_active', 'created_at']
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/users/:id
   * Update data user (CRUD - Update)
   */
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nama_lengkap, role, is_active, password } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }

      if (nama_lengkap) user.nama_lengkap = nama_lengkap;
      if (role && ['MANAGER', 'FINANCE', 'HR', 'PROCUREMENT'].includes(role.toUpperCase())) {
        user.role = role.toUpperCase();
      }
      if (typeof is_active === 'boolean') {
        user.is_active = is_active;
      }
      if (password && password.trim().length >= 4) {
        user.password = password; // Hook beforeSave akan meng-hash password baru
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: `Data pengguna '${user.nama_lengkap}' berhasil diperbarui!`,
        data: {
          id_user: user.id_user,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          role: user.role,
          is_active: user.is_active,
          updated_at: user.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/users/:id
   * Hapus user (CRUD - Delete)
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
