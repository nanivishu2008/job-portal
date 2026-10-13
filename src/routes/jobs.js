'use strict';

const express = require('express');
const router  = express.Router();

const { handleValidationErrors } = require('../middleware/validate');
const { listJobsValidators, listJobs, getJob } = require('../controllers/jobController');

// GET /api/jobs
router.get('/', listJobsValidators, handleValidationErrors, listJobs);

// GET /api/jobs/:id
router.get('/:id', getJob);

module.exports = router;
