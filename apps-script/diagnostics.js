/**
 * Diagnostic functions to understand why SpreadsheetApp.create is failing
 */

function runDiagnostics() {
  console.log('🔍 Running PromptLab Diagnostics...\n');
  
  const results = {};
  
  // Test 1: Check if SpreadsheetApp exists
  try {
    results.spreadsheetAppExists = typeof SpreadsheetApp !== 'undefined';
    console.log('1. SpreadsheetApp exists:', results.spreadsheetAppExists);
  } catch (e) {
    results.spreadsheetAppExists = false;
    console.log('1. SpreadsheetApp check failed:', e.toString());
  }
  
  // Test 2: Check available methods
  try {
    if (results.spreadsheetAppExists) {
      const methods = Object.getOwnPropertyNames(SpreadsheetApp);
      results.availableMethods = methods;
      console.log('2. Available SpreadsheetApp methods:', methods.length);
      console.log('   Includes create?', methods.includes('create'));
      console.log('   Includes openById?', methods.includes('openById'));
      console.log('   First 10 methods:', methods.slice(0, 10).join(', '));
    }
  } catch (e) {
    console.log('2. Method check failed:', e.toString());
  }
  
  // Test 3: Check script type
  try {
    results.scriptType = 'unknown';
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getActiveSpreadsheet) {
      try {
        const active = SpreadsheetApp.getActiveSpreadsheet();
        results.scriptType = active ? 'container-bound' : 'standalone';
        results.activeSpreadsheetName = active ? active.getName() : null;
      } catch (e) {
        results.scriptType = 'standalone';
      }
    }
    console.log('3. Script type:', results.scriptType);
  } catch (e) {
    console.log('3. Script type check failed:', e.toString());
  }
  
  // Test 4: Try alternative creation methods
  console.log('\n4. Testing alternative creation methods...');
  
  // Method A: Try using getActiveSpreadsheet
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      console.log('   ✅ Can access active spreadsheet:', active.getName());
      results.canUseActive = true;
    } else {
      console.log('   ❌ No active spreadsheet');
      results.canUseActive = false;
    }
  } catch (e) {
    console.log('   ❌ getActiveSpreadsheet failed:', e.toString());
    results.canUseActive = false;
  }
  
  // Method B: Try openById with a test ID
  try {
    // This will fail but shows if openById exists
    SpreadsheetApp.openById('test');
  } catch (e) {
    if (e.toString().includes('Invalid argument')) {
      console.log('   ✅ openById method exists (failed with invalid ID as expected)');
      results.canUseOpenById = true;
    } else {
      console.log('   ❌ openById failed unexpectedly:', e.toString());
      results.canUseOpenById = false;
    }
  }
  
  // Method C: Check if this is a restricted environment
  try {
    results.isRestricted = false;
    
    // Check for G Suite domain restrictions
    const userEmail = Session.getActiveUser().getEmail();
    console.log('5. User email:', userEmail || 'Not available');
    
    // Check execution environment
    console.log('6. Execution environment:');
    console.log('   Timezone:', Session.getScriptTimeZone());
    console.log('   Effective user:', Session.getEffectiveUser().getEmail() || 'Not available');
    
  } catch (e) {
    console.log('Environment check failed:', e.toString());
  }
  
  // Test 5: Try DriveApp
  console.log('\n7. Testing DriveApp...');
  try {
    results.driveAppExists = typeof DriveApp !== 'undefined';
    console.log('   DriveApp exists:', results.driveAppExists);
    
    if (results.driveAppExists) {
      // Try to create a file
      const testFile = DriveApp.createFile('test.txt', 'test content');
      console.log('   ✅ Can create files with DriveApp');
      results.canUseDriveApp = true;
      
      // Clean up
      testFile.setTrashed(true);
    }
  } catch (e) {
    console.log('   ❌ DriveApp test failed:', e.toString());
    results.canUseDriveApp = false;
  }
  
  // Recommendations
  console.log('\n📋 DIAGNOSTICS SUMMARY:');
  console.log('=======================');
  
  if (!results.spreadsheetAppExists) {
    console.log('❌ CRITICAL: SpreadsheetApp is not available at all!');
    console.log('   This suggests a serious environment issue.');
  } else if (results.availableMethods && !results.availableMethods.includes('create')) {
    console.log('❌ SpreadsheetApp.create method is missing!');
    console.log('   This is very unusual and suggests:');
    console.log('   - You may be in a restricted Google Workspace environment');
    console.log('   - Your account may have limited permissions');
    console.log('   - The Apps Script runtime may be restricted');
  }
  
  if (results.scriptType === 'container-bound' && results.canUseActive) {
    console.log('✅ This is a container-bound script with active spreadsheet access');
    console.log('   SOLUTION: Use the active spreadsheet instead of creating new ones');
  }
  
  if (results.canUseDriveApp) {
    console.log('✅ DriveApp works - can create files via Drive API');
    console.log('   SOLUTION: Create spreadsheets using DriveApp as a workaround');
  }
  
  console.log('\n🔧 RECOMMENDED SOLUTION:');
  if (results.canUseActive) {
    console.log('Use getActiveSpreadsheet() and add sheets to it');
  } else if (results.canUseDriveApp) {
    console.log('Use the createSpreadsheetViaDrive() workaround below');
  } else {
    console.log('Manual setup required - create spreadsheet manually and use openById');
  }
  
  return results;
}

/**
 * Workaround: Create spreadsheet using DriveApp
 */
function createSpreadsheetViaDrive() {
  try {
    console.log('Attempting to create spreadsheet via DriveApp...');
    
    // Create an empty file with Sheets MIME type
    const file = DriveApp.createFile('temp', '', MimeType.GOOGLE_SHEETS);
    file.setName('PromptLab - Experiment Data');
    
    // Get the file ID
    const fileId = file.getId();
    console.log('Created file with ID:', fileId);
    
    // Try to open it as a spreadsheet
    const spreadsheet = SpreadsheetApp.openById(fileId);
    console.log('✅ Successfully created spreadsheet:', spreadsheet.getUrl());
    
    // Store the ID
    PropertiesService.getScriptProperties()
      .setProperty('PROMPTLAB_SHEET_ID', fileId);
    
    // Set up sheets
    setupSheetsInSpreadsheet(spreadsheet);
    
    return {
      success: true,
      spreadsheetId: fileId,
      url: spreadsheet.getUrl()
    };
    
  } catch (e) {
    console.error('DriveApp workaround failed:', e);
    throw e;
  }
}

/**
 * Helper to set up sheets in existing spreadsheet
 */
function setupSheetsInSpreadsheet(spreadsheet) {
  // Set up prompts sheet
  const sheets = spreadsheet.getSheets();
  const promptsSheet = sheets[0];
  promptsSheet.setName('Prompts');
  
  // Clear and add headers
  promptsSheet.clear();
  const headers = [
    'Timestamp',
    'Participant ID',
    'Cohort ID',
    'Prompt',
    'AI Response',
    'Response Time (ms)',
    'Status',
    'Session Type'
  ];
  
  promptsSheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#FFFFFF');
  
  promptsSheet.autoResizeColumns(1, headers.length);
  
  // Add demographics sheet
  const demoSheet = spreadsheet.insertSheet('Demographics');
  const demoHeaders = [
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
  ];
  
  demoSheet.getRange(1, 1, 1, demoHeaders.length)
    .setValues([demoHeaders])
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#FFFFFF');
  
  demoSheet.autoResizeColumns(1, demoHeaders.length);
  
  console.log('✅ Sheets configured successfully');
}

/**
 * Last resort: Manual setup instructions
 */
function showManualSetupInstructions() {
  const instructions = `
MANUAL SETUP REQUIRED
====================

Since SpreadsheetApp.create is not available in your environment,
please follow these steps:

1. Go to Google Sheets (sheets.google.com)
2. Create a new spreadsheet
3. Name it "PromptLab - Experiment Data"
4. Copy the ID from the URL:
   https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit

5. Come back here and run:
   finalizeManualSetup("PASTE_YOUR_ID_HERE")

This will configure everything else automatically.
`;
  
  console.log(instructions);
  return instructions;
}

/**
 * Finalize manual setup with provided ID
 */
function finalizeManualSetup(spreadsheetId) {
  try {
    console.log('Finalizing setup with ID:', spreadsheetId);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    console.log('✅ Opened spreadsheet:', spreadsheet.getName());
    
    // Store the ID
    PropertiesService.getScriptProperties()
      .setProperty('PROMPTLAB_SHEET_ID', spreadsheetId);
    
    // Set up sheets
    setupSheetsInSpreadsheet(spreadsheet);
    
    // Run other setup
    setupYourClassSchedule();
    
    console.log('\n✅ SETUP COMPLETE!');
    console.log('Spreadsheet URL:', spreadsheet.getUrl());
    console.log('\nNext steps:');
    console.log('1. Add GEMINI_API_KEY to Script Properties');
    console.log('2. Deploy as Web App (Execute as: Me)');
    
    return {
      success: true,
      url: spreadsheet.getUrl()
    };
    
  } catch (e) {
    console.error('Manual setup failed:', e);
    throw e;
  }
}