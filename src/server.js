'use strict';

require('dotenv').config();

// Validate required environment variables at startup
const REQUIRED_ENV = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const app  = require('./app');
const { pool } = require('./db/pool');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function start() {
  // Verify DB connectivity before accepting traffic
  try {
    await pool.query('SELECT 1');
    console.log('✅  PostgreSQL connected');
  } catch (err) {
    console.error('❌  Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully…`);
    server.close(async () => {
      await pool.end();
      console.log('PostgreSQL pool closed. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();
