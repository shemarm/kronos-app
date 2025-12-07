const { getWorkHours } = require("../controllers/workHoursController");

// GET /api/attendance/user/:id/hours
router.get("/user/:id/hours", getWorkHours);
