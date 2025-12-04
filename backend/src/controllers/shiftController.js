// backend/src/controllers/shiftController.js
const {
  createShift,
  getShiftsForUser,
  getAvailableShifts,
  getAllShifts,
  updateShiftStatus,
} = require("../models/shiftModel");

/**
 * HR: create a new shift.
 * Body:
 * {
 *   description: string (required)
 *   departmentId?: number
 *   startTime?: string (ISO timestamp) | null
 *   endTime?: string (ISO timestamp) | null
 *   location?: string
 *   assignedToId?: number   // users.id
 *   createdBy?: number      // HR user id (for now passed in body)
 *   status?: "AVAILABLE" | "ASSIGNED" | "COMPLETED" | "CANCELLED"
 * }
 */
async function createShiftHandler(req, res) {
  try {
    const {
      description,
      departmentId,
      startTime,
      endTime,
      location,
      assignedToId,
      createdBy,
      status,
    } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const shift = await createShift({
      description,
      departmentId: departmentId || null,
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      assignedToId: assignedToId || null,
      createdBy: createdBy || null,
      status: status || null,
    });

    return res.status(201).json({ shift });
  } catch (err) {
    console.error("createShiftHandler error:", err);
    return res.status(500).json({ message: "Failed to create shift" });
  }
}

/**
 * Employee: get their own assigned shifts.
 * GET /api/shifts/user/:userId
 */
async function getUserShiftsHandler(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId parameter" });
    }

    const shifts = await getShiftsForUser(userId);
    return res.json({ shifts });
  } catch (err) {
    console.error("getUserShiftsHandler error:", err);
    return res.status(500).json({ message: "Failed to fetch user shifts" });
  }
}

/**
 * Get all AVAILABLE shifts.
 * GET /api/shifts/available
 */
async function getAvailableShiftsHandler(req, res) {
  try {
    const shifts = await getAvailableShifts();
    return res.json({ shifts });
  } catch (err) {
    console.error("getAvailableShiftsHandler error:", err);
    return res.status(500).json({ message: "Failed to fetch available shifts" });
  }
}

/**
 * HR: get ALL shifts (regardless of status).
 * GET /api/shifts
 */
async function getAllShiftsHandler(req, res) {
  try {
    const shifts = await getAllShifts();
    return res.json({ shifts });
  } catch (err) {
    console.error("getAllShiftsHandler error:", err);
    return res.status(500).json({ message: "Failed to fetch shifts" });
  }
}

/**
 * HR: update a shift's status (and optionally whose shift it is).
 * PATCH /api/shifts/:id/status
 * Body:
 * {
 *   status: "AVAILABLE" | "ASSIGNED" | "COMPLETED" | "CANCELLED",
 *   assignedToId?: number
 * }
 */
async function setShiftStatusHandler(req, res) {
  try {
    const shiftId = parseInt(req.params.id, 10);
    if (!shiftId || Number.isNaN(shiftId)) {
      return res.status(400).json({ message: "Invalid shift id parameter" });
    }

    const { status, assignedToId } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const updated = await updateShiftStatus({
      shiftId,
      status,
      assignedToId: assignedToId || null,
    });

    if (!updated) {
      return res.status(404).json({ message: "Shift not found" });
    }

    return res.json({ shift: updated });
  } catch (err) {
    console.error("setShiftStatusHandler error:", err);
    if (err.message === "Invalid shift status") {
      return res.status(400).json({ message: "Invalid shift status" });
    }
    return res.status(500).json({ message: "Failed to update shift status" });
  }
}

module.exports = {
  createShiftHandler,
  getUserShiftsHandler,
  getAvailableShiftsHandler,
  getAllShiftsHandler,
  setShiftStatusHandler,
};