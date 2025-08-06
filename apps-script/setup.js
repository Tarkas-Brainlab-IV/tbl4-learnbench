// Setup function to create necessary spreadsheets
// Run this once from the Apps Script editor before using the web app

function setupPromptLab() {
  console.log('Setting up PromptLab...');
  
  // Create main data spreadsheet
  const SPREADSHEET_NAME = 'PromptLab - Experiment Data';
  
  try {
    // Check if spreadsheet already exists
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    let spreadsheet;
    
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.open(files.next());
      console.log('Spreadsheet already exists:', spreadsheet.getUrl());
    } else {
      // Create new spreadsheet
      spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
      console.log('Created new spreadsheet:', spreadsheet.getUrl());
    }
    
    // Set up prompts sheet
    let promptsSheet = spreadsheet.getSheetByName('Prompts');
    if (!promptsSheet) {
      promptsSheet = spreadsheet.insertSheet('Prompts');
      
      // Add headers
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
      
      console.log('Created Prompts sheet with headers');
    }
    
    // Set up demographics sheet
    let demographicsSheet = spreadsheet.getSheetByName('Demographics');
    if (!demographicsSheet) {
      demographicsSheet = spreadsheet.insertSheet('Demographics');
      
      // Add headers
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
      
      // Protect demographics sheet
      const protection = demographicsSheet.protect()
        .setDescription('Demographics data - restricted access');
      protection.removeEditors(protection.getEditors());
      if (Session.getActiveUser()) {
        protection.addEditor(Session.getActiveUser());
      }
      
      console.log('Created Demographics sheet with headers');
    }
    
    // Store spreadsheet ID for later use
    PropertiesService.getScriptProperties()
      .setProperty('PROMPTLAB_SPREADSHEET_ID', spreadsheet.getId());
    
    // Setup class schedule
    setupYourClassSchedule();
    
    console.log('\n✅ PromptLab setup complete!');
    console.log('Spreadsheet URL:', spreadsheet.getUrl());
    console.log('\nNext steps:');
    console.log('1. Add your Gemini API key to Script Properties');
    console.log('2. Deploy as Web App');
    console.log('3. Share the web app URL with participants');
    
    return {
      success: true,
      spreadsheetUrl: spreadsheet.getUrl(),
      spreadsheetId: spreadsheet.getId()
    };
    
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

// Alternative: Get spreadsheet by stored ID
function getSpreadsheetById() {
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty('PROMPTLAB_SPREADSHEET_ID');
  
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID not found. Please run setupPromptLab() first.');
  }
  
  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    console.error('Cannot open spreadsheet by ID:', error);
    throw error;
  }
}