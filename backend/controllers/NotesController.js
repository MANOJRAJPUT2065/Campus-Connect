import Note from '../models/Notes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all notes data from Notes.json file
export const getAllNotes = async (req, res) => {
    try {
        const notesPath = path.join(__dirname, '../../Notes.json');
        const notesData = fs.readFileSync(notesPath, 'utf8');
        const parsedNotes = JSON.parse(notesData);
        res.json(parsedNotes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to load study materials', message: error.message });
    }
};

export const getBranchNotes = async (req, res) => {
    console.log("Notes Route")
    try {
        const branch = req.query.branch || req.params?.branch;
        if (!branch) {
            return res.status(400).json({ error: 'Missing required parameter: branch' });
        }
        const notes = await Note.findOne({ branch });
        res.json(notes);
        console.log(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
