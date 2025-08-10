import express from 'express';
import userProfileRoute from './UserProfileRoute.js';
import authRoute from './AuthRoute.js';

const router = express.Router();

// Mount user profile routes
router.use('/profile', userProfileRoute);

// Mount authentication routes
router.use('/auth', authRoute);

export default router;
