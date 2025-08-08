/**
 * Find where the wrong scenario structure is coming from
 */
function findWrongStructure() {
  console.log('=== FINDING SOURCE OF WRONG STRUCTURE ===');
  
  // Check the actual Scenarios sheet structure
  const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
  const ss = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
  
  // List ALL sheets
  const sheets = ss.getSheets();
  console.log('All sheets in spreadsheet:');
  sheets.forEach(sheet => {
    console.log(`- ${sheet.getName()}`);
    
    // Check if any sheet has scenario-like data
    if (sheet.getLastRow() > 0) {
      const firstRow = sheet.getRange(1, 1, 1, Math.min(10, sheet.getLastColumn())).getValues()[0];
      
      // Look for sheets with scenario-related headers
      if (firstRow.some(cell => String(cell).toLowerCase().includes('scenario'))) {
        console.log(`  Found scenario-related headers in ${sheet.getName()}:`, firstRow);
        
        // Get second row to see data structure
        if (sheet.getLastRow() > 1) {
          const dataRow = sheet.getRange(2, 1, 1, Math.min(10, sheet.getLastColumn())).getValues()[0];
          console.log(`  First data row:`, dataRow);
        }
      }
    }
  });
  
  // Check what parseScenarioOptions does if it exists
  console.log('\nChecking parseScenarioOptions function:');
  if (typeof parseScenarioOptions !== 'undefined') {
    // Test with the data from the sheet
    const testData = ['Clinic', 'Water pump', 'Community hall', 'None (Hold the generator in reserve)'];
    const parsed = parseScenarioOptions(testData[0]);
    console.log('parseScenarioOptions("Clinic") returns:', parsed);
  }
  
  // Check if there's a different getAllScenarios function
  console.log('\nChecking for conflicting functions:');
  
  // Get all global functions
  const globalFunctions = Object.keys(this).filter(key => typeof this[key] === 'function');
  const scenarioFunctions = globalFunctions.filter(name => 
    name.toLowerCase().includes('scenario') || 
    name.toLowerCase().includes('getall')
  );
  
  console.log('Found scenario-related functions:', scenarioFunctions);
  
  return 'Check logs';
}

/**
 * Create the CORRECT scenario structure from sheet data
 */
function createCorrectScenario() {
  const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
  const ss = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
  const scenariosSheet = ss.getSheetByName('Scenarios');
  
  if (!scenariosSheet) {
    return 'No Scenarios sheet found';
  }
  
  const data = scenariosSheet.getDataRange().getValues();
  console.log('Sheet headers:', data[0]);
  console.log('First data row:', data[1]);
  
  // Create the CORRECT structure
  const row = data[1];
  const correctScenario = {
    id: String(row[0]),
    text: String(row[1]), // ScenarioText column
    imageUrl: row[2] || null,
    options: []
  };
  
  // Parse options CORRECTLY
  // Options are in pairs: Option1, Score1, Option2, Score2, etc.
  for (let j = 0; j < 5; j++) {
    const optionIdx = 3 + (j * 2); // 3, 5, 7, 9, 11
    const scoreIdx = 4 + (j * 2);  // 4, 6, 8, 10, 12
    
    if (row[optionIdx] && row[optionIdx] !== '') {
      correctScenario.options.push({
        id: `option_${j + 1}`,
        text: String(row[optionIdx]),
        score: Number(row[scoreIdx]) || 0
      });
    }
  }
  
  console.log('\nCORRECT scenario structure:');
  console.log(JSON.stringify(correctScenario, null, 2));
  
  return correctScenario;
}