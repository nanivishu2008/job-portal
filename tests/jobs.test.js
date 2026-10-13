'use strict';

/**
 * tests/jobs.test.js
 *
 * Integration tests for /api/jobs/* endpoints.
 * Inserts test data before the suite and removes it after.
 */

require('dotenv').config();

if (process.env.TEST_DB_NAME) {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
}

const request  = require('supertest');
const app      = require('../src/app');
const { pool } = require('../src/db/pool');

let testJobId;
let testRecruiterId;

beforeAll(async () => {
  // Create a test recruiter user
  const { rows: userRows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name)
     VALUES ($1, $2, 'recruiter', 'Test Recruiter Jobs')
     RETURNING id`,
    [`recruiter_jobs_${Date.now()}@test.com`, '$2a$12$placeholder']
  );
  testRecruiterId = userRows[0].id;

  // Create recruiter profile
  await pool.query(
    `INSERT INTO recruiter_profiles (user_id, company_name, industry)
     VALUES ($1, 'Test Corp', 'Technology')`,
    [testRecruiterId]
  );

  // Create a test job
  const { rows: jobRows } = await pool.query(
    `INSERT INTO jobs (recruiter_id, title, description, location, job_type, experience_level, status)
     VALUES ($1, 'Senior Node.js Developer', 'Build great things', 'Remote', 'remote', 'senior', 'active')
     RETURNING id`,
    [testRecruiterId]
  );
  testJobId = jobRows[0].id;
});

afterAll(async () => {
  // Delete cascades to jobs, profiles
  await pool.query('DELETE FROM users WHERE id = $1', [testRecruiterId]);
  await pool.end();
});

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
describe('GET /api/jobs', () => {
  it('returns paginated job listings', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('filters by job_type', async () => {
    const res = await request(app).get('/api/jobs?job_type=remote');
    expect(res.status).toBe(200);
    res.body.data.forEach((job) => expect(job.job_type).toBe('remote'));
  });

  it('filters by search term', async () => {
    const res = await request(app).get('/api/jobs?search=Node.js');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('paginates correctly', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination.limit).toBe(5);
  });

  it('rejects invalid job_type with 422', async () => {
    const res = await request(app).get('/api/jobs?job_type=invalid');
    expect(res.status).toBe(422);
  });

  it('rejects invalid page with 422', async () => {
    const res = await request(app).get('/api/jobs?page=0');
    expect(res.status).toBe(422);
  });
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
describe('GET /api/jobs/:id', () => {
  it('returns a job by id', async () => {
    const res = await request(app).get(`/api/jobs/${testJobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testJobId);
    expect(res.body.title).toBe('Senior Node.js Developer');
    expect(res.body.company_name).toBe('Test Corp');
  });

  it('returns 404 for unknown UUID', async () => {
    const res = await request(app).get('/api/jobs/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('returns 404 for invalid UUID format', async () => {
    const res = await request(app).get('/api/jobs/not-a-uuid');
    expect(res.status).toBe(404);
  });
});
