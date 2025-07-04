// pages/api/suites.js
// Google Sheets API route with Excel serial number date parsing

const { GoogleSpreadsheet } = require('google-spreadsheet');

export default async function handler(req, res) {
  try {
    // Get target date from query parameter or use today
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    
    // Initialize the sheet
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

    // Initialize Auth (v3.3.0 syntax)
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    // Load the document properties and worksheets
    await doc.loadInfo();

    // Function to get sheet name for a given date
    function getSheetNameForDate(date) {
      const monthNames = [
        'JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI',
        'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      return `${month} ${year}`;
    }

    // Function to find row for specific date in a sheet (EXCEL SERIAL VERSION)
    async function findRowForDate(sheet, targetDate) {
      await sheet.loadCells();
      
      const targetDay = targetDate.getDate();
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      // Convert target date to Excel serial number
      const excelEpoch = new Date(1900, 0, 1);
      const targetSerial = Math.floor((targetDate - excelEpoch) / (24 * 60 * 60 * 1000)) + 2;

      let debugInfo = [];
      debugInfo.push(`EXCEL VERSION: Looking for Day=${targetDay}, Month=${targetMonth}, Year=${targetYear}, Serial=${targetSerial}`);

      // Search through rows starting from row 6 to find matching date
      for (let row = 6; row <= 50; row++) {
        try {
          const dateCell = sheet.getCell(row - 1, 11); // Column L (index 11)
          
          if (dateCell && dateCell.value !== null && dateCell.value !== undefined) {
            const cellValue = parseInt(dateCell.value);
            debugInfo.push(`Row ${row}: Serial=${cellValue}`);
            
            // Check if this matches our target serial number
            if (cellValue === targetSerial) {
              debugInfo.push(`FOUND MATCH at row ${row}! Serial ${cellValue}`);
              return { row: row, debug: debugInfo };
            }
          }
        } catch (error) {
          debugInfo.push(`Row ${row}: Error`);
          continue;
        }
      }
      
      debugInfo.push(`No match found for serial ${targetSerial}`);
      throw new Error(`EXCEL DEBUG: ${debugInfo.join(' | ')}`);
    }

    // Function to get suites data for a specific date
    async function getSuitesDataForDate(targetDate) {
      const sheetName = getSheetNameForDate(targetDate);
      
      // Try to get the sheet for the target date
      let sheet;
      try {
        sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) {
          throw new Error(`Sheet ${sheetName} not found`);
        }
      } catch (error) {
        throw new Error(`Sheet ${sheetName} not found. Planning voor ${targetDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })} nog niet beschikbaar.`);
      }

      // Find the row for this specific date
      const result = await findRowForDate(sheet, targetDate);
      const targetRow = typeof result === 'object' ? result.row : result;

      // Define the suite configurations with their column mappings
      const suitesConfig = [
        { name: 'EM1', titleCol: 'N', editorCol: 'O' },
        { name: 'EM2', titleCol: 'Q', editorCol: 'R' },
        { name: 'EM3', titleCol: 'T', editorCol: 'U' },
        { name: 'EM4', titleCol: 'W', editorCol: 'X' },
        { name: 'EM5', titleCol: 'Z', editorCol: 'AA' },
        { name: 'EM6', titleCol: 'AC', editorCol: 'AD' },
        { name: 'VM1', titleCol: 'AH', editorCol: 'AI' },
        { name: 'VM2', titleCol: 'AK', editorCol: 'AL' },
        { name: 'SCHIJF', titleCol: 'AN', editorCol: 'AO' }
      ];

      // Function to convert column letter to index
      function columnToIndex(col) {
        let result = 0;
        for (let i = 0; i < col.length; i++) {
          result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return result - 1;
      }

      // Extract data for each suite
      const suites = suitesConfig.map(suite => {
        const titleColIndex = columnToIndex(suite.titleCol);
        const editorColIndex = columnToIndex(suite.editorCol);
        
        let title = '';
        let editor = '';
        
        try {
          const titleCell = sheet.getCell(targetRow - 1, titleColIndex);
          const editorCell = sheet.getCell(targetRow - 1, editorColIndex);
          
          title = titleCell && titleCell.value ? titleCell.value.toString().trim() : '';
          editor = editorCell && editorCell.value ? editorCell.value.toString().trim() : '';
        } catch (error) {
          // Cell doesn't exist or is empty
          title = '';
          editor = '';
        }
        
        // Clean editor name (remove "- Pilot", "- EM" suffixes)
        let cleanEditor = editor;
        if (editor && typeof editor === 'string') {
          if (editor.includes(' - Pilot') || editor.includes(' - EM')) {
            cleanEditor = editor.split(' - ')[0].trim();
          }
        }
        
        // Determine status and progress
        const status = title || editor ? 'Bezet' : 'Vrij';
        const progress = status === 'Bezet' ? Math.floor(Math.random() * 80) + 20 : 0;
        
        return {
          name: suite.name,
          editor: cleanEditor,
          project: title,
          status: status,
          progress: progress
        };
      });

      return {
        suites,
        sheetName,
        targetRow
      };
    }

    // Single date request
    const result = await getSuitesDataForDate(targetDate);
    
    res.status(200).json({
      success: true,
      type: 'single',
      targetDate: targetDate.toISOString(),
      sheetName: result.sheetName,
      targetRow: result.targetRow,
      suites: result.suites,
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error accessing Google Sheet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: true,
      suites: [
        { name: 'EM1', editor: 'Isis', project: 'S & F', progress: 50, status: 'Bezet' },
        { name: 'EM2', editor: 'RAID', project: 'Yolanthe', progress: 65, status: 'Bezet' },
        { name: 'EM3', editor: '', project: '', progress: 0, status: 'Vrij' },
        { name: 'EM4', editor: '', project: '', progress: 0, status: 'Vrij' },
        { name: 'EM5', editor: '', project: '', progress: 0, status: 'Vrij' },
        { name: 'EM6', editor: '', project: '', progress: 0, status: 'Vrij' },
        { name: 'VM1', editor: '', project: '', progress: 0, status: 'Vrij' },
        { name: 'VM2', editor: '', project: '', progress: 0, status: 'Vrij' },
        { name: 'SCHIJF', editor: '', project: '', progress: 0, status: 'Vrij' }
      ]
    });
  }
}
