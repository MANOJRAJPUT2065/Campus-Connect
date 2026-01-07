import Message from '../models/Messages.js';
import User from '../models/User.js';

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: 'Error retrieving messages' });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: 'senderId, receiverId, and message are required' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message
    });

    await newMessage.save();
    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
};

// Get chats list for current user (unique conversations)
export const getChats = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get unique chat partners
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });

    // Extract unique participants
    const participantSet = new Set();
    messages.forEach(msg => {
      if (msg.senderId === userId) participantSet.add(msg.receiverId);
      if (msg.receiverId === userId) participantSet.add(msg.senderId);
    });

    const participants = Array.from(participantSet);
    
    // Fetch user details for each participant
    const chats = await Promise.all(
      participants.map(async (participantId) => {
        const user = await User.findOne({ $or: [{ email: participantId }, { usn: participantId }] });
        const lastMessage = messages.find(
          m => (m.senderId === userId && m.receiverId === participantId) ||
               (m.senderId === participantId && m.receiverId === userId)
        );

        return {
          participantId,
          name: user?.username || participantId,
          email: user?.email,
          avatar: `https://ui-avatars.com/api/?name=${user?.username || participantId}&background=random`,
          lastMessage: lastMessage?.message || 'No messages yet',
          timestamp: lastMessage?.createdAt || new Date(),
          isGroup: false,
        };
      })
    );

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Error fetching chats' });
  }
};

// Get all users for starting new chat
export const getUsersForChat = async (req, res) => {
  try {
    const users = await User.find().select('email username role usn');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

