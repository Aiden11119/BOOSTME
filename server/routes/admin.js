const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

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

module.exports = router;
