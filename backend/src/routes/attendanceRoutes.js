// backend/src/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();

const {
  logAttendance,
  getUserAttendance,
  getRecentAttendance
} = require("../controllers/attendanceController");

// POST /api/attendance
router.post("/", logAttendance);

// GET /api/attendance/user/:userId?limit=50
router.get("/user/:userId", getUserAttendance);

// GET /api/attendance/recent?limit=100  (optional HR overview)
router.get("/recent", getRecentAttendance);

module.exports = router;