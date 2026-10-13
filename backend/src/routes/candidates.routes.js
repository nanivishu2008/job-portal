const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const candCtrl = require('../controllers/candidates.controller');

const router = express.Router();

router.get('/profile', requireAuth, requireRole('candidate'), candCtrl.getMyProfile);
router.put('/profile', requireAuth, requireRole('candidate'), candCtrl.updateMyProfile);

module.exports = router;
