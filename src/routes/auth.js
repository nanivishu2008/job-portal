'use strict';

const express = require('express');
const router  = express.Router();

const { authenticate }         = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  registerValidators,
  loginValidators,
  register,
  login,
  me,
  logout,
} = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerValidators, handleValidationErrors, register);

// POST /api/auth/login
router.post('/login', loginValidators, handleValidationErrors, login);

// GET  /api/auth/me  (protected)
router.get('/me', authenticate, me);

// POST /api/auth/logout (protected — stateless, just tells client to drop token)
router.post('/logout', authenticate, logout);

module.exports = router;
