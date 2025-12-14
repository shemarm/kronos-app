// backend/src/routes/shiftRoutes.js
const express = require("express");
const {
  getUserShifts,
  getAvailableShiftsHandler,
  createShift,
  deleteShift,
} = require("../controllers/shiftController");

const router = express.Router();

/**
 * Employee: see their shifts
 * GET /api/shifts/user/:userId
 */
router.get("/user/:userId", getUserShifts);

/**
 * Get AVAILABLE shifts (anyone)
 * GET /api/shifts/available
 */
router.get("/available", getAvailableShiftsHandler);

/**
 * HR: create new shift
 * POST /api/shifts
 */
router.post("/", createShift);

/**
 * HR: delete shift
 * DELETE /api/shifts/:id
 */
router.delete("/:id", deleteShift);


module.exports = router;