const { validationResult } = require('express-validator');
const jobModel = require('../models/job.model');

const getAllJobs = async (req, res, next) => {
  try {
    const { search, jobType, experienceLevel, location } = req.query;
    const jobs = await jobModel.getAllJobs({ search, jobType, experienceLevel, location });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await jobModel.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

const getMyJobs = async (req, res, next) => {
  try {
    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
    }
    const jobs = await jobModel.getJobsByRecruiter(recruiterId);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) {
      return res.status(403).json({ success: false, message: 'Recruiter profile not found.' });
    }

    const job = await jobModel.createJob(recruiterId, req.body);
    res.status(201).json({ success: true, message: 'Job created successfully.', data: job });
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) {
      return res.status(403).json({ success: false, message: 'Recruiter profile not found.' });
    }

    const updated = await jobModel.updateJob(req.params.id, recruiterId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Job not found or unauthorized to edit.' });
    }

    res.json({ success: true, message: 'Job updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) {
      return res.status(403).json({ success: false, message: 'Recruiter profile not found.' });
    }

    const deleted = await jobModel.deleteJob(req.params.id, recruiterId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Job not found or unauthorized to delete.' });
    }

    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  getMyJobs,
  createJob,
  updateJob,
  deleteJob
};
