const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed.'), false);
    }
  }
});

// Register User
router.post('/register', upload.single('avatar'), async (req, res) => {
  const { 
    role, email, password, avatar_url,
    // Student fields
    student_id_number, department, semester, age, gender, family_income_level,
    // Mentor fields
    specialty_description, full_name,
    // Lecturer fields
    courses
  } = req.body;

  // If a file was uploaded, use its path as avatar_url
  let finalAvatarUrl = avatar_url;
  if (req.file) {
    finalAvatarUrl = `/uploads/avatars/${req.file.filename}`;
  }

  let coursesList = [];
  if (role === 'lecturer' && courses) {
    try {
      coursesList = JSON.parse(courses);
    } catch (e) {
      if (typeof courses === 'string') {
        coursesList = courses.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(courses)) {
        coursesList = courses;
      }
    }
  }

  // Only allow UTAR email addresses (must end with utar.my)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || !email.toLowerCase().endsWith('utar.my')) {
    return res.status(400).json({ message: 'A valid UTAR email address (ending with utar.my) is required.' });
  }

  // Only allow valid roles — prevent registering as admin
  const allowedRoles = ['student', 'lecturer', 'mentor'];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be student, lecturer, or mentor.' });
  }

  // Validate full_name
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }

  // Validate password length
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if user exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(`
      INSERT INTO users (
        role, email, password_hash, full_name, avatar_url,
        student_id_number, department, semester, age, gender, family_income_level,
        specialty_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      role, email, password_hash, full_name, finalAvatarUrl || null,
      student_id_number || null, department || null, semester || null, 
      age || null, gender || null, family_income_level || null,
      specialty_description || null
    ]);

    // Insert lecturer courses
    if (role === 'lecturer' && coursesList.length > 0) {
      for (const course of coursesList) {
        await pool.query('INSERT IGNORE INTO lecturer_courses (lecturer_id, course_name) VALUES (?, ?)', [result.insertId, course]);
      }
    }

    // Generate JWT for auto-login
    const payload = { userId: result.insertId, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: {
        id: result.insertId,
        role,
        full_name,
        email,
        avatar_url: finalAvatarUrl,
        department,
        semester,
        student_id_number,
        specialty_description,
        courses: coursesList
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

const sendEmail = require('../utils/email');

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  // Only allow UTAR email addresses (must end with utar.my)
  if (!email.toLowerCase().endsWith('utar.my')) {
    return res.status(400).json({ message: 'Only UTAR email addresses (ending with utar.my) are allowed to register.' });
  }
  
  try {
    // Check if email already used (we do it here to prevent sending OTP if email exists)
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email already exists in the database. Please use a different one.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Valid for 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60000); 

    // Delete any old OTPs for this email to prevent spam issues
    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    // Insert new OTP
    await pool.query('INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)', [email, otpCode, expiresAt]);

    // Send the email
    const subject = 'Your BoostMe Registration Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>BoostMe Registration</h2>
        <p>Your verification code is: <strong>${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    const emailSent = await sendEmail(email, subject, html);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }

    return res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ message: 'Server error sending verification code' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp_code } = req.body;
  if (!email || !otp_code) return res.status(400).json({ message: 'Email and verification code are required.' });

  try {
    const [otps] = await pool.query('SELECT * FROM otps WHERE email = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1', [email, otp_code]);
    
    if (otps.length === 0) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    const otpRecord = otps[0];
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Optionally delete OTP so it can't be reused, but we will leave it for now or delete it during successful registration
    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    return res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ message: 'Server error verifying code' });
  }
});

// Forgot Password - Request OTP
router.post('/forgot-password-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  
  try {
    // Check if email exists
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Email not registered. Please check the email address or register a new account.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Valid for 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60000); 

    // Delete any old OTPs for this email
    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    // Insert new OTP
    await pool.query('INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)', [email, otpCode, expiresAt]);

    // Send the email
    const subject = 'Your BoostMe Password Reset Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">BoostMe Password Reset</h2>
        <p>You requested a password reset. Your verification code is: <strong style="font-size: 24px; color: #2563eb; letter-spacing: 2px;">${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    `;

    const emailSent = await sendEmail(email, subject, html);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }

    return res.json({ message: 'Password reset code sent to your email.' });
  } catch (err) {
    console.error('Forgot Password OTP Error:', err);
    return res.status(500).json({ message: 'Server error sending verification code' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp_code, new_password, confirm_password } = req.body;
  
  if (!email || !otp_code || !new_password || !confirm_password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // 1. Verify OTP
    const [otps] = await pool.query('SELECT * FROM otps WHERE email = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1', [email, otp_code]);
    
    if (otps.length === 0) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    const otpRecord = otps[0];
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // 3. Update password in users table
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, email]);

    // 4. Delete OTP so it cannot be reused
    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    return res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });

  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ message: 'Server error resetting password' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check Maintenance Mode
    const [settings] = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = \'maintenance_mode\'');
    const isMaintenance = settings.length > 0 && settings[0].setting_value === 'true';
    if (isMaintenance && user.role !== 'admin') {
      return res.status(503).json({ 
        message: 'The system is undergoing maintenance. Please try again later.' 
      });
    }

    // Check if user is active
    if (user.is_active === 0) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Fetch courses if role is lecturer
    let courses = [];
    if (user.role === 'lecturer') {
      const [coursesRows] = await pool.query('SELECT course_name FROM lecturer_courses WHERE lecturer_id = ?', [user.id]);
      courses = coursesRows.map(r => r.course_name);
    }

    // Generate JWT
    const payload = {
      userId: user.id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        department: user.department,
        semester: user.semester,
        student_id_number: user.student_id_number,
        specialty_description: user.specialty_description,
        courses
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET Profile — returns full user data for logged-in user (any role)
router.get('/profile', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const [rows] = await pool.query(
      `SELECT id, role, full_name, email, avatar_url,
              student_id_number, department, semester, age, gender, family_income_level,
              specialty_description, created_at
       FROM users WHERE id = ?`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = rows[0];
    if (user.role === 'lecturer') {
      const [coursesRows] = await pool.query('SELECT course_name FROM lecturer_courses WHERE lecturer_id = ?', [userId]);
      user.courses = coursesRows.map(r => r.course_name);
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// PUT Profile — update editable fields based on role (email always read-only)
router.put('/profile', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    let query = '';
    let params = [];

    if (role === 'student') {
      const { full_name, department, semester, age, gender, family_income_level } = req.body;
      query = `UPDATE users SET full_name=?, department=?, semester=?, age=?, gender=?, family_income_level=? WHERE id=?`;
      params = [full_name, department, semester, age || null, gender, family_income_level, userId];
      await pool.query(query, params);
    } else if (role === 'lecturer') {
      const { full_name, department, courses } = req.body;
      query = `UPDATE users SET full_name=?, department=? WHERE id=?`;
      params = [full_name, department, userId];
      await pool.query(query, params);

      // Update courses
      await pool.query('DELETE FROM lecturer_courses WHERE lecturer_id = ?', [userId]);
      let coursesList = [];
      if (Array.isArray(courses)) {
        coursesList = courses;
      } else if (typeof courses === 'string') {
        try {
          coursesList = JSON.parse(courses);
        } catch (e) {
          coursesList = courses.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (coursesList.length > 0) {
        for (const course of coursesList) {
          await pool.query('INSERT IGNORE INTO lecturer_courses (lecturer_id, course_name) VALUES (?, ?)', [userId, course]);
        }
      }
    } else if (role === 'mentor') {
      const { full_name, specialty_description } = req.body;
      query = `UPDATE users SET full_name=?, specialty_description=? WHERE id=?`;
      params = [full_name, specialty_description, userId];
      await pool.query(query, params);
    } else {
      return res.status(403).json({ message: 'Unknown role' });
    }

    // Return the updated record so frontend can sync localStorage
    const [rows] = await pool.query(
      `SELECT id, role, full_name, email, avatar_url,
              student_id_number, department, semester, age, gender, family_income_level,
              specialty_description
       FROM users WHERE id = ?`,
      [userId]
    );

    const updatedUser = rows[0];
    if (updatedUser.role === 'lecturer') {
      const [coursesRows] = await pool.query('SELECT course_name FROM lecturer_courses WHERE lecturer_id = ?', [userId]);
      updatedUser.courses = coursesRows.map(r => r.course_name);
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Upload Avatar (for already logged-in users)
router.post('/profile/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  const userId = req.user.userId;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const finalAvatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [finalAvatarUrl, userId]);

    res.json({ message: 'Avatar updated successfully', avatar_url: finalAvatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Server error updating avatar' });
  }
});
// Generic Send Message Email (For Student -> Mentor, Lecturer -> Student)
router.post('/send-message', verifyToken, async (req, res) => {
  const { to_email, subject, message } = req.body;
  
  if (!to_email || !subject || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [senders] = await pool.query('SELECT full_name, email, role FROM users WHERE id = ?', [req.user.userId]);
    if (senders.length === 0) return res.status(404).json({ message: 'Sender not found' });
    const sender = senders[0];

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #2563eb;">Message from ${sender.full_name} (${sender.role})</h2>
        <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; margin-top: 20px; white-space: pre-wrap;">${message}</div>
        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Reply directly to this email to reach ${sender.full_name} at <a href="mailto:${sender.email}">${sender.email}</a>.</p>
      </div>
    `;

    // Fire and forget email for faster UI response. Passes sender's email as replyTo
    sendEmail(to_email, subject, emailHtml, sender.email, sender.full_name).catch(err => console.error('Failed sending generic message email:', err));

    res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Failed to send generic message', err);
    res.status(500).json({ message: 'Server error sending message' });
  }
});
// Change Password (for logged-in users)
router.put('/change-password', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const { current_password, new_password, confirm_new_password } = req.body;

  if (!current_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  if (new_password !== confirm_new_password) {
    return res.status(400).json({ message: 'New passwords do not match.' });
  }

  try {
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change Password Error:', err);
    return res.status(500).json({ message: 'Server error changing password.' });
  }
});

// Submit manual registration verification request
router.post('/submit-registration-request', async (req, res) => {
  const { full_name, email, role, id_number, message } = req.body;

  if (!full_name || !email || !role || !id_number || !message) {
    return res.status(400).json({ message: 'Name, Email, Role, ID Number, and Reason/Message are required.' });
  }

  const allowedRoles = ['student', 'lecturer', 'mentor'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be student, lecturer, or mentor.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || !email.toLowerCase().endsWith('utar.my')) {
    return res.status(400).json({ message: 'A valid UTAR email address (ending with utar.my) is required.' });
  }

  try {
    // Check if user already exists in users table
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'An account already exists with this email address. Please use the login page.' });
    }

    // Check if a pending request exists
    const [existingRequests] = await pool.query(
      'SELECT id, status FROM registration_requests WHERE email = ? AND status = \'pending\'',
      [email]
    );

    if (existingRequests.length > 0) {
      const existing = existingRequests[0];
      // Update the existing pending request with the latest details and update the submission timestamp
      await pool.query(
        `UPDATE registration_requests 
         SET full_name = ?, role = ?, id_number = ?, message = ?, created_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [full_name.trim(), role, id_number.trim(), message.trim(), existing.id]
      );
      return res.json({ message: 'Your existing verification request has been updated with the latest details.' });
    }

    // Insert new request
    await pool.query(
      `INSERT INTO registration_requests (full_name, email, role, id_number, message, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [full_name.trim(), email.trim().toLowerCase(), role, id_number.trim(), message.trim()]
    );

    return res.status(201).json({ message: 'Verification request submitted successfully. An Admin will review it shortly.' });
  } catch (err) {
    console.error('Submit Registration Request Error:', err);
    return res.status(500).json({ message: 'Server error submitting verification request.' });
  }
});

// Submit manual password reset verification request
router.post('/submit-reset-request', async (req, res) => {
  const { email, id_number, message } = req.body;

  if (!email || !id_number || !message) {
    return res.status(400).json({ message: 'Email, ID Number, and Reason/Message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || !email.toLowerCase().endsWith('utar.my')) {
    return res.status(400).json({ message: 'A valid UTAR email address (ending with utar.my) is required.' });
  }

  try {
    // 1. Verify user exists
    const [existingUsers] = await pool.query(
      'SELECT full_name, role, student_id_number FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existingUsers.length === 0) {
      return res.status(400).json({ message: 'No account exists with this email address. Please register first.' });
    }

    const user = existingUsers[0];

    // 2. Validate Student ID matches if role is student
    if (user.role === 'student' && user.student_id_number) {
      if (user.student_id_number.trim().toLowerCase() !== id_number.trim().toLowerCase()) {
        return res.status(400).json({ message: 'The student ID number does not match our records.' });
      }
    }

    // 3. Check for existing pending reset request
    const [existingRequests] = await pool.query(
      'SELECT id FROM registration_requests WHERE email = ? AND request_type = \'reset_password\' AND status = \'pending\'',
      [email.trim().toLowerCase()]
    );

    if (existingRequests.length > 0) {
      const existing = existingRequests[0];
      // Update existing pending reset request
      await pool.query(
        `UPDATE registration_requests 
         SET full_name = ?, id_number = ?, message = ?, created_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [user.full_name, id_number.trim(), message.trim(), existing.id]
      );
      return res.json({ message: 'Your existing password reset request has been updated with the latest details.' });
    }

    // 4. Insert new reset request
    await pool.query(
      `INSERT INTO registration_requests (full_name, email, role, id_number, message, request_type, status)
       VALUES (?, ?, ?, ?, ?, 'reset_password', 'pending')`,
      [user.full_name, email.trim().toLowerCase(), user.role, id_number.trim(), message.trim()]
    );

    return res.status(201).json({ message: 'Password reset request submitted successfully. An Admin will review it shortly.' });
  } catch (err) {
    console.error('Submit Reset Request Error:', err);
    return res.status(500).json({ message: 'Server error submitting password reset request.' });
  }
});

module.exports = router;
