import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname replacement (ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials JSON
const CREDENTIALS_PATH = path.join(__dirname, '../campusconnect-sheet-api-credentials.json');
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

// Destructure credentials
const { client_email, private_key } = credentials;

// Spreadsheet ID (from your sheet URL)
const SPREADSHEET_ID = '1qyJvbO8hyCXZ9m_3I9IWrtAHnp1FHutshb-o_cVcYgI';

// Google Auth
const auth = new google.auth.JWT(
  client_email,
  null,
  private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

// Sheets instance
const sheets = google.sheets({ version: 'v4', auth });

export const appendEventToSheet = async (eventData) => {
    console.log('Google sheets workingss......');
  try {
    const {
      clubName,
      clubCoordinator,
      contactNumber,
      eventName,
      eventDescription,
      eventDate,
      eventTime,
      venue,
      registrationLink,
      eventImage
    } = eventData;

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1', // Start appending from top
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            clubName,
            clubCoordinator,
            contactNumber,
            eventName,
            eventDescription,
            eventDate,
            eventTime,
            venue,
            registrationLink,
            eventImage
          ]
        ]
      }
    });

    console.log('Event added to Google Sheet ✅');
  } catch (error) {
    console.error('❌ Failed to append event to Google Sheet:', error);
  }
};
