const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/email');

// Get all Mentors (Any authenticated user, mostly for Students)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [mentors] = await pool.query(`
      SELECT id, full_name, email, avatar_url, specialty_description 
      FROM users 
      WHERE role = 'mentor'
    `);
    res.json(mentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching mentors' });
  }
});

// GET Mentor Slots (For Students - only unbooked)
router.get('/slots/:mentor_id', verifyToken, async (req, res) => {
  try {
    const [slots] = await pool.query(
      'SELECT appointment_id as slot_id, DATE_FORMAT(appointment_date, "%Y-%m-%d") as slot_date, start_time, end_time FROM appointments WHERE mentor_id = ? AND status = "available" AND student_id IS NULL AND appointment_date >= CURDATE() ORDER BY appointment_date, start_time',
      [req.params.mentor_id]
    );
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching slots' });
  }
});

// GET Day Slots (For Mentors)
router.get('/day-slots', verifyToken, verifyRole(['mentor']), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });
    
    const [slots] = await pool.query(
      'SELECT appointment_id, mentor_id, student_id, DATE_FORMAT(appointment_date, "%Y-%m-%d") as appointment_date, start_time, end_time, status, created_at FROM appointments WHERE mentor_id = ? AND appointment_date = ? ORDER BY start_time',
      [req.user.userId, date]
    );
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching day slots' });
  }
});

// Create Slots (Mentor)
router.post('/slots', verifyToken, verifyRole(['mentor']), async (req, res) => {
  const { slot_date, start_time, end_time } = req.body;
  const mentor_id = req.user.userId;

  try {
    // Check if slot already exists for that mentor and time
    const [existing] = await pool.query(
      'SELECT * FROM appointments WHERE mentor_id = ? AND appointment_date = ? AND start_time = ? AND status != "cancelled"',
      [mentor_id, slot_date, start_time]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Slot already exists at this time' });
    }

    const [result] = await pool.query(
      'INSERT INTO appointments (mentor_id, appointment_date, start_time, end_time, status, student_id) VALUES (?, ?, ?, ?, "available", NULL)',
      [mentor_id, slot_date, start_time, end_time]
    );
    res.status(201).json({ message: 'Slot created successfully', appointment_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating slot' });
  }
});

// Delete Slot (Mentor)
router.delete('/slots/:id', verifyToken, verifyRole(['mentor']), async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM appointments WHERE appointment_id = ? AND mentor_id = ? AND status = "available" AND student_id IS NULL',
      [req.params.id, req.user.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slot not found or already booked' });
    }
    res.json({ message: 'Slot deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting slot' });
  }
});

// Book Appointment (Student)
router.post('/book', verifyToken, verifyRole(['student']), async (req, res) => {
  const { mentor_id, appointment_date, start_time, end_time, slot_id } = req.body;
  const student_id = req.user.userId;

  try {
    // If booking via a specific slot
    if (slot_id) {
      const [slots] = await pool.query('SELECT * FROM appointments WHERE appointment_id = ? AND status = "available" AND student_id IS NULL', [slot_id]);
      if (slots.length === 0) {
        return res.status(400).json({ message: 'Slot is no longer available' });
      }
    } else {
      // Legacy Anti-Conflict Logic (if no slot_id provided)
      const [conflicts] = await pool.query(`
        SELECT * FROM appointments 
        WHERE mentor_id = ? 
          AND appointment_date = ? 
          AND status IN ('pending', 'confirmed')
          AND (
            (start_time <= ? AND end_time > ?) OR
            (start_time < ? AND end_time >= ?) OR
            (start_time >= ? AND end_time <= ?)
          )
      `, [mentor_id, appointment_date, start_time, start_time, end_time, end_time, start_time, end_time]);

      if (conflicts.length > 0) {
        return res.status(409).json({ message: 'Time slot is already booked or overlaps' });
      }
    }

    if (slot_id) {
      // Just update it if slot_id is provided
      await pool.query('UPDATE appointments SET student_id = ?, status = "pending" WHERE appointment_id = ?', [student_id, slot_id]);
      res.status(201).json({ message: 'Appointment booked successfully', appointment_id: slot_id });
    } else {
      // Freeform insertion (legacy behavior fallback)
      const [result] = await pool.query(`
        INSERT INTO appointments (mentor_id, student_id, appointment_date, start_time, end_time, status) 
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [mentor_id, student_id, appointment_date, start_time, end_time]);
      res.status(201).json({ message: 'Appointment booked successfully', appointment_id: result.insertId });
    }

    // Send Notification Email to Mentor
    try {
      const [mentors] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [mentor_id]);
      const [students] = await pool.query('SELECT full_name FROM users WHERE id = ?', [student_id]);
      if (mentors.length > 0 && students.length > 0) {
        const mentor = mentors[0];
        const student = students[0];
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Appointment Booked</h2>
            <p>Hello ${mentor.full_name},</p>
            <p>Student <strong>${student.full_name}</strong> has booked an appointment with you for <strong>${new Date(appointment_date).toLocaleDateString()}</strong> from <strong>${start_time}</strong> to <strong>${end_time}</strong>.</p>
            <p>Please check your Mentor Dashboard to confirm or cancel the appointment.</p>
            <p>Thank you.</p>
          </div>
        `;
        sendEmail(mentor.email, 'New Appointment Booking - BoostMe', emailHtml).catch(e => console.error(e));
      }
    } catch (emailErr) {
      console.error('Failed to send booking email to mentor:', emailErr);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error booking appointment' });
  }
});

// Get Mentor's Appointments (Mentor)
router.get('/mentor', verifyToken, verifyRole(['mentor']), async (req, res) => {
  const mentor_id = req.user.userId;

  try {
    const [appointments] = await pool.query(`
      SELECT a.*, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, u.full_name as student_name, u.email as student_email, u.avatar_url, u.student_id_number 
      FROM appointments a
      JOIN users u ON a.student_id = u.id
      WHERE a.mentor_id = ? AND a.status != 'available'
      ORDER BY a.appointment_date ASC, a.start_time ASC
    `, [mentor_id]);

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// Get Student's Appointments (Student)
router.get('/student', verifyToken, verifyRole(['student']), async (req, res) => {
  const student_id = req.user.userId;

  try {
    const [appointments] = await pool.query(`
      SELECT a.*, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, u.full_name as mentor_name, u.email as mentor_email, u.avatar_url 
      FROM appointments a
      JOIN users u ON a.mentor_id = u.id
      WHERE a.student_id = ?
      ORDER BY a.appointment_date ASC, a.start_time ASC
    `, [student_id]);

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching student appointments' });
  }
});

// Update Appointment Status (Mentor)
router.put('/:id/status', verifyToken, verifyRole(['mentor']), async (req, res) => {
  const appointment_id = req.params.id;
  const { status } = req.body; // 'confirmed', 'cancelled'
  const mentor_id = req.user.userId;

  try {
    // We fetch details for the email before we update status (though we could do it after)
    let studentToNotify = null;
    let appointmentDetails = null;
    let mentorName = '';
    
    if (status === 'cancelled') {
        const [appts] = await pool.query('SELECT student_id, appointment_date, start_time FROM appointments WHERE appointment_id = ? AND mentor_id = ? AND student_id IS NOT NULL', [appointment_id, mentor_id]);
        if (appts.length > 0) {
            appointmentDetails = appts[0];
            const [students] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [appointmentDetails.student_id]);
            const [mentors] = await pool.query('SELECT full_name FROM users WHERE id = ?', [mentor_id]);
            if (students.length > 0 && mentors.length > 0) {
               studentToNotify = students[0];
               mentorName = mentors[0].full_name;
            }
        }
    }

    const [result] = await pool.query(`
      UPDATE appointments 
      SET status = ? 
      WHERE appointment_id = ? AND mentor_id = ?
    `, [status, appointment_id, mentor_id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Appointment not found or unauthorized' });

    // Send Cancellation Email to Student
    if (status === 'cancelled' && studentToNotify && appointmentDetails) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Appointment Cancelled</h2>
            <p>Hello ${studentToNotify.full_name},</p>
            <p>Your appointment with Mentor <strong>${mentorName}</strong> on <strong>${new Date(appointmentDetails.appointment_date).toLocaleDateString()}</strong> at <strong>${appointmentDetails.start_time}</strong> has been cancelled by the mentor.</p>
            <p>Please log in to your dashboard to book a new appointment if needed.</p>
          </div>
        `;
        sendEmail(studentToNotify.email, 'Appointment Cancelled - BoostMe', emailHtml).catch(e => console.error(e));
    }

    res.json({ message: `Appointment ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating appointment' });
  }
});

// Cancel Appointment (Student)
router.put('/:id/cancel-student', verifyToken, verifyRole(['student']), async (req, res) => {
  const appointment_id = req.params.id;
  const student_id = req.user.userId;

  try {
    const [appts] = await pool.query('SELECT mentor_id, appointment_date, start_time FROM appointments WHERE appointment_id = ? AND student_id = ?', [appointment_id, student_id]);
    
    const [result] = await pool.query(`
      UPDATE appointments 
      SET status = 'available', student_id = NULL 
      WHERE appointment_id = ? AND student_id = ?
    `, [appointment_id, student_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized' });
    }

    // Send Email to Mentor about Cancellation
    if (appts.length > 0) {
        try {
            const { mentor_id, appointment_date, start_time } = appts[0];
            const [mentors] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [mentor_id]);
            const [students] = await pool.query('SELECT full_name FROM users WHERE id = ?', [student_id]);
            if (mentors.length > 0 && students.length > 0) {
                const mentor = mentors[0];
                const student = students[0];
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Appointment Cancelled by Student</h2>
                    <p>Hello ${mentor.full_name},</p>
                    <p>Student <strong>${student.full_name}</strong> has cancelled their appointment on <strong>${new Date(appointment_date).toLocaleDateString()}</strong> at <strong>${start_time}</strong>.</p>
                    <p>Your calendar slot has been marked as available again.</p>
                  </div>
                `;
                sendEmail(mentor.email, 'Appointment Cancelled - BoostMe', emailHtml).catch(e => console.error(e));
            }
        } catch (emailErr) {
            console.error('Failed to send cancellation email:', emailErr);
        }
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
});

// Update Mentor Profile (Mentor)
router.put('/profile', verifyToken, verifyRole(['mentor']), async (req, res) => {
  const mentor_id = req.user.userId;
  const { specialty_description } = req.body;

  try {
    await pool.query('UPDATE users SET specialty_description = ? WHERE id = ?', [specialty_description, mentor_id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
