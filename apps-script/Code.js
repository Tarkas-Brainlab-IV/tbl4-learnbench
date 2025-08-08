/**
 * Main entry point for the PromptLab web application
 * Fixed version - removes duplicates, keeps refactored functions
 * 
 * IMPORTANT: This file replaces Code.js entirely
 * Delete or rename the old Code.js to Code-old.js before using this
 */

// Main entry point for the web app
function doGet(e) {
  try {
    // Simple page routing without performance monitoring for initial load
    const page = e.parameter.page ? String(e.parameter.page).toLowerCase() : 'index';
    
    // Route to appropriate page
    let htmlFile;
    let title;
    
    switch (page) {
      case 'demographics':
        htmlFile = 'demographics-form';
        title = 'Study Information';
        break;
      case 'test':
        htmlFile = 'test';
        title = 'Test Page';
        break;
      default:
        htmlFile = 'index';
        title = 'Session';
    }
    
    // Create HTML output
    const output = HtmlService.createHtmlOutputFromFile(htmlFile)
      .setTitle(title)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    return output;
    
  } catch (error) {
    // Return error page
    return HtmlService.createHtmlOutput(`
      <h1>Error Loading Application</h1>
      <p>Error: ${error.toString()}</p>
      <p>Please ensure all files are properly deployed.</p>
    `);
  }
}

/**
 * Generate secure participant hash with validation
 */
function generateParticipantHash(nricLast4) {
  try {
    // Validate input
    const validated = Validators.nricLast4(nricLast4);
    
    // Generate hash using pure function
    const hash = generateHash(validated);
    
    Logger.info('Generated participant hash', { 
      nricPattern: validated.substring(0, 3) + '*' 
    });
    
    Analytics.trackAction('login', { success: true });
    
    return {
      success: true,
      hash: hash,
      message: 'Login successful'
    };
    
  } catch (error) {
    Logger.error('Hash generation failed', { error: error.toString() });
    Analytics.trackAction('login', { success: false });
    
    return {
      success: false,
      error: error.message || 'Invalid input format'
    };
  }
}

/**
 * Get client configuration with caching
 */
function getClientConfig() {
  const timer = performanceMonitor.startTimer('getClientConfig');
  
  try {
    // Get config from cache or sheet
    const config = CacheManager.get('config', () => {
      return loadConfigFromSheet();
    }, CONFIG.CACHE_TTL.CONFIG);
    
    performanceMonitor.endTimer(timer);
    
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
  } catch (error) {
    performanceMonitor.endTimer(timer);
    return ErrorHandler.logAndDefault(
      'getClientConfig',
      error,
      CONFIG.DEFAULTS
    );
  }
}

/**
 * Load configuration from Setup sheet
 */
function loadConfigFromSheet() {
  try {
    const setupSheet = SheetManager.getSheet(CONFIG.SHEETS.SETUP);
    const setupData = setupSheet.getRange('B2:B11').getValues();
    
    return {
      enableAI: setupData[0][0] !== false,
      enableContext: setupData[1][0] === true,
      contextWindow: parseInt(setupData[2][0] || CONFIG.DEFAULTS.CONTEXT_WINDOW),
      enableDemographics: setupData[3][0] !== false,
      promptsBeforeDemographics: parseInt(setupData[4][0] || CONFIG.DEFAULTS.PROMPTS_BEFORE_DEMOGRAPHICS),
      autoAdvanceScenarios: setupData[5][0] !== false,
      autoCloseOnComplete: setupData[6][0] !== false,
      geminiApiKey: PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.GEMINI_KEY),
      allowOutOfClass: setupData[7][0] !== false,
      timezone: setupData[8][0] || CONFIG.DEFAULTS.TIMEZONE,
      enableExitSurvey: setupData[9][0] !== false
    };
  } catch (error) {
    Logger.warn('Failed to load config from sheet, using defaults', { error: error.toString() });
    return CONFIG.DEFAULTS;
  }
}

/**
 * Process prompt with validation and monitoring
 */
function processPrompt(data) {
  const timer = performanceMonitor.startTimer('processPrompt');
  
  try {
    // Validate input data
    const validatedData = {
      participantId: Validators.participantId(data.participantId),
      prompt: Validators.prompt(data.prompt),
      scenarioId: data.scenarioId || null,
      image: data.image || null
    };
    
    // Get configuration
    const config = getClientConfig();
    
    // Detect cohort and check permissions
    const cohortInfo = detectCohortWithValidation(validatedData.participantId);
    
    if (!cohortInfo.inClass && !config.allowOutOfClass) {
      Analytics.trackAction('blocked_submission', { reason: 'out_of_class' });
      return {
        success: false,
        error: 'Submissions are only accepted during scheduled class times.'
      };
    }
    
    // Get conversation context if enabled
    const context = config.enableContext 
      ? getConversationContext(validatedData.participantId)
      : [];
    
    // Call AI API
    const aiTimer = performanceMonitor.startTimer('gemini_api_call');
    const geminiResponse = callGeminiAPIWithContext(
      validatedData.prompt,
      context,
      validatedData.image
    );
    performanceMonitor.endTimer(aiTimer);
    
    // Validate API response
    const validatedResponse = Validators.apiResponse(geminiResponse);
    
    // Log to spreadsheet
    const timestamp = new Date();
    const rowData = [
      timestamp,
      validatedData.participantId,
      cohortInfo.cohort,
      validatedData.prompt,
      validatedResponse.output,
      validatedResponse.processingTime || 0,
      cohortInfo.inClass ? 'IN-CLASS' : 'OUT-OF-CLASS',
      cohortInfo.note || '',
      validatedData.scenarioId || '',
      validatedResponse.tokens || 0
    ];
    
    SheetManager.safeAppendRow(CONFIG.SHEETS.PROMPTS, rowData);
    
    // Update conversation cache
    if (config.enableContext) {
      updateConversationCache(
        validatedData.participantId,
        validatedData.prompt,
        validatedResponse.output,
        timestamp
      );
    }
    
    // Check if demographics needed
    const promptCount = getParticipantPromptCount(validatedData.participantId);
    const needsDemographics = shouldShowDemographics(
      promptCount,
      0, // scenario count
      config
    );
    
    performanceMonitor.endTimer(timer);
    Analytics.trackAction('submit_prompt', {
      participantId: validatedData.participantId,
      cohort: cohortInfo.cohort,
      hasImage: Boolean(validatedData.image)
    });
    
    return {
      success: true,
      response: validatedResponse.output,
      model: validatedResponse.model,
      needsDemographics: needsDemographics
    };
    
  } catch (error) {
    performanceMonitor.endTimer(timer);
    ErrorHandler.logError(error, ErrorSeverity.HIGH);
    Analytics.trackAction('error', { 
      type: 'processPrompt',
      error: error.toString() 
    });
    
    return {
      success: false,
      error: 'Failed to process your request. Please try again.'
    };
  }
}

/**
 * Save demographics with validation
 */
function saveDemographicsMain(data) {
  const timer = performanceMonitor.startTimer('saveDemographics');
  
  try {
    // Validate demographics data
    const validatedData = Validators.demographics(data);
    
    // Transform for storage
    const rowData = transformDemographicsForStorage(validatedData);
    
    // Save to sheet
    SheetManager.safeAppendRow(CONFIG.SHEETS.DEMOGRAPHICS, rowData);
    
    // Update cache
    CacheManager.put(
      `demographics_${validatedData.participantId}`,
      { provided: true, timestamp: new Date() },
      CONFIG.CACHE_TTL.DEMOGRAPHICS
    );
    
    Analytics.trackAction('provide_demographics', {
      participantId: validatedData.participantId
    });
    
    Logger.info('Demographics saved', { 
      participantId: validatedData.participantId 
    });
    
    performanceMonitor.endTimer(timer);
    
    return {
      success: true,
      message: 'Demographics saved successfully'
    };
    
  } catch (error) {
    performanceMonitor.endTimer(timer);
    ErrorHandler.logError(error, ErrorSeverity.MEDIUM);
    
    return {
      success: false,
      error: error.message || 'Failed to save demographics'
    };
  }
}

/**
 * Save exit survey with validation
 */
function saveExitSurvey(data) {
  const timer = performanceMonitor.startTimer('saveExitSurvey');
  
  try {
    // Validate survey data
    const validatedData = Validators.exitSurvey(data);
    
    // Prepare row data
    const rowData = [
      new Date(),
      validatedData.participantId,
      validatedData.sessionId,
      validatedData.mentalDemand || '',
      validatedData.confidence || '',
      validatedData.aiReliance || '',
      validatedData.overallExperience || '',
      validatedData.completionTime || 0,
      validatedData.totalScenarios || 0,
      validatedData.comments || ''
    ];
    
    // Save to sheet
    SheetManager.safeAppendRow(CONFIG.SHEETS.EXIT_SURVEY, rowData);
    
    Analytics.trackAction('complete_survey', {
      participantId: validatedData.participantId,
      sessionId: validatedData.sessionId
    });
    
    Logger.info('Exit survey saved', { 
      participantId: validatedData.participantId 
    });
    
    performanceMonitor.endTimer(timer);
    
    return {
      success: true,
      message: 'Survey saved successfully'
    };
    
  } catch (error) {
    performanceMonitor.endTimer(timer);
    ErrorHandler.logError(error, ErrorSeverity.MEDIUM);
    
    return {
      success: false,
      error: error.message || 'Failed to save survey'
    };
  }
}

/**
 * Get all scenarios for participant (called from HTML)
 */
function getAllScenariosForParticipant(participantId) {
  const cacheKey = `scenarios_${participantId}`;
  
  return CacheManager.get(cacheKey, () => {
    try {
      const scenariosSheet = SheetManager.getSheet(CONFIG.SHEETS.SCENARIOS);
      const data = scenariosSheet.getDataRange().getValues();
      const scenarios = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue; // Skip empty rows
        
        const scenario = {
          id: String(row[0]),
          title: String(row[1] || ''),
          description: String(row[2] || ''),
          options: parseScenarioOptions(row[3]),
          tags: String(row[4] || ''),
          active: row[5] !== false
        };
        
        if (scenario.active && scenario.options.length > 0) {
          scenarios.push(scenario);
        }
      }
      
      return scenarios;
    } catch (error) {
      return ErrorHandler.logAndDefault(
        'getAllScenariosCached',
        error,
        []
      );
    }
  }, CONFIG.CACHE_TTL.SCENARIOS);
}

/**
 * System health check
 */
function healthCheck() {
  return HealthChecker.runHealthCheck();
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  CacheManager.clear();
  SheetManager.clearCache();
  Logger.info('All caches cleared');
  return 'Caches cleared successfully';
}

/**
 * Get performance metrics
 */
function getPerformanceMetrics() {
  return performanceMonitor.getSummary();
}

// ============================================
// HELPER FUNCTIONS (Not exposed to client)
// ============================================

/**
 * Detect cohort with validation
 */
function detectCohortWithValidation(participantId) {
  try {
    const validatedId = Validators.participantId(participantId);
    
    // Get participant history
    const historicalCohort = getParticipantHistoricalCohort(validatedId);
    
    if (historicalCohort) {
      // Use clustering analysis to classify
      const recentActivity = getRecentActivity(validatedId);
      const classification = classifySessionTiming(
        { recentActivity },
        getClassSchedule(),
        new Date()
      );
      
      return {
        cohort: historicalCohort,
        inClass: classification.likelyInClass,
        confidence: classification.confidence,
        note: classification.reason
      };
    }
    
    // New participant - detect from current activity
    const activeCohorts = detectActiveCohorts();
    
    if (activeCohorts.length === 1) {
      return {
        cohort: activeCohorts[0].cohort,
        inClass: true,
        confidence: activeCohorts[0].confidence,
        note: 'Assigned to currently active cohort'
      };
    }
    
    // Multiple or no cohorts - need manual assignment
    return {
      cohort: 'UNASSIGNED',
      inClass: false,
      confidence: 0,
      note: activeCohorts.length > 1 
        ? 'Multiple cohorts active' 
        : 'No active cohorts detected'
    };
    
  } catch (error) {
    return ErrorHandler.logAndDefault(
      'detectCohortWithValidation',
      error,
      { cohort: 'ERROR', inClass: false, confidence: 0, note: error.toString() }
    );
  }
}

function getParticipantHistoricalCohort(participantId) {
  const sheet = SheetManager.getSheet(CONFIG.SHEETS.PROMPTS);
  const data = sheet.getDataRange().getValues();
  
  // Find participant's most recent valid cohort
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][1] === participantId) {
      const cohort = data[i][2];
      if (cohort && cohort !== 'UNASSIGNED' && cohort !== 'OUT-OF-CLASS') {
        return cohort;
      }
    }
  }
  
  return null;
}

function getRecentActivity(participantId) {
  const sheet = SheetManager.getSheet(CONFIG.SHEETS.PROMPTS);
  const data = sheet.getDataRange().getValues();
  const recentWindow = new Date(Date.now() - CONFIG.CLUSTERING.RECENT_WINDOW_MINUTES * 60 * 1000);
  
  return data.slice(1)
    .filter(row => new Date(row[0]) >= recentWindow)
    .map(row => ({
      timestamp: row[0],
      participantId: row[1],
      cohort: row[2]
    }));
}

function detectActiveCohorts() {
  const recentActivity = getRecentActivity();
  const cohortCounts = {};
  
  recentActivity.forEach(activity => {
    if (activity.cohort && activity.cohort !== 'UNASSIGNED') {
      if (!cohortCounts[activity.cohort]) {
        cohortCounts[activity.cohort] = new Set();
      }
      cohortCounts[activity.cohort].add(activity.participantId);
    }
  });
  
  return Object.entries(cohortCounts)
    .map(([cohort, participants]) => ({
      cohort,
      participants: participants.size,
      confidence: Math.min(participants.size / CONFIG.CLUSTERING.MIN_CLASS_PARTICIPANTS, 1)
    }))
    .filter(c => c.participants >= 3)
    .sort((a, b) => b.participants - a.participants);
}

function getParticipantPromptCount(participantId) {
  try {
    const sheet = SheetManager.getSheet(CONFIG.SHEETS.PROMPTS);
    const data = sheet.getDataRange().getValues();
    
    return data.slice(1).filter(row => row[1] === participantId).length;
  } catch (error) {
    return 0;
  }
}

function getClassSchedule() {
  // This would load from a Class Schedule sheet if available
  return CONFIG.DEFAULTS.CLASS_SCHEDULE || [];
}

function updateConversationCache(participantId, prompt, response, timestamp) {
  const cacheKey = `conversation_${participantId}`;
  const existing = CacheManager.get(cacheKey, () => [], 0) || [];
  
  existing.push({ timestamp, prompt, response });
  
  // Keep only last N exchanges
  const config = getClientConfig();
  while (existing.length > config.contextWindow) {
    existing.shift();
  }
  
  CacheManager.put(cacheKey, existing, CONFIG.CACHE_TTL.PARTICIPANT);
}

function getConversationContext(participantId) {
  const cacheKey = `conversation_${participantId}`;
  return CacheManager.get(cacheKey, () => [], 0) || [];
}

// ============================================
// BACKWARD COMPATIBILITY
// Keep these for existing code that might call them
// ============================================

function getOrCreateSheet() {
  return SheetManager.getSheet(CONFIG.SHEETS.PROMPTS);
}

function getConfig() {
  return loadConfigFromSheet();
}

function detectCohort(participantId) {
  return detectCohortWithValidation(participantId);
}

// ============================================
// TEST FUNCTIONS
// ============================================

function testNewSystem() {
  console.log('Testing v2.0 deployment...');
  
  try {
    // Test configuration
    console.log('CONFIG exists:', typeof CONFIG !== 'undefined');
    console.log('ErrorHandler exists:', typeof ErrorHandler !== 'undefined');
    console.log('Validators exists:', typeof Validators !== 'undefined');
    console.log('SheetManager exists:', typeof SheetManager !== 'undefined');
    
    // Test health check
    const health = healthCheck();
    console.log('Health check:', health);
    
    // Test hash generation
    const hash = generateParticipantHash('TEST');
    console.log('Hash generation:', hash);
    
    // Test configuration
    const config = getClientConfig();
    console.log('Config loaded:', Boolean(config));
    
    return {
      success: true,
      health: health,
      message: 'V2.0 system operational!'
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Keep the Gemini API functions until we refactor them
function callGeminiAPIWithContext(prompt, context = [], image = null) {
  // Check if we have the production Gemini function
  if (typeof callGeminiAPIProduction !== 'undefined') {
    return callGeminiAPIProduction(prompt);
  }
  
  // Otherwise use the Code-gemini.js version
  return callGeminiAPI(prompt, image);
}

function callGeminiAPI(prompt, image = null) {
  // Check if Code-gemini.js has the real implementation
  const startTime = Date.now();
  
  // Get API key from script properties
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) {
    return {
      output: 'Please configure your Gemini API key in Script Properties.',
      model: 'error',
      tokens: 0,
      processingTime: Date.now() - startTime
    };
  }
  
  // Use Gemini 1.5 Flash for faster responses
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY;
  
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
  
  try {
    const response = UrlFetchApp.fetch(API_URL, options);
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
    
    return {
      output: output,
      model: 'gemini-1.5-flash',
      tokens: totalTokens,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return a user-friendly error message
    return {
      output: `I encountered an error: ${error.toString()}. Please check the API key and try again.`,
      model: 'error',
      tokens: 0,
      processingTime: Date.now() - startTime
    };
  }
}

// Add the backward compatibility function
function getAllScenariosCached(participantId) {
  return getAllScenariosForParticipant(participantId);
}