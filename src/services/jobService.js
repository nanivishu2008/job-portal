'use strict';

const { query } = require('../db/pool');

/**
 * Paginated list of active jobs (public).
 * @param {{ page, limit, search, jobType, experienceLevel, location }} opts
 */
async function listJobs({ page = 1, limit = 20, search, jobType, experienceLevel, location } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [`j.status = 'active'`];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`);
  }
  if (jobType) {
    params.push(jobType);
    conditions.push(`j.job_type = $${params.length}`);
  }
  if (experienceLevel) {
    params.push(experienceLevel);
    conditions.push(`j.experience_level = $${params.length}`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`j.location ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count for pagination
  const countResult = await query(
    `SELECT COUNT(*) FROM jobs j ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Paginated data
  params.push(limit);
  params.push(offset);
  const { rows } = await query(
    `SELECT
       j.id, j.title, j.location, j.job_type, j.salary_min, j.salary_max,
       j.salary_currency, j.experience_level, j.application_deadline, j.created_at,
       rp.company_name, rp.company_logo_filename, rp.industry
     FROM jobs j
     JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
     ${where}
     ORDER BY j.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Single job detail (public).
 */
async function getJobById(id) {
  const { rows } = await query(
    `SELECT
       j.*,
       rp.company_name, rp.company_website, rp.company_description,
       rp.company_logo_filename, rp.industry, rp.company_size,
       rp.location AS company_location
     FROM jobs j
     JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
     WHERE j.id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { listJobs, getJobById };
