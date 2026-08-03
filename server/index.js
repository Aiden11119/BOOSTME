const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const lecturerRoutes = require('./routes/lecturer');
const mentorRoutes = require('./routes/mentor');
const adminRoutes = require('./routes/admin');
const announcementsRoutes = require('./routes/announcements');

const path = require('path');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────

// Helmet: sets various HTTP security headers (X-Frame-Options, CSP, etc.)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: restrict to known origins only
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:5000',   // If serving from same port
  'http://127.0.0.1:5173',
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parser with size limit (prevent large payload DoS)
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiters ───────────────────────────────────────────────────────────

// Login: max 10 attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP: max 5 requests per IP per hour
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chatbot: max 30 messages per IP per 5 minutes
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { message: 'Too many messages. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Verification: max 10 attempts per IP per 10 minutes (prevents brute-force)
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { message: 'Too many OTP verification attempts. Please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: max 100 requests per IP per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);

// ─── Static Files ────────────────────────────────────────────────────────────
// Only serve avatar images publicly (they need to be visible in UI)
// Marks files are served through authenticated download endpoint in lecturer.js
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/forgot-password-otp', otpLimiter);
app.use('/api/auth/verify-otp', verifyLimiter);
app.use('/api/auth/reset-password', verifyLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/appointments', mentorRoutes);

const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot/chat', chatLimiter);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
