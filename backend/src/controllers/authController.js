// backend/src/controllers/authController.js
const { findUserByUserId } = require("../models/userModel");

/**
 * POST /api/auth/login
 * Body: { userId: string, password: string }
 */
async function login(req, res, next) {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "userId and password are required." });
    }

    const user = await findUserByUserId(userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // TEMP: plain text comparison (later: use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Build a minimal payload to send back
    const payload = {
      id: user.id,
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      roleId: user.role_id,
      departmentId: user.department_id,
    };

    // Later we can generate a JWT here.
    return res.json({
      message: "Login successful",
      user: payload,
    });
  } catch (err) {
    next(err); // pass to error handler
  }
}

module.exports = {
  login,
};