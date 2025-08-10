import express from 'express';
import { addRoute, removeRoute, checkRoute, getRoute } from '../controllers/BookmarkController.js';

const router = express.Router();

router.post('/add', addRoute);
router.delete('/remove', removeRoute);
router.get('/check', checkRoute);
router.get('/get', getRoute);

export default router;