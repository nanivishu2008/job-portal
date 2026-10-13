const { query } = require('../config/db');

const getProfileByUserId = async (userId) => {
  const sql = `
    SELECT c.*, u.email, u.created_at AS member_since
    FROM candidates c
    JOIN users u ON c.user_id = u.id
    WHERE c.user_id = $1;
  `;
  const res = await query(sql, [userId]);
  return res.rows[0] || null;
};

const updateProfileByUserId = async (userId, data) => {
  const { fullName, phone, bio, location, linkedinUrl } = data;
  const sql = `
    UPDATE candidates
    SET full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        bio = COALESCE($3, bio),
        location = COALESCE($4, location),
        linkedin_url = COALESCE($5, linkedin_url),
        updated_at = NOW()
    WHERE user_id = $6
    RETURNING *;
  `;
  const res = await query(sql, [fullName, phone, bio, location, linkedinUrl, userId]);
  return res.rows[0] || null;
};

module.exports = { getProfileByUserId, updateProfileByUserId };
