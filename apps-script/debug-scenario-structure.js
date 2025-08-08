/**
 * Debug the actual scenario structure being returned
 */
function debugScenarioStructure() {
  console.log('=== DEBUGGING SCENARIO STRUCTURE ===');
  
  // Test 1: Direct call to getAllScenariosForParticipant
  console.log('\n1. Direct call to getAllScenariosForParticipant:');
  const direct = getAllScenariosForParticipant('TEST_USER');
  console.log('Result:', JSON.stringify(direct, null, 2));
  
  // Test 2: Check if getAllScenariosCached exists and what it returns
  console.log('\n2. Checking getAllScenariosCached:');
  if (typeof getAllScenariosCached !== 'undefined') {
    const cached = getAllScenariosCached('TEST_USER');
    console.log('Cached result:', JSON.stringify(cached, null, 2));
  } else {
    console.log('getAllScenariosCached is not defined');
  }
  
  // Test 3: Direct sheet access
  console.log('\n3. Direct sheet access:');
  try {
    const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
    const ss = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    const scenariosSheet = ss.getSheetByName('Scenarios');
    
    if (scenariosSheet) {
      const data = scenariosSheet.getDataRange().getValues();
      console.log('Headers:', data[0]);
      console.log('First data row:', data[1]);
      
      // Build scenario the way we expect
      const row = data[1];
      const expectedScenario = {
        id: String(row[0]),
        text: String(row[1]),
        imageUrl: row[2] || null,
        options: []
      };
      
      // Parse options correctly
      for (let j = 0; j < 5; j++) {
        const optionIdx = 3 + (j * 2);
        const scoreIdx = 4 + (j * 2);
        
        if (row[optionIdx] && row[optionIdx] !== '') {
          expectedScenario.options.push({
            id: `option_${j + 1}`,
            text: String(row[optionIdx]),
            score: Number(row[scoreIdx]) || 0
          });
        }
      }
      
      console.log('\nExpected scenario structure:');
      console.log(JSON.stringify(expectedScenario, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 4: Check if there's another scenarios implementation
  console.log('\n4. Checking for other implementations:');
  
  // List all functions that might be related
  const functionsToCheck = [
    'getAllScenarios',
    'getScenarios', 
    'loadScenarios',
    'fetchScenarios'
  ];
  
  functionsToCheck.forEach(fname => {
    if (typeof global[fname] === 'function') {
      console.log(`Found function: ${fname}`);
      try {
        const result = global[fname]('TEST_USER');
        console.log(`${fname} returns:`, result);
      } catch (e) {
        console.log(`${fname} error:`, e.toString());
      }
    }
  });
  
  return 'Check logs for results';
}

/**
 * Fix the scenario structure if it's wrong
 */
function fixScenarioStructure(wrongScenario) {
  // Convert from wrong structure to correct structure
  if (wrongScenario.title && !wrongScenario.text) {
    return {
      id: wrongScenario.id,
      text: wrongScenario.title, // Use title as text
      imageUrl: wrongScenario.imageUrl || null,
      options: [] // Will need to rebuild options correctly
    };
  }
  return wrongScenario;
}