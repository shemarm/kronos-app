// backend/src/controllers/attendanceController.js
const {
  insertAttendanceLog,
  getAttendanceLogsByUser,
  getRecentAttendanceLogs,
  getLogsForHours 
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
async function calculateWorkHours(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Get logs sorted oldest → newest
    const logs = await getLogsForHours(userId);

    const days = {};
    let i = 0;

    while (i < logs.length) {
      const log = logs[i];

      if (log.event_type === "IN") {
        const day = new Date(log.recorded_at).toISOString().slice(0, 10);
        const next = logs[i + 1];

        if (!days[day]) {
          days[day] = { 
            totalHours: 0, 
            incomplete: false,
            // Capture the first clock in of the day
            firstClockIn: new Date(log.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            lastClockOut: '-' 
          };
        }

        // If no OUT or next is not OUT → incomplete day
        if (!next || next.event_type !== "OUT") {
          days[day].incomplete = true;
          i++;
          continue;
        }

        // Capture the latest clock out
        days[day].lastClockOut = new Date(next.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Calculate hours
        const diffHours = (new Date(next.recorded_at) - new Date(log.recorded_at)) / (1000 * 60 * 60);
        days[day].totalHours += diffHours;

        // Skip the OUT row
        i += 2;
      } else {
        i++;
      }
    }

    // Convert object into sorted array
    const dayList = Object.entries(days).map(([date, info]) => ({
      date,
      totalHours: Number(info.totalHours.toFixed(2)),
      incomplete: info.incomplete,
      clockIn: info.firstClockIn,
      clockOut: info.lastClockOut
    })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

    // Calculate weekly summary
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    let weeklyTotal = 0;
    for (const d of dayList) {
      const dDate = new Date(d.date);
      if (dDate >= weekAgo && !d.incomplete) {
        weeklyTotal += d.totalHours;
      }
    }

    return res.json({
      userId,
      weeklyTotal: Number(weeklyTotal.toFixed(2)),
      days: dayList
    });

  } catch (err) {
    console.error("Work hours error:", err);
    return res.status(500).json({ message: "Failed to calculate work hours" });
  }
}
module.exports = {
  logAttendance,
  getUserAttendance,
  getRecentAttendance,
  calculateWorkHours 
};