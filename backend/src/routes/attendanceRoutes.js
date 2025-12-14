// backend/src/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();

const {
  logAttendance,
  getUserAttendance,
  getAllUserAttendance,
  getRecentAttendance,
  getUserWorkHours,
  getUserTotalHours
} = require("../controllers/attendanceController");

// POST /api/attendance
router.post("/", logAttendance);

// GET /api/attendance/user/:userId?days=7
router.get("/user/:userId", getUserAttendance);

// GET /api/attendance/user/:userId/all (for modal)
router.get("/user/:userId/all", getAllUserAttendance);

// GET /api/attendance/recent?limit=100
router.get("/recent", getRecentAttendance);

// GET /api/attendance/user/:userId/hours?days=7
router.get("/user/:userId/hours", getUserWorkHours);

// GET /api/attendance/user/:userId/total-hours?date=2025-12-10
router.get("/user/:userId/total-hours", getUserTotalHours);

module.exports = router;