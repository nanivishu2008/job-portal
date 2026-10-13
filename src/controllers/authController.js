'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const authService = require('../services/authService');

// ─── Validation rule sets ──────────────────────────────────────────────────────

const registerValidators = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be 2–255 characters'),
  body('role')
    .isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
  body('company_name')
    .if(body('role').equals('recruiter'))
    .trim()
    .notEmpty().withMessage('company_name is required for recruiters')
    .isLength({ max: 255 }),
];

const loginValidators = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, full_name, role, company_name } = req.body;

    const existing = await authService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await authService.createUser({
      email,
      passwordHash,
      role,
      fullName: full_name,
      companyName: company_name,
    });

    const token = signToken(user);
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        full_name:  user.full_name,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await authService.findUserByEmail(email);
    if (!user) {
      // Constant-time: still run bcrypt even on missing user
      await bcrypt.compare(password, '$2a$12$invalidhashfortimingnormalizati');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Login successful',
      token,
      user: {
        id:        user.id,
        email:     user.email,
        role:      user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/auth/me  (requires JWT)
 */
async function me(req, res) {
  try {
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const profile = await authService.getProfile(user.id, user.role);
    return res.json({ user, profile });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/logout  (stateless — instructs client to discard token)
 */
function logout(_req, res) {
  return res.json({ message: 'Logged out successfully. Please discard your token.' });
}

module.exports = {
  registerValidators,
  loginValidators,
  register,
  login,
  me,
  logout,
};
