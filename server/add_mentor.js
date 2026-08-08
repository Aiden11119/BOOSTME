const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function updateMentor() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await pool.query(
      `UPDATE users SET role = 'mentor', password_hash = ? WHERE email = ?`,
      [hashedPassword, 'ting@1utar.my']
    );
    console.log('Mentor updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating mentor:', err);
    process.exit(1);
  }
}

updateMentor();
