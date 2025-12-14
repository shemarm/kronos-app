// backend/src/models/shiftModel.js
const { pool } = require("../db");

/**
 * Get shifts assigned to a specific user.
 */
async function getShiftsForUser(userId) {
  const result = await pool.query(
    `
    SELECT id, description, assigned_to_id AS assigned_to, status, created_at, updated_at
    FROM shifts
    WHERE assigned_to_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

/**
 * Get all available shifts.
 * If userId is provided, exclude shifts assigned to that user.
 * Also exclude shifts that are assigned to ANY user (assigned_to_id IS NOT NULL).
 */
async function getAvailableShifts(userId = null) {
  const params = [];
  let filter = "AND assigned_to_id IS NULL";  // Only truly unassigned shifts
  
  if (userId) {
    // This is redundant now since we're checking assigned_to_id IS NULL,
    // but keep it for clarity
    filter += " AND (assigned_to_id IS NULL OR assigned_to_id != $1)";
    params.push(userId);
  }

  const result = await pool.query(
    `
    SELECT id, description, assigned_to_id AS assigned_to, status, created_at, updated_at
    FROM shifts
    WHERE status = 'AVAILABLE'
    ${filter}
    ORDER BY created_at DESC
    `,
    params
  );
  return result.rows;
}

/**
 * Get all shifts (HR)
 */
async function getAllShifts() {
  const result = await pool.query(
    `
    SELECT id, description, assigned_to_id AS assigned_to, status, created_at, updated_at
    FROM shifts
    ORDER BY created_at DESC
    `
  );
  return result.rows;
}

/**
 * Create a new shift.
 */
async function createShift({ description, assignedToId = null, status = "AVAILABLE", createdBy = null }) {
  const result = await pool.query(
    `
    INSERT INTO shifts (description, assigned_to_id, status, created_by, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING id, description, assigned_to_id AS assigned_to, status, created_at, updated_at
    `,
    [description, assignedToId, status, createdBy]
  );
  return result.rows[0] || null;
}


/**
 * Update shift assignment and status.
 */
async function updateShiftStatus({ shiftId, status, assignedToId = null }) {
  const result = await pool.query(
    `
    UPDATE shifts
    SET assigned_to_id = $1,
        status = $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, description, assigned_to_id AS assigned_to, status, created_at, updated_at
    `,
    [assignedToId, status, shiftId]
  );
  return result.rows[0] || null;
}

/**
 * Delete a shift.
 */
async function deleteShift(shiftId) {
  const result = await pool.query(
    `
    DELETE FROM shifts
    WHERE id = $1
    RETURNING id
    `,
    [shiftId]
  );
  return result.rowCount > 0;
}

module.exports = {
  getShiftsForUser,
  getAvailableShifts,
  getAllShifts,
  createShift,
  updateShiftStatus,
  deleteShift,
};