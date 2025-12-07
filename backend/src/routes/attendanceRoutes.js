// backend/src/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();

const {
  logAttendance,
  getUserAttendance,
  getRecentAttendance,
  calculateWorkHours
} = require("../controllers/attendanceController");

// POST /api/attendance
router.post("/", logAttendance);

// GET /api/attendance/user/:userId?limit=50
router.get("/user/:userId", getUserAttendance);

// GET /api/attendance/recent?limit=100  (optional HR overview)
router.get("/recent", getRecentAttendance);

// GET /api/attendance/user/:id/hours  (Track Work Hours)
router.get("/user/:id/hours", calculateWorkHours);


module.exports = router;