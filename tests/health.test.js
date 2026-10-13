'use strict';

/**
 * tests/health.test.js — Smoke test for the health endpoint.
 * No DB interaction; verifies the server boots correctly.
 */

require('dotenv').config();

if (process.env.TEST_DB_NAME) {
  process.env.DB_NAME = process.env.TEST_DB_NAME;
}

const request  = require('supertest');
const app      = require('../src/app');
const { pool } = require('../src/db/pool');

afterAll(() => pool.end());

describe('GET /api/health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Unknown route', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
