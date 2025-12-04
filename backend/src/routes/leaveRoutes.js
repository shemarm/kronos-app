// backend/src/routes/leaveRoutes.js
const express = require("express");

const {
  submitLeaveRequest,
  getUserLeaveRequests,
  getAllLeave,
  getLeaveByStatus,
  setLeaveStatus,
} = require("../controllers/leaveController");

const router = express.Router();

/**
 * Employee endpoints
 */

// Employee: submit a new leave request
router.post("/", submitLeaveRequest);

// Employee: get their own leave requests
router.get("/user/:userId", getUserLeaveRequests);

/**
 * HR endpoints (backend ready; frontend later)
 * In the future, you should protect these with middleware that checks
 * the logged-in user's role_id (2 = HR in your setup).
 */

// HR: get ALL leave requests
router.get("/", getAllLeave);

// HR: get leave by status, e.g. /api/leave/status/PENDING
router.get("/status/:status", getLeaveByStatus);

// HR: approve/reject/reset a leave request
// PATCH /api/leave/:id/status
// Body: { status: "APPROVED" | "REJECTED" | "PENDING", approverId: <users.id> }
router.patch("/:id/status", setLeaveStatus);

module.exports = router;