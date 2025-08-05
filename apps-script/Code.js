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
    const shortHash = hexHash.substr(0, 8).toUpperCase();
    
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

// Admin configuration - Set these in Script Properties
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    enableContext: props.getProperty('ENABLE_CONTEXT') === 'true' || false,
    contextWindow: parseInt(props.getProperty('CONTEXT_WINDOW') || '5'), // Last N exchanges
    geminiApiKey: props.getProperty('GEMINI_API_KEY'),
    classSchedule: JSON.parse(props.getProperty('CLASS_SCHEDULE') || '[]'), // Array of class times
    timezone: props.getProperty('TIMEZONE') || 'Asia/Singapore',
    allowOutOfClass: props.getProperty('ALLOW_OUT_OF_CLASS') === 'true' || false
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

// Get conversation history for a participant
function getConversationContext(participantId) {
  const config = getConfig();
  if (!config.enableContext) return [];
  
  // Try to get from cache first
  if (conversationCache[participantId]) {
    return conversationCache[participantId];
  }
  
  // Otherwise, fetch from sheet
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find column indices
  const participantCol = headers.indexOf('Participant ID');
  const promptCol = headers.indexOf('Prompt');
  const responseCol = headers.indexOf('AI Response');
  const timestampCol = headers.indexOf('Timestamp');
  
  // Get this participant's history
  const history = data.slice(1)
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

// Process prompt and get AI response
function processPrompt(data) {
  console.log('Processing prompt:', data);
  
  try {
    // Detect cohort based on clustering and participant history
    const cohortInfo = detectCohort(data.participantId);
    const config = getConfig();
    
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
    
    // Call Gemini API with or without context
    const geminiResponse = callGeminiAPIWithContext(data.prompt, context);
    
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
    sheet.appendRow([
      timestamp,
      data.participantId,
      cohortInfo.cohort, // Smart cohort detection
      data.prompt,
      geminiResponse.output,
      geminiResponse.model,
      geminiResponse.tokens,
      geminiResponse.processingTime,
      cohortInfo.inClass ? 'IN-CLASS' : 'OUT-OF-CLASS', // Status
      cohortInfo.note || '' // Additional notes
    ]);
    
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
      tokens: geminiResponse.tokens,
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
  const SHEET_NAME = 'Prompts';
  let spreadsheet;
  
  // First try to get spreadsheet by stored ID
  try {
    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty('PROMPTLAB_SPREADSHEET_ID');
    
    if (spreadsheetId) {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      console.log('Opened spreadsheet by ID');
    }
  } catch (e) {
    console.log('Could not open by ID:', e);
  }
  
  // If no ID or failed, try by name
  if (!spreadsheet) {
    try {
      const SPREADSHEET_NAME = 'PromptLab - Experiment Data';
      const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
      if (files.hasNext()) {
        spreadsheet = SpreadsheetApp.open(files.next());
        // Store the ID for future use
        PropertiesService.getScriptProperties()
          .setProperty('PROMPTLAB_SPREADSHEET_ID', spreadsheet.getId());
      }
    } catch (e) {
      console.error('Could not find spreadsheet by name:', e);
    }
  }
  
  // If still no spreadsheet, we have a problem
  if (!spreadsheet) {
    throw new Error('No spreadsheet found. Please run setupPromptLab() from the Apps Script editor first.');
  }
  
  // Get or create sheet
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    
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
  }
  
  return sheet;
}

// Call Gemini API with context support
function callGeminiAPIWithContext(prompt, context = []) {
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
    
    // Use multi-turn conversation format
    return callGeminiAPIMultiTurn(prompt, contextMessages);
  }
  
  // Otherwise use single-turn
  return callGeminiAPI(prompt);
}

// Multi-turn conversation with Gemini
function callGeminiAPIMultiTurn(currentPrompt, previousMessages) {
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
  
  // Build conversation history
  const contents = [
    ...previousMessages,
    {
      role: 'user',
      parts: [{ text: currentPrompt }]
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
function callGeminiAPI(prompt) {
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
  scriptProperties.setProperty('GEMINI_API_KEY', 'YOUR_API_KEY_HERE');
  scriptProperties.setProperty('ENABLE_CONTEXT', 'false'); // Set to 'true' to enable conversation memory
  scriptProperties.setProperty('CONTEXT_WINDOW', '5'); // Number of previous exchanges to remember
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
}