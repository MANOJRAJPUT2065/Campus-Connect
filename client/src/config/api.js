// API Configuration
const API_CONFIG = {
  // Backend server URL
  BASE_URL: 'http://localhost:7071',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/signup',
      GET_USER_DETAILS: '/api/auth/getUserDetails',
      GET_ALL_USERS: '/api/auth/getAllUsers',
    },
    
    // Posts
    POSTS: {
      GET_POSTS: '/api/posts/getposts',
      CREATE_POST: '/api/posts',
      DELETE_POST: '/api/posts/deletepost',
    },
    
    // Events
    EVENTS: {
      GET_EVENTS: '/events/getEvents',
      ADD_EVENT: '/events/addEvent',
      UPDATE_EVENT: '/events/updateEvent',
      DELETE_EVENT: '/events/deleteEvent',
    },
    
    // Video Call
    VIDEO_CALL: {
      GENERATE_TOKEN: '/api/videocall/generate-token',
      CREATE_SESSION: '/api/videocall/create-session',
    },
    
    // AI Chatbot
    CHATBOT: {
      ASK: '/api/chatbot/ask',
      SUGGESTIONS: '/api/chatbot/suggestions',
      FEEDBACK: '/api/chatbot/feedback',
    },
    
    // Notifications
    NOTIFICATIONS: {
      SUBSCRIBE: '/api/notifications/subscribe',
      SEND: '/api/notifications/send',
      BROADCAST: '/api/notifications/broadcast',
    },
    
    // Advanced Features
    ADVANCED_FEATURES: {
      WHITEBOARD: '/api/advanced-features/whiteboard',
      FILE_UPLOAD: '/api/advanced-features/upload',
      POLLS: '/api/advanced-features/polls',
      ATTENDANCE: '/api/advanced-features/attendance',
    },
    
    // Other features
    LIKE_POST: '/api/likes',
    BOOKMARK: '/api/bookmarks',
    COMMENT: '/api/comments',
    MESSAGES: '/api/messages',
    USER_PROFILE: '/api/users/profile',
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export the config
export default API_CONFIG;
