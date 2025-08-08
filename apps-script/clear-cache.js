/**
 * Clear all caches to ensure fresh data loads
 */
function clearAllCachesAndReset() {
  console.log('Clearing all caches...');
  
  try {
    // Clear script cache
    const cache = CacheService.getScriptCache();
    cache.removeAll(['scenarios_TEST_USER', 'config', 'scenarios']);
    console.log('Script cache cleared');
    
    // Clear any scenario-related caches
    const keys = [
      'scenarios_TEST_USER',
      'scenarios_TEST123', 
      'config',
      'setup_config'
    ];
    
    keys.forEach(key => {
      try {
        cache.remove(key);
        console.log(`Removed cache key: ${key}`);
      } catch (e) {
        // Ignore if key doesn't exist
      }
    });
    
    // Also ensure the script property is set correctly
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('PROMPTLAB_SHEET_ID', '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo');
    console.log('Script property PROMPTLAB_SHEET_ID updated');
    
    // Test scenario loading after cache clear
    console.log('\nTesting scenario loading after cache clear...');
    const scenarios = getAllScenariosForParticipant('TEST_USER');
    console.log('Scenarios loaded:', scenarios ? scenarios.length : 0);
    
    if (scenarios && scenarios.length > 0) {
      console.log('First scenario ID:', scenarios[0].id);
      console.log('First scenario has options:', scenarios[0].options.length);
    }
    
    return {
      success: true,
      message: 'All caches cleared. Please refresh the web app.',
      scenariosFound: scenarios ? scenarios.length : 0
    };
    
  } catch (error) {
    console.error('Error clearing caches:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Force reload scenarios without cache
 */
function forceReloadScenarios() {
  console.log('Force reloading scenarios...');
  
  // Clear cache first
  const cache = CacheService.getScriptCache();
  cache.removeAll(['scenarios_TEST_USER', 'scenarios_TEST123']);
  
  // Load directly from sheet
  const PROMPTLAB_SHEET_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
  const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
  const scenariosSheet = spreadsheet.getSheetByName('Scenarios');
  
  if (!scenariosSheet) {
    return { error: 'Scenarios sheet not found' };
  }
  
  const data = scenariosSheet.getDataRange().getValues();
  const scenarios = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
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
        }
      }
      
      if (scenario.options.length > 0) {
        scenarios.push(scenario);
      }
    }
  }
  
  console.log(`Loaded ${scenarios.length} scenarios directly from sheet`);
  return scenarios;
}