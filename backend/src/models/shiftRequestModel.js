// backend/src/models/shiftRequestModel.js
const { pool } = require("../db");

/**
 * Create a new shift request.
 * requestType: "TRADE" | "PICK_UP" | "DROP"
 * status: "PENDING" | "APPROVED" | "REJECTED"
 * source: "ASSIGNED" | "AVAILABLE"
 */
async function createShiftRequest({
  userId,
  shiftId,
  requestType,
  note,
  source,
}) {
  const result = await pool.query(
    `
    INSERT INTO shift_requests (
      user_id,
      shift_id,
      request_type,
      note,
      status,
      source
    )
    VALUES ($1, $2, $3, $4, 'PENDING', $5)
    RETURNING
      id,
      user_id,
      shift_id,
      request_type,
      note,
      status,
      source,
      created_at,
      updated_at,
      approved_by,
      approved_at
    `,
    [userId, shiftId, requestType, note || null, source]
  );

  return result.rows[0];
}

/**
 * Employee: get their own shift requests.
 */
async function getShiftRequestsByUser(userId) {
  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      shift_id,
      request_type,
      note,
      status,
      source,
      created_at,
      updated_at,
      approved_by,
      approved_at
    FROM shift_requests
    WHERE user_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [userId]
  );
  return result.rows;
}

/**
 * HR: get ALL shift requests (with employee and approver info).
 */
async function getAllShiftRequests() {
  const result = await pool.query(
    `
    SELECT
      sr.id,
      sr.user_id,
      sr.shift_id,
      sr.request_type,
      sr.note,
      sr.status,
      sr.source,
      sr.created_at,
      sr.updated_at,
      sr.approved_by,
      sr.approved_at,
      u.user_id       AS employee_staff_id,
      u.first_name    AS employee_first_name,
      u.last_name     AS employee_last_name,
      au.user_id      AS approver_staff_id,
      au.first_name   AS approver_first_name,
      au.last_name    AS approver_last_name
    FROM shift_requests sr
    JOIN users u
      ON u.id = sr.user_id
    LEFT JOIN users au
      ON au.id = sr.approved_by
    ORDER BY sr.created_at DESC, sr.id DESC
    `
  );
  return result.rows;
}

/**
 * HR: update status of shift request, set approved_by/approved_at if needed.
 */
async function updateShiftRequestStatus({ requestId, status, approverId }) {
  const statusUpper = status.toUpperCase();
  const allowed = ["PENDING", "APPROVED", "REJECTED"];
  if (!allowed.includes(statusUpper)) {
    throw new Error("Invalid shift request status");
  }

  let query;
  let values;

  if (statusUpper === "PENDING") {
    query = `
      UPDATE shift_requests
      SET
        status      = $1,
        approved_by = NULL,
        approved_at = NULL,
        updated_at  = NOW()
      WHERE id = $2
      RETURNING
        id,
        user_id,
        shift_id,
        request_type,
        note,
        status,
        source,
        created_at,
        updated_at,
        approved_by,
        approved_at
    `;
    values = [statusUpper, requestId];
  } else {
    query = `
      UPDATE shift_requests
      SET
        status      = $1,
        approved_by = $2,
        approved_at = NOW(),
        updated_at  = NOW()
      WHERE id = $3
      RETURNING
        id,
        user_id,
        shift_id,
        request_type,
        note,
        status,
        source,
        created_at,
        updated_at,
        approved_by,
        approved_at
    `;
    values = [statusUpper, approverId, requestId];
  }

  const result = await pool.query(query, values);
  if (result.rowCount === 0) return null;
  return result.rows[0];
}

module.exports = {
  createShiftRequest,
  getShiftRequestsByUser,
  getAllShiftRequests,
  updateShiftRequestStatus,
};