const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get all active announcements (Public to logged in users)
router.get('/', verifyToken, async (req, res) => {
  try {
    let condition = 'is_active = TRUE';
    if (req.user.role === 'student') condition += ' AND target_students = TRUE';
    else if (req.user.role === 'lecturer') condition += ' AND target_lecturers = TRUE';
    else if (req.user.role === 'mentor') condition += ' AND target_mentors = TRUE';

    const [announcements] = await pool.query(
      `SELECT id, title, content, created_at 
       FROM announcements 
       WHERE ${condition}
       ORDER BY created_at DESC`
    );
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error fetching announcements.' });
  }
});

// Get all announcements including inactive (Admin only)
router.get('/all', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [announcements] = await pool.query(
      `SELECT a.*, u.full_name as author 
       FROM announcements a
       JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC`
    );
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ message: 'Server error fetching announcements.' });
  }
});

// Create announcement (Admin only)
router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  const { title, content, target_students = true, target_lecturers = true, target_mentors = true } = req.body;
  const adminId = req.user.userId;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (admin_id, title, content, target_students, target_lecturers, target_mentors) VALUES (?, ?, ?, ?, ?, ?)',
      [adminId, title, content, target_students, target_lecturers, target_mentors]
    );
    res.status(201).json({ id: result.insertId, title, content });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error creating announcement.' });
  }
});

// Toggle announcement active status (Admin only)
router.put('/:id/status', verifyToken, verifyRole(['admin']), async (req, res) => {
  const { is_active } = req.body;
  const announcementId = req.params.id;

  try {
    await pool.query('UPDATE announcements SET is_active = ? WHERE id = ?', [is_active, announcementId]);
    res.json({ message: 'Announcement status updated.' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Server error updating announcement.' });
  }
});

// Delete announcement (Admin only)
router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  const announcementId = req.params.id;

  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [announcementId]);
    res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error deleting announcement.' });
  }
});

module.exports = router;
