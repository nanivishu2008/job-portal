const { query, pool } = require('../config/db');
const findUserByEmail = async (email) => {
  const r = await query('SELECT id,email,password_hash,role,created_at FROM users WHERE email=$1',[email]);
  return r.rows[0]||null;
};
const findUserById = async (id) => {
  const r = await query('SELECT id,email,role,created_at FROM users WHERE id=$1',[id]);
  return r.rows[0]||null;
};
const createUserWithProfile = async ({email,passwordHash,role,profileData}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows} = await client.query(
      'INSERT INTO users(email,password_hash,role) VALUES($1,$2,$3) RETURNING id,email,role,created_at',
      [email,passwordHash,role]);
    const user = rows[0];
    if(role==='candidate')
      await client.query('INSERT INTO candidates(user_id,full_name) VALUES($1,$2)',[user.id,profileData.fullName]);
    else
      await client.query('INSERT INTO recruiters(user_id,company_name,contact_name) VALUES($1,$2,$3)',
        [user.id,profileData.companyName,profileData.contactName]);
    await client.query('COMMIT');
    return user;
  } catch(e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};
module.exports = { findUserByEmail, findUserById, createUserWithProfile };

