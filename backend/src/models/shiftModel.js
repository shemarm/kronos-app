// backend/src/models/shiftModel.js
const { pool } = require("../db");

const ALLOWED_STATUSES = ["AVAILABLE", "ASSIGNED", "COMPLETED", "CANCELLED"];

/**
 * HR: create a new shift
 */
async function createShift({
  description,
  departmentId = null,
  startTime = null,
  endTime = null,
  location = null,
  assignedToId = null,
  createdBy = null,
  status = null,
}) {
  if (!description) {
    throw new Error("Description is required");
  }

  let finalStatus = status
    ? status.toUpperCase()
    : assignedToId
      ? "ASSIGNED"
      : "AVAILABLE";

  if (!ALLOWED_STATUSES.includes(finalStatus)) {
    throw new Error("Invalid shift status");
  }

  const query = `
    INSERT INTO shifts (
      description,
      department_id,
      start_time,
      end_time,
      location,
      assigned_to_id,
      status,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      description,
      department_id,
      start_time,
      end_time,
      location,
      assigned_to_id,
      status,
      created_by,
      created_at,
      updated_at
  `;

  const values = [
    description,
    departmentId,
    startTime,
    endTime,
    location,
    assignedToId,
    finalStatus,
    createdBy,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Employee: get all shifts assigned to this user.
 */
async function getShiftsForUser(userId) {
  const query = `
    SELECT
      s.id,
      s.description,
      s.department_id,
      d.name AS department_name,
      s.start_time,
      s.end_time,
      s.location,
      s.assigned_to_id,
      u.user_id AS employee_staff_id,
      u.first_name AS employee_first_name,
      u.last_name AS employee_last_name,
      s.status,
      s.created_by,
      s.created_at,
      s.updated_at
    FROM shifts s
    LEFT JOIN departments d
      ON d.id = s.department_id
    LEFT JOIN users u
      ON u.id = s.assigned_to_id
    WHERE s.assigned_to_id = $1
    ORDER BY
      s.start_time NULLS LAST,
      s.id
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Get all "available" shifts (not assigned to anyone).
 */
async function getAvailableShifts() {
  const query = `
    SELECT
      s.id,
      s.description,
      s.department_id,
      d.name AS department_name,
      s.start_time,
      s.end_time,
      s.location,
      s.assigned_to_id,
      s.status,
      s.created_by,
      s.created_at,
      s.updated_at
    FROM shifts s
    LEFT JOIN departments d
      ON d.id = s.department_id
    WHERE s.status = 'AVAILABLE'
    ORDER BY
      s.start_time NULLS LAST,
      s.id
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * HR: get all shifts (any status).
 */
async function getAllShifts() {
  const query = `
    SELECT
      s.id,
      s.description,
      s.department_id,
      d.name AS department_name,
      s.start_time,
      s.end_time,
      s.location,
      s.assigned_to_id,
      u.user_id AS employee_staff_id,
      u.first_name AS employee_first_name,
      u.last_name AS employee_last_name,
      s.status,
      s.created_by,
      s.created_at,
      s.updated_at
    FROM shifts s
    LEFT JOIN departments d
      ON d.id = s.department_id
    LEFT JOIN users u
      ON u.id = s.assigned_to_id
    ORDER BY
      s.start_time NULLS LAST,
      s.id
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * HR: update shift status (AVAILABLE / ASSIGNED / COMPLETED / CANCELLED).
 * Optionally change assigned_to_id when (re)assigning.
 */
async function updateShiftStatus({ shiftId, status, assignedToId = null }) {
  const statusUpper = (status || "").toUpperCase();
  if (!ALLOWED_STATUSES.includes(statusUpper)) {
    throw new Error("Invalid shift status");
  }

  // If we are setting status to AVAILABLE, we generally clear assigned_to_id.
  let finalAssignedToId = assignedToId;
  if (statusUpper === "AVAILABLE") {
    finalAssignedToId = null;
  }

  const query = `
    UPDATE shifts
    SET
      status = $1,
      assigned_to_id = $2,
      updated_at = now()
    WHERE id = $3
    RETURNING
      id,
      description,
      department_id,
      start_time,
      end_time,
      location,
      assigned_to_id,
      status,
      created_by,
      created_at,
      updated_at
  `;

  const values = [statusUpper, finalAssignedToId, shiftId];

  const result = await pool.query(query, values);
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0];
}

module.exports = {
  createShift,
  getShiftsForUser,
  getAvailableShifts,
  getAllShifts,
  updateShiftStatus,
};