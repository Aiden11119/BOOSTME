require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE announcements ADD COLUMN target_students BOOLEAN DEFAULT TRUE');
    await pool.query('ALTER TABLE announcements ADD COLUMN target_lecturers BOOLEAN DEFAULT TRUE');
    await pool.query('ALTER TABLE announcements ADD COLUMN target_mentors BOOLEAN DEFAULT TRUE');
    console.log('Successfully altered announcements table.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Error during migration:', err);
    }
  }
  process.exit(0);
}

migrate();
