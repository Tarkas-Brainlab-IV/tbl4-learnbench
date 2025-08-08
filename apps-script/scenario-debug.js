/**
 * Debug version of getAllScenariosForParticipant that bypasses cache
 */
function getAllScenariosForParticipantDEBUG(participantId) {
  console.log('DEBUG: getAllScenariosForParticipantDEBUG called with participantId:', participantId);
  
  try {
    // Direct access, no cache
    const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
    console.log('DEBUG: Opening spreadsheet:', PROMPTLAB_SHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    console.log('DEBUG: Spreadsheet opened:', spreadsheet.getName());
    
    // Get Scenarios sheet
    const scenariosSheet = spreadsheet.getSheetByName('Scenarios');
    if (!scenariosSheet) {
      console.log('DEBUG: ERROR - No Scenarios sheet found!');
      return [];
    }
    
    console.log('DEBUG: Found Scenarios sheet');
    
    // Get all data
    const data = scenariosSheet.getDataRange().getValues();
    console.log('DEBUG: Got data, rows:', data.length);
    console.log('DEBUG: Headers:', data[0]);
    
    const scenarios = [];
    
    // Parse each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`DEBUG: Processing row ${i}:`, row[0], row[1] ? row[1].substring(0, 50) : 'empty');
      
      if (row[0] && row[1]) {
        const scenario = {
          id: String(row[0]),
          text: String(row[1]),
          imageUrl: row[2] || null,
          options: []
        };
        
        // Parse options
        for (let j = 0; j < 5; j++) {
          const optionIdx = 3 + (j * 2);
          const scoreIdx = 4 + (j * 2);
          
          if (row[optionIdx] && row[optionIdx] !== '') {
            scenario.options.push({
              id: `option_${j + 1}`,
              text: String(row[optionIdx]),
              score: Number(row[scoreIdx]) || 0
            });
            console.log(`DEBUG: Added option ${j+1}:`, row[optionIdx]);
          }
        }
        
        if (scenario.options.length > 0) {
          scenarios.push(scenario);
          console.log(`DEBUG: Added scenario ${scenario.id} with ${scenario.options.length} options`);
        }
      }
    }
    
    console.log(`DEBUG: Returning ${scenarios.length} scenarios`);
    console.log('DEBUG: First scenario:', scenarios[0]);
    
    return scenarios;
    
  } catch (error) {
    console.error('DEBUG: ERROR in getAllScenariosForParticipantDEBUG:', error);
    console.error('DEBUG: Stack trace:', error.stack);
    return [];
  }
}

/**
 * Test function to call from Apps Script editor
 */
function testDebugScenarios() {
  const result = getAllScenariosForParticipantDEBUG('TEST_USER');
  console.log('Result:', result);
  return result;
}