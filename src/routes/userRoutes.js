const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route Autentikasi
router.post('/login', userController.login);
router.post('/seed', async (req, res, next) => {
  try {
    const users = await userController.seedDefaultUsers();
    res.json({ success: true, message: 'Default 4 User berhasil di-seed!', data: users });
  } catch (err) {
    next(err);
  }
});

// Route Manajemen Pengguna (CRUD User)
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
