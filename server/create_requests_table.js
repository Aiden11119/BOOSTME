require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS registration_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role ENUM('student', 'lecturer', 'mentor') NOT NULL,
        id_number VARCHAR(50) NOT NULL,
        message TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createTableQuery);
    console.log('Successfully created registration_requests table.');
  } catch (err) {
    console.error('Error during migration:', err);
  }
  process.exit(0);
}

migrate();
