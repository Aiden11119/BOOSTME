require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    const alterQuery = `
      ALTER TABLE registration_requests 
      ADD COLUMN request_type ENUM('register', 'reset_password') DEFAULT 'register' AFTER role
    `;
    await pool.query(alterQuery);
    console.log('Successfully altered registration_requests table to add request_type.');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN' || err.message.includes('Multiple columns')) {
      console.log('Column request_type already exists.');
    } else {
      console.error('Error during migration:', err);
    }
  }
  process.exit(0);
}

migrate();
