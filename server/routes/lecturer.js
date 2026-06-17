const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get all students' prediction histories for Lecturer view
router.get('/students', verifyToken, verifyRole(['lecturer']), async (req, res) => {
  const { department, semester, course } = req.query;
  const lecturerId = req.user.userId;

  try {
    let query = `
      SELECT 
        u.id as student_id, u.student_id_number, u.full_name, u.email, u.department, u.semester, u.avatar_url,
        p.prediction_id, p.course_name, p.predicted_grade, p.created_at
      FROM users u
      JOIN prediction_history p ON u.id = p.student_id
      JOIN lecturer_courses lc ON p.course_name = lc.course_name
      WHERE u.role = 'student' AND lc.lecturer_id = ?
    `;

    const queryParams = [lecturerId];

    if (department) {
      query += ` AND u.department = ?`;
      queryParams.push(department);
    }
    if (semester) {
      query += ` AND u.semester = ?`;
      queryParams.push(semester);
    }
    if (course) {
      query += ` AND p.course_name = ?`;
      queryParams.push(course);
    }

    // Crucial Sorting: D and F grades absolute top
    // Using CASE statement to map 'D' and 'F' to 0 (top), others to 1
    query += `
      ORDER BY 
        CASE 
          WHEN p.predicted_grade IN ('D', 'F') THEN 0 
          ELSE 1 
        END ASC,
        p.created_at DESC
    `;

    const [students] = await pool.query(query, queryParams);

    // Group multiple predictions by student or just return the list 
    // Usually a lecturer monitor might want the latest prediction per course, 
    // but the query above gets all records sorted.
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching student data' });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/marks');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Upload marks from Excel/CSV
router.post('/upload-marks', verifyToken, verifyRole(['lecturer']), upload.single('file'), async (req, res) => {
  const { course_name } = req.body;
  const lecturerId = req.user.userId;

  if (!req.file || !course_name) {
    return res.status(400).json({ message: 'Course name and file are required.' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Uploaded file is empty.' });
    }

    let successCount = 0;
    
    for (const row of data) {
      // Find the key that loosely matches "student id"
      const idKey = Object.keys(row).find(k => k.toLowerCase().includes('student') && k.toLowerCase().includes('id'));
      const attKey = Object.keys(row).find(k => k.toLowerCase().includes('attendance'));
      const assignKey = Object.keys(row).find(k => k.toLowerCase().includes('assignment'));
      const midKey = Object.keys(row).find(k => k.toLowerCase().includes('midterm'));
      const quizKey = Object.keys(row).find(k => k.toLowerCase().includes('quiz'));

      const student_id_number = idKey ? String(row[idKey]).trim() : null;
      
      if (!student_id_number) continue;

      const attendance_rate = attKey ? parseFloat(row[attKey]) || 0 : 0;
      const assignments_avg = assignKey ? parseFloat(row[assignKey]) || 0 : 0;
      const midterm_score = midKey ? parseFloat(row[midKey]) || 0 : 0;
      const quizzes_avg = quizKey ? parseFloat(row[quizKey]) || 0 : 0;

      const query = `
        INSERT INTO student_course_marks 
          (student_id_number, course_name, lecturer_id, attendance_rate, midterm_score, assignments_avg, quizzes_avg)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          lecturer_id = VALUES(lecturer_id),
          attendance_rate = VALUES(attendance_rate),
          midterm_score = VALUES(midterm_score),
          assignments_avg = VALUES(assignments_avg),
          quizzes_avg = VALUES(quizzes_avg)
      `;

      await pool.query(query, [
        student_id_number,
        course_name,
        lecturerId,
        attendance_rate,
        midterm_score,
        assignments_avg,
        quizzes_avg
      ]);

      successCount++;
    }

    // Save to uploaded_files_history
    await pool.query(`
      INSERT INTO uploaded_files_history (lecturer_id, course_name, original_file_name, stored_file_name)
      VALUES (?, ?, ?, ?)
    `, [lecturerId, course_name, req.file.originalname, req.file.filename]);

    res.json({ message: `Successfully processed ${successCount} student records for ${course_name}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process uploaded file.' });
  }
});

// Get uploaded files history
router.get('/uploaded-files', verifyToken, verifyRole(['lecturer']), async (req, res) => {
  const { course } = req.query;
  const lecturerId = req.user.userId;

  try {
    let query = `
      SELECT id, course_name, original_file_name, uploaded_at 
      FROM uploaded_files_history 
      WHERE lecturer_id = ?
    `;
    const queryParams = [lecturerId];

    if (course) {
      query += ` AND course_name = ?`;
      queryParams.push(course);
    }

    query += ` ORDER BY uploaded_at DESC`;

    const [files] = await pool.query(query, queryParams);
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching uploaded files' });
  }
});

// Download uploaded file
router.get('/download-file/:id', verifyToken, verifyRole(['lecturer']), async (req, res) => {
  const fileId = req.params.id;
  const lecturerId = req.user.userId;

  try {
    const [files] = await pool.query(`SELECT * FROM uploaded_files_history WHERE id = ? AND lecturer_id = ?`, [fileId, lecturerId]);
    if (files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileRecord = files[0];
    const filePath = path.join(__dirname, '../uploads/marks', fileRecord.stored_file_name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File does not exist on server' });
    }

    res.download(filePath, fileRecord.original_file_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error downloading file' });
  }
});

module.exports = router;
