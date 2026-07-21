require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seedAdmin() {
  try {
    const adminEmail = 'admin@boostme.com';
    const adminPassword = 'password123';
    
    // Check if admin already exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
    
    if (rows.length > 0) {
      console.log(`Admin user ${adminEmail} already exists.`);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      
      // Insert admin
      await pool.query(
        `INSERT INTO users (role, email, password_hash, full_name) 
         VALUES (?, ?, ?, ?)`,
        ['admin', adminEmail, passwordHash, 'Super Admin']
      );
      
      console.log(`Successfully created admin user: ${adminEmail} with password: ${adminPassword}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
