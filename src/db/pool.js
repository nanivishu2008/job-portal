'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Keep idle connections for 30 s, max 10 clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  max: 10,
});

// Crash loudly if the pool encounters an unexpected error on an idle client
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
  process.exit(1);
});

/**
 * Run a single parameterised query.
 * @param {string} text  SQL with $1, $2… placeholders
 * @param {Array}  params
 */
const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client from the pool for multi-statement transactions.
 * The caller is responsible for calling client.release().
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
