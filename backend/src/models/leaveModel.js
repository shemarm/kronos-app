// backend/src/models/leaveModel.js
const { pool } = require("../db");

/**
 * Create a new leave request (employee).
 */
async function createLeaveRequest({ userId, fromDate, toDate, reason }) {
  const query = `
    INSERT INTO leave_requests (
      user_id,
      from_date,
      to_date,
      reason,
      status
    )
    VALUES ($1, $2, $3, $4, 'PENDING')
    RETURNING
      id,
      user_id,
      from_date,
      to_date,
      reason,
      status,
      submitted_at,
      approved_by,
      approved_at,
      created_at,
      updated_at
  `;
  const values = [userId, fromDate, toDate, reason];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get all leave requests for a given user (employee view).
 */
async function getLeaveRequestsByUser(userId) {
  const query = `
    SELECT
      id,
      user_id,
      from_date,
      to_date,
      reason,
      status,
      submitted_at,
      approved_by,
      approved_at,
      created_at,
      updated_at
    FROM leave_requests
    WHERE user_id = $1
    ORDER BY submitted_at DESC, id DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * HR: get ALL leave requests with user and approver info.
 */
async function getAllLeaveRequests() {
  const query = `
    SELECT
      lr.id,
      lr.user_id,
      lr.from_date,
      lr.to_date,
      lr.reason,
      lr.status,
      lr.submitted_at,
      lr.approved_by,
      lr.approved_at,
      lr.created_at,
      lr.updated_at,
      u.user_id        AS employee_staff_id,
      u.first_name     AS employee_first_name,
      u.last_name      AS employee_last_name,
      u.role_id        AS employee_role_id,
      u.department_id  AS employee_department_id,
      au.user_id       AS approver_staff_id,
      au.first_name    AS approver_first_name,
      au.last_name     AS approver_last_name
    FROM leave_requests lr
    JOIN users u
      ON u.id = lr.user_id
    LEFT JOIN users au
      ON au.id = lr.approved_by
    ORDER BY lr.submitted_at DESC, lr.id DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * HR: get leave requests by status (PENDING / APPROVED / REJECTED).
 */
async function getLeaveRequestsByStatus(status) {
  const statusUpper = status.toUpperCase();
  const allowed = ["PENDING", "APPROVED", "REJECTED"];

  if (!allowed.includes(statusUpper)) {
    throw new Error("Invalid status filter");
  }

  const query = `
    SELECT
      lr.id,
      lr.user_id,
      lr.from_date,
      lr.to_date,
      lr.reason,
      lr.status,
      lr.submitted_at,
      lr.approved_by,
      lr.approved_at,
      lr.created_at,
      lr.updated_at,
      u.user_id        AS employee_staff_id,
      u.first_name     AS employee_first_name,
      u.last_name      AS employee_last_name,
      u.role_id        AS employee_role_id,
      u.department_id  AS employee_department_id,
      au.user_id       AS approver_staff_id,
      au.first_name    AS approver_first_name,
      au.last_name     AS approver_last_name
    FROM leave_requests lr
    JOIN users u
      ON u.id = lr.user_id
    LEFT JOIN users au
      ON au.id = lr.approved_by
    WHERE lr.status = $1
    ORDER BY lr.submitted_at DESC, lr.id DESC
  `;
  const result = await pool.query(query, [statusUpper]);
  return result.rows;
}

/**
 * HR: update leave status (APPROVED / REJECTED / PENDING).
 * When APPROVED or REJECTED, sets approved_by + approved_at.
 * When PENDING, clears approved_by + approved_at.
 */
async function updateLeaveStatus({ leaveId, status, approverId }) {
  const statusUpper = status.toUpperCase();
  const allowed = ["PENDING", "APPROVED", "REJECTED"];
  if (!allowed.includes(statusUpper)) {
    throw new Error("Invalid status value");
  }

  let query;
  let values;

  if (statusUpper === "PENDING") {
    // Reset approval info
    query = `
      UPDATE leave_requests
      SET
        status = $1,
        approved_by = NULL,
        approved_at = NULL,
        updated_at = now()
      WHERE id = $2
      RETURNING
        id,
        user_id,
        from_date,
        to_date,
        reason,
        status,
        submitted_at,
        approved_by,
        approved_at,
        created_at,
        updated_at
    `;
    values = [statusUpper, leaveId];
  } else {
    // APPROVED or REJECTED → set approver + timestamp
    query = `
      UPDATE leave_requests
      SET
        status = $1,
        approved_by = $2,
        approved_at = now(),
        updated_at = now()
      WHERE id = $3
      RETURNING
        id,
        user_id,
        from_date,
        to_date,
        reason,
        status,
        submitted_at,
        approved_by,
        approved_at,
        created_at,
        updated_at
    `;
    values = [statusUpper, approverId, leaveId];
  }

  const result = await pool.query(query, values);
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0];
}


module.exports = {
  createLeaveRequest,
  getLeaveRequestsByUser,
  getAllLeaveRequests,
  getLeaveRequestsByStatus,
  updateLeaveStatus,
};