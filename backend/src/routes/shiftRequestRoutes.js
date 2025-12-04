// backend/src/routes/shiftRequestRoutes.js
const express = require("express");

const {
  submitShiftRequest,
  getUserShiftRequests,
  getAllShiftRequestsHandler,
  setShiftRequestStatus,
} = require("../controllers/shiftRequestController");

const router = express.Router();

// Employee: submit new shift request
router.post("/", submitShiftRequest);

// Employee: get their own shift requests
router.get("/user/:userId", getUserShiftRequests);

// HR: get ALL shift requests
router.get("/", getAllShiftRequestsHandler);

// HR: approve/reject/reset a shift request
router.patch("/:id/status", setShiftRequestStatus);

module.exports = router;