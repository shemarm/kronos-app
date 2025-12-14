// backend/src/controllers/shiftController.js
const {
  getShiftsForUser,
  getAvailableShifts,
  createShift: createShiftModel,
  updateShiftStatus,
  deleteShift: deleteShiftModel,
} = require("../models/shiftModel");

/**
 * Get shifts assigned to a specific user.
 * GET /api/shifts/user/:userId
 */
async function getUserShifts(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const shifts = await getShiftsForUser(userId);
    return res.json({ shifts });
  } catch (err) {
    console.error("getUserShifts error:", err);
    return res.status(500).json({ message: "Failed to fetch user shifts" });
  }
}

/**
 * Get all AVAILABLE shifts.
 * GET /api/shifts/available?userId=1
 */
async function getAvailableShiftsHandler(req, res) {
  try {
    const userIdQuery = req.query.userId ? parseInt(req.query.userId, 10) : null;

    const shifts = await getAvailableShifts(userIdQuery);
    return res.json({ shifts });
  } catch (err) {
    console.error("getAvailableShiftsHandler error:", err);
    return res.status(500).json({ message: "Failed to fetch available shifts" });
  }
}

/**
 * HR: create new shift
 * POST /api/shifts
 * Body: { description, assignedToId (optional), status }
 */
async function createShift(req, res) {
  try {
    const { description, assignedToId, status = "AVAILABLE" } = req.body;
    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "Shift description is required" });
    }

    const shift = await createShiftModel({
      description: description.trim(),
      assignedToId: assignedToId || null,
      status,
      createdBy: req.user?.id || null, // optional, if auth available
    });

    if (!shift) return res.status(500).json({ message: "Failed to create shift" });

    return res.status(201).json({ message: "Shift created successfully", shift });
  } catch (err) {
    console.error("createShift error:", err);
    return res.status(500).json({ message: "Failed to create shift: " + err.message });
  }
}

async function deleteShift(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid shift id" });
    }
    const ok = await deleteShiftModel(id);
    if (!ok) return res.status(404).json({ message: "Shift not found" });
    return res.json({ message: "Shift deleted" });
  } catch (err) {
    console.error("deleteShift error:", err);
    return res.status(500).json({ message: "Failed to delete shift: " + err.message });
  }
}

module.exports = {
  getUserShifts,
  getAvailableShiftsHandler,
  createShift,
  deleteShift,
};