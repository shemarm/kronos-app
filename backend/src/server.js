// backend/src/server.js
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./db");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const userRoutes = require("./routes/userRoutes");
const shiftRequestRoutes = require("./routes/shiftRequestRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json()); // to parse JSON bodies

// Static files (HTML, CSS, JS)
const publicPath = path.join(__dirname, "..", "..", "public");
app.use(express.static(publicPath));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "error", db: "not_connected" });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shift-requests', shiftRequestRoutes);

// Default route -> login page
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "kronos_dashboard.html"));
});


// Error handler (must be last)
// app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`KRONOS backend running on http://localhost:${PORT}`);
});