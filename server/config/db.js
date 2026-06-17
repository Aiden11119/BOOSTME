require('dotenv').config();
const mysql = require('mysql2/promise');

// Setup connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'boastme',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
const initializeDB = async () => {
  try {
    // We can also create the database if it doesn't exist, but typically we assume 
    // the user has created it or we need a connection without database first.
    // For simplicity, we assume DB exists as 'boastme'. We will just create tables if not exist.

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role ENUM('student', 'lecturer', 'mentor') NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        
        -- Student fields
        student_id_number VARCHAR(100),
        department VARCHAR(255),
        semester VARCHAR(100),
        age INT,
        gender VARCHAR(50),
        family_income_level VARCHAR(50),
        
        -- Mentor fields
        specialty_description TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create prediction_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_history (
        prediction_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        
        attendance_rate FLOAT,
        midterm_score FLOAT,
        assignments_avg FLOAT,
        quizzes_avg FLOAT,
        study_hours FLOAT,
        stress_level INT,
        
        predicted_grade ENUM('A', 'B', 'C', 'D', 'F') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        appointment_id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NOT NULL,
        student_id INT NULL,
        appointment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status ENUM('available', 'pending', 'confirmed', 'cancelled') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    try {
      // Force update existing table structure just in case it already existed
      await pool.query("ALTER TABLE appointments MODIFY COLUMN student_id INT NULL");
      await pool.query("ALTER TABLE appointments MODIFY COLUMN status ENUM('available', 'pending', 'confirmed', 'cancelled') DEFAULT 'available'");
    } catch (alterErr) {
      console.log('Note: ALTER appointments skipped or already applied.');
    }

    // Create mentor_slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_slots (
        slot_id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NOT NULL,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create otps table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lecturer_courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lecturer_courses (
        lecturer_id INT NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (lecturer_id, course_name),
        FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create student_course_marks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_course_marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id_number VARCHAR(100) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        lecturer_id INT NOT NULL,
        attendance_rate FLOAT,
        midterm_score FLOAT,
        assignments_avg FLOAT,
        quizzes_avg FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_course (student_id_number, course_name),
        FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create uploaded_files_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lecturer_id INT NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        original_file_name VARCHAR(255) NOT NULL,
        stored_file_name VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create chat_messages table for AI history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        role ENUM('user', 'ai') NOT NULL,
        message_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

initializeDB();

module.exports = pool;
