import express from 'express';
import userProfileRoute from './UserProfileRoute.js';
import authRoute from './AuthRoute.js';
import User from '../models/User.js';

const router = express.Router();

// Mount user profile routes
router.use('/profile', userProfileRoute);

// Mount authentication routes
router.use('/auth', authRoute);

// Get all users (for chat)
router.get('/all', async (req, res) => {
  try {
    const users = await User.find().select('email username role usn -_id');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
