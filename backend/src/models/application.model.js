const { query } = require('../config/db');

const getCandidateIdByUserId = async (userId) => {
  const res = await query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
  return res.rows[0]?.id || null;
};

const getExistingApplication = async (jobId, candidateId) => {
  const res = await query(
    'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
    [jobId, candidateId]
  );
  return res.rows[0] || null;
};

const createApplication = async ({ jobId, candidateId, coverLetter, resumePath }) => {
  const sql = `
    INSERT INTO applications (job_id, candidate_id, cover_letter, resume_path)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const res = await query(sql, [jobId, candidateId, coverLetter || null, resumePath || null]);
  return res.rows[0];
};

const getApplicationsByCandidate = async (candidateId) => {
  const sql = `
    SELECT a.*, j.title AS job_title, j.company AS job_company, j.location AS job_location,
           j.job_type, j.status AS job_status
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.candidate_id = $1
    ORDER BY a.applied_at DESC;
  `;
  const res = await query(sql, [candidateId]);
  return res.rows;
};

const withdrawApplication = async (applicationId, candidateId) => {
  const sql = 'DELETE FROM applications WHERE id = $1 AND candidate_id = $2 RETURNING id;';
  const res = await query(sql, [applicationId, candidateId]);
  return res.rows[0] || null;
};

// --- Recruiter queries ---

// Get all applicants for a job (ensuring recruiter owns the job)
const getApplicantsForJob = async (jobId, recruiterId) => {
  const sql = `
    SELECT a.id AS application_id, a.status, a.cover_letter, a.resume_path, a.applied_at,
           c.id AS candidate_id, c.full_name, c.phone, c.bio, c.location, c.linkedin_url,
           u.email AS candidate_email
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN candidates c ON a.candidate_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE a.job_id = $1 AND j.recruiter_id = $2
    ORDER BY a.applied_at DESC;
  `;
  const res = await query(sql, [jobId, recruiterId]);
  return res.rows;
};

// Update status of an application (ensuring recruiter owns the associated job)
const updateApplicationStatus = async (applicationId, recruiterId, status) => {
  const sql = `
    UPDATE applications a
    SET status = $1, updated_at = NOW()
    FROM jobs j
    WHERE a.id = $2 AND a.job_id = j.id AND j.recruiter_id = $3
    RETURNING a.*;
  `;
  const res = await query(sql, [status, applicationId, recruiterId]);
  return res.rows[0] || null;
};

// Recruiter views single candidate profile
const getCandidateProfile = async (candidateId) => {
  const sql = `
    SELECT c.*, u.email
    FROM candidates c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = $1;
  `;
  const res = await query(sql, [candidateId]);
  return res.rows[0] || null;
};

module.exports = {
  getCandidateIdByUserId,
  getExistingApplication,
  createApplication,
  getApplicationsByCandidate,
  withdrawApplication,
  getApplicantsForJob,
  updateApplicationStatus,
  getCandidateProfile
};
