const { query } = require('../config/db');

// Helper to get recruiter ID from user ID
const getRecruiterIdByUserId = async (userId) => {
  const res = await query('SELECT id FROM recruiters WHERE user_id = $1', [userId]);
  return res.rows[0]?.id || null;
};

// Create a new job listing
const createJob = async (recruiterId, jobData) => {
  const {
    title, company, location, jobType, experienceLevel,
    description, requirements, salaryMin, salaryMax, deadline
  } = jobData;

  const sql = `
    INSERT INTO jobs (
      recruiter_id, title, company, location, job_type,
      experience_level, description, requirements, salary_min,
      salary_max, deadline
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;
  const params = [
    recruiterId, title, company, location, jobType,
    experienceLevel, description, requirements,
    salaryMin || null, salaryMax || null, deadline || null
  ];

  const res = await query(sql, params);
  return res.rows[0];
};

// Get all open jobs with optional filters
const getAllJobs = async ({ search, jobType, experienceLevel, location }) => {
  let conditions = ["status = 'open'"];
  let params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR company ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (jobType) {
    conditions.push(`job_type = $${paramIdx}`);
    params.push(jobType);
    paramIdx++;
  }

  if (experienceLevel) {
    conditions.push(`experience_level = $${paramIdx}`);
    params.push(experienceLevel);
    paramIdx++;
  }

  if (location) {
    conditions.push(`location ILIKE $${paramIdx}`);
    params.push(`%${location}%`);
    paramIdx++;
  }

  const sql = `
    SELECT j.*, r.company_name, r.contact_name
    FROM jobs j
    JOIN recruiters r ON j.recruiter_id = r.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY j.posted_at DESC;
  `;

  const res = await query(sql, params);
  return res.rows;
};

// Get single job by ID
const getJobById = async (id) => {
  const sql = `
    SELECT j.*, r.company_name, r.company_website
    FROM jobs j
    JOIN recruiters r ON j.recruiter_id = r.id
    WHERE j.id = $1;
  `;
  const res = await query(sql, [id]);
  return res.rows[0] || null;
};

// Get all jobs posted by a specific recruiter
const getJobsByRecruiter = async (recruiterId) => {
  const sql = `
    SELECT j.*, COUNT(a.id) AS total_applicants
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.recruiter_id = $1
    GROUP BY j.id
    ORDER BY j.posted_at DESC;
  `;
  const res = await query(sql, [recruiterId]);
  return res.rows;
};

// Update a job listing
const updateJob = async (jobId, recruiterId, updateData) => {
  const {
    title, company, location, jobType, experienceLevel,
    description, requirements, salaryMin, salaryMax, status, deadline
  } = updateData;

  const sql = `
    UPDATE jobs
    SET title = COALESCE($1, title),
        company = COALESCE($2, company),
        location = COALESCE($3, location),
        job_type = COALESCE($4, job_type),
        experience_level = COALESCE($5, experience_level),
        description = COALESCE($6, description),
        requirements = COALESCE($7, requirements),
        salary_min = COALESCE($8, salary_min),
        salary_max = COALESCE($9, salary_max),
        status = COALESCE($10, status),
        deadline = COALESCE($11, deadline)
    WHERE id = $12 AND recruiter_id = $13
    RETURNING *;
  `;
  const params = [
    title, company, location, jobType, experienceLevel,
    description, requirements, salaryMin, salaryMax, status, deadline,
    jobId, recruiterId
  ];

  const res = await query(sql, params);
  return res.rows[0] || null;
};

// Delete a job listing
const deleteJob = async (jobId, recruiterId) => {
  const sql = 'DELETE FROM jobs WHERE id = $1 AND recruiter_id = $2 RETURNING id;';
  const res = await query(sql, [jobId, recruiterId]);
  return res.rows[0] || null;
};

module.exports = {
  getRecruiterIdByUserId,
  createJob,
  getAllJobs,
  getJobById,
  getJobsByRecruiter,
  updateJob,
  deleteJob
};
