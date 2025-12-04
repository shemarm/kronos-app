// backend/src/controllers/leaveController.js
const {
  createLeaveRequest,
  getLeaveRequestsByUser,
  getAllLeaveRequests,
  getLeaveRequestsByStatus,
  updateLeaveStatus,
} = require("../models/leaveModel");

/**
 * Employee: submit a new leave request.
 */
async function submitLeaveRequest(req, res) {
  try {
    const { userId, fromDate, toDate, reason } = req.body;

    if (!userId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        message: "userId, fromDate, toDate and reason are required",
      });
    }

    const leave = await createLeaveRequest({
      userId,
      fromDate,
      toDate,
      reason,
    });

    return res.status(201).json({ leave });
  } catch (err) {
    console.error("submitLeaveRequest error:", err);
    return res.status(500).json({
      message: "Failed to submit leave request",
    });
  }
}

/**
 * Employee: get their own leave requests.
 */
async function getUserLeaveRequests(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId parameter" });
    }

    const leaves = await getLeaveRequestsByUser(userId);

    return res.json({ leaves });
  } catch (err) {
    console.error("getUserLeaveRequests error:", err);
    return res.status(500).json({
      message: "Failed to fetch leave requests for user",
    });
  }
}

/**
 * HR: get ALL leave requests (with user + approver info).
 * Protect this with auth middleware checking role_id.
 */
async function getAllLeave(req, res) {
  try {
    const leaves = await getAllLeaveRequests();
    return res.json({ leaves });
  } catch (err) {
    console.error("getAllLeave error:", err);
    return res.status(500).json({
      message: "Failed to fetch leave requests",
    });
  }
}

/**
 * HR: get leave requests filtered by status (PENDING / APPROVED / REJECTED).
 */
async function getLeaveByStatus(req, res) {
  try {
    const status = (req.params.status || "").toUpperCase();
    if (!status) {
      return res
        .status(400)
        .json({ message: "Status parameter is required" });
    }

    const leaves = await getLeaveRequestsByStatus(status);
    return res.json({ leaves });
  } catch (err) {
    console.error("getLeaveByStatus error:", err);
    if (err.message === "Invalid status filter") {
      return res.status(400).json({ message: "Invalid status filter" });
    }
    return res.status(500).json({
      message: "Failed to fetch leave requests by status",
    });
  }
}

/**
 * HR: update status of a leave request (APPROVED / REJECTED / PENDING).
 * Body: { status, approverId }
 */
async function setLeaveStatus(req, res) {
  try {
    const leaveId = parseInt(req.params.id, 10);
    if (!leaveId || Number.isNaN(leaveId)) {
      return res
        .status(400)
        .json({ message: "Invalid leave id parameter" });
    }

    const { status, approverId } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const statusUpper = status.toUpperCase();

    // For APPROVED / REJECTED we expect approverId
    if (
      (statusUpper === "APPROVED" || statusUpper === "REJECTED") &&
      !approverId
    ) {
      return res.status(400).json({
        message: "approverId is required for APPROVED/REJECTED",
      });
    }

    const updated = await updateLeaveStatus({
      leaveId,
      status: statusUpper,
      approverId: approverId || null,
    });

    if (!updated) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    return res.json({ leave: updated });
  } catch (err) {
    console.error("setLeaveStatus error:", err);
    if (err.message === "Invalid status value") {
      return res.status(400).json({ message: "Invalid status value" });
    }
    return res.status(500).json({
      message: "Failed to update leave status",
    });
  }
}

module.exports = {
  submitLeaveRequest,
  getUserLeaveRequests,
  getAllLeave,
  getLeaveByStatus,
  setLeaveStatus,
};