workHoursController.js
const { getUserLogs, calculateHours } = require("../services/workHoursService");

async function getWorkHours(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const logs = await getUserLogs(userId);
    const { list, weeklyTotal } = calculateHours(logs);

    return res.json({
      success: true,
      days: list.map(d => ({
        date: d.date,
        clockIn: d.clockIn,
        clockOut: d.clockOut,
        totalHours: Number(d.totalHours.toFixed(2)),
        incomplete: d.incomplete
      })),
      weeklyTotal: Number(weeklyTotal.toFixed(2))
    });

  } catch (err) {
    console.error("Work hours error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate work hours"
    });
  }
}

module.exports = { getWorkHours };
