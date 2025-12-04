// backend/src/controllers/shiftRequestController.js
const {
  createShiftRequest,
  getShiftRequestsByUser,
  getAllShiftRequests,
  updateShiftRequestStatus,
} = require("../models/shiftRequestModel");

/**
 * Employee: submit a new shift request.
 * Body:
 * {
 *   userId: number (users.id),
 *   shiftId: number,
 *   requestType: "TRADE" | "PICK_UP" | "DROP",
 *   note?: string,
 *   source: "ASSIGNED" | "AVAILABLE"
 * }
 */
async function submitShiftRequest(req, res) {
  try {
    const { userId, shiftId, requestType, note, source } = req.body || {};

    if (!userId || !shiftId || !requestType || !source) {
      return res.status(400).json({
        message: "userId, shiftId, requestType and source are required",
      });
    }

    const shiftReq = await createShiftRequest({
      userId,
      shiftId,
      requestType,
      note,
      source,
    });

    return res.status(201).json({ shiftRequest: shiftReq });
  } catch (err) {
    console.error("submitShiftRequest error:", err);
    return res.status(500).json({ message: "Failed to submit shift request" });
  }
}

/**
 * Employee: get their own shift requests.
 * GET /api/shift-requests/user/:userId
 */
async function getUserShiftRequests(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId parameter" });
    }

    const requests = await getShiftRequestsByUser(userId);
    return res.json({ shiftRequests: requests });
  } catch (err) {
    console.error("getUserShiftRequests error:", err);
    return res.status(500).json({
      message: "Failed to fetch shift requests for user",
    });
  }
}

/**
 * HR: get ALL shift requests (with employee + approver info).
 * GET /api/shift-requests
 */
async function getAllShiftRequestsHandler(req, res) {
  try {
    const requests = await getAllShiftRequests();
    return res.json({ shiftRequests: requests });
  } catch (err) {
    console.error("getAllShiftRequestsHandler error:", err);
    return res.status(500).json({ message: "Failed to fetch shift requests" });
  }
}

/**
 * HR: approve / reject / reset a shift request.
 * PATCH /api/shift-requests/:id/status
 * Body: { status: "APPROVED" | "REJECTED" | "PENDING", approverId?: number }
 */
async function setShiftRequestStatus(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (!requestId || Number.isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request id parameter" });
    }

    const { status, approverId } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const statusUpper = status.toUpperCase();
    if ((statusUpper === "APPROVED" || statusUpper === "REJECTED") && !approverId) {
      return res
        .status(400)
        .json({ message: "approverId is required for APPROVED/REJECTED" });
    }

    const updated = await updateShiftRequestStatus({
      requestId,
      status: statusUpper,
      approverId: approverId || null,
    });

    if (!updated) {
      return res.status(404).json({ message: "Shift request not found" });
    }

    return res.json({ shiftRequest: updated });
  } catch (err) {
    console.error("setShiftRequestStatus error:", err);
    if (err.message === "Invalid shift request status") {
      return res.status(400).json({ message: "Invalid shift request status" });
    }
    return res.status(500).json({ message: "Failed to update shift request status" });
  }
}

module.exports = {
  submitShiftRequest,
  getUserShiftRequests,
  getAllShiftRequestsHandler,
  setShiftRequestStatus,
};