import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|mp4|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only specific file types are allowed'));
    }
  }
});

// Store data (in production, use a database)
const whiteboards = new Map();
const files = new Map();
const polls = new Map();
const attendance = new Map();
const breakoutRooms = new Map();

// ===== VIRTUAL WHITEBOARD =====

// POST /api/advanced-features/whiteboard/create - Create new whiteboard
router.post('/whiteboard/create', (req, res) => {
  try {
    const { sessionId, title, instructorId } = req.body;
    
    if (!sessionId || !title || !instructorId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, title, and instructor ID are required'
      });
    }

    const whiteboardId = uuidv4();
    const whiteboard = {
      id: whiteboardId,
      sessionId,
      title,
      instructorId,
      content: [],
      participants: [],
      createdAt: new Date(),
      isActive: true
    };

    whiteboards.set(whiteboardId, whiteboard);

    res.json({
      success: true,
      whiteboard,
      message: 'Whiteboard created successfully'
    });

  } catch (error) {
    console.error('Create whiteboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/advanced-features/whiteboard/:whiteboardId/draw - Add drawing action
router.post('/whiteboard/:whiteboardId/draw', (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const { action, userId, data } = req.body;
    
    const whiteboard = whiteboards.get(whiteboardId);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    const drawAction = {
      id: uuidv4(),
      action,
      userId,
      data,
      timestamp: new Date()
    };

    whiteboard.content.push(drawAction);

    res.json({
      success: true,
      action: drawAction,
      message: 'Drawing action added successfully'
    });

  } catch (error) {
    console.error('Add drawing action error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/advanced-features/whiteboard/:whiteboardId - Get whiteboard content
router.get('/whiteboard/:whiteboardId', (req, res) => {
  try {
    const { whiteboardId } = req.params;
    
    const whiteboard = whiteboards.get(whiteboardId);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    res.json({
      success: true,
      whiteboard
    });

  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== FILE SHARING =====

// POST /api/advanced-features/files/upload - Upload file
router.post('/files/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { sessionId, userId, description = '' } = req.body;
    
    const fileId = uuidv4();
    const file = {
      id: fileId,
      sessionId,
      userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      description,
      uploadedAt: new Date(),
      downloads: 0
    };

    files.set(fileId, file);

    res.json({
      success: true,
      file,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/advanced-features/files/session/:sessionId - Get session files
router.get('/files/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionFiles = Array.from(files.values())
      .filter(file => file.sessionId === sessionId)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({
      success: true,
      files: sessionFiles,
      total: sessionFiles.length
    });

  } catch (error) {
    console.error('Get session files error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== LIVE POLLS & QUIZZES =====

// POST /api/advanced-features/polls/create - Create new poll
router.post('/polls/create', (req, res) => {
  try {
    const { sessionId, question, options, instructorId, duration = 300 } = req.body;
    
    if (!sessionId || !question || !options || !instructorId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, question, options, and instructor ID are required'
      });
    }

    const pollId = uuidv4();
    const poll = {
      id: pollId,
      sessionId,
      question,
      options: options.map(option => ({
        id: uuidv4(),
        text: option,
        votes: 0
      })),
      instructorId,
      duration,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 1000),
      isActive: true,
      participants: [],
      results: []
    };

    polls.set(pollId, poll);

    res.json({
      success: true,
      poll,
      message: 'Poll created successfully'
    });

  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/advanced-features/polls/:pollId/vote - Vote on poll
router.post('/polls/:pollId/vote', (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId, optionId } = req.body;
    
    const poll = polls.get(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    if (!poll.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Poll is no longer active'
      });
    }

    // Check if user already voted
    if (poll.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'User already voted'
      });
    }

    // Find and increment vote
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(400).json({
        success: false,
        error: 'Invalid option'
      });
    }

    option.votes++;
    poll.participants.push(userId);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      poll
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/advanced-features/polls/session/:sessionId - Get session polls
router.get('/polls/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionPolls = Array.from(polls.values())
      .filter(poll => poll.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      polls: sessionPolls,
      total: sessionPolls.length
    });

  } catch (error) {
    console.error('Get session polls error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== ATTENDANCE TRACKING =====

// POST /api/advanced-features/attendance/join - Mark user as present
router.post('/attendance/join', (req, res) => {
  try {
    const { sessionId, userId, userName, userRole } = req.body;
    
    if (!sessionId || !userId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, user ID, and user name are required'
      });
    }

    const attendanceKey = `${sessionId}-${userId}`;
    const attendanceRecord = {
      sessionId,
      userId,
      userName,
      userRole,
      joinedAt: new Date(),
      leftAt: null,
      duration: 0
    };

    attendance.set(attendanceKey, attendanceRecord);

    res.json({
      success: true,
      attendance: attendanceRecord,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/advanced-features/attendance/leave - Mark user as left
router.post('/attendance/leave', (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    const attendanceKey = `${sessionId}-${userId}`;
    const attendanceRecord = attendance.get(attendanceKey);
    
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    attendanceRecord.leftAt = new Date();
    attendanceRecord.duration = Math.floor(
      (attendanceRecord.leftAt - attendanceRecord.joinedAt) / 1000 / 60
    );

    res.json({
      success: true,
      attendance: attendanceRecord,
      message: 'Leave time recorded successfully'
    });

  } catch (error) {
    console.error('Record leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/advanced-features/attendance/session/:sessionId - Get session attendance
router.get('/attendance/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionAttendance = Array.from(attendance.values())
      .filter(record => record.sessionId === sessionId)
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

    const stats = {
      total: sessionAttendance.length,
      present: sessionAttendance.filter(r => !r.leftAt).length,
      left: sessionAttendance.filter(r => r.leftAt).length,
      averageDuration: sessionAttendance.reduce((sum, r) => sum + (r.duration || 0), 0) / sessionAttendance.length
    };

    res.json({
      success: true,
      attendance: sessionAttendance,
      stats
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== BREAKOUT ROOMS =====

// POST /api/advanced-features/breakout/create - Create breakout rooms
router.post('/breakout/create', (req, res) => {
  try {
    const { sessionId, instructorId, rooms, participants, duration = 900 } = req.body;
    
    if (!sessionId || !instructorId || !rooms || !participants) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, instructor ID, rooms, and participants are required'
      });
    }

    const breakoutId = uuidv4();
    const breakout = {
      id: breakoutId,
      sessionId,
      instructorId,
      rooms: rooms.map(room => ({
        id: uuidv4(),
        name: room.name,
        maxParticipants: room.maxParticipants,
        participants: [],
        isActive: false
      })),
      participants,
      duration,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 1000),
      isActive: true
    };

    // Assign participants to rooms
    let participantIndex = 0;
    for (const room of breakout.rooms) {
      while (room.participants.length < room.maxParticipants && participantIndex < participants.length) {
        room.participants.push(participants[participantIndex]);
        participantIndex++;
      }
    }

    breakoutRooms.set(breakoutId, breakout);

    res.json({
      success: true,
      breakout,
      message: 'Breakout rooms created successfully'
    });

  } catch (error) {
    console.error('Create breakout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/advanced-features/breakout/:breakoutId/start - Start breakout rooms
router.post('/breakout/:breakoutId/start', (req, res) => {
  try {
    const { breakoutId } = req.params;
    
    const breakout = breakoutRooms.get(breakoutId);
    if (!breakout) {
      return res.status(404).json({
        success: false,
        error: 'Breakout not found'
      });
    }

    breakout.isActive = true;
    breakout.startedAt = new Date();
    
    for (const room of breakout.rooms) {
      room.isActive = true;
    }

    res.json({
      success: true,
      breakout,
      message: 'Breakout rooms started successfully'
    });

  } catch (error) {
    console.error('Start breakout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/advanced-features/breakout/session/:sessionId - Get session breakouts
router.get('/breakout/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionBreakouts = Array.from(breakoutRooms.values())
      .filter(breakout => breakout.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      breakouts: sessionBreakouts,
      total: sessionBreakouts.length
    });

  } catch (error) {
    console.error('Get breakouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
