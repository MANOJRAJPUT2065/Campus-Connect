import express from 'express';
import { LikeRoute, UnlikeRoute, getRoute } from '../controllers/LikePostController.js';

const router = express.Router();

router.post('/like', LikeRoute);
router.post('/unlike', UnlikeRoute);
router.get('/getLikes', getRoute);

export default router;