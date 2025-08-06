/**
 * Robust sheet management with proper locking and error handling
 * Based on expert code review feedback
 */

/**
 * Returns the logging sheet, creating it once.
 * Uses LockService to prevent race conditions.
 */
function getLogSheet() {
  const PROPERTY_KEY = 'PROMPTLAB_SHEET_ID';
  const id = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEY);
  
  // If we already have an ID, just open it
  if (id) {
    try {
      return SpreadsheetApp.openById(id).getSheetByName('Prompts');
    } catch (e) {
      console.error('Failed to open sheet by ID:', e);
      // Continue to recreation logic
    }
  }
  
  // Need to create - use lock to prevent race conditions
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds
    
    // Double-check in case another process created it
    const recheckedId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEY);
    if (recheckedId && recheckedId !== id) {
      return SpreadsheetApp.openById(recheckedId).getSheetByName('Prompts');
    }
    
    // Create new spreadsheet
    console.log('Creating new experiment spreadsheet...');
    const ss = SpreadsheetApp.create('PromptLab - Experiment Data');
    const ssId = ss.getId();
    
    // Store ID immediately
    PropertiesService.getScriptProperties().setProperty(PROPERTY_KEY, ssId);
    
    // Set up prompts sheet
    const promptsSheet = ss.getSheets()[0];
    promptsSheet.setName('Prompts');
    
    // Add headers
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
    
    // Auto-resize columns
    promptsSheet.autoResizeColumns(1, headers.length);
    
    // Set up demographics sheet while we have the lock
    const demoSheet = ss.insertSheet('Demographics');
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
    
    console.log('Created spreadsheet:', ss.getUrl());
    return promptsSheet;
    
  } catch (error) {
    console.error('Failed to create/access sheet:', error);
    throw new Error('Unable to access logging sheet. Please contact administrator.');
  } finally {
    lock.releaseLock();
  }
}

/**
 * Gets the demographics sheet
 */
function getDemographicsSheet() {
  const id = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
  if (!id) {
    // Ensure main sheet exists first
    getLogSheet();
    return getDemographicsSheet(); // Recursive call with ID now set
  }
  
  try {
    return SpreadsheetApp.openById(id).getSheetByName('Demographics');
  } catch (e) {
    console.error('Failed to get demographics sheet:', e);
    throw new Error('Unable to access demographics sheet');
  }
}

/**
 * Safely appends a row, handling large content
 */
function safeAppendRow(sheet, rowData) {
  const MAX_CELL_LENGTH = 49000; // Leave buffer under 50k limit
  
  // Truncate any oversized cells
  const safeData = rowData.map(cell => {
    if (typeof cell === 'string' && cell.length > MAX_CELL_LENGTH) {
      console.warn('Truncating oversized cell content');
      return cell.substring(0, MAX_CELL_LENGTH) + '... [TRUNCATED]';
    }
    return cell;
  });
  
  try {
    sheet.appendRow(safeData);
  } catch (e) {
    console.error('Failed to append row:', e);
    // Try with minimal data as fallback
    const minimalData = safeData.map((cell, index) => {
      if (index < 3) return cell; // Keep timestamp, participant, cohort
      return '[ERROR: Could not save]';
    });
    sheet.appendRow(minimalData);
  }
}

/**
 * One-time setup function to be run by script owner
 */
function authorizeAndSetup() {
  console.log('Authorizing script and running setup...');
  
  // Touch all services to trigger authorization
  DriveApp.getRootFolder(); // Authorize Drive
  SpreadsheetApp.create('Authorization Test').getId(); // Authorize Sheets
  
  // Run actual setup
  const sheet = getLogSheet();
  console.log('✅ Authorization complete!');
  console.log('✅ Spreadsheet ready:', sheet.getParent().getUrl());
  
  // Set other properties
  setupYourClassSchedule();
  
  console.log('\nNext steps:');
  console.log('1. Add GEMINI_API_KEY to Script Properties');
  console.log('2. Deploy as Web App (Execute as: Me)');
  console.log('3. Share the web app URL');
  
  return {
    success: true,
    sheetUrl: sheet.getParent().getUrl()
  };
}

/**
 * Test function to verify setup
 */
function testSheetAccess() {
  try {
    const sheet = getLogSheet();
    console.log('✅ Sheet access working');
    console.log('Sheet name:', sheet.getName());
    console.log('Parent spreadsheet:', sheet.getParent().getName());
    console.log('URL:', sheet.getParent().getUrl());
    return true;
  } catch (e) {
    console.error('❌ Sheet access failed:', e);
    return false;
  }
}