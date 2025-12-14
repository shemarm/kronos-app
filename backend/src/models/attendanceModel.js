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
/**
 * Insert a single attendance log row and update the status accordingly.
 */
async function insertAttendanceLog({
  userId,
  eventType,
  source = "WEB_FORM",
  qrValue = null,
  createdBy = null
}) {
  // Set the clock_in_time only if the event type is 'IN'
  // Set the clock_out_time only if the event type is 'OUT'
  const clockInTime = eventType === 'IN' ? new Date() : null;
  const clockOutTime = eventType === 'OUT' ? new Date() : null;

  const query = `
    INSERT INTO attendance_logs
      (user_id, event_type, source, qr_value, created_by, clock_in_time, clock_out_time)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      user_id,
      event_type,
      recorded_at,
      clock_in_time,
      clock_out_time,
      source,
      qr_value,
      created_by,
      created_at
  `;

  const values = [userId, eventType, source, qrValue, createdBy, clockInTime, clockOutTime];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Fetch recent attendance logs for a given user and calculate the hours worked.
 */
async function getAttendanceLogsByUser(userId, { limit = 50, days = null, date = null } = {}) {
  const params = [userId];
  let idx = 2;
  const clauses = ["user_id = $1"];
  
  if (date) {
    // Filter by specific date (YYYY-MM-DD format)
    // Use timezone-aware date filtering
    clauses.push(`recorded_at::date = $${idx++}::date`);
    params.push(date);
  } else if (days) {
    clauses.push(`recorded_at >= NOW() - INTERVAL '${days} days'`);
  }
  
  const limitSql = `LIMIT $${idx++}`;
  params.push(limit);

  const query = `
    SELECT
      id,
      user_id,
      event_type,
      recorded_at,
      clock_in_time,
      clock_out_time,
      source,
      qr_value,
      created_by,
      created_at
    FROM attendance_logs
    WHERE ${clauses.join(" AND ")}
    ORDER BY recorded_at ASC
    ${limitSql}
  `;

  const result = await pool.query(query, params);
  
  // Calculate hours worked by pairing consecutive IN/OUT events
  const logsWithHours = [];
  let lastClockIn = null;

  for (const log of result.rows) {
    let hoursWorked = null;

    if (log.event_type === 'IN') {
      lastClockIn = log;
      logsWithHours.push({
        ...log,
        hoursWorked: null
      });
    } else if (log.event_type === 'OUT' && lastClockIn) {
      const clockIn = new Date(lastClockIn.recorded_at);
      const clockOut = new Date(log.recorded_at);
      hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      
      logsWithHours.push({
        ...log,
        hoursWorked: hoursWorked
      });
      
      lastClockIn = null;
    } else {
      logsWithHours.push({
        ...log,
        hoursWorked: null
      });
    }
  }

  return logsWithHours.reverse();
}


/**
 * Fetch recent attendance logs across all users (for HR).
 */
async function getRecentAttendanceLogs({ limit = 100, days = null } = {}) {
  const params = [];
  let idx = 1;
  const where = [];
  if (days) {
    where.push(`al.recorded_at >= NOW() - INTERVAL '${days} days'`);
  }
  params.push(limit);

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
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY al.user_id, al.recorded_at ASC
    LIMIT $1
  `;

  const result = await pool.query(query, params);
  
  // Calculate hours worked by pairing IN/OUT events per user
  const logsWithHours = [];
  const userClockIns = {}; // Track last clock-in per user

  for (const log of result.rows) {
    const userId = log.user_id;
    let hoursWorked = null;

    if (log.event_type === 'IN') {
      userClockIns[userId] = log;
      logsWithHours.push({
        ...log,
        hoursWorked: null
      });
    } else if (log.event_type === 'OUT' && userClockIns[userId]) {
      const clockIn = new Date(userClockIns[userId].recorded_at);
      const clockOut = new Date(log.recorded_at);
      hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      
      logsWithHours.push({
        ...log,
        hoursWorked: hoursWorked
      });
      
      delete userClockIns[userId];
    } else {
      logsWithHours.push({
        ...log,
        hoursWorked: null
      });
    }
  }

  // Return in DESC order for display
  return logsWithHours.reverse();
}


async function getWorkHoursByUser(userId) {
  const query = `
    SELECT
      user_id,
      clock_in_time,
      clock_out_time,
      EXTRACT(EPOCH FROM clock_out_time - clock_in_time) / 3600 AS total_hours
    FROM attendance_logs
    WHERE user_id = $1
      AND clock_in_time IS NOT NULL
      AND clock_out_time IS NOT NULL
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Get total hours worked for a specific date or date range
 */
async function getTotalHoursByDate(userId, { date = null, startDate = null, endDate = null } = {}) {
  const params = [userId];
  let idx = 2;
  const clauses = ["user_id = $1"];
  
  if (date) {
    // Single date - use timezone-aware comparison
    clauses.push(`recorded_at::date = $${idx++}::date`);
    params.push(date);
  } else if (startDate && endDate) {
    // Date range
    clauses.push(`recorded_at::date >= $${idx++}::date`);
    params.push(startDate);
    clauses.push(`recorded_at::date <= $${idx++}::date`);
    params.push(endDate);
  }

  const query = `
    SELECT
      id,
      user_id,
      event_type,
      recorded_at
    FROM attendance_logs
    WHERE ${clauses.join(" AND ")}
    ORDER BY recorded_at ASC
  `;

  const result = await pool.query(query, params);
  
  // Calculate total hours for the period
  let totalHours = 0;
  let lastClockIn = null;

  for (const log of result.rows) {
    if (log.event_type === 'IN') {
      lastClockIn = log;
    } else if (log.event_type === 'OUT' && lastClockIn) {
      const clockIn = new Date(lastClockIn.recorded_at);
      const clockOut = new Date(log.recorded_at);
      const hours = (clockOut - clockIn) / (1000 * 60 * 60);
      totalHours += hours;
      lastClockIn = null;
    }
  }

  return totalHours;
}

module.exports = {
  insertAttendanceLog,
  getAttendanceLogsByUser,
  getRecentAttendanceLogs,
  getWorkHoursByUser,
  getTotalHoursByDate
};