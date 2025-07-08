import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    // Google Sheets configuratie
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:E', // Pas aan naar je range
    });

    const rows = response.data.values || [];
    
    // Transform data naar het juiste formaat
    const suites = rows.slice(1).map(row => ({
      name: row[0] || '',
      editor: row[1] || '',
      project: row[2] || '',
      progress: parseInt(row[3]) || 0,
      status: row[4] || 'Vrij'
    }));

    res.status(200).json({ success: true, suites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
