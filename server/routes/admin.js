const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/email');

// Get all users (Admin only)
router.get('/users', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, role, email, full_name, is_active, created_at, department 
       FROM users 
       WHERE role != 'admin' 
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
});

// Toggle user active status (Admin only)
router.put('/users/:id/status', verifyToken, verifyRole(['admin']), async (req, res) => {
  const userId = req.params.id;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active must be a boolean.' });
  }

  try {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ? AND role != "admin"', [is_active, userId]);
    res.json({ message: `User status updated to ${is_active ? 'active' : 'inactive'}.` });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error updating user status.' });
  }
});

// Get Admin KPI Dashboard Stats
router.get('/stats', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [userCounts] = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE role != 'admin' 
      GROUP BY role
    `);
    
    const [appointmentCounts] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `);

    res.json({
      users: userCounts,
      appointments: appointmentCounts
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error fetching stats.' });
  }
});

// Get system settings
router.get('/settings', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error fetching settings.' });
  }
});

// Toggle maintenance mode
router.put('/settings/maintenance', verifyToken, verifyRole(['admin']), async (req, res) => {
  const { maintenance_mode } = req.body; // should be a boolean or 'true'/'false' string
  
  if (maintenance_mode === undefined) {
    return res.status(400).json({ message: 'maintenance_mode is required.' });
  }

  const value = String(maintenance_mode) === 'true' ? 'true' : 'false';

  try {
    await pool.query(
      'UPDATE system_settings SET setting_value = ? WHERE setting_key = "maintenance_mode"',
      [value]
    );
    res.json({ message: `Maintenance mode is now ${value === 'true' ? 'ON' : 'OFF'}.` });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    res.status(500).json({ message: 'Server error updating maintenance mode.' });
  }
});

// Get all pending registration requests (Admin only)
router.get('/registration-requests', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [requests] = await pool.query(
      'SELECT id, full_name, email, role, id_number, message, created_at FROM registration_requests WHERE status = "pending" ORDER BY created_at DESC'
    );
    res.json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    res.status(500).json({ message: 'Server error fetching verification requests.' });
  }
});

// Approve registration request (Admin only)
router.post('/registration-requests/:id/approve', verifyToken, verifyRole(['admin']), async (req, res) => {
  const requestId = req.params.id;

  try {
    // 1. Get request details
    const [requests] = await pool.query('SELECT * FROM registration_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Verification request not found.' });
    }

    const request = requests[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    // 2. Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [request.email]);
    if (existingUsers.length > 0) {
      await pool.query('UPDATE registration_requests SET status = "rejected" WHERE id = ?', [requestId]);
      return res.status(400).json({ message: 'User already exists. Auto-rejecting this request.' });
    }

    // 3. Create password hash for "123456"
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('123456', salt);

    // 4. Insert user into users table
    await pool.query(
      `INSERT INTO users (role, email, password_hash, full_name, student_id_number, is_active)
       VALUES (?, ?, ?, ?, ?, true)`,
      [
        request.role,
        request.email,
        password_hash,
        request.full_name,
        request.role === 'student' ? request.id_number : null
      ]
    );

    // 5. Update request status to approved
    await pool.query('UPDATE registration_requests SET status = "approved" WHERE id = ?', [requestId]);

    // 6. Send welcome email to user
    const subject = 'Your BoostMe Registration Request is Approved!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">Welcome to BoostMe!</h2>
        <p>Hello ${request.full_name},</p>
        <p>We are pleased to inform you that your manual registration request has been <strong>approved</strong> by the administrator.</p>
        <p>You can now log in to the platform with the credentials below:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Login URL:</strong> <a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
          <p style="margin: 5px 0 0 0;"><strong>Username / Email:</strong> ${request.email}</p>
          <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">123456</code></p>
        </div>
        <p style="color: #ef4444; font-weight: bold;">⚠️ IMPORTANT SECURITY NOTICE:</p>
        <p>For your account security, please complete the following steps immediately after logging in:</p>
        <ol>
          <li>Go to your <strong>Profile Tab</strong>.</li>
          <li>Change your password to a strong, secure one.</li>
          <li>Review and update your personal details (like your department, semester, or course list) to ensure all data is accurate.</li>
        </ol>
        <p>Thank you for joining BoostMe!</p>
        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">This is an automated system email. Please do not reply directly to this message.</p>
      </div>
    `;
    
    // Fire-and-forget email sending
    sendEmail(request.email, subject, html).catch(err => {
      console.error('Failed to send approval email:', err);
    });

    res.json({ message: 'Registration request approved successfully. User account created.' });
  } catch (error) {
    console.error('Error approving registration request:', error);
    res.status(500).json({ message: 'Server error approving request.' });
  }
});

// Reject registration request (Admin only)
router.post('/registration-requests/:id/reject', verifyToken, verifyRole(['admin']), async (req, res) => {
  const requestId = req.params.id;

  try {
    const [requests] = await pool.query('SELECT * FROM registration_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Verification request not found.' });
    }

    const request = requests[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    // Update request status to rejected
    await pool.query('UPDATE registration_requests SET status = "rejected" WHERE id = ?', [requestId]);

    // Send rejection email to user
    const subject = 'Regarding Your BoostMe Registration Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #dc2626;">BoostMe Registration Request Update</h2>
        <p>Hello ${request.full_name},</p>
        <p>We are writing to inform you that your manual registration request has been reviewed by the administrator and unfortunately could <strong>not</strong> be approved at this time.</p>
        <p>Please double-check that your details (such as your student/staff ID) are correct and that you are using a valid UTAR student or staff email address. You may try submitting another request or contact system support if you believe this is an error.</p>
        <p>Thank you for your patience.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">This is an automated system email. Please do not reply directly to this message.</p>
      </div>
    `;

    sendEmail(request.email, subject, html).catch(err => {
      console.error('Failed to send rejection email:', err);
    });

    res.json({ message: 'Registration request rejected successfully.' });
  } catch (error) {
    console.error('Error rejecting registration request:', error);
    res.status(500).json({ message: 'Server error rejecting request.' });
  }
});

module.exports = router;
