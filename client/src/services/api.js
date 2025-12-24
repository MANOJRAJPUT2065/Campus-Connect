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

export default {
  auth: authAPI,
  posts: postsAPI,
  events: eventsAPI,
  videoCall: videoCallAPI,
  chatbot: chatbotAPI,
  notices: noticesAPI,
  quiz: quizAPI,
  chat: chatAPI,
};