import express from 'express';
import { getBranchNotes, getAllNotes } from '../controllers/NotesController.js';

const router = express.Router();

// Get all notes data from Notes.json
router.get('/', getAllNotes);

// Support both query param and path param for flexibility
router.get('/getNotes', getBranchNotes);
router.get('/getBranchNotes/:branch', getBranchNotes);

export default router;
