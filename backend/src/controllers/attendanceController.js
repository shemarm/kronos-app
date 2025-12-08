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

    const eventType = String(action).toUpperCase();
    if (eventType !== "IN" && eventType !== "OUT") {
      return res.status(400).json({
        message: "action must be 'in' or 'out'"
      });
    }

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

/**
 * GET /api/attendance/user/:id/hours
 * Calculate work hours by pairing IN/OUT events
 */
async function calculateWorkHours(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Fetch logs sorted oldest → newest
    const logs = await getLogsForHours(userId);

    const days = {};
    let i = 0;

    while (i < logs.length) {
      const log = logs[i];

      // Only process IN events
      if (log.event_type === "IN") {
        const clockInTime = new Date(log.recorded_at);
        const day = clockInTime.toISOString().slice(0, 10); // YYYY-MM-DD
        
        // Initialize day if new
        if (!days[day]) {
          days[day] = {
            totalHours: 0,
            incomplete: false,
            clockInTime: null,
            clockOutTime: null
          };
        }

        // Store first clock-in of the day if not set
        if (!days[day].clockInTime) {
          days[day].clockInTime = clockInTime;
        }

        const next = logs[i + 1];

        // Check if next log is an OUT on the same or later time
        if (next && next.event_type === "OUT") {
          const clockOutTime = new Date(next.recorded_at);
          
          // Calculate duration in milliseconds, then convert to hours
          const durationMs = clockOutTime - clockInTime;
          const durationHours = durationMs / (1000 * 60 * 60);

          days[day].totalHours += durationHours;
          days[day].clockOutTime = clockOutTime; // Track last clock-out
          
          i += 2; // Skip both IN and OUT
        } else {
          // Orphaned IN (no matching OUT)
          days[day].incomplete = true;
          i += 1;
        }
      } else {
        // Skip orphaned OUT
        i += 1;
      }
    }

    // Convert to array and format for frontend
    const dayList = Object.entries(days).map(([date, info]) => {
      // Format times for display (24-hour format)
      const clockIn = info.clockInTime 
        ? info.clockInTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '--:--';
      
      const clockOut = info.clockOutTime && !info.incomplete
        ? info.clockOutTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '-';

      return {
        date,
        clockIn,
        clockOut,
        totalHours: Number(info.totalHours.toFixed(2)),
        incomplete: info.incomplete
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

    // Calculate weekly total (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyTotal = dayList.reduce((sum, d) => {
      const dayDate = new Date(d.date);
      // Include all hours (even incomplete days show partial work)
      return (dayDate >= weekAgo) ? sum + d.totalHours : sum;
    }, 0);

    return res.json({
      userId,
      weeklyTotal: Number(weeklyTotal.toFixed(2)),
      days: dayList
    });

  } catch (err) {
    console.error("Work hours calculation error:", err);
    return res.status(500).json({ 
      message: "Failed to calculate work hours",
      detail: err.message 
    });
  }
}

module.exports = {
  logAttendance,
  getUserAttendance,
  getRecentAttendance,
  calculateWorkHours 
};