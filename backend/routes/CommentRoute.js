import express from 'express';
import { postRoute, deleteRoute, getRoute } from '../controllers/CommentController.js';

const router = express.Router();

router.post('/addComment', postRoute);
router.delete('/deleteComment/:id', deleteRoute);
router.get('/getComments/:postId', getRoute);

export default router;