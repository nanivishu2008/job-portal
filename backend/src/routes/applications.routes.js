const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const appCtrl = require('../controllers/applications.controller');

const router = express.Router();

// Candidate endpoints
router.post('/', requireAuth, requireRole('candidate'), upload.single('resume'), appCtrl.applyForJob);
router.get('/my', requireAuth, requireRole('candidate'), appCtrl.getMyApplications);
router.delete('/:id', requireAuth, requireRole('candidate'), appCtrl.withdrawApplication);

// Recruiter endpoints
router.get('/job/:jobId', requireAuth, requireRole('recruiter'), appCtrl.getJobApplicants);
router.put('/:id/status', requireAuth, requireRole('recruiter'), appCtrl.updateStatus);
router.get('/candidates/:id', requireAuth, requireRole('recruiter'), appCtrl.getCandidateDetail);

module.exports = router;
