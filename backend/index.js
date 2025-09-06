import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

// Import routes
import userRoute from './routes/UserRoute.js';
import postRoute from './routes/PostRoute.js';
import EventRoute from './routes/EventRoute.js';
import contactRoute from './routes/ContactRoute.js';
import videocallRoute from './routes/videocall.js';
import chatbotRoute from './routes/chatbot.js';
import notificationsRoute from './routes/notifications.js';
import advancedFeaturesRoute from './routes/advanced-features.js';
import voiceRoute from './routes/voice.js';
import likePostRoute from './routes/LikePostRoute.js';
import bookmarkRoute from './routes/BookmarkRoute.js';
import commentRoute from './routes/CommentRoute.js';
import messageRoute from './routes/MessageRoute.js';
import notesRoute from './routes/NotesRoute.js';
import noticesRoute from './routes/notices.js';
import quizRoute from './routes/quiz.js';
import calendarSyncRoute from './routes/calendar-sync.js';
import lectureRecordingsRoute from './routes/lecture-recordings.js';
import recommendationsRoute from './routes/recommendations.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lightweight request logger for key APIs
app.use((req, res, next) => {
  try {
    const interesting = ['/api/voice', '/api/chatbot', '/api/notifications', '/api/videocall'];
    if (interesting.some((p) => req.path.startsWith(p))) {
      console.log(`[API] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    }
  } catch (_) {}
  next();
});

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoute);
app.use('/api/posts', postRoute);
app.use('/events', EventRoute);
app.use('/api/contact', contactRoute);

// Advanced Features Routes
app.use('/api/videocall', videocallRoute);
app.use('/api/chatbot', chatbotRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/advanced-features', advancedFeaturesRoute);
app.use('/api/voice', voiceRoute);

// Additional Routes
app.use('/api/likes', likePostRoute);
app.use('/api/bookmarks', bookmarkRoute);
app.use('/api/comments', commentRoute);
app.use('/api/messages', messageRoute);
app.use('/api/notes', notesRoute);
app.use('/api/notices', noticesRoute);
app.use('/api/quiz', quizRoute);

// New Advanced Features - Now Enabled
app.use('/api/calendar', calendarSyncRoute);
app.use('/api/recordings', lectureRecordingsRoute);
app.use('/api/recommendations', recommendationsRoute);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join video call room
  socket.on('join-video-room', (roomId) => {
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined video room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });

  // Leave video call room
  socket.on('leave-video-room', (roomId) => {
    socket.leave(roomId);
    console.log(`👋 User ${socket.id} left video room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-left', { userId: socket.id });
  });

  // Handle video call signaling
  socket.on('video-offer', (data) => {
    socket.to(data.roomId).emit('video-offer', data);
  });

  socket.on('video-answer', (data) => {
    socket.to(data.roomId).emit('video-answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('new-message', data);
  });

  // Handle whiteboard updates
  socket.on('whiteboard-draw', (data) => {
    socket.to(data.roomId).emit('whiteboard-update', data);
  });

  // Handle file sharing
  socket.on('file-uploaded', (data) => {
    socket.to(data.roomId).emit('new-file', data);
  });

  // Handle live polls
  socket.on('poll-created', (data) => {
    io.to(data.roomId).emit('new-poll', data);
  });

  socket.on('poll-vote', (data) => {
    io.to(data.roomId).emit('poll-update', data);
  });

  // Handle attendance tracking
  socket.on('user-joined-session', (data) => {
    io.to(data.roomId).emit('attendance-update', {
      type: 'joined',
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('user-left-session', (data) => {
    io.to(data.roomId).emit('attendance-update', {
      type: 'left',
      userId: data.userId,
      userName: data.userName
    });
  });

  // Handle breakout rooms
  socket.on('join-breakout-room', (data) => {
    socket.join(data.breakoutRoomId);
    socket.to(data.breakoutRoomId).emit('user-joined-breakout', data);
  });

  socket.on('leave-breakout-room', (data) => {
    socket.leave(data.breakoutRoomId);
    socket.to(data.breakoutRoomId).emit('user-left-breakout', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Campus Connect API is running! 🚀',
    version: '2.0.0',
    features: [
      'User Management',
      'Post Management',
      'Advanced Event Management',
      'Video Calls with Agora',
      'AI Chatbot',
      'Push Notifications',
      'Virtual Whiteboard',
      'File Sharing',
      'Live Polls & Quizzes',
      'Attendance Tracking',
      'Breakout Rooms',
      'Advanced Analytics',
      'Code Editor & Quiz Platform',
      'Google Calendar Sync',
      'Lecture Recordings'
    ],
    endpoints: {
      users: '/api/users',
      posts: '/api/posts',
      events: '/events',
      contact: '/api/contact',
      videocall: '/api/videocall',
      chatbot: '/api/chatbot',
      notifications: '/api/notifications',
      advancedFeatures: '/api/advanced-features',
      calendar: '/api/calendar',
      recordings: '/api/recordings',
      recommendations: '/api/recommendations'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 7071;

server.listen(PORT, () => {
  console.log("✅ Campus Connect Server is running on port", PORT);
  console.log("🌐 API Documentation: http://localhost:" + PORT + "/api");
  console.log("💚 Health Check: http://localhost:" + PORT + "/health");
  console.log("⚠️  Note: Some features require API keys (check env-example.txt)");
});
