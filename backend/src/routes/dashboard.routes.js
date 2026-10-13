const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const dashCtrl = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/recruiter', requireAuth, requireRole('recruiter'), dashCtrl.getRecruiterStats);
router.get('/candidate', requireAuth, requireRole('candidate'), dashCtrl.getCandidateStats);

module.exports = router;
