const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const axios = require('axios');

// Student Predict API
router.post('/predict', verifyToken, verifyRole(['student']), async (req, res) => {
  const { attendance_rate, midterm_score, assignments_avg, quizzes_avg, study_hours, stress_level, course_name } = req.body;
  const student_id = req.user.userId;

  try {
    // 1. Fetch static data from user
    const [users] = await pool.query('SELECT gender, family_income_level, department FROM users WHERE id = ?', [student_id]);
    if (users.length === 0) return res.status(404).json({ message: 'Student not found' });

    const studentData = users[0];

    // Prepare JSON payload for Flask API
    const flaskPayload = {
      "Gender": studentData.gender,
      "Department": studentData.department,
      "Attendance (%)": parseFloat(attendance_rate) || 0,
      "Midterm_Score": parseFloat(midterm_score) || 0,
      "Assignments_Avg": parseFloat(assignments_avg) || 0,
      "Quizzes_Avg": parseFloat(quizzes_avg) || 0,
      "Study_Hours_per_Week": parseFloat(study_hours) || 0,
      "Family_Income_Level": studentData.family_income_level,
      "Stress_Level (1-10)": parseFloat(stress_level) || 0
    };

    // 2. Call Flask API
    let predictedGrade;
    try {
      const flaskResponse = await axios.post('http://127.0.0.1:5001/predict', flaskPayload);
      predictedGrade = flaskResponse.data.predicted_grade;
      if (!predictedGrade) throw new Error("No grade string in response.");
    } catch (apiErr) {
      console.error("Flask API Error:", apiErr.message);
      return res.status(502).json({ message: 'Failed to get prediction from AI model' });
    }

    // 3. Save to prediction_history
    const [result] = await pool.query(`
      INSERT INTO prediction_history (
        student_id, course_name, attendance_rate, midterm_score, 
        assignments_avg, quizzes_avg, study_hours, stress_level, predicted_grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      student_id, course_name, attendance_rate, midterm_score,
      assignments_avg, quizzes_avg, study_hours, stress_level, predictedGrade
    ]);

    res.json({
      prediction_id: result.insertId,
      predicted_grade: predictedGrade,
      message: 'Prediction successful'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during prediction' });
  }
});

// Student History API
router.get('/history', verifyToken, verifyRole(['student']), async (req, res) => {
  const student_id = req.user.userId;

  try {
    const [history] = await pool.query(`
      SELECT * FROM prediction_history 
      WHERE student_id = ? 
      ORDER BY created_at DESC
    `, [student_id]);

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

// Update Profile API
router.put('/profile', verifyToken, verifyRole(['student']), async (req, res) => {
  const student_id = req.user.userId;
  const { age, semester } = req.body;

  try {
    await pool.query('UPDATE users SET age = ?, semester = ? WHERE id = ?', [age, semester, student_id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Get Course Marks API
router.get('/course-marks', verifyToken, verifyRole(['student']), async (req, res) => {
  const student_id = req.user.userId;
  const { course_name } = req.query;

  if (!course_name) {
    return res.status(400).json({ message: 'course_name is required' });
  }

  try {
    const [users] = await pool.query('SELECT student_id_number FROM users WHERE id = ?', [student_id]);
    if (users.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const student_id_number = users[0].student_id_number;

    const [marks] = await pool.query(`
      SELECT attendance_rate, midterm_score, assignments_avg, quizzes_avg 
      FROM student_course_marks 
      WHERE student_id_number = ? AND course_name = ?
    `, [student_id_number, course_name]);

    if (marks.length === 0) {
      return res.json({ has_marks: false });
    }

    res.json({
      has_marks: true,
      marks: marks[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching course marks' });
  }
});

module.exports = router;
