require('dotenv').config();
const pool = require('./config/db');

async function migrateSettings() {
  try {
    // Create system_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default maintenance_mode if not exists
    await pool.query(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value) 
      VALUES ('maintenance_mode', 'false')
    `);

    console.log('Successfully created system_settings table and inserted defaults.');
  } catch (err) {
    console.error('Error during settings migration:', err);
  }
  process.exit(0);
}

migrateSettings();
