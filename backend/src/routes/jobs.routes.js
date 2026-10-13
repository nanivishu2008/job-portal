const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const jobsCtrl = require('../controllers/jobs.controller');

const router = express.Router();

// Validation for creating/updating jobs
const jobValidation = [
  body('title').notEmpty().withMessage('Job title is required.').trim(),
  body('company').notEmpty().withMessage('Company name is required.').trim(),
  body('description').notEmpty().withMessage('Description is required.'),
  body('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'remote', 'internship']),
  body('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead']),
];

// Public routes
router.get('/', jobsCtrl.getAllJobs);
router.get('/:id', jobsCtrl.getJobById);

// Recruiter routes
router.get('/recruiter/my', requireAuth, requireRole('recruiter'), jobsCtrl.getMyJobs);
router.post('/', requireAuth, requireRole('recruiter'), jobValidation, jobsCtrl.createJob);
router.put('/:id', requireAuth, requireRole('recruiter'), jobsCtrl.updateJob);
router.delete('/:id', requireAuth, requireRole('recruiter'), jobsCtrl.deleteJob);

module.exports = router;
