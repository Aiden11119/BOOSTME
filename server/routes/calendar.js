const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/api/calendar/auth/callback
);

// Scopes required for Calendar API
const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
];

// Get OAuth URL
router.get('/auth-url', verifyToken, verifyRole(['mentor']), (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force to get refresh token
    scope: scopes,
    state: req.user.userId.toString(), // Pass mentor ID to callback
  });
  res.json({ url });
});

// OAuth Callback
router.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  const mentorId = state;

  if (!code) {
    return res.status(400).send('Authorization code is missing.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      // Save refresh token to DB
      await pool.query(
        'UPDATE users SET google_refresh_token = ? WHERE id = ?',
        [tokens.refresh_token, mentorId]
      );
      
      // Redirect back to frontend profile page
      // Assuming frontend runs on process.env.FRONTEND_URL or localhost:5173
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/mentor/profile?google_connected=true`);
    } else {
      res.status(400).send('No refresh token received. You might need to revoke access in your Google account and try again.');
    }
  } catch (error) {
    console.error('Error during Google Auth Callback:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Helper function to create meeting (will be imported by mentor.js)
const createGoogleMeet = async (mentorId, eventDetails) => {
  try {
    const [rows] = await pool.query('SELECT google_refresh_token FROM users WHERE id = ?', [mentorId]);
    if (rows.length === 0 || !rows[0].google_refresh_token) {
      return null;
    }

    oauth2Client.setCredentials({ refresh_token: rows[0].google_refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: 'Asia/Kuala_Lumpur', 
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: 'Asia/Kuala_Lumpur',
      },
      conferenceData: {
        createRequest: {
          requestId: `boostme-${eventDetails.appointmentId}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1, // Required to create Google Meet link
    });

    return res.data.hangoutLink;
  } catch (error) {
    console.error('Error creating Google Meet link:', error);
    return null;
  }
};

module.exports = {
  router,
  createGoogleMeet
};
