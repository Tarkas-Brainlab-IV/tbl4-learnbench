// Main entry point for the web app
function doGet(e) {
  try {
    // Check if this is demographics page request
    if (e.parameter.page === 'demographics') {
      return HtmlService.createHtmlOutputFromFile('demographics-form')
        .setTitle('Study Information')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    
    // Default to main interface
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Session')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    // Return error page if files are not found
    return HtmlService.createHtmlOutput(`
      <h1>Error Loading Application</h1>
      <p>Error: ${error.toString()}</p>
      <p>Please ensure all files are properly deployed.</p>
    `);
  }
}

// Generate secure hash from NRIC last 4
function generateParticipantHash(nricLast4) {
  try {
    // Ensure uppercase and exactly 4 characters
    const normalizedNric = nricLast4.toUpperCase().trim();
    
    if (normalizedNric.length !== 4) {
      throw new Error('NRIC must be exactly 4 characters');
    }
    
    // Add a salt for extra security
    const salt = 'PromptLab2024';
    const dataToHash = salt + normalizedNric;
    
    // Generate SHA-256 hash
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, dataToHash);
    
    // Convert to hex and take first 8 characters for a shorter ID
    const hexHash = hash.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
    let shortHash = hexHash.substr(0, 8).toUpperCase();
    
    // Ensure hash starts with a letter to prevent scientific notation in spreadsheets
    // If it starts with all numbers and could be interpreted as scientific notation,
    // prepend 'P' for participant
    if (/^\d+E\d+$/i.test(shortHash) || /^\d{8}$/.test(shortHash)) {
      shortHash = 'P' + shortHash.substr(0, 7);
    }
    
    console.log('Generated hash for NRIC ending:', normalizedNric, '→', shortHash);
    
    return {
      success: true,
      hash: shortHash,
      message: 'Login successful'
    };
    
  } catch (error) {
    console.error('Error generating hash:', error);
    throw error;
  }
}

// Client-accessible function to get configuration (CACHED)
function getClientConfig() {
  console.log('getClientConfig called');
  const config = getConfigCached ? getConfigCached() : getConfig();
  console.log('Config retrieved:', config);
  // Return only client-relevant settings
  return {
    enableAI: config.enableAI,
    enableContext: config.enableContext,
    contextWindow: config.contextWindow,
    enableDemographics: config.enableDemographics,
    promptsBeforeDemographics: config.promptsBeforeDemographics,
    autoAdvanceScenarios: config.autoAdvanceScenarios,
    autoCloseOnComplete: config.autoCloseOnComplete,
    enableExitSurvey: config.enableExitSurvey
  };
}

// Test function to manually create Exit Survey sheet and test saving
function testExitSurvey() {
  // First check if PROMPTLAB_SHEET_ID is configured
  const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
  if (!PROMPTLAB_SHEET_ID) {
    return 'ERROR: PROMPTLAB_SHEET_ID not found in Script Properties. Run ensureSpreadsheetExists() first.';
  }
  
  console.log('Using spreadsheet ID:', PROMPTLAB_SHEET_ID);
  
  const testData = {
    participantId: 'TEST123',
    sessionId: 'test_session',
    mentalDemand: 75,
    confidence: 80,
    aiReliance: 60,
    overallExperience: 85,
    completionTime: 120000,
    totalScenarios: 3
  };
  
  try {
    const result = saveExitSurvey(testData);
    console.log('Test result:', result);
    
    // Try to open the spreadsheet and list all sheets
    const ss = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    const sheets = ss.getSheets().map(s => s.getName());
    console.log('All sheets in spreadsheet:', sheets.join(', '));
    
    return 'Success! Sheets in your spreadsheet: ' + sheets.join(', ');
  } catch (error) {
    console.error('Test failed:', error);
    return 'Error: ' + error.toString();
  }
}

// Test what getClientConfig actually returns
function testGetClientConfig() {
  const config = getClientConfig();
  console.log('getClientConfig returned:', JSON.stringify(config, null, 2));
  return config;
}

// Clear the cache to fix the stale config
function clearConfigCache() {
  const cache = CacheService.getScriptCache();
  cache.remove('config');
  console.log('Config cache cleared');
  return 'Cache cleared - config will be reloaded from Setup sheet';
}

// Debug function to check Setup sheet values
function debugSetupSheet() {
  try {
    const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    const setupSheet = spreadsheet.getSheetByName('Setup');
    
    if (!setupSheet) {
      return "No Setup sheet found";
    }
    
    const values = setupSheet.getRange('A1:C11').getValues();
    console.log('Setup sheet values:');
    values.forEach((row, i) => {
      console.log(`Row ${i+1}: [${row[0]}] = [${row[1]}] (${typeof row[1]}) - ${row[2]}`);
    });
    
    const b11Value = setupSheet.getRange('B11').getValue();
    console.log(`B11 value specifically: [${b11Value}] type: ${typeof b11Value}`);
    
    return {
      allValues: values,
      b11: b11Value,
      b11Type: typeof b11Value
    };
  } catch (error) {
    return "Error: " + error.toString();
  }
}

// Admin configuration - Set these in Script Properties
function getConfig() {
  // First try to get config from Setup sheet
  try {
    const sheet = getOrCreateSheet();
    const ss = sheet.getParent();
    let setupSheet = ss.getSheetByName('Setup');
    
    if (!setupSheet) {
      setupSheet = createSetupSheet(ss);
    }
    
    // Read setup values (B column contains values)
    const setupData = setupSheet.getRange('B2:B11').getValues();
    
    return {
      enableAI: setupData[0][0] !== false, // B2 - Enable AI Assistance
      enableContext: setupData[1][0] === true, // B3 - Enable Context (Multi-turn)
      contextWindow: parseInt(setupData[2][0] || 5), // B4 - Context Window Size
      enableDemographics: setupData[3][0] !== false, // B5 - Enable Demographics
      promptsBeforeDemographics: parseInt(setupData[4][0] || 3), // B6 - Prompts Before Demographics
      autoAdvanceScenarios: setupData[5][0] !== false, // B7 - Auto-advance Scenarios
      autoCloseOnComplete: setupData[6][0] !== false, // B8 - Auto-close on Complete
      geminiApiKey: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
      allowOutOfClass: setupData[7][0] !== false, // B9 - Allow Out of Class
      timezone: setupData[8][0] || 'Asia/Singapore', // B10 - Timezone
      enableExitSurvey: setupData[9][0] !== false // B11 - Enable Exit Survey
    };
  } catch (error) {
    console.error('Error reading setup sheet, using defaults:', error);
    // Fallback to script properties
    const props = PropertiesService.getScriptProperties();
    return {
      enableAI: true,
      enableContext: props.getProperty('ENABLE_CONTEXT') === 'true' || false,
      contextWindow: parseInt(props.getProperty('CONTEXT_WINDOW') || '5'),
      enableDemographics: true,
      promptsBeforeDemographics: parseInt(props.getProperty('PROMPTS_BEFORE_DEMOGRAPHICS') || '3'),
      autoAdvanceScenarios: true,
      autoCloseOnComplete: true,
      geminiApiKey: props.getProperty('GEMINI_API_KEY'),
      allowOutOfClass: props.getProperty('ALLOW_OUT_OF_CLASS') === 'true' || false,
      timezone: props.getProperty('TIMEZONE') || 'Asia/Singapore',
      enableExitSurvey: true
    };
  }
}

// Create setup sheet with default values
function createSetupSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Setup');
  
  // Set headers and default values
  const setupData = [
    ['Setting', 'Value', 'Description'],
    ['Enable AI Assistance', true, 'Show/hide AI prompt and response sections'],
    ['Enable Context (Multi-turn)', false, 'Allow AI to remember conversation history'],
    ['Context Window Size', 5, 'Number of previous exchanges to remember'],
    ['Enable Demographics', true, 'Collect demographic information'],
    ['Prompts Before Demographics', 3, 'Number of AI prompts before showing demographics (if AI disabled, shows after N scenarios)'],
    ['Auto-advance Scenarios', true, 'Automatically advance to next scenario after submission'],
    ['Auto-close on Complete', true, 'Close browser window after final scenario'],
    ['Allow Out of Class', true, 'Allow submissions outside scheduled class times'],
    ['Timezone', 'Asia/Singapore', 'Timezone for class schedule'],
    ['Enable Exit Survey', true, 'Show NASA-TLX style exit survey after all scenarios']
  ];
  
  // Set data
  sheet.getRange(1, 1, setupData.length, 3).setValues(setupData);
  
  // Format headers
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  sheet.getRange(1, 1, 1, 3).setBackground('#f0f0f0');
  
  // Set column widths
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 400);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add data validation for boolean fields
  const booleanRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  
  sheet.getRange('B2:B5').setDataValidation(booleanRule);
  sheet.getRange('B7:B9').setDataValidation(booleanRule);
  sheet.getRange('B11').setDataValidation(booleanRule);
  
  console.log('✅ Setup sheet created with default values');
  console.log('Configure settings in column B (checkboxes for true/false, numbers for numeric values)');
  
  return sheet;
}

// Function to ensure Setup sheet exists and is properly configured
function ensureSetupSheet() {
  try {
    const sheet = getOrCreateSheet();
    const ss = sheet.getParent();
    let setupSheet = ss.getSheetByName('Setup');
    
    if (!setupSheet) {
      console.log('Setup sheet not found, creating...');
      setupSheet = createSetupSheet(ss);
      console.log('✅ Setup sheet created successfully');
      console.log('URL:', ss.getUrl() + '#gid=' + setupSheet.getSheetId());
    } else {
      console.log('✅ Setup sheet already exists');
    }
    
    // Display current configuration
    const config = getConfig();
    console.log('\n📋 Current Configuration:');
    console.log('- Enable AI Assistance:', config.enableAI);
    console.log('- Enable Context:', config.enableContext);
    console.log('- Context Window:', config.contextWindow);
    console.log('- Enable Demographics:', config.enableDemographics);
    console.log('- Prompts Before Demographics:', config.promptsBeforeDemographics);
    console.log('- Auto-advance Scenarios:', config.autoAdvanceScenarios);
    console.log('- Auto-close on Complete:', config.autoCloseOnComplete);
    console.log('- Allow Out of Class:', config.allowOutOfClass);
    console.log('- Timezone:', config.timezone);
    
    console.log('\n📝 To change settings:');
    console.log('1. Open the Setup sheet in your Google Spreadsheet');
    console.log('2. Modify values in column B');
    console.log('3. Use checkboxes for true/false values');
    console.log('4. Enter numbers directly for numeric values');
    console.log('5. Changes take effect on next page reload');
    
    return setupSheet;
  } catch (error) {
    console.error('Error ensuring setup sheet:', error);
    throw error;
  }
}

// Get demographics configuration
function getDemographicsConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    promptsBeforeDemographics: parseInt(props.getProperty('PROMPTS_BEFORE_DEMOGRAPHICS') || '1'),
    enableDemographics: props.getProperty('ENABLE_DEMOGRAPHICS') !== 'false' // Default true
  };
}

// Class schedule configuration
function getDefaultClassSchedule() {
  return [
    { day: 'Monday', startTime: '09:00', endTime: '12:00', cohort: 'MON-AM' },
    { day: 'Monday', startTime: '14:00', endTime: '17:00', cohort: 'MON-PM' },
    { day: 'Wednesday', startTime: '09:00', endTime: '12:00', cohort: 'WED-AM' },
    { day: 'Wednesday', startTime: '14:00', endTime: '17:00', cohort: 'WED-PM' },
    { day: 'Friday', startTime: '09:00', endTime: '12:00', cohort: 'FRI-AM' }
  ];
}

// Detect cohort based on NRIC hash patterns and clustering
function detectCohort(participantId) {
  const config = getConfig();
  const now = new Date();
  
  // First, try to determine cohort from participant's history
  const historicalCohort = getParticipantHistoricalCohort(participantId);
  
  if (historicalCohort) {
    // Participant has submitted before - use their established cohort
    // Now check if this submission is clustered with others
    const classification = classifySubmissionTiming(participantId, historicalCohort);
    
    return {
      cohort: historicalCohort,
      inClass: classification.likelyInClass,
      confidence: classification.confidence,
      note: classification.reason
    };
  }
  
  // New participant - try to detect cohort from current activity
  const activeCohorts = detectActiveCohorts();
  
  if (activeCohorts.length === 1) {
    // Only one cohort active - assign to it
    return {
      cohort: activeCohorts[0].cohort,
      inClass: true,
      confidence: activeCohorts[0].confidence,
      note: 'Assigned to currently active cohort'
    };
  } else if (activeCohorts.length > 1) {
    // Multiple cohorts active - try to determine base cohort from time
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    let baseCohort = null;
    
    // Determine which cohort should be active now
    if (day === 0 || day === 6) { // Weekend
      if (hour >= 9 && hour < 12) baseCohort = 'A';
      else if (hour >= 13 && hour < 16) baseCohort = 'B';
    } else if (day === 1 || day === 3) { // Mon/Wed
      if (hour >= 19 && hour < 22) baseCohort = 'C';
    } else if (day === 2 || day === 4) { // Tue/Thu
      if (hour >= 19 && hour < 22) baseCohort = 'D';
    }
    
    if (baseCohort) {
      const monthlyId = generateMonthlyCohortId(baseCohort);
      const matchingCohort = activeCohorts.find(c => c.cohort === monthlyId);
      if (matchingCohort) {
        return {
          cohort: matchingCohort.cohort,
          inClass: true,
          confidence: matchingCohort.confidence,
          note: 'Assigned based on schedule match'
        };
      }
    }
    
    // Still can't determine - mark as unassigned
    return {
      cohort: 'UNASSIGNED',
      inClass: false,
      confidence: 0,
      note: 'Multiple cohorts active - manual assignment needed'
    };
  }
  
  // No cohorts currently active - check if it's a scheduled class time
  const currentTime = new Date();
  const day = currentTime.getDay();
  const hour = currentTime.getHours();
  let baseCohort = null;
  
  if (day === 0 || day === 6) { // Weekend
    if (hour >= 9 && hour < 12) baseCohort = 'A';
    else if (hour >= 13 && hour < 16) baseCohort = 'B';
  } else if (day === 1 || day === 3) { // Mon/Wed
    if (hour >= 19 && hour < 22) baseCohort = 'C';
  } else if (day === 2 || day === 4) { // Tue/Thu
    if (hour >= 19 && hour < 22) baseCohort = 'D';
  }
  
  if (baseCohort) {
    // It's during a scheduled class time, assign to monthly cohort
    const monthlyId = generateMonthlyCohortId(baseCohort);
    return {
      cohort: monthlyId,
      inClass: false, // No one else active yet
      confidence: 0.5,
      note: 'First participant in scheduled class time'
    };
  }
  
  // Outside any scheduled time
  return {
    cohort: 'UNASSIGNED',
    inClass: false,
    confidence: 0,
    note: 'No active class session detected'
  };
}

// Get participant's historical cohort assignment
function getParticipantHistoricalCohort(participantId) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const participantCol = headers.indexOf('Participant ID');
  const cohortCol = headers.indexOf('Cohort ID');
  
  // Find this participant's previous submissions
  const previousSubmissions = data.slice(1)
    .filter(row => row[participantCol] === participantId && 
                   row[cohortCol] && 
                   row[cohortCol] !== 'UNASSIGNED' &&
                   row[cohortCol] !== 'OUT-OF-CLASS');
  
  if (previousSubmissions.length > 0) {
    // Return their most recent cohort
    return previousSubmissions[previousSubmissions.length - 1][cohortCol];
  }
  
  return null;
}

// Detect currently active cohorts based on recent activity
function detectActiveCohorts() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const recentWindow = 30; // minutes
  
  const timestampCol = headers.indexOf('Timestamp');
  const cohortCol = headers.indexOf('Cohort ID');
  const participantCol = headers.indexOf('Participant ID');
  
  // Get recent submissions
  const recentSubmissions = data.slice(1)
    .filter(row => {
      const timestamp = new Date(row[timestampCol]);
      const timeDiff = (now - timestamp) / (1000 * 60);
      return timeDiff >= 0 && timeDiff <= recentWindow &&
             row[cohortCol] && 
             row[cohortCol] !== 'UNASSIGNED';
    });
  
  // Group by cohort
  const cohortActivity = {};
  recentSubmissions.forEach(row => {
    const cohort = row[cohortCol];
    if (!cohortActivity[cohort]) {
      cohortActivity[cohort] = new Set();
    }
    cohortActivity[cohort].add(row[participantCol]);
  });
  
  // Calculate activity level for each cohort
  const activeCohorts = Object.entries(cohortActivity)
    .map(([cohort, participants]) => ({
      cohort: cohort,
      participants: participants.size,
      confidence: Math.min(participants.size / 5, 1) // 5+ participants = high confidence
    }))
    .filter(c => c.participants >= 3) // At least 3 participants to be considered active
    .sort((a, b) => b.participants - a.participants);
  
  return activeCohorts;
}

// Classify if current submission is part of a cluster
function classifySubmissionTiming(participantId, cohort) {
  const now = new Date();
  const recentWindow = 30; // minutes
  
  // Get recent submissions from same cohort
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const timestampCol = headers.indexOf('Timestamp');
  const cohortCol = headers.indexOf('Cohort ID');
  const participantCol = headers.indexOf('Participant ID');
  
  const recentSubmissions = data.slice(1)
    .filter(row => {
      const timestamp = new Date(row[timestampCol]);
      const timeDiff = (now - timestamp) / (1000 * 60);
      return row[cohortCol] === cohort && 
             timeDiff >= 0 && timeDiff <= recentWindow;
    });
  
  const uniqueParticipants = new Set(recentSubmissions.map(row => 
    row[participantCol]
  )).size;
  
  // Classification based on clustering
  if (uniqueParticipants >= 8) {
    return {
      likelyInClass: true,
      confidence: 0.95,
      reason: `High activity: ${uniqueParticipants} participants active`
    };
  } else if (uniqueParticipants >= 5) {
    return {
      likelyInClass: true,
      confidence: 0.8,
      reason: `Moderate activity: ${uniqueParticipants} participants active`
    };
  } else if (uniqueParticipants >= 3) {
    return {
      likelyInClass: true,
      confidence: 0.6,
      reason: `Some activity: ${uniqueParticipants} participants active`
    };
  } else {
    return {
      likelyInClass: false,
      confidence: 0.8,
      reason: `Low activity: only ${uniqueParticipants} participant(s) active`
    };
  }
}

// Store for conversation contexts (in-memory per session)
const conversationCache = {};

// Get conversation history for a participant (OPTIMIZED)
function getConversationContext(participantId) {
  const config = getConfigCached ? getConfigCached() : getConfig();
  if (!config.enableContext) return [];
  
  // Try to get from in-memory cache first
  if (conversationCache[participantId]) {
    return conversationCache[participantId];
  }
  
  // Use optimized history fetch if available
  if (typeof getParticipantHistoryCached !== 'undefined') {
    const history = getParticipantHistoryCached(participantId, config.contextWindow);
    conversationCache[participantId] = history;
    return history;
  }
  
  // Fallback to original implementation
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return [];
  
  // Read only last 50 rows instead of entire sheet
  const startRow = Math.max(2, lastRow - 50);
  const numRows = lastRow - startRow + 1;
  const data = sheet.getRange(startRow, 1, numRows, 10).getValues();
  const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
  
  // Find column indices
  const participantCol = headers.indexOf('Participant ID');
  const promptCol = headers.indexOf('Prompt');
  const responseCol = headers.indexOf('AI Response');
  const timestampCol = headers.indexOf('Timestamp');
  
  // Get this participant's history
  const history = data
    .filter(row => row[participantCol] === participantId)
    .map(row => ({
      timestamp: row[timestampCol],
      prompt: row[promptCol],
      response: row[responseCol]
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, config.contextWindow);
  
  // Cache it
  conversationCache[participantId] = history.reverse();
  
  return conversationCache[participantId];
}

// Process prompt and get AI response (with optional image)
function processPrompt(data) {
  console.log('Processing prompt:', data.image ? 'with image' : 'text only');
  
  try {
    // Detect cohort based on clustering and participant history
    const cohortInfo = detectCohort(data.participantId);
    const config = getConfigCached ? getConfigCached() : getConfig();
    
    // Check if out-of-class submissions are allowed
    if (!cohortInfo.inClass && !config.allowOutOfClass && cohortInfo.cohort === 'OUT-OF-CLASS') {
      return {
        success: false,
        error: 'Submissions are only accepted during scheduled class times. Please try again during your class session.'
      };
    }
    
    // Get or create the spreadsheet
    const sheet = getOrCreateSheet();
    
    // Generate timestamp
    const timestamp = new Date();
    
    // Get conversation context if enabled
    const context = getConversationContext(data.participantId);
    
    // Call Gemini API with or without context, include image if present
    const geminiResponse = callGeminiAPIWithContext(data.prompt, context, data.image);
    
    // Update cache if context is enabled
    if (config.enableContext) {
      if (!conversationCache[data.participantId]) {
        conversationCache[data.participantId] = [];
      }
      conversationCache[data.participantId].push({
        timestamp: timestamp,
        prompt: data.prompt,
        response: geminiResponse.output
      });
      // Keep only last N exchanges
      if (conversationCache[data.participantId].length > config.contextWindow) {
        conversationCache[data.participantId].shift();
      }
    }
    
    // Log to spreadsheet with smart cohort and status
    const rowData = [
      timestamp,
      data.participantId,
      cohortInfo.cohort, // Smart cohort detection
      data.prompt,
      geminiResponse.output,
      geminiResponse.processingTime,
      cohortInfo.inClass ? 'IN-CLASS' : 'OUT-OF-CLASS', // Status
      cohortInfo.note || '' // Additional notes
    ];
    
    // Use safe append to handle large content
    safeAppendRow(sheet, rowData);
    
    console.log('Successfully logged to sheet with cohort:', cohortInfo.cohort);
    
    // Check if demographics needed (simplified for now)
    let needsDemographics = false;
    try {
      // Count submissions by this participant in current data
      const currentData = sheet.getDataRange().getValues();
      let submissionCount = 0;
      for (let i = 1; i < currentData.length; i++) {
        if (currentData[i][1] === data.participantId) {
          submissionCount++;
        }
      }
      
      // Only show demographics after first submission
      // For now, we'll just track it client-side with sessionStorage
      needsDemographics = (submissionCount === 1);
      
    } catch (e) {
      console.log('Demographics check error:', e);
      needsDemographics = false;
    }
    
    // Return response to client
    return {
      success: true,
      output: geminiResponse.output,
      model: geminiResponse.model,
      tokenUsage: {
        totalTokens: geminiResponse.tokens || 0
      },
      timestamp: timestamp.toISOString(),
      needsDemographics: needsDemographics
    };
    
  } catch (error) {
    console.error('Error processing prompt:', error);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// Get or create the logging spreadsheet
function getOrCreateSheet() {
  // Delegate to the robust sheet manager if it exists
  if (typeof getLogSheet !== 'undefined') {
    return getLogSheet();
  }
  
  // Fallback to direct implementation
  const SHEET_NAME = 'Prompts';
  
  // Get PROMPTLAB_SHEET_ID from script properties
  const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
  
  if (!PROMPTLAB_SHEET_ID) {
    throw new Error('PROMPTLAB_SHEET_ID not found in script properties. Please run quickSetup() or add it in Project Settings → Script Properties');
  }
  
  let spreadsheet;
  
  try {
    // Open the spreadsheet by ID (fixed: was using SpreadsheetApp.open which caused errors)
    spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
  } catch (error) {
    console.error('Error opening spreadsheet:', error);
    throw new Error('Failed to open spreadsheet. Please check the PROMPTLAB_SHEET_ID in script properties.');
  }
  
  // Get or create sheet
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  
  // ALWAYS check if headers exist (in case of existing sheet without headers)
  const firstRow = sheet.getRange(1, 1, 1, 10).getValues()[0];
  const hasHeaders = firstRow[0] === 'Timestamp' || firstRow[0] === 'timestamp';
  
  if (!hasHeaders) {
    console.log('Headers missing - adding them now...');
    
    // Check if there's existing data that needs to be moved down
    const lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      // There's existing data - insert a row at the top
      sheet.insertRowBefore(1);
    }
    
    // Add headers
    sheet.getRange(1, 1, 1, 10).setValues([[
      'Timestamp',
      'Participant ID',
      'Cohort ID',
      'Prompt',
      'AI Response',
      'Model',
      'Token Count',
      'Processing Time (ms)',
      'Status',
      'Notes'
    ]]);
    
    // Format headers
    sheet.getRange(1, 1, 1, 10)
      .setFontWeight('bold')
      .setBackground('#4CAF50')
      .setFontColor('#FFFFFF');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 10);
    
    console.log('Headers added successfully');
  }
  
  return sheet;
}

// Call Gemini API with context support and optional image
function callGeminiAPIWithContext(prompt, context = [], image = null) {
  const config = getConfig();
  
  // Build the prompt with context if enabled
  let fullPrompt = prompt;
  if (config.enableContext && context.length > 0) {
    const contextMessages = context.flatMap(exchange => [
      {
        role: 'user',
        parts: [{ text: exchange.prompt }]
      },
      {
        role: 'model',
        parts: [{ text: exchange.response }]
      }
    ]);
    
    // Use multi-turn conversation format with image if provided
    return callGeminiAPIMultiTurn(prompt, contextMessages, image);
  }
  
  // Otherwise use single-turn with image if provided
  return callGeminiAPI(prompt, image);
}

// Multi-turn conversation with Gemini (with optional image)
function callGeminiAPIMultiTurn(currentPrompt, previousMessages, image = null) {
  const startTime = Date.now();
  
  // Get API key from script properties
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found in script properties. Please add it in Project Settings → Script Properties');
  }
  
  // Try Gemini 1.5 Flash first, then fall back to Pro if needed
  const models = [
    { name: 'gemini-1.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY },
    { name: 'gemini-pro', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY }
  ];
  
  let currentModelIndex = 0;
  
  // Build current message parts with text and optional image
  const currentParts = [{ text: currentPrompt }];
  
  if (image) {
    if (image.data) {
      // Base64 encoded image
      currentParts.push({
        inline_data: {
          mime_type: image.mimeType || 'image/jpeg',
          data: image.data
        }
      });
    } else if (image.url) {
      // For URLs, we need to fetch and encode the image
      try {
        const imageResponse = UrlFetchApp.fetch(image.url);
        const blob = imageResponse.getBlob();
        const base64 = Utilities.base64Encode(blob.getBytes());
        currentParts.push({
          inline_data: {
            mime_type: blob.getContentType() || 'image/jpeg',
            data: base64
          }
        });
      } catch (e) {
        console.error('Failed to fetch image from URL:', e);
        // Continue without the image
      }
    }
    console.log('Image included in multi-turn request');
  }
  
  // Build conversation history
  const contents = [
    ...previousMessages,
    {
      role: 'user',
      parts: currentParts
    }
  ];
  
  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  // Same retry logic as before
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const currentModel = models[currentModelIndex];
      console.log(`Calling ${currentModel.name} API with context (attempt ${attempt})...`);
      
      const response = UrlFetchApp.fetch(currentModel.url, options);
      const responseText = response.getContentText();
      const json = JSON.parse(responseText);
      
      if (response.getResponseCode() !== 200) {
        console.error('Gemini API error response:', json);
        throw new Error(json.error?.message || 'API request failed');
      }
      
      const output = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      const totalTokens = json.usageMetadata?.totalTokenCount || 0;
      
      console.log('Gemini API with context success. Tokens used:', totalTokens);
      
      return {
        output: output,
        model: models[currentModelIndex].name,
        tokens: totalTokens,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      lastError = error;
      console.error(`Gemini API error on attempt ${attempt}:`, error.toString());
      
      if (error.toString().includes('overloaded')) {
        if (currentModelIndex < models.length - 1) {
          currentModelIndex++;
          console.log(`Switching to ${models[currentModelIndex].name}...`);
          continue;
        } else if (attempt < 3) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Models overloaded, waiting ${waitTime}ms before retry...`);
          Utilities.sleep(waitTime);
          currentModelIndex = 0;
          continue;
        }
      }
      break;
    }
  }
  
  console.error('All Gemini API attempts with context failed:', lastError);
  return {
    output: `I understand your prompt: "${currentPrompt}". Unfortunately, the AI service is currently busy. Your prompt has been recorded. Please try again in a moment.`,
    model: 'fallback-mode',
    tokens: 0,
    processingTime: Date.now() - startTime
  };
}

// Call Gemini API - PRODUCTION VERSION (single-turn)
function callGeminiAPI(prompt, image = null) {
  const startTime = Date.now();
  
  // Get API key from script properties
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found in script properties. Please add it in Project Settings → Script Properties');
  }
  
  // Try Gemini 1.5 Flash first, then fall back to Pro if needed
  const models = [
    { name: 'gemini-1.5-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY },
    { name: 'gemini-pro', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY }
  ];
  
  let currentModelIndex = 0;
  
  // Build parts array with text and optional image
  const parts = [{ text: prompt }];
  
  if (image) {
    if (image.data) {
      // Base64 encoded image
      parts.push({
        inline_data: {
          mime_type: image.mimeType || 'image/jpeg',
          data: image.data
        }
      });
    } else if (image.url) {
      // For URLs, we need to fetch and encode the image
      try {
        const imageResponse = UrlFetchApp.fetch(image.url);
        const blob = imageResponse.getBlob();
        const base64 = Utilities.base64Encode(blob.getBytes());
        parts.push({
          inline_data: {
            mime_type: blob.getContentType() || 'image/jpeg',
            data: base64
          }
        });
      } catch (e) {
        console.error('Failed to fetch image from URL:', e);
        // Continue without the image
      }
    }
    console.log('Image included in request:', image.mimeType || 'from URL');
  }
  
  const requestBody = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  // Try up to 3 times with exponential backoff
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const currentModel = models[currentModelIndex];
      console.log(`Calling ${currentModel.name} API (attempt ${attempt})...`);
      
      const response = UrlFetchApp.fetch(currentModel.url, options);
      const responseText = response.getContentText();
      const json = JSON.parse(responseText);
      
      if (response.getResponseCode() !== 200) {
        console.error('Gemini API error response:', json);
        throw new Error(json.error?.message || 'API request failed');
      }
      
      // Extract the response text
      const output = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      
      // Get token count if available
      const promptTokens = json.usageMetadata?.promptTokenCount || 0;
      const candidatesTokens = json.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = json.usageMetadata?.totalTokenCount || (promptTokens + candidatesTokens);
      
      console.log('Gemini API success. Tokens used:', totalTokens);
      
      return {
        output: output,
        model: models[currentModelIndex].name,
        tokens: totalTokens,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      lastError = error;
      console.error(`Gemini API error on attempt ${attempt}:`, error.toString());
      
      // Check if it's an overload error
      if (error.toString().includes('overloaded')) {
        // Try the other model if available
        if (currentModelIndex < models.length - 1) {
          currentModelIndex++;
          console.log(`Switching to ${models[currentModelIndex].name}...`);
          continue;
        } else if (attempt < 3) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s
          console.log(`Models overloaded, waiting ${waitTime}ms before retry...`);
          Utilities.sleep(waitTime);
          currentModelIndex = 0; // Reset to first model
          continue;
        }
      }
      
      // For other errors or final attempt, break
      break;
    }
  }
  
  // If all attempts failed, return a fallback response
  console.error('All Gemini API attempts failed:', lastError);
  
  // Provide a simple fallback response
  return {
    output: `I understand your prompt: "${prompt}". Unfortunately, the AI service is currently busy. Your prompt has been recorded. Please try again in a moment.`,
    model: 'fallback-mode',
    tokens: 0,
    processingTime: Date.now() - startTime
  };
}

// Production Gemini API implementation (commented out for reference)
/*
function callGeminiAPIProduction(prompt) {
  const startTime = Date.now();
  
  // Replace with your actual API key or use ScriptProperties
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': API_KEY
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(API_URL, options);
    const json = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(json.error?.message || 'API request failed');
    }
    
    const output = json.candidates[0].content.parts[0].text;
    const tokens = json.usageMetadata?.totalTokenCount || 0;
    
    return {
      output: output,
      model: 'gemini-pro',
      tokens: tokens,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
*/

// Helper function to set up script properties (run once)
function setupScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Set these properties in the Apps Script editor:
  // File > Project Properties > Script Properties
  scriptProperties.setProperty('PROMPTLAB_SHEET_ID', '1152xJb3pqhug19ExNKCdAFy1sSvMa2GyJIVoEkLd29o');
  scriptProperties.setProperty('GEMINI_API_KEY', 'YOUR_API_KEY_HERE');
  scriptProperties.setProperty('ENABLE_CONTEXT', 'false'); // Set to 'true' to enable conversation memory
  scriptProperties.setProperty('CONTEXT_WINDOW', '5'); // Number of previous exchanges to remember
  scriptProperties.setProperty('ALLOW_OUT_OF_CLASS', 'true'); // Allow submissions outside class hours
}

// Sanity check function to verify SpreadsheetApp is not shadowed
function sanityCheck() {
  console.log('SpreadsheetApp type:', typeof SpreadsheetApp);
  console.log('SpreadsheetApp has openById:', typeof SpreadsheetApp.openById === 'function');
  console.log('Available methods (first 10):', Object.keys(SpreadsheetApp).slice(0, 10).join(', '));
  
  try {
    const ss = SpreadsheetApp.openById('1152xJb3pqhug19ExNKCdAFy1sSvMa2GyJIVoEkLd29o');
    console.log('✅ Successfully opened spreadsheet:', ss.getName());
    return true;
  } catch (error) {
    console.error('❌ Failed to open spreadsheet:', error.toString());
    return false;
  }
}

// Function to add headers to existing sheet - RUN THIS IF HEADERS ARE MISSING
function addHeadersToSheet() {
  try {
    const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
    if (!PROMPTLAB_SHEET_ID) {
      console.error('No PROMPTLAB_SHEET_ID found. Run quickSetup() first.');
      return false;
    }
    
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    const sheet = spreadsheet.getSheetByName('Prompts');
    
    if (!sheet) {
      console.error('Prompts sheet not found');
      return false;
    }
    
    // Check current first row
    const firstRow = sheet.getRange(1, 1, 1, 10).getValues()[0];
    const hasHeaders = firstRow[0] === 'Timestamp' || firstRow[0] === 'timestamp';
    
    if (hasHeaders) {
      console.log('Headers already exist!');
      return true;
    }
    
    // Insert row at top for headers
    const lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      sheet.insertRowBefore(1);
      console.log('Moved existing data down one row');
    }
    
    // Add headers
    sheet.getRange(1, 1, 1, 10).setValues([[
      'Timestamp',
      'Participant ID',
      'Cohort ID',
      'Prompt',
      'AI Response',
      'Model',
      'Token Count',
      'Processing Time (ms)',
      'Status',
      'Notes'
    ]]);
    
    // Format headers
    sheet.getRange(1, 1, 1, 10)
      .setFontWeight('bold')
      .setBackground('#4CAF50')
      .setFontColor('#FFFFFF');
    
    // Set column widths for better readability
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(2, 120); // Participant ID
    sheet.setColumnWidth(3, 120); // Cohort ID
    sheet.setColumnWidth(4, 300); // Prompt
    sheet.setColumnWidth(5, 400); // AI Response
    sheet.setColumnWidth(6, 100); // Model
    sheet.setColumnWidth(7, 100); // Token Count
    sheet.setColumnWidth(8, 140); // Processing Time
    sheet.setColumnWidth(9, 100); // Status
    sheet.setColumnWidth(10, 200); // Notes
    
    // Freeze the header row
    sheet.setFrozenRows(1);
    
    console.log('✅ Headers added successfully!');
    console.log('✅ Column widths set');
    console.log('✅ Header row frozen');
    
    return true;
    
  } catch (error) {
    console.error('Error adding headers:', error);
    return false;
  }
}

// Quick setup function - RUN THIS FIRST!
function quickSetup() {
  // First verify SpreadsheetApp is working
  console.log('=== PromptLab Quick Setup ===');
  console.log('Checking SpreadsheetApp availability...');
  console.log('SpreadsheetApp type:', typeof SpreadsheetApp);
  console.log('Has openById method:', typeof SpreadsheetApp.openById === 'function');
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Set the spreadsheet ID
  scriptProperties.setProperty('PROMPTLAB_SHEET_ID', '1152xJb3pqhug19ExNKCdAFy1sSvMa2GyJIVoEkLd29o');
  scriptProperties.setProperty('ALLOW_OUT_OF_CLASS', 'true');
  scriptProperties.setProperty('PROMPTS_BEFORE_DEMOGRAPHICS', '1'); // Set to 1 for testing, 3 for production
  scriptProperties.setProperty('ENABLE_DEMOGRAPHICS', 'true');
  
  // Check if we can access the spreadsheet
  try {
    const spreadsheet = SpreadsheetApp.openById('1152xJb3pqhug19ExNKCdAFy1sSvMa2GyJIVoEkLd29o');
    console.log('✅ Successfully connected to spreadsheet:', spreadsheet.getName());
    
    // Check for the Prompts sheet
    const sheet = spreadsheet.getSheetByName('Prompts');
    if (sheet) {
      console.log('✅ Found "Prompts" sheet with', sheet.getLastRow(), 'rows');
    } else {
      console.log('⚠️ "Prompts" sheet not found - will be created on first use');
    }
    
    // Check for Gemini API key
    const apiKey = scriptProperties.getProperty('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey.length > 10) {
      console.log('✅ Gemini API key is set');
    } else {
      console.log('❌ Please set GEMINI_API_KEY in Script Properties');
      console.log('   Get your key from: https://aistudio.google.com/app/apikey');
    }
    
    console.log('\n=== Setup Summary ===');
    console.log('Spreadsheet ID:', scriptProperties.getProperty('PROMPTLAB_SHEET_ID'));
    console.log('Allow out-of-class:', scriptProperties.getProperty('ALLOW_OUT_OF_CLASS'));
    console.log('Context enabled:', scriptProperties.getProperty('ENABLE_CONTEXT') || 'false');
    
    return {
      success: true,
      spreadsheetConnected: true,
      message: 'Setup complete! Remember to set GEMINI_API_KEY if not already done.'
    };
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Admin function to toggle context feature
function setContextEnabled(enabled) {
  PropertiesService.getScriptProperties().setProperty('ENABLE_CONTEXT', enabled ? 'true' : 'false');
  console.log('Context feature:', enabled ? 'ENABLED' : 'DISABLED');
}

// Admin function to set context window size
function setContextWindow(size) {
  PropertiesService.getScriptProperties().setProperty('CONTEXT_WINDOW', size.toString());
  console.log('Context window set to:', size);
}

// Admin function to set class schedule
function setClassSchedule(schedule) {
  PropertiesService.getScriptProperties().setProperty('CLASS_SCHEDULE', JSON.stringify(schedule));
  console.log('Class schedule updated:', schedule);
}

// Admin function to allow/disallow out-of-class submissions
function setAllowOutOfClass(allowed) {
  PropertiesService.getScriptProperties().setProperty('ALLOW_OUT_OF_CLASS', allowed ? 'true' : 'false');
  console.log('Out-of-class submissions:', allowed ? 'ALLOWED' : 'BLOCKED');
}

// Function to save scenario response with duplicate prevention
function saveScenarioResponse(participantId, scenarioId, response) {
  try {
    const sheet = getOrCreateSheet();
    const ss = sheet.getParent();
    
    // Find or create scenario responses sheet
    let responsesSheet = ss.getSheetByName('Scenario_Responses');
    
    if (!responsesSheet) {
      responsesSheet = ss.insertSheet('Scenario_Responses');
      // Add headers with submission ID
      responsesSheet.getRange(1, 1, 1, 7).setValues([[
        'Participant ID',
        'Scenario ID',
        'Option Selected',
        'Response Text',
        'Score',
        'Timestamp',
        'Submission ID'
      ]]);
      responsesSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    
    // Check for recent duplicate (within last 5 seconds)
    const data = responsesSheet.getDataRange().getValues();
    const now = new Date();
    
    // Check last 10 rows for duplicates
    for (let i = Math.max(1, data.length - 10); i < data.length; i++) {
      if (i >= data.length) break;
      const row = data[i];
      if (row[0] === participantId && row[1] === scenarioId) {
        const rowTimestamp = new Date(row[5]);
        const timeDiff = (now - rowTimestamp) / 1000; // seconds
        
        if (timeDiff < 5) {
          console.log('Duplicate submission detected within 5 seconds, ignoring');
          return { success: true, duplicate: true };
        }
      }
    }
    
    // Generate unique submission ID
    const submissionId = Utilities.getUuid();
    
    // Append response with submission ID, force participant ID as string
    responsesSheet.appendRow([
      String(participantId), // Force string to prevent scientific notation
      scenarioId,
      response.optionId,
      response.text,
      response.score,
      new Date().toISOString(),
      submissionId
    ]);
    
    console.log('Scenario response saved:', participantId, 'Scenario:', scenarioId, 'ID:', submissionId);
    return { success: true, submissionId: submissionId };
  } catch (error) {
    console.error('Error saving scenario response:', error);
    return { success: false, error: error.toString() };
  }
}

// Function to get ALL scenarios for a participant (CACHED VERSION)
function getAllScenariosForParticipant(participantId) {
  // Use cached version if available
  if (typeof getAllScenariosCached !== 'undefined') {
    return getAllScenariosCached(participantId);
  }
  
  // Fallback to original implementation
  try {
    const sheet = getOrCreateSheet();
    const ss = sheet.getParent();
    
    // Check for scenarios sheet
    let scenariosSheet = ss.getSheetByName('Scenarios');
    
    if (!scenariosSheet) {
      // Create example scenarios sheet if it doesn't exist
      scenariosSheet = createExampleScenariosSheet(ss);
    }
    
    // Get all scenarios
    const data = scenariosSheet.getDataRange().getValues();
    const headers = data[0];
    const scenarios = [];
    
    console.log(`Found ${data.length - 1} rows in Scenarios sheet`);
    
    // Parse scenarios from sheet
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) { // If ScenarioID and ScenarioText exist
        const scenario = {
          id: row[0],
          text: row[1],
          imageUrl: row[2] || null,
          options: []
        };
        
        // Parse up to 5 options
        for (let j = 0; j < 5; j++) {
          const optionIdx = 3 + (j * 2); // Option1 at index 3, Option2 at 5, etc.
          const scoreIdx = 4 + (j * 2);  // Score1 at index 4, Score2 at 6, etc.
          
          if (row[optionIdx]) {
            scenario.options.push({
              id: `option_${j + 1}`,
              text: row[optionIdx],
              score: row[scoreIdx] || 0
            });
          }
        }
        
        if (scenario.options.length > 0) {
          scenarios.push(scenario);
          console.log(`Added scenario: ${scenario.id} with ${scenario.options.length} options`);
        }
      }
    }
    
    console.log(`Returning ${scenarios.length} scenarios to client`);
    return scenarios; // Return ALL scenarios
    
  } catch (error) {
    console.error('Error getting scenarios:', error);
    return [];
  }
}

// Function to test the scenario system
function testScenarioSystem() {
  console.log('\n=== Testing Scenario System ===\n');
  
  try {
    // Test loading scenarios
    const scenarios = getAllScenariosForParticipant('TEST_USER');
    
    console.log(`✅ Loaded ${scenarios.length} scenarios`);
    
    if (scenarios.length === 0) {
      console.log('⚠️ No scenarios found. Make sure you have scenarios in the Scenarios sheet.');
      console.log('Expected format:');
      console.log('- Column A: ScenarioID (e.g., S001)');
      console.log('- Column B: ScenarioText (can use markdown)');
      console.log('- Column C: ImageURL (optional)');
      console.log('- Column D: Option1');
      console.log('- Column E: Score1');
      console.log('- Column F: Option2');
      console.log('- Column G: Score2');
      console.log('... and so on for up to 5 options');
    } else {
      scenarios.forEach((scenario, index) => {
        console.log(`\nScenario ${index + 1}: ${scenario.id}`);
        console.log(`Text: ${scenario.text.substring(0, 50)}...`);
        console.log(`Options: ${scenario.options.length}`);
        scenario.options.forEach(opt => {
          console.log(`  - ${opt.text} (score: ${opt.score})`);
        });
      });
    }
    
    // Test configuration
    console.log('\n=== Testing Configuration ===\n');
    const config = getConfig();
    console.log('Configuration loaded:', config);
    
    if (!config.autoAdvanceScenarios) {
      console.log('⚠️ Auto-advance is DISABLED. Users will need to manually click to continue.');
    } else {
      console.log('✅ Auto-advance is ENABLED. Scenarios will advance automatically.');
    }
    
    return {
      scenarios: scenarios.length,
      config: config,
      success: true
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Batch load all initial data for faster startup
function getInitialDataBatch(participantId) {
  console.log('Batch loading initial data for:', participantId);
  
  try {
    // Load all data in parallel where possible
    const config = getConfigCached ? getConfigCached() : getConfig();
    const scenarios = getAllScenariosForParticipant(participantId);
    const demographicsStatus = checkDemographicsStatus(participantId);
    
    return {
      success: true,
      config: {
        enableAI: config.enableAI,
        enableContext: config.enableContext,
        contextWindow: config.contextWindow,
        enableDemographics: config.enableDemographics,
        promptsBeforeDemographics: config.promptsBeforeDemographics,
        autoAdvanceScenarios: config.autoAdvanceScenarios,
        autoCloseOnComplete: config.autoCloseOnComplete,
        enableExitSurvey: config.enableExitSurvey
      },
      scenarios: scenarios,
      demographicsStatus: demographicsStatus,
      serverTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in batch load:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Legacy function - kept for backward compatibility
function getScenarioForParticipant(participantId) {
  const scenarios = getAllScenariosForParticipant(participantId);
  
  if (!scenarios || scenarios.length === 0) {
    return null;
  }
  
  // Return first scenario for legacy support
  const scenarioIndex = hashCode(participantId) % scenarios.length;
  return scenarios[Math.abs(scenarioIndex)];
}

// Helper function to create hash from string
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Create example scenarios sheet
function createExampleScenariosSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('Scenarios');
  
  // Set headers
  const headers = [
    'ScenarioID', 'ScenarioText', 'ImageURL',
    'Option1', 'Score1', 'Option2', 'Score2', 
    'Option3', 'Score3', 'Option4', 'Score4',
    'Option5', 'Score5'
  ];
  
  // Example scenario
  const exampleScenario = [
    'S001',
    '## Emergency Response\n\nYou are the first to arrive at a multi-vehicle accident on a highway. There are:\n- 3 vehicles involved\n- Smoke coming from one engine\n- Multiple people appear injured\n- Traffic is building up\n\nWhat is your **first** priority action?',
    'https://via.placeholder.com/600x400/333/fff?text=Accident+Scene',
    'Ensure your own safety and assess the scene', 10,
    'Immediately start helping injured people', 5,
    'Call emergency services (995)', 8,
    'Direct traffic away from the accident', 3,
    'Take photos for insurance purposes', 0
  ];
  
  // Set data
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, exampleScenario.length).setValues([exampleScenario]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  return sheet;
}

// Function to save session metrics
function saveSessionMetrics(participantId, metrics) {
  try {
    const sheet = getOrCreateSheet();
    
    // Find or create a metrics sheet
    const ss = sheet.getParent();
    let metricsSheet = ss.getSheetByName('Session_Metrics');
    
    if (!metricsSheet) {
      metricsSheet = ss.insertSheet('Session_Metrics');
      // Add headers with scenario columns
      metricsSheet.getRange(1, 1, 1, 11).setValues([[
        'Participant ID',
        'Start Time',
        'End Time',
        'Duration (seconds)',
        'Total Tokens Used',
        'Prompt Count',
        'Scenario ID',
        'Response Option',
        'Response Score',
        'Response Text',
        'Date'
      ]]);
      metricsSheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    }
    
    // Append metrics data
    metricsSheet.appendRow([
      participantId,
      metrics.startTime,
      metrics.endTime,
      metrics.durationSeconds,
      metrics.totalTokensUsed,
      metrics.promptCount,
      metrics.scenarioId || '',
      metrics.scenarioResponse?.optionId || '',
      metrics.scenarioResponse?.score || '',
      metrics.scenarioResponse?.text || '',
      new Date().toISOString()
    ]);
    
    console.log('Session metrics saved for participant:', participantId);
    return { success: true };
  } catch (error) {
    console.error('Error saving session metrics:', error);
    return { success: false, error: error.toString() };
  }
}

// Save demographics data to a separate, protected sheet
function saveDemographics(demographics) {
  console.log('saveDemographics called with:', JSON.stringify(demographics));
  
  try {
    const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
    if (!PROMPTLAB_SHEET_ID) {
      throw new Error('PROMPTLAB_SHEET_ID not configured');
    }
    
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    
    // Get or create Demographics sheet
    let demographicsSheet = spreadsheet.getSheetByName('Demographics');
    if (!demographicsSheet) {
      demographicsSheet = spreadsheet.insertSheet('Demographics');
      
      // Add headers if new sheet
      const headers = [
        'Timestamp',
        'Participant ID',
        'Age Band',
        'Gender', 
        'Qualification',
        'Discipline',
        'English Proficiency',
        'Coding Experience',
        'LLM Usage',
        'Occupation',
        'Consent Given',
        'Collection Method'
      ];
      
      demographicsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      demographicsSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#2196F3')
        .setFontColor('#FFFFFF');
      
      // Set column widths
      demographicsSheet.setColumnWidth(1, 180); // Timestamp
      demographicsSheet.setColumnWidth(2, 120); // Participant ID
      demographicsSheet.setColumnWidth(3, 100); // Age Band
      demographicsSheet.setColumnWidth(4, 100); // Gender
      demographicsSheet.setColumnWidth(5, 150); // Qualification
      demographicsSheet.setColumnWidth(6, 150); // Discipline
      demographicsSheet.setColumnWidth(7, 150); // English Proficiency
      demographicsSheet.setColumnWidth(8, 150); // Coding Experience
      demographicsSheet.setColumnWidth(9, 120); // LLM Usage
      demographicsSheet.setColumnWidth(10, 150); // Occupation
      demographicsSheet.setColumnWidth(11, 120); // Consent
      demographicsSheet.setColumnWidth(12, 150); // Collection Method
      
      // Freeze header row
      demographicsSheet.setFrozenRows(1);
      
      // IMPORTANT: Protect the sheet - only script owner can edit
      const protection = demographicsSheet.protect();
      protection.setDescription('Demographics data - Protected');
      protection.setWarningOnly(false);
      // Remove all editors except the owner
      protection.removeEditors(protection.getEditors());
      if (protection.canDomainEdit()) {
        protection.setDomainEdit(false);
      }
      
      console.log('Created and protected Demographics sheet');
    }
    
    // Check if participant already submitted demographics
    const existingData = demographicsSheet.getDataRange().getValues();
    const participantCol = 1; // Participant ID column (0-indexed)
    
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][participantCol] === demographics.participantId) {
        console.log('Demographics already recorded for participant:', demographics.participantId);
        return {
          success: true,
          message: 'Demographics already on file',
          updated: false
        };
      }
    }
    
    // Add new demographics row
    const row = [
      new Date(), // Timestamp
      demographics.participantId,
      demographics.ageBand || '',
      demographics.gender || '',
      demographics.qualification || '',
      demographics.discipline || '',
      demographics.englishProficiency || '',
      demographics.codingExperience || '',
      demographics.llmUsage || '',
      demographics.occupation || '',
      demographics.consentGiven ? 'Yes' : 'No',
      'After 3 prompts' // Collection method
    ];
    
    console.log('Row to be saved:', row);
    console.log('Individual values:');
    console.log('- participantId:', demographics.participantId);
    console.log('- ageBand:', demographics.ageBand);
    console.log('- gender:', demographics.gender);
    console.log('- qualification:', demographics.qualification);
    console.log('- discipline:', demographics.discipline);
    console.log('- englishProficiency:', demographics.englishProficiency);
    console.log('- codingExperience:', demographics.codingExperience);
    console.log('- llmUsage:', demographics.llmUsage);
    console.log('- occupation:', demographics.occupation);
    
    demographicsSheet.appendRow(row);
    
    console.log('Demographics saved for participant:', demographics.participantId);
    
    return {
      success: true,
      message: 'Demographics saved successfully',
      updated: true
    };
    
  } catch (error) {
    console.error('Error saving demographics:', error);
    throw error;
  }
}

// Function to check if demographics exist for a participant
function checkDemographicsStatus(participantId) {
  try {
    const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
    if (!PROMPTLAB_SHEET_ID) return { hasDemographics: false };
    
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    const demographicsSheet = spreadsheet.getSheetByName('Demographics');
    
    if (!demographicsSheet) return { hasDemographics: false };
    
    const data = demographicsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === participantId) {
        return { 
          hasDemographics: true,
          collectedAt: data[i][0]
        };
      }
    }
    
    return { hasDemographics: false };
    
  } catch (error) {
    console.error('Error checking demographics status:', error);
    return { hasDemographics: false };
  }
}

// Save exit survey data to spreadsheet
function saveExitSurvey(surveyData) {
  console.log('saveExitSurvey called with:', surveyData);
  try {
    const PROMPTLAB_SHEET_ID = PropertiesService.getScriptProperties().getProperty('PROMPTLAB_SHEET_ID');
    if (!PROMPTLAB_SHEET_ID) {
      throw new Error('PROMPTLAB_SHEET_ID not configured');
    }
    console.log('Opening spreadsheet:', PROMPTLAB_SHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(PROMPTLAB_SHEET_ID);
    
    // Get or create Exit Survey sheet
    let surveySheet = spreadsheet.getSheetByName('Exit_Survey');
    if (!surveySheet) {
      surveySheet = spreadsheet.insertSheet('Exit_Survey');
      
      // Add headers if new sheet
      const headers = [
        'Timestamp',
        'Participant ID',
        'Session ID',
        'Mental Demand',
        'Confidence Level',
        'AI Reliance',
        'Overall Experience',
        'Completion Time (ms)',
        'Total Scenarios Completed'
      ];
      
      surveySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      surveySheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#9C27B0')
        .setFontColor('#FFFFFF');
      
      // Set column widths
      surveySheet.setColumnWidth(1, 180); // Timestamp
      surveySheet.setColumnWidth(2, 120); // Participant ID
      surveySheet.setColumnWidth(3, 120); // Session ID
      surveySheet.setColumnWidth(4, 120); // Mental Demand
      surveySheet.setColumnWidth(5, 120); // Confidence
      surveySheet.setColumnWidth(6, 120); // AI Reliance
      surveySheet.setColumnWidth(7, 140); // Overall Experience
      surveySheet.setColumnWidth(8, 140); // Completion Time
      surveySheet.setColumnWidth(9, 180); // Scenarios Completed
      
      // Freeze header row
      surveySheet.setFrozenRows(1);
      
      // Protect the sheet similar to demographics
      const protection = surveySheet.protect();
      protection.setDescription('Exit Survey data - Protected');
      protection.setWarningOnly(false);
      protection.removeEditors(protection.getEditors());
      if (protection.canDomainEdit()) {
        protection.setDomainEdit(false);
      }
      
      console.log('Created and protected Exit Survey sheet');
    }
    
    // Check if participant already submitted exit survey
    const existingData = surveySheet.getDataRange().getValues();
    const participantCol = 1; // Participant ID column (0-indexed)
    const sessionCol = 2; // Session ID column (0-indexed)
    
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][participantCol] === surveyData.participantId && 
          existingData[i][sessionCol] === surveyData.sessionId) {
        console.log('Exit survey already recorded for participant:', surveyData.participantId, 'session:', surveyData.sessionId);
        return {
          success: true,
          message: 'Exit survey already recorded',
          duplicate: true
        };
      }
    }
    
    // Prepare row data
    const timestamp = new Date();
    const rowData = [
      timestamp,
      surveyData.participantId,
      surveyData.sessionId || '',
      surveyData.mentalDemand || 0,
      surveyData.confidence || 0,
      surveyData.aiReliance || 0,
      surveyData.overallExperience || 0,
      surveyData.completionTime || 0,
      surveyData.totalScenarios || 0
    ];
    
    // Use optimized append if available
    if (typeof appendRowOptimized !== 'undefined') {
      appendRowOptimized(surveySheet, rowData);
    } else {
      surveySheet.appendRow(rowData);
    }
    
    console.log('Exit survey saved for participant:', surveyData.participantId);
    
    // Flush to ensure data is written immediately
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: 'Exit survey saved successfully',
      timestamp: timestamp.toISOString()
    };
    
  } catch (error) {
    console.error('Error saving exit survey:', error);
    throw error;
  }
}

// Helper to set up default Singapore class schedule
function setupSingaporeSchedule() {
  const schedule = [
    { day: 'Monday', startTime: '09:00', endTime: '12:00', cohort: 'MON-AM' },
    { day: 'Monday', startTime: '14:00', endTime: '17:00', cohort: 'MON-PM' },
    { day: 'Tuesday', startTime: '09:00', endTime: '12:00', cohort: 'TUE-AM' },
    { day: 'Tuesday', startTime: '14:00', endTime: '17:00', cohort: 'TUE-PM' },
    { day: 'Wednesday', startTime: '09:00', endTime: '12:00', cohort: 'WED-AM' },
    { day: 'Wednesday', startTime: '14:00', endTime: '17:00', cohort: 'WED-PM' },
    { day: 'Thursday', startTime: '09:00', endTime: '12:00', cohort: 'THU-AM' },
    { day: 'Thursday', startTime: '14:00', endTime: '17:00', cohort: 'THU-PM' },
    { day: 'Friday', startTime: '09:00', endTime: '12:00', cohort: 'FRI-AM' }
  ];
  
  setClassSchedule(schedule);
  PropertiesService.getScriptProperties().setProperty('TIMEZONE', 'Asia/Singapore');
  console.log('Singapore schedule configured');
}

// Manual cohort assignment for edge cases
function assignParticipantToCohort(participantId, cohort) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const participantCol = headers.indexOf('Participant ID');
  const cohortCol = headers.indexOf('Cohort ID');
  
  // Find all UNASSIGNED entries for this participant
  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][participantCol] === participantId && 
        data[i][cohortCol] === 'UNASSIGNED') {
      sheet.getRange(i + 1, cohortCol + 1).setValue(cohort);
      updated++;
    }
  }
  
  console.log(`Assigned participant ${participantId} to cohort ${cohort}. Updated ${updated} rows.`);
  return updated;
}

// Get unassigned participants
function getUnassignedParticipants() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const participantCol = headers.indexOf('Participant ID');
  const cohortCol = headers.indexOf('Cohort ID');
  const timestampCol = headers.indexOf('Timestamp');
  
  const unassigned = new Map();
  
  data.slice(1).forEach(row => {
    if (row[cohortCol] === 'UNASSIGNED') {
      const participant = row[participantCol];
      if (!unassigned.has(participant)) {
        unassigned.set(participant, {
          firstSubmission: row[timestampCol],
          count: 1
        });
      } else {
        unassigned.get(participant).count++;
      }
    }
  });
  
  return Array.from(unassigned.entries()).map(([id, info]) => ({
    participantId: id,
    firstSubmission: info.firstSubmission,
    unassignedCount: info.count
  }));
}

// Generate monthly cohort ID with days (e.g., "2024-12-A-SS" for December 2024, Cohort A, Sat/Sun)
function generateMonthlyCohortId(baseCohort, date = new Date()) {
  // Map cohorts to their days
  const cohortDays = {
    'A': 'SS',  // Saturday/Sunday
    'B': 'SS',  // Saturday/Sunday
    'C': 'MW',  // Monday/Wednesday
    'D': 'TT'   // Tuesday/Thursday
  };
  
  // Determine which month the cohort "belongs" to
  // If we're in the last week of a month, this cohort belongs to next month
  const cohortMonth = getCohortMonth(date);
  const year = cohortMonth.getFullYear();
  const month = String(cohortMonth.getMonth() + 1).padStart(2, '0');
  const days = cohortDays[baseCohort] || 'XX';
  
  return `${year}-${month}-${baseCohort}-${days}`;
}

// Determine which month a cohort belongs to based on majority of sessions
function getCohortMonth(date) {
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  
  // If we're in the last week of the month (last 7 days)
  // AND it's the start of a new cohort cycle, assign to next month
  if (day > daysInMonth - 7) {
    const dayOfWeek = date.getDay();
    
    // Check if this is the start of a cohort cycle
    // Weekend cohorts start on Saturday
    // Weekday cohorts start on Monday (C) or Tuesday (D)
    const isNewCycleStart = (
      dayOfWeek === 6 || // Saturday (A, B cohorts)
      dayOfWeek === 1 || // Monday (C cohort)
      dayOfWeek === 2    // Tuesday (D cohort)
    );
    
    if (isNewCycleStart) {
      // This cohort belongs to next month
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    }
  }
  
  // Otherwise, use current month
  return date;
}

// Fix cold start problem - batch process all unassigned participants
function fixColdStart() {
  const unassigned = getUnassignedParticipants();
  const assignments = {};
  let totalAssigned = 0;
  
  console.log(`Found ${unassigned.length} unassigned participants`);
  
  unassigned.forEach(p => {
    const date = new Date(p.firstSubmission);
    const day = date.getDay(); // 0=Sunday, 1=Monday, etc.
    const hour = date.getHours();
    
    let baseCohort = null;
    
    // Determine base cohort from schedule
    // Weekend cohorts
    if (day === 0 || day === 6) { // Saturday or Sunday
      if (hour >= 9 && hour < 12) {
        baseCohort = 'A';
      } else if (hour >= 13 && hour < 16) {
        baseCohort = 'B';
      }
    }
    // Weekday evening cohorts  
    else if (day === 1 || day === 3) { // Monday or Wednesday
      if (hour >= 19 && hour < 22) {
        baseCohort = 'C';
      }
    }
    else if (day === 2 || day === 4) { // Tuesday or Thursday
      if (hour >= 19 && hour < 22) {
        baseCohort = 'D';
      }
    }
    
    if (baseCohort) {
      // Generate monthly cohort ID
      const cohortId = generateMonthlyCohortId(baseCohort, date);
      
      // Assign participant to cohort
      const updated = assignParticipantToCohort(p.participantId, cohortId);
      
      if (!assignments[cohortId]) {
        assignments[cohortId] = 0;
      }
      assignments[cohortId] += updated;
      totalAssigned += updated;
      
      console.log(`Assigned ${p.participantId} to ${cohortId} (${p.firstSubmission})`);
    } else {
      console.log(`Could not determine cohort for ${p.participantId} (${p.firstSubmission})`);
    }
  });
  
  console.log('\nCold start fix complete:');
  console.log('Assignments by cohort:', assignments);
  console.log('Total rows updated:', totalAssigned);
  
  return {
    processed: unassigned.length,
    assigned: totalAssigned,
    byCohort: assignments
  };
}

// Test function for debugging
function testFunction() {
  return 'Server connection successful! Time: ' + new Date().toString();
}

// Manual test function to check sheet creation
function testSheetCreation() {
  try {
    const sheet = getOrCreateSheet();
    console.log('Sheet created/found successfully');
    console.log('Sheet name:', sheet.getName());
    console.log('Sheet URL:', sheet.getParent().getUrl());
    return {
      success: true,
      sheetName: sheet.getName(),
      sheetUrl: sheet.getParent().getUrl()
    };
  } catch (error) {
    console.error('Error creating sheet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Test the full process
function testFullProcess() {
  const testData = {
    participantId: 'test-user',
    cohortId: 'test-cohort',
    prompt: 'This is a test prompt'
  };
  
  return processPrompt(testData);
}

// Alternative entry point for testing
function doGetTest() {
  try {
    return HtmlService.createHtmlOutputFromFile('test')
      .setTitle('Test Page')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput('Error: ' + error.toString());
  }
}// Force update Wed  6 Aug 2025 15:58:51 +07
// Force update Wed  6 Aug 2025 16:02:05 +07
// Force refresh Thu  7 Aug 2025 17:09:02 +07
// FORCE UPDATE 1754561403
