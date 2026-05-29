const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const handleValidationErrors = require('../middleware/validationHandler');

// Register
router.post(
  '/register',
  [
    body('name', 'Name is required').trim().notEmpty(),
    body('email', 'Valid email is required').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  handleValidationErrors,
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email', 'Valid email is required').isEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  handleValidationErrors,
  authController.login
);

// Get Current User
router.get('/me', auth, authController.getCurrentUser);

// Change Password
router.put('/change-password', auth, authController.changePassword);

// Refresh Token
router.post('/refresh-token', authController.refreshToken);

// Admin Routes
router.get('/users', auth, authorize('admin'), authController.getAllUsers);
router.put('/users/:id', auth, authorize('admin'), authController.updateUser);
router.delete('/users/:id', auth, authorize('admin'), authController.deleteUser);

module.exports = router;
