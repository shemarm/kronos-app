// backend/src/models/userModel.js
const { pool } = require("../db");

/**
 * Find a user by user_id (the login ID).
 * This matches the `user_id` column in your `users` table.
 */
async function findUserByUserId(userId) {
  const query = `
    SELECT id, user_id, first_name, last_name, password, role_id, department_id
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `;
  const values = [userId];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

module.exports = {
  findUserByUserId,
};