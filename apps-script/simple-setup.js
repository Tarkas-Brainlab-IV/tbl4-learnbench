// Simplified setup - just create a sheet in the current spreadsheet container
function simpleSetup() {
  console.log('Running simple setup...');
  
  try {
    // Method 1: Try to get the active spreadsheet (if running from a container-bound script)
    let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (spreadsheet) {
      console.log('Using active spreadsheet:', spreadsheet.getName());
    } else {
      // Method 2: Try to create via DriveApp
      console.log('No active spreadsheet, trying DriveApp...');
      
      // Create a new Google Sheets file
      const file = DriveApp.createFile('PromptLab Data', '', MimeType.GOOGLE_SHEETS);
      const fileId = file.getId();
      
      // Open it as a spreadsheet
      spreadsheet = SpreadsheetApp.openById(fileId);
      console.log('Created spreadsheet via DriveApp');
    }
    
    // Store the ID
    PropertiesService.getScriptProperties()
      .setProperty('PROMPTLAB_SPREADSHEET_ID', spreadsheet.getId());
    
    // Set up sheets
    setupSheets(spreadsheet);
    
    console.log('✅ Setup complete!');
    console.log('Spreadsheet URL:', spreadsheet.getUrl());
    
    return {
      success: true,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl()
    };
    
  } catch (error) {
    console.error('Simple setup failed:', error);
    
    // Last resort - manual instructions
    console.log('\n🔧 MANUAL SETUP REQUIRED:');
    console.log('1. Create a new Google Sheet manually');
    console.log('2. Copy its ID from the URL');
    console.log('3. Run: setSpreadsheetId("YOUR_ID_HERE")');
    
    throw error;
  }
}

// Manual setup helper
function setSpreadsheetId(spreadsheetId) {
  try {
    // Test that we can open it
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    console.log('Successfully opened spreadsheet:', spreadsheet.getName());
    
    // Store the ID
    PropertiesService.getScriptProperties()
      .setProperty('PROMPTLAB_SPREADSHEET_ID', spreadsheetId);
    
    // Set up sheets
    setupSheets(spreadsheet);
    
    console.log('✅ Manual setup complete!');
    return true;
    
  } catch (error) {
    console.error('Failed to open spreadsheet with ID:', spreadsheetId);
    throw error;
  }
}

// Helper to set up sheets
function setupSheets(spreadsheet) {
  // Set up prompts sheet
  let promptsSheet = spreadsheet.getSheetByName('Prompts');
  if (!promptsSheet) {
    // Rename the first sheet if it exists
    const sheets = spreadsheet.getSheets();
    if (sheets.length > 0) {
      promptsSheet = sheets[0];
      promptsSheet.setName('Prompts');
    } else {
      promptsSheet = spreadsheet.insertSheet('Prompts');
    }
  }
  
  // Clear and set headers
  promptsSheet.clear();
  promptsSheet.getRange(1, 1, 1, 10).setValues([[
    'Timestamp',
    'Participant ID',
    'Cohort ID',
    'Prompt',
    'Model Response',
    'Response Time (ms)',
    'Status',
    'Context Used',
    'Session Type',
    'Notes'
  ]]);
  
  // Format headers
  promptsSheet.getRange(1, 1, 1, 10)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  // Set column widths
  promptsSheet.setColumnWidth(1, 150); // Timestamp
  promptsSheet.setColumnWidth(2, 100); // Participant ID
  promptsSheet.setColumnWidth(3, 120); // Cohort ID
  promptsSheet.setColumnWidth(4, 300); // Prompt
  promptsSheet.setColumnWidth(5, 400); // Response
  
  console.log('Set up Prompts sheet');
  
  // Set up demographics sheet
  let demographicsSheet = spreadsheet.getSheetByName('Demographics');
  if (!demographicsSheet) {
    demographicsSheet = spreadsheet.insertSheet('Demographics');
  }
  
  // Clear and set headers
  demographicsSheet.clear();
  demographicsSheet.getRange(1, 1, 1, 12).setValues([[
    'Timestamp',
    'Participant ID',
    'Age Group',
    'Gender',
    'Education',
    'Discipline',
    'English Proficiency',
    'Coding Experience',
    'AI Usage',
    'Military Experience',
    'Demographics Provided',
    'Consent Given'
  ]]);
  
  // Format headers
  demographicsSheet.getRange(1, 1, 1, 12)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  console.log('Set up Demographics sheet');
}

// Test function to verify setup
function testSetup() {
  try {
    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty('PROMPTLAB_SPREADSHEET_ID');
    
    if (!spreadsheetId) {
      console.log('❌ No spreadsheet ID found. Run simpleSetup() first.');
      return false;
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    console.log('✅ Spreadsheet found:', spreadsheet.getName());
    console.log('URL:', spreadsheet.getUrl());
    
    const promptsSheet = spreadsheet.getSheetByName('Prompts');
    const demographicsSheet = spreadsheet.getSheetByName('Demographics');
    
    console.log('✅ Prompts sheet:', promptsSheet ? 'Found' : 'Missing');
    console.log('✅ Demographics sheet:', demographicsSheet ? 'Found' : 'Missing');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}