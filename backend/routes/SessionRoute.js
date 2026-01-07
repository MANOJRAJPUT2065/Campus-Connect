import express from 'express';
import Session from '../models/Session.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to find session by ID or channelName
const findSession = async (sessionId) => {
  // Try to find by ObjectId first if it's a valid ObjectId format
  if (mongoose.Types.ObjectId.isValid(sessionId)) {
    const session = await Session.findById(sessionId);
    if (session) return session;
  }
  
  // Fall back to finding by channelName (for custom session IDs like "session-xxx")
  return await Session.findOne({ channelName: sessionId });
};

// Create a new session (Teacher)
router.post('/create', async (req, res) => {
  try {
    const { title, description, instructorId, instructorName, maxParticipants = 50, duration = '60 min' } = req.body;
    
    if (!title || !instructorId) {
      return res.status(400).json({ success: false, error: 'Title and instructor ID required' });
    }

    const channelName = `session-${uuidv4().substring(0, 8)}`;
    
    const session = new Session({
      title,
      description,
      instructorId: String(instructorId), // Ensure it's a string (email, USN, or ID)
      instructorName: instructorName || 'Instructor',
      channelName,
      maxParticipants,
      duration,
      status: 'scheduled'
    });

    await session.save();

    res.json({
      success: true,
      session,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

// Get teacher's sessions
router.get('/teacher/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;
    const sessions = await Session.find({ instructorId })
      .populate('participants.userId', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get teacher sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

// Start a session (Teacher)
router.post('/:sessionId/start', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const existingSession = await findSession(sessionId);

    if (!existingSession) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = await Session.findByIdAndUpdate(
      existingSession._id,
      { 
        status: 'live',
        startTime: new Date()
      },
      { new: true }
    );

    res.json({ success: true, session, message: 'Session started' });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

// End a session (Teacher)
router.post('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const existingSession = await findSession(sessionId);

    if (!existingSession) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = await Session.findByIdAndUpdate(
      existingSession._id,
      { 
        status: 'ended',
        endTime: new Date()
      },
      { new: true }
    );

    res.json({ success: true, session, message: 'Session ended' });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ success: false, error: 'Failed to end session' });
  }
});

// Add participant to session
router.post('/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, userName, userRole = 'student' } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({ success: false, error: 'User ID and name required' });
    }

    const session = await findSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Allow students to join sessions that are 'live' or 'scheduled'
    if (session.status === 'ended') {
      return res.status(400).json({ success: false, error: 'Session has ended' });
    }

    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Session is full' });
    }

    // Check if user already in session
    const existing = session.participants.find(p => String(p.userId) === String(userId));
    if (existing) {
      return res.json({ success: true, session, message: 'Already in session' });
    }

    session.participants.push({
      userId: String(userId),
      userName,
      joinedAt: new Date(),
      role: userRole
    });

    await session.save();

    res.json({ success: true, session, message: 'Joined session successfully' });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ success: false, error: 'Failed to join session' });
  }
});

// Get live sessions (for students)
router.get('/live', async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'live' })
      .populate('instructorId', 'username email')
      .select('-participants');

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get live sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await findSession(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

// Get session analytics (for teacher)
router.get('/:sessionId/analytics', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await findSession(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const analytics = {
      totalParticipants: session.participants.length,
      duration: session.endTime && session.startTime 
        ? Math.round((session.endTime - session.startTime) / 1000 / 60) + ' min'
        : 'ongoing',
      peakParticipants: session.participants.length,
      recordingUrl: session.recordingUrl || null
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;
