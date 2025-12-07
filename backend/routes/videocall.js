import express from 'express';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Agora configuration - make them optional
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// Check if Agora is configured
if (AGORA_APP_ID && AGORA_APP_CERTIFICATE) {
  console.log('✅ Agora video calling configured successfully');
} else {
  console.log('⚠️  Agora credentials not found - video calling will be limited');
}

// Store active sessions
const activeSessions = new Map();

// Generate Agora RTC Token
router.post('/generate-token', (req, res) => {
  try {
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      return res.status(503).json({
        success: false,
        error: 'Agora video calling is not configured. Please check environment variables.',
        message: 'Video calling service temporarily unavailable'
      });
    }

    const { channelName, uid, role = 'publisher' } = req.body;
    
    if (!channelName || !uid) {
      return res.status(400).json({
        success: false,
        error: 'Channel name and UID are required'
      });
    }

    // Set token expiry time (24 hours)
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      appId: AGORA_APP_ID,
      channelName,
      uid,
      role,
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token'
    });
  }
});

// Create a new video call session with shareable link
router.post('/create-session', (req, res) => {
  try {
    const { title, instructorId, instructorName, maxParticipants = 50, settings = {} } = req.body;
    
    if (!title || !instructorId) {
      return res.status(400).json({
        success: false,
        error: 'Title and instructor ID are required'
      });
    }

    const sessionId = uuidv4();
    const channelName = `room-${sessionId.substring(0, 8)}`;
    const shareLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/video-call/join/${sessionId}`;
    
    const session = {
      id: sessionId,
      title,
      channelName,
      instructorId,
      instructorName: instructorName || 'Instructor',
      maxParticipants,
      participants: [],
      shareLink,
      settings: {
        allowScreenShare: true,
        allowRecording: true,
        allowChat: true,
        allowWhiteboard: true,
        ...settings
      },
      status: 'waiting',
      createdAt: new Date(),
      startedAt: null,
      endedAt: null
    };

    activeSessions.set(sessionId, session);

    res.json({
      success: true,
      session,
      shareLink,
      message: 'Session created successfully'
    });

  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// Join a video call session
router.post('/join-session', (req, res) => {
  try {
    const { sessionId, userId, userName, userRole = 'student' } = req.body;
    
    if (!sessionId || !userId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, user ID, and user name are required'
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Session is full'
      });
    }

    // Check if user is already in session
    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      return res.json({
        success: true,
        session,
        participant: existingParticipant,
        message: 'User already in session'
      });
    }

    const participant = {
      userId,
      userName,
      userRole,
      joinedAt: new Date(),
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      isRecording: false
    };

    session.participants.push(participant);

    // Generate token for this participant (if Agora is configured)
    let token = null;
    if (AGORA_APP_ID && AGORA_APP_CERTIFICATE) {
      try {
        token = RtcTokenBuilder.buildTokenWithUid(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          session.channelName,
          participant.userId,
          userRole === 'instructor' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
          Math.floor(Date.now() / 1000) + 3600 * 24
        );
      } catch (tokenError) {
        console.error('Token generation error:', tokenError);
      }
    }

    res.json({
      success: true,
      session,
      participant,
      token: token || 'mock-token-for-testing',
      appId: AGORA_APP_ID || 'mock-app-id',
      channelName: session.channelName,
      message: 'Successfully joined session'
    });

  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join session'
    });
  }
});

// Leave a video call session
router.post('/leave-session', (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and user ID are required'
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const participantIndex = session.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'User not in session'
      });
    }

    session.participants.splice(participantIndex, 1);

    // If no participants left, end session
    if (session.participants.length === 0) {
      session.status = 'ended';
      session.endedAt = new Date();
    }

    res.json({
      success: true,
      message: 'Successfully left session',
      session
    });

  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave session'
    });
  }
});

// Get session details by sessionId (for joining via link)
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    // Check if session is still active
    if (session.status === 'ended') {
      return res.status(400).json({
        success: false,
        error: 'This session has ended'
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        channelName: session.channelName,
        instructorName: session.instructorName,
        maxParticipants: session.maxParticipants,
        participants: session.participants.length,
        status: session.status,
        createdAt: session.createdAt,
        settings: session.settings
      }
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

// Update session settings
router.put('/session/:sessionId/settings', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { settings } = req.body;
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.settings = { ...session.settings, ...settings };

    res.json({
      success: true,
      session,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// Start/Stop session recording
router.post('/session/:sessionId/recording', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, userId } = req.body; // action: 'start' or 'stop'
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'User not in session'
      });
    }

    if (action === 'start') {
      participant.isRecording = true;
      session.isRecording = true;
      session.recordingStartedAt = new Date();
    } else if (action === 'stop') {
      participant.isRecording = false;
      session.isRecording = false;
      session.recordingEndedAt = new Date();
    }

    res.json({
      success: true,
      session,
      message: `Recording ${action}ed successfully`
    });

  } catch (error) {
    console.error('Recording control error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control recording'
    });
  }
});

// Get all active sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = Array.from(activeSessions.values());
    
    res.json({
      success: true,
      sessions,
      total: sessions.length
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

export default router;
