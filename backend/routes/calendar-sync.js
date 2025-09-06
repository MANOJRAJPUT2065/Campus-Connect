import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import Event from '../models/Event.js';

dotenv.config();

const router = express.Router();

// Google Calendar API configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Generate OAuth URL for user authorization
router.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ authUrl });
});

// Handle OAuth callback and get tokens
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in user's session or database
    // For now, we'll return them (in production, store securely)
    res.json({ 
      success: true, 
      message: 'Calendar connected successfully',
      tokens 
    });
  } catch (error) {
    console.error('Calendar OAuth error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect calendar' 
    });
  }
});

// Sync events to Google Calendar
router.post('/sync-event', async (req, res) => {
  try {
    const { eventId, accessToken } = req.body;
    
    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Event not found' 
      });
    }

    // Set access token
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create Google Calendar event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: event.endTime,
        timeZone: 'Asia/Kolkata'
      },
      location: event.location || 'Online',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: googleEvent
    });

    // Update event with Google Calendar ID
    event.googleCalendarId = response.data.id;
    await event.save();

    res.json({ 
      success: true, 
      message: 'Event synced to Google Calendar',
      googleEventId: response.data.id
    });

  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync event' 
    });
  }
});

// Get upcoming events for calendar view
router.get('/upcoming', async (req, res) => {
  try {
    const { accessToken } = req.query;
    
    if (accessToken) {
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: oneWeekLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      res.json({
        success: true,
        events: response.data.items || []
      });
    } else {
      // Return local events if no calendar access
      const events = await Event.find({
        startTime: { $gte: new Date() }
      }).sort({ startTime: 1 }).limit(10);
      
      res.json({
        success: true,
        events: events.map(event => ({
          id: event._id,
          summary: event.title,
          description: event.description,
          start: event.startTime,
          end: event.endTime,
          location: event.location
        }))
      });
    }
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch calendar events' 
    });
  }
});

export default router;
