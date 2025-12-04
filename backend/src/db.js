const { Pool } = require("pg");
require("dotenv").config();

// If Render is being used → DATABASE_URL will exist
// If running locally → fall back to individual DB_* variables
const isProd = !!process.env.DATABASE_URL;

let pool;

if (isProd) {
  // Render Postgres connection
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required by Render
    },
  });
} else {
  // Local Postgres connection (your current settings)
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL client error", err);
  process.exit(-1);
});

async function testConnection() {
  const res = await pool.query("SELECT 1");
  return res.rows[0];
}

module.exports = {
  pool,
  testConnection,
};
