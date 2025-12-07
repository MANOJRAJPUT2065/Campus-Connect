// API Configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:7071',

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

    // Notices
    NOTICES: {
      GET_ALL: '/api/notices',
      GET_RANDOM: '/api/notices/random',
      GET_BY_CATEGORY: '/api/notices/category',
      GET_BY_PRIORITY: '/api/notices/priority',
      SEARCH: '/api/notices/search',
      STATS: '/api/notices/stats',
    },

    // Quiz Platform
    QUIZ: {
      TOPICS: '/api/quiz/topics',
      QUESTIONS_BY_TOPIC: '/api/quiz/questions',
      RANDOM_QUESTIONS: '/api/quiz/random',
      QUESTIONS_BY_TAGS: '/api/quiz/tags',
      QUESTIONS_BY_DIFFICULTY: '/api/quiz/difficulty',
      SEARCH_QUESTIONS: '/api/quiz/search',
      STATS: '/api/quiz/stats',
      SUBMIT: '/api/quiz/submit',
    },

    // Chat System
    CHAT: {
      GET_CHATS: '/api/chat',
      GET_MESSAGES: '/api/chat/messages',
      SEND_MESSAGE: '/api/chat/send',
      CREATE_GROUP: '/api/chat/group',
      GET_USERS: '/api/chat/users',
      TYPING_STATUS: '/api/chat/typing',
    },
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export the config
export default API_CONFIG;
