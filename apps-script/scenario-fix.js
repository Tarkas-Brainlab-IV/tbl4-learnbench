/**
 * Fix for scenario loading - Run debugScenarios() from Apps Script editor
 */

function debugScenarios() {
  console.log('=== DEBUGGING SCENARIO LOADING ===');
  
  try {
    // Get the correct spreadsheet
    const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
    console.log('Using spreadsheet ID:', PROMPTLAB_SHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    console.log('Spreadsheet name:', spreadsheet.getName());
    
    // List all sheets
    const sheets = spreadsheet.getSheets();
    console.log('Available sheets:', sheets.map(s => s.getName()).join(', '));
    
    // Look for Scenarios sheet
    let scenariosSheet = spreadsheet.getSheetByName('Scenarios');
    if (!scenariosSheet) {
      console.log('ERROR: No "Scenarios" sheet found!');
      console.log('Looking for sheet with scenario data...');
      
      // Check each sheet for scenario-like data
      for (const sheet of sheets) {
        const data = sheet.getRange(1, 1, Math.min(2, sheet.getLastRow()), Math.min(10, sheet.getLastColumn())).getValues();
        if (data[0] && data[0][0] === 'ScenarioID') {
          console.log('Found scenario data in sheet:', sheet.getName());
          scenariosSheet = sheet;
          break;
        }
      }
    }
    
    if (!scenariosSheet) {
      return 'ERROR: Could not find Scenarios sheet or scenario data';
    }
    
    console.log('Using sheet:', scenariosSheet.getName());
    
    // Get the data
    const data = scenariosSheet.getDataRange().getValues();
    console.log('Total rows:', data.length);
    console.log('Headers:', data[0]);
    
    // Parse scenarios
    const scenarios = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        const scenario = {
          id: row[0],
          text: row[1],
          imageUrl: row[2] || null,
          options: []
        };
        
        // Parse options - they come in pairs (Option1, Score1, Option2, Score2, etc.)
        for (let j = 0; j < 5; j++) {
          const optionIdx = 3 + (j * 2);
          const scoreIdx = 4 + (j * 2);
          
          if (row[optionIdx]) {
            scenario.options.push({
              id: `option_${j + 1}`,
              text: row[optionIdx],
              score: row[scoreIdx] || 0
            });
          }
        }
        
        scenarios.push(scenario);
        console.log(`Scenario ${i}: ${scenario.id} - ${scenario.options.length} options`);
      }
    }
    
    console.log(`\nTotal scenarios loaded: ${scenarios.length}`);
    
    if (scenarios.length > 0) {
      console.log('\nFirst scenario:');
      console.log('ID:', scenarios[0].id);
      console.log('Text preview:', scenarios[0].text.substring(0, 100) + '...');
      console.log('Options:');
      scenarios[0].options.forEach(opt => {
        console.log(`  - ${opt.text} (score: ${opt.score})`);
      });
    }
    
    // Now test the actual function
    console.log('\n=== Testing getAllScenariosForParticipant ===');
    const result = getAllScenariosForParticipant('TEST_USER');
    console.log('Function returned:', result ? result.length + ' scenarios' : 'null/empty');
    
    return {
      sheetsFound: sheets.map(s => s.getName()),
      scenariosSheet: scenariosSheet ? scenariosSheet.getName() : 'NOT FOUND',
      scenariosLoaded: scenarios.length,
      functionResult: result ? result.length : 0
    };
    
  } catch (error) {
    console.error('ERROR:', error);
    return 'ERROR: ' + error.toString();
  }
}

// Fixed version of getAllScenariosForParticipant
function getAllScenariosForParticipantFixed(participantId) {
  try {
    // Use the correct spreadsheet ID directly
    const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    
    // Get the Scenarios sheet
    let scenariosSheet = spreadsheet.getSheetByName('Scenarios');
    
    if (!scenariosSheet) {
      console.log('Scenarios sheet not found, checking for sheet with scenario data...');
      
      // Look for a sheet with ScenarioID header
      const sheets = spreadsheet.getSheets();
      for (const sheet of sheets) {
        const firstCell = sheet.getRange(1, 1).getValue();
        if (firstCell === 'ScenarioID') {
          scenariosSheet = sheet;
          console.log('Found scenarios in sheet:', sheet.getName());
          break;
        }
      }
    }
    
    if (!scenariosSheet) {
      console.error('No Scenarios sheet found');
      return [];
    }
    
    // Get all data
    const data = scenariosSheet.getDataRange().getValues();
    const scenarios = [];
    
    console.log(`Processing ${data.length - 1} scenario rows`);
    
    // Parse each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Check if row has scenario ID and text
      if (row[0] && row[1]) {
        const scenario = {
          id: String(row[0]),
          text: String(row[1]),
          imageUrl: row[2] || null,
          options: []
        };
        
        // Parse options (Option1, Score1, Option2, Score2, etc.)
        for (let j = 0; j < 5; j++) {
          const optionIdx = 3 + (j * 2);
          const scoreIdx = 4 + (j * 2);
          
          if (row[optionIdx] && row[optionIdx] !== '') {
            scenario.options.push({
              id: `option_${j + 1}`,
              text: String(row[optionIdx]),
              score: Number(row[scoreIdx]) || 0
            });
          }
        }
        
        // Only add scenarios that have options
        if (scenario.options.length > 0) {
          scenarios.push(scenario);
        }
      }
    }
    
    console.log(`Returning ${scenarios.length} scenarios`);
    return scenarios;
    
  } catch (error) {
    console.error('Error loading scenarios:', error);
    return [];
  }
}