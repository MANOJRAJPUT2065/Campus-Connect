// backend/routes/ContactRoute.js
import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const CREDENTIALS_PATH = path.join(process.cwd(), 'backend', 'campusconnect-sheet-api-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const SPREADSHEET_ID = '1qyJvbO8hyCXZ9m_3I9IWrtAHnp1FHutshb-o_cVcYgI';
const range = 'Sheet1!A1'; // assuming the main sheet is named "Sheet1"

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1', // Make sure "Sheet1" exists in your spreadsheet
      valueInputOption: 'RAW',
      requestBody: {
        values: [[name, email, message, new Date().toISOString()]],
      },
    });

    res.status(200).json({ message: 'Form submitted successfully', data: response.data });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

export default router;
