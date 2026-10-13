'use strict';

/**
 * tests/auth.test.js
 *
 * Integration tests for /api/auth/* endpoints.
 * These tests run against a REAL PostgreSQL database (TEST_DB_NAME).
 * Each test suite cleans up its own data so tests are repeatable.
 *
 * Requires environment variables set in .env (or CI):
 *   DB_HOST, DB_PORT, DB_NAME (used as test db), DB_USER, DB_PASSWORD, JWT_SECRET
 *
 * To use a separate test database, set TEST_DB_NAME in .env.
 */

require('dotenv').config();

// Override DB_NAME with TEST_DB_NAME if provided
if (process.env.TEST_DB_NAME) {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
}

const request  = require('supertest');
const app      = require('../src/app');
const { pool } = require('../src/db/pool');

// Unique email per test run to avoid conflicts
const ts = Date.now();
const candidateEmail  = `candidate_${ts}@test.com`;
const recruiterEmail  = `recruiter_${ts}@test.com`;

afterAll(async () => {
  // Clean up test users (cascades to profiles)
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`%_${ts}@test.com`]);
  await pool.end();
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registers a candidate successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:     candidateEmail,
        password:  'SecurePass1',
        full_name: 'Test Candidate',
        role:      'candidate',
      });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('candidate');
    expect(res.body.user.email).toBe(candidateEmail);
  });

  it('registers a recruiter successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:        recruiterEmail,
        password:     'SecurePass1',
        full_name:    'Test Recruiter',
        role:         'recruiter',
        company_name: 'Acme Corp',
      });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('recruiter');
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:     candidateEmail,
        password:  'SecurePass1',
        full_name: 'Dup Candidate',
        role:      'candidate',
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('rejects weak password with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:     `weak_${ts}@test.com`,
        password:  'short',
        full_name: 'Weak User',
        role:      'candidate',
      });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid role with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:     `badrole_${ts}@test.com`,
        password:  'SecurePass1',
        full_name: 'Bad Role',
        role:      'admin',
      });
    expect(res.status).toBe(422);
  });

  it('rejects recruiter without company_name with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:     `nocompany_${ts}@test.com`,
        password:  'SecurePass1',
        full_name: 'No Company',
        role:      'recruiter',
      });
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('logs in a registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: candidateEmail, password: 'SecurePass1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: candidateEmail, password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects non-existent email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'SecurePass1' });
    expect(res.status).toBe(401);
  });

  it('rejects missing fields with 422', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: candidateEmail, password: 'SecurePass1' });
    token = res.body.token;
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(candidateEmail);
    expect(res.body.profile).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken.xyz');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: candidateEmail, password: 'SecurePass1' });
    token = res.body.token;
  });

  it('returns 200 with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
