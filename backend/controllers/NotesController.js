import Note from '../models/Notes.js';

export const getBranchNotes = async (req, res) => {
    console.log("Notes Route")
    try {
        const { branch } = req.params;
        const notes = await Note.findOne({ branch });
        res.json(notes);
        console.log(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
