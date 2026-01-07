import express from 'express';
import { getMessages, sendMessage, getChats, getUsersForChat } from '../controllers/MessageController.js';

const router = express.Router();

// Get all messages between two users
router.get('/getMessages', getMessages);

// Send a new message
router.post('/send', sendMessage);

// Get chats list for current user
router.get('/chats', getChats);

// Get all users for chat
router.get('/users', getUsersForChat);

export default router;