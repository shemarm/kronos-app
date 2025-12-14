// backend/src/controllers/attendanceController.js
const {
  insertAttendanceLog,
  getAttendanceLogsByUser,
  getAllAttendanceLogsByUser,
  getRecentAttendanceLogs,
  getWorkHoursByUser,
  getTotalHoursByDate
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
 * GET /api/attendance/user/:userId?days=7&date=2025-12-10
 * Get attendance logs, optionally filtered by date
 */
async function getUserAttendance(req, res) {
  try {
    const userId = Number(req.params.userId);
    const days = req.query.days ? Number(req.query.days) : 7;
    const date = req.query.date || null;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Valid numeric userId param is required"
      });
    }

    const logs = await getAttendanceLogsByUser(userId, { days, date });
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
 * GET /api/attendance/user/:userId/all
 * Get ALL attendance logs for modal
 */
async function getAllUserAttendance(req, res) {
  try {
    const userId = Number(req.params.userId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Valid numeric userId param is required"
      });
    }

    const logs = await getAllAttendanceLogsByUser(userId);
    return res.json({ logs });
  } catch (err) {
    console.error("getAllUserAttendance error:", err);
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
    const days = req.query.days ? Number(req.query.days) : null;
    const logs = await getRecentAttendanceLogs({ limit, days });
    return res.json({ logs });
  } catch (err) {
    console.error("getRecentAttendance error:", err);
    return res.status(500).json({
      message: "Failed to fetch attendance",
      detail: err.message
    });
  }
}

/**
 * GET /api/attendance/user/:userId/hours?days=7
 * Fetch the total hours worked for a specific user.
 */
async function getUserWorkHours(req, res) {
  try {
    const userId = Number(req.params.userId);
    const days = req.query.days ? Number(req.query.days) : 7;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Valid numeric userId param is required"
      });
    }

    const totalHours = await getWorkHoursByUser(userId, { days });

    return res.json({
      totalHours: parseFloat(totalHours).toFixed(2)
    });
  } catch (err) {
    console.error("getUserWorkHours error:", err);
    return res.status(500).json({
      message: "Failed to fetch work hours",
      detail: err.message
    });
  }
}

/**
 * GET /api/attendance/user/:userId/total-hours?date=2025-12-10
 * or ?startDate=2025-12-01&endDate=2025-12-10
 * Get total hours worked for a date or date range
 */
async function getUserTotalHours(req, res) {
  try {
    const userId = Number(req.params.userId);
    const date = req.query.date || null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Valid numeric userId param is required"
      });
    }

    const totalHours = await getTotalHoursByDate(userId, { date, startDate, endDate });

    return res.json({
      userId,
      date,
      startDate,
      endDate,
      totalHours: parseFloat(totalHours).toFixed(2)
    });
  } catch (err) {
    console.error("getUserTotalHours error:", err);
    return res.status(500).json({
      message: "Failed to fetch total hours",
      detail: err.message
    });
  }
}

module.exports = {
  logAttendance,
  getUserAttendance,
  getAllUserAttendance,
  getRecentAttendance,
  getUserWorkHours,
  getUserTotalHours
};