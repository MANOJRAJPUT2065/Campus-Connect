import express from 'express';
import { getBranchNotes } from '../controllers/NotesController.js';

const router = express.Router();

router.get('/getNotes', getBranchNotes);

export default router;
