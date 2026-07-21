require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seedOldStudent() {
  try {
    const email = 'oldstudent@boostme.com';
    const password = 'password123';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Date from 6 years ago
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
    
    // Insert old student
    await pool.query(
      `INSERT INTO users (role, email, password_hash, full_name, created_at, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['student', email, passwordHash, 'Test Old Student', sixYearsAgo, true]
    );
    
    console.log(`Successfully created old student user: ${email} with join date ${sixYearsAgo.toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding old student:', error);
    process.exit(1);
  }
}

seedOldStudent();
