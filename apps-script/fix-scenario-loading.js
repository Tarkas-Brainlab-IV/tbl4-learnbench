/**
 * OVERRIDE the broken getAllScenariosForParticipant with a working version
 */
function getAllScenariosForParticipantFIXED(participantId) {
  console.log('Using FIXED scenario loader, bypassing cache');
  
  // CLEAR THE CORRUPTED CACHE FIRST
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll([`scenarios_${participantId}`]);
  } catch (e) {
    // Ignore cache clear errors
  }
  
  try {
    // Direct access to the correct spreadsheet
    const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
    const ss = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    const scenariosSheet = ss.getSheetByName('Scenarios');
    
    if (!scenariosSheet) {
      console.error('No Scenarios sheet found');
      return [];
    }
    
    const data = scenariosSheet.getDataRange().getValues();
    const scenarios = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[0] && row[1]) { // Has ID and text
        const scenario = {
          id: String(row[0]),
          text: String(row[1]), // NOT title, but text!
          imageUrl: row[2] || null,
          options: [] // Array of objects, not strings!
        };
        
        // Parse options correctly (Option1, Score1, Option2, Score2, etc.)
        for (let j = 0; j < 5; j++) {
          const optionIdx = 3 + (j * 2); // 3, 5, 7, 9, 11
          const scoreIdx = 4 + (j * 2);  // 4, 6, 8, 10, 12
          
          if (row[optionIdx] && row[optionIdx] !== '') {
            scenario.options.push({
              id: `option_${j + 1}`,
              text: String(row[optionIdx]),
              score: Number(row[scoreIdx]) || 0
            });
          }
        }
        
        if (scenario.options.length > 0) {
          scenarios.push(scenario);
        }
      }
    }
    
    console.log(`Loaded ${scenarios.length} scenarios with correct structure`);
    if (scenarios.length > 0) {
      console.log('First scenario check:', {
        hasText: !!scenarios[0].text,
        hasTitle: !!scenarios[0].title,
        optionsAreObjects: typeof scenarios[0].options[0] === 'object',
        firstOptionHasText: !!scenarios[0].options[0].text
      });
    }
    
    return scenarios;
    
  } catch (error) {
    console.error('Error in FIXED loader:', error);
    return [];
  }
}

/**
 * Clear the bad cache and replace getAllScenariosForParticipant
 */
function fixScenarioLoading() {
  console.log('=== FIXING SCENARIO LOADING ===');
  
  // Clear ALL scenario caches
  try {
    const cache = CacheService.getScriptCache();
    const keysToRemove = [];
    
    // Try to remove all possible scenario cache keys
    for (let i = 0; i < 100; i++) {
      keysToRemove.push(`scenarios_${i}`);
      keysToRemove.push(`scenario_${i}`);
    }
    keysToRemove.push('scenarios_TEST_USER');
    keysToRemove.push('scenarios_TEST123');
    keysToRemove.push('scenarios');
    
    cache.removeAll(keysToRemove);
    console.log('Cleared scenario caches');
  } catch (e) {
    console.log('Cache clear error:', e);
  }
  
  // Test the fixed function
  const scenarios = getAllScenariosForParticipantFIXED('TEST_USER');
  console.log('Fixed function returns:', scenarios);
  
  return scenarios;
}

/**
 * Override the broken function globally
 * ENABLED: This fixes the cache corruption issue
 */
getAllScenariosForParticipant = getAllScenariosForParticipantFIXED;