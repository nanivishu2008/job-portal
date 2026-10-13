'use strict';

const { query } = require('../db/pool');

/**
 * Find a user by email (case-insensitive).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Find a user by id.
 * @param {string} id  UUID
 */
async function findUserById(id) {
  const { rows } = await query(
    'SELECT id, email, role, full_name, is_active, email_verified, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new user and their role-specific profile in a single transaction.
 * @param {{ email, passwordHash, role, fullName, companyName? }} data
 * @returns {Promise<object>} The created user row (no password_hash).
 */
async function createUser({ email, passwordHash, role, fullName, companyName }) {
  const { getClient } = require('../db/pool');
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, full_name, is_active, email_verified, created_at`,
      [email.toLowerCase(), passwordHash, role, fullName]
    );
    const user = userRows[0];

    if (role === 'candidate') {
      await client.query(
        'INSERT INTO candidate_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    } else if (role === 'recruiter') {
      await client.query(
        'INSERT INTO recruiter_profiles (user_id, company_name) VALUES ($1, $2)',
        [user.id, companyName || 'My Company']
      );
    }

    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Return the role-specific profile for a user.
 */
async function getProfile(userId, role) {
  if (role === 'candidate') {
    const { rows } = await query(
      'SELECT * FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );
    return rows[0] || null;
  } else if (role === 'recruiter') {
    const { rows } = await query(
      'SELECT * FROM recruiter_profiles WHERE user_id = $1',
      [userId]
    );
    return rows[0] || null;
  }
  return null;
}

module.exports = { findUserByEmail, findUserById, createUser, getProfile };
