/**
 * FIX THE SPREADSHEET ID ONCE AND FOR ALL
 * Run this function to ensure all functions use the correct spreadsheet
 */
function fixSpreadsheetId() {
  const CORRECT_ID = '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo';
  
  console.log('=== FIXING SPREADSHEET ID ===');
  
  // Set the script property
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('PROMPTLAB_SHEET_ID', CORRECT_ID);
  console.log('✅ Script property PROMPTLAB_SHEET_ID set to:', CORRECT_ID);
  
  // Verify we can open it
  try {
    const ss = SpreadsheetApp.openById(CORRECT_ID);
    console.log('✅ Successfully opened spreadsheet:', ss.getName());
    
    // List all sheets
    const sheets = ss.getSheets();
    console.log('Available sheets:', sheets.map(s => s.getName()).join(', '));
    
    // Check for Scenarios sheet
    const scenariosSheet = ss.getSheetByName('Scenarios');
    if (scenariosSheet) {
      const data = scenariosSheet.getDataRange().getValues();
      console.log('✅ Scenarios sheet found with', data.length - 1, 'scenarios');
      
      // Show first scenario
      if (data.length > 1) {
        console.log('First scenario ID:', data[1][0]);
        console.log('First scenario text preview:', data[1][1].substring(0, 50) + '...');
      }
    } else {
      console.log('❌ No Scenarios sheet found!');
    }
    
  } catch (error) {
    console.error('❌ Error opening spreadsheet:', error);
    return false;
  }
  
  // Clear ALL caches
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll(['scenarios_TEST_USER', 'scenarios_TEST123', 'config']);
    console.log('✅ Cache cleared');
  } catch (e) {
    console.log('Cache clear error:', e);
  }
  
  // Now test the getAllScenariosForParticipant function
  console.log('\n=== Testing getAllScenariosForParticipant ===');
  try {
    const scenarios = getAllScenariosForParticipant('TEST_USER');
    console.log('Function returned:', scenarios ? scenarios.length + ' scenarios' : 'null');
    
    if (scenarios && scenarios.length > 0) {
      console.log('✅ SUCCESS! Scenarios are loading correctly');
      console.log('First scenario:', scenarios[0].id, '-', scenarios[0].options.length, 'options');
    } else {
      console.log('❌ FAILED! No scenarios returned');
    }
  } catch (error) {
    console.log('❌ ERROR calling getAllScenariosForParticipant:', error);
  }
  
  return true;
}

/**
 * Verify what spreadsheet ID is currently being used
 */
function checkCurrentSpreadsheetId() {
  console.log('=== CHECKING CURRENT CONFIGURATION ===');
  
  // Check script property
  const scriptProperties = PropertiesService.getScriptProperties();
  const currentId = scriptProperties.getProperty('PROMPTLAB_SHEET_ID');
  console.log('Current PROMPTLAB_SHEET_ID in script properties:', currentId);
  
  // Try to open it
  if (currentId) {
    try {
      const ss = SpreadsheetApp.openById(currentId);
      console.log('This opens spreadsheet:', ss.getName());
      console.log('URL:', ss.getUrl());
    } catch (error) {
      console.log('ERROR: Cannot open this spreadsheet ID');
    }
  } else {
    console.log('ERROR: No PROMPTLAB_SHEET_ID set in script properties!');
  }
  
  // Check what getOrCreateSheet returns
  try {
    const sheet = getOrCreateSheet();
    const ss = sheet.getParent();
    console.log('\ngetOrCreateSheet() returns sheet from:', ss.getName());
    console.log('Spreadsheet ID:', ss.getId());
    console.log('URL:', ss.getUrl());
  } catch (error) {
    console.log('ERROR calling getOrCreateSheet():', error);
  }
  
  return currentId;
}