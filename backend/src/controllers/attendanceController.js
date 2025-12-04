// backend/src/controllers/attendanceController.js
const {
  insertAttendanceLog,
  getAttendanceLogsByUser,
  getRecentAttendanceLogs
} = require("../models/attendanceModel");

/**
 * POST /api/attendance
 * Body: { userId, action, source?, qrValue? }
 */
async function logAttendance(req, res) {
  try {
    const { userId, action, source, qrValue } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        message: "userId and action are required"
      });
    }

    // Normalise "in"/"out" to "IN"/"OUT" for the CHECK constraint
    const eventType = String(action).toUpperCase();
    if (eventType !== "IN" && eventType !== "OUT") {
      return res.status(400).json({
        message: "action must be 'in' or 'out'"
      });
    }

    // For self-service, we treat created_by as the same user.
    const createdBy = userId;

    const log = await insertAttendanceLog({
      userId,
      eventType,
      source,
      qrValue,
      createdBy
    });

    return res.status(201).json({ log });
  } catch (err) {
    console.error("logAttendance error:", err);
    return res.status(500).json({
      message: "Failed to save attendance",
      detail: err.message
    });
  }
}

/**
 * GET /api/attendance/user/:userId?limit=50
 */
async function getUserAttendance(req, res) {
  try {
    const userId = Number(req.params.userId);
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Valid numeric userId param is required"
      });
    }

    const logs = await getAttendanceLogsByUser(userId, limit);
    return res.json({ logs });
  } catch (err) {
    console.error("getUserAttendance error:", err);
    return res.status(500).json({
      message: "Failed to fetch attendance",
      detail: err.message
    });
  }
}

/**
 * GET /api/attendance/recent?limit=100
 * For HR overview
 */
async function getRecentAttendance(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const logs = await getRecentAttendanceLogs(limit);
    return res.json({ logs });
  } catch (err) {
    console.error("getRecentAttendance error:", err);
    return res.status(500).json({
      message: "Failed to fetch attendance",
      detail: err.message
    });
  }
}

module.exports = {
  logAttendance,
  getUserAttendance,
  getRecentAttendance
};