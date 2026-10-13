'use strict';

const { query: validateQuery } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const jobService = require('../services/jobService');

// ─── Validation ───────────────────────────────────────────────────────────────

const listJobsValidators = [
  validateQuery('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  validateQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
  validateQuery('search').optional().trim().isLength({ max: 200 }),
  validateQuery('job_type').optional().isIn(['full-time','part-time','contract','internship','remote']),
  validateQuery('experience_level').optional().isIn(['entry','mid','senior','lead','executive']),
  validateQuery('location').optional().trim().isLength({ max: 255 }),
];

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * GET /api/jobs
 */
async function listJobs(req, res) {
  try {
    const result = await jobService.listJobs({
      page:            req.query.page  || 1,
      limit:           req.query.limit || 20,
      search:          req.query.search,
      jobType:         req.query.job_type,
      experienceLevel: req.query.experience_level,
      location:        req.query.location,
    });
    return res.json(result);
  } catch (err) {
    console.error('listJobs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/jobs/:id
 */
async function getJob(req, res) {
  try {
    const job = await jobService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json(job);
  } catch (err) {
    // Postgres throws "invalid input syntax for type uuid" on bad UUIDs
    if (err.code === '22P02') {
      return res.status(404).json({ error: 'Job not found' });
    }
    console.error('getJob error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { listJobsValidators, listJobs, getJob };
