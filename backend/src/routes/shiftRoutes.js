// backend/src/routes/shiftRoutes.js
const express = require("express");

const {
  createShiftHandler,
  getUserShiftsHandler,
  getAvailableShiftsHandler,
  getAllShiftsHandler,
  setShiftStatusHandler,
} = require("../controllers/shiftController");

const router = express.Router();

/**
 * HR: create new shift
 * POST /api/shifts
 */
router.post("/", createShiftHandler);

/**
 * Employee: see their shifts
 * GET /api/shifts/user/:userId
 */
router.get("/user/:userId", getUserShiftsHandler);

/**
 * Get AVAILABLE shifts (anyone)
 * GET /api/shifts/available
 */
router.get("/available", getAvailableShiftsHandler);

/**
 * HR: get all shifts
 * GET /api/shifts
 */
router.get("/", getAllShiftsHandler);

/**
 * HR: update shift status (and optionally assignment)
 * PATCH /api/shifts/:id/status
 */
router.patch("/:id/status", setShiftStatusHandler);

module.exports = router;