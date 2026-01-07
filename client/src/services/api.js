import axios from 'axios';
import API_CONFIG, { buildApiUrl } from '../config/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (credentials) => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
  signup: (userData) => api.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, userData),
  getUserDetails: () => api.get(API_CONFIG.ENDPOINTS.AUTH.GET_USER_DETAILS),
  getAllUsers: () => api.get(API_CONFIG.ENDPOINTS.AUTH.GET_ALL_USERS),
};

// Posts API
export const postsAPI = {
  getPosts: () => api.get(API_CONFIG.ENDPOINTS.POSTS.GET_POSTS),
  createPost: (postData) => api.post(API_CONFIG.ENDPOINTS.POSTS.CREATE_POST, postData),
  deletePost: (postId) => api.delete(`${API_CONFIG.ENDPOINTS.POSTS.DELETE_POST}/${postId}`),
};

// Events API
export const eventsAPI = {
  getEvents: () => api.get(API_CONFIG.ENDPOINTS.EVENTS.GET_EVENTS),
  addEvent: (eventData) => api.post(API_CONFIG.ENDPOINTS.EVENTS.ADD_EVENT, eventData),
  updateEvent: (eventId, eventData) => 
    api.put(`${API_CONFIG.ENDPOINTS.EVENTS.UPDATE_EVENT}/${eventId}`, eventData),
  deleteEvent: (eventId) => 
    api.delete(`${API_CONFIG.ENDPOINTS.EVENTS.DELETE_EVENT}/${eventId}`),
};

// Video Call API
export const videoCallAPI = {
  generateToken: (data) => 
    api.post(API_CONFIG.ENDPOINTS.VIDEO_CALL.GENERATE_TOKEN, data),
  createSession: (data) => 
    api.post(API_CONFIG.ENDPOINTS.VIDEO_CALL.CREATE_SESSION, data),
};

// AI Chatbot API
export const chatbotAPI = {
  ask: (question) => 
    api.post(API_CONFIG.ENDPOINTS.CHATBOT.ASK, { question }),
  getSuggestions: () => 
    api.get(API_CONFIG.ENDPOINTS.CHATBOT.SUGGESTIONS),
  sendFeedback: (feedback) => 
    api.post(API_CONFIG.ENDPOINTS.CHATBOT.FEEDBACK, feedback),
};

// Notices API
export const noticesAPI = {
  getAll: () => api.get(API_CONFIG.ENDPOINTS.NOTICES.GET_ALL),
  getRandom: () => api.get(API_CONFIG.ENDPOINTS.NOTICES.GET_RANDOM),
  getByCategory: (category) => 
    api.get(`${API_CONFIG.ENDPOINTS.NOTICES.GET_BY_CATEGORY}/${category}`),
  search: (query) => 
    api.get(`${API_CONFIG.ENDPOINTS.NOTICES.SEARCH}?q=${query}`),
};

// Quiz API
export const quizAPI = {
  getTopics: () => api.get(API_CONFIG.ENDPOINTS.QUIZ.TOPICS),
  getQuestionsByTopic: (topic) => 
    api.get(`${API_CONFIG.ENDPOINTS.QUIZ.QUESTIONS_BY_TOPIC}/${topic}`),
  submitQuiz: (answers) => 
    api.post(API_CONFIG.ENDPOINTS.QUIZ.SUBMIT, { answers }),
};

// Chat API
export const chatAPI = {
  getChats: () => api.get(API_CONFIG.ENDPOINTS.CHAT.GET_CHATS),
  getMessages: (chatId) => 
    api.get(`${API_CONFIG.ENDPOINTS.CHAT.GET_MESSAGES}/${chatId}`),
  sendMessage: (chatId, message) => 
    api.post(API_CONFIG.ENDPOINTS.CHAT.SEND_MESSAGE, { chatId, message }),
  createGroup: (groupData) => 
    api.post(API_CONFIG.ENDPOINTS.CHAT.CREATE_GROUP, groupData),
};

// Teacher API
export const teacherAPI = {
  // Classes
  createClass: (classData) => api.post('/api/teacher/classes', classData),
  getClasses: (params) => api.get('/api/teacher/classes', { params }),
  getClassDetails: (classId) => api.get(`/api/teacher/classes/${classId}`),
  updateClass: (classId, updates) => api.put(`/api/teacher/classes/${classId}`, updates),
  addStudent: (classId, studentData) => api.post(`/api/teacher/classes/${classId}/students`, studentData),
  uploadMaterial: (classId, material) => api.post(`/api/teacher/classes/${classId}/materials`, material),
  
  // Assignments
  createAssignment: (assignmentData) => api.post('/api/teacher/assignments', assignmentData),
  getAssignments: (params) => api.get('/api/teacher/assignments', { params }),
  getAssignmentDetails: (assignmentId) => api.get(`/api/teacher/assignments/${assignmentId}`),
  gradeSubmission: (assignmentId, submissionId, gradeData) => 
    api.post(`/api/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade`, gradeData),
  
  // Attendance
  createAttendance: (attendanceData) => api.post('/api/teacher/attendance', attendanceData),
  markAttendance: (attendanceId, markData) => api.post(`/api/teacher/attendance/${attendanceId}/mark`, markData),
  getClassAttendance: (classId, params) => api.get(`/api/teacher/attendance/class/${classId}`, { params }),
  
  // Analytics
  getAnalytics: () => api.get('/api/teacher/analytics'),
};

// Coordinator API
export const coordinatorAPI = {
  // Clubs
  createClub: (clubData) => api.post('/api/coordinator/clubs', clubData),
  getClubs: () => api.get('/api/coordinator/clubs'),
  getClubDetails: (clubId) => api.get(`/api/coordinator/clubs/${clubId}`),
  addMember: (clubId, memberData) => api.post(`/api/coordinator/clubs/${clubId}/members`, memberData),
  sendClubAnnouncement: (clubId, announcement) => 
    api.post(`/api/coordinator/clubs/${clubId}/announcements`, announcement),
  
  // Events
  createEvent: (eventData) => api.post('/api/coordinator/events', eventData),
  getEvents: (params) => api.get('/api/coordinator/events', { params }),
  getEventDetails: (eventId) => api.get(`/api/coordinator/events/${eventId}`),
  updateEvent: (eventId, updates) => api.put(`/api/coordinator/events/${eventId}`, updates),
  approveParticipant: (eventId, registrationId) => 
    api.post(`/api/coordinator/events/${eventId}/registrations/${registrationId}/approve`),
  rejectParticipant: (eventId, registrationId, reason) => 
    api.post(`/api/coordinator/events/${eventId}/registrations/${registrationId}/reject`, { reason }),
  sendEventAnnouncement: (eventId, announcement) => 
    api.post(`/api/coordinator/events/${eventId}/announcements`, announcement),
  
  // Analytics
  getAnalytics: () => api.get('/api/coordinator/analytics'),
};

export default {
  auth: authAPI,
  posts: postsAPI,
  events: eventsAPI,
  videoCall: videoCallAPI,
  chatbot: chatbotAPI,
  notices: noticesAPI,
  quiz: quizAPI,
  chat: chatAPI,
  teacher: teacherAPI,
  coordinator: coordinatorAPI,
};