workHoursModel.js
const { pool } = require("../db");

// Get all attendance logs (IN/OUT) sorted oldest → newest
async function getUserLogs(userId) {
  const query = `
    SELECT event_type, recorded_at
    FROM attendance_logs
    WHERE user_id = $1
    ORDER BY recorded_at ASC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

// Calculate paired IN/OUT shifts + daily totals + weekly total
function calculateHours(logs) {
  const days = {};
  let i = 0;

  while (i < logs.length) {
    const log = logs[i];

    if (log.event_type === "IN") {
      const day = log.recorded_at.toISOString().slice(0, 10);
      const next = logs[i + 1];

      if (!days[day]) {
        days[day] = {
          date: day,
          clockIn: null,
          clockOut: null,
          totalHours: 0,
          incomplete: false
        };
      }

      days[day].clockIn = log.recorded_at.toISOString().slice(11, 19);

      // If no OUT exists → incomplete
      if (!next || next.event_type !== "OUT") {
        days[day].incomplete = true;
        i++;
        continue;
      }

      days[day].clockOut = next.recorded_at.toISOString().slice(11, 19);

      const diffMs = next.recorded_at - log.recorded_at;
      const diffHours = diffMs / (1000 * 60 * 60);

      days[day].totalHours += diffHours;

      i += 2; // Skip OUT
    } else {
      i++;
    }
  }

  // Convert object → array
  const list = Object.values(days);

  // Compute weekly total (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  let weeklyTotal = 0;
  list.forEach(d => {
    const dDate = new Date(d.date);
    if (dDate >= weekAgo && !d.incomplete) {
      weeklyTotal += d.totalHours;
    }
  });

  return { list, weeklyTotal };
}

module.exports = {
  getUserLogs,
  calculateHours
};
