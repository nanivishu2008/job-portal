const { query } = require('../config/db');
const jobModel = require('../models/job.model');
const appModel = require('../models/application.model');

const getRecruiterStats = async (req, res, next) => {
  try {
    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) return res.status(403).json({ success: false, message: 'Recruiter not found.' });

    // Job counts
    const jobsRes = await query(`
      SELECT 
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE status = 'open') AS active_jobs,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed_jobs
      FROM jobs
      WHERE recruiter_id = $1
    `, [recruiterId]);

    // Applicant counts by status
    const appsRes = await query(`
      SELECT 
        COUNT(a.id) AS total_applicants,
        COUNT(a.id) FILTER (WHERE a.status = 'applied') AS applied,
        COUNT(a.id) FILTER (WHERE a.status = 'under_review') AS under_review,
        COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') AS shortlisted,
        COUNT(a.id) FILTER (WHERE a.status = 'hired') AS hired,
        COUNT(a.id) FILTER (WHERE a.status = 'rejected') AS rejected
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = $1
    `, [recruiterId]);

    res.json({
      success: true,
      data: {
        jobs: jobsRes.rows[0],
        applicants: appsRes.rows[0]
      }
    });
  } catch (err) { next(err); }
};

const getCandidateStats = async (req, res, next) => {
  try {
    const candidateId = await appModel.getCandidateIdByUserId(req.user.id);
    if (!candidateId) return res.status(403).json({ success: false, message: 'Candidate not found.' });

    const statsRes = await query(`
      SELECT 
        COUNT(*) AS total_applied,
        COUNT(*) FILTER (WHERE status = 'applied') AS pending,
        COUNT(*) FILTER (WHERE status = 'under_review') AS under_review,
        COUNT(*) FILTER (WHERE status = 'shortlisted') AS shortlisted,
        COUNT(*) FILTER (WHERE status = 'hired') AS hired,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
      FROM applications
      WHERE candidate_id = $1
    `, [candidateId]);

    res.json({ success: true, data: statsRes.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getRecruiterStats, getCandidateStats };
