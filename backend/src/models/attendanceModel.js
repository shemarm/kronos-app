// backend/src/models/attendanceModel.js
const { pool } = require("../db");

/**
 * Insert a single attendance log row.
 *
 * @param {Object} params
 * @param {number} params.userId      - users.id (FK)
 * @param {string} params.eventType   - "IN" | "OUT"
 * @param {string} [params.source]    - "WEB_FORM", "QR_SCAN", etc.
 * @param {string} [params.qrValue]   - raw QR text if applicable
 * @param {number} [params.createdBy] - users.id who created the log
 */
async function insertAttendanceLog({
  userId,
  eventType,
  source = "WEB_FORM",
  qrValue = null,
  createdBy = null
}) {
  const query = `
    INSERT INTO attendance_logs
      (user_id, event_type, source, qr_value, created_by)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING
      id,
      user_id,
      event_type,
      recorded_at,
      source,
      qr_value,
      created_by,
      created_at
  `;

  const values = [userId, eventType, source, qrValue, createdBy];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Fetch recent attendance logs for a given user.
 */
async function getAttendanceLogsByUser(userId, limit = 50) {
  const query = `
    SELECT
      id,
      user_id,
      event_type,
      recorded_at,
      source,
      qr_value,
      created_by,
      created_at
    FROM attendance_logs
    WHERE user_id = $1
    ORDER BY recorded_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

/**
 * Fetch recent logs across all users (for HR).
 */
async function getRecentAttendanceLogs(limit = 100) {
  const query = `
    SELECT
      al.id,
      al.user_id,
      al.event_type,
      al.recorded_at,
      al.source,
      al.qr_value,
      al.created_by,
      al.created_at,
      u.first_name,
      u.last_name
    FROM attendance_logs al
    JOIN users u ON u.id = al.user_id
    ORDER BY al.recorded_at DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}
/**
 * Fetch logs for work-hour calculations (sorted oldest → newest).
 */
async function getLogsForHours(userId) {
  const query = `
    SELECT
      event_type,
      recorded_at
    FROM attendance_logs
    WHERE user_id = $1
    ORDER BY recorded_at ASC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

module.exports = {
  insertAttendanceLog,
  getAttendanceLogsByUser,
  getRecentAttendanceLogs,
  getLogsForHours
};