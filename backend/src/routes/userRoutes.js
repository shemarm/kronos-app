// backend/src/routes/userRoutes.js
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

/**
 * GET /api/users/employees
 * Returns all non-HR employees for HR dropdowns & reports.
 * (Assumes role_id = 1 = staff, role_id = 2 = HR)
 */
router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        first_name,
        last_name,
        role_id,
        department_id
      FROM users
      WHERE role_id = 1
      ORDER BY first_name, last_name, user_id
      `
    );

    return res.json({
      employees: result.rows,
    });
  } catch (err) {
    console.error("GET /api/users/employees error:", err);
    return res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
});

module.exports = router;