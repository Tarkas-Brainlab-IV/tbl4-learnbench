// Intelligent Cache Manager for Apps Script
// Reduces sheet reads and improves performance

/**
 * Cache Manager - Handles all caching operations
 */
const CacheManager = {
  // Cache durations (in seconds)
  DURATIONS: {
    CONFIG: 3600,        // 1 hour - config rarely changes
    SCENARIOS: 7200,     // 2 hours - scenarios are static
    PARTICIPANT: 300,    // 5 minutes - participant data
    COHORT: 600,         // 10 minutes - cohort detection
    SHORT: 60,           // 1 minute - quick cache
    SESSION: 1800        // 30 minutes - session data
  },
  
  /**
   * Get or set cached value with automatic JSON handling
   */
  get(key, fetcher, duration = this.DURATIONS.SHORT) {
    const cache = CacheService.getScriptCache();
    
    try {
      // Try to get from cache
      const cached = cache.get(key);
      if (cached !== null) {
        console.log(`Cache HIT: ${key}`);
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error(`Cache parse error for ${key}:`, e);
    }
    
    // Cache miss - fetch new data
    console.log(`Cache MISS: ${key} - fetching...`);
    const data = fetcher();
    
    // Store in cache
    try {
      cache.put(key, JSON.stringify(data), duration);
    } catch (e) {
      console.error(`Cache put error for ${key}:`, e);
      // If caching fails (too large), continue without caching
    }
    
    return data;
  },
  
  /**
   * Invalidate cache entries
   */
  invalidate(pattern) {
    const cache = CacheService.getScriptCache();
    if (pattern === '*') {
      // Clear all cache
      cache.removeAll([]);
      console.log('Cache cleared: ALL');
    } else {
      // Remove specific key
      cache.remove(pattern);
      console.log(`Cache cleared: ${pattern}`);
    }
  },
  
  /**
   * Batch get multiple cache entries
   */
  getBatch(keys) {
    const cache = CacheService.getScriptCache();
    const results = cache.getAll(keys);
    const parsed = {};
    
    for (const [key, value] of Object.entries(results)) {
      if (value !== null) {
        try {
          parsed[key] = JSON.parse(value);
        } catch (e) {
          parsed[key] = null;
        }
      } else {
        parsed[key] = null;
      }
    }
    
    return parsed;
  }
};

/**
 * Cached version of getConfig
 */
function getConfigCached() {
  return CacheManager.get('config', () => {
    // Original getConfig logic
    try {
      const sheet = getOrCreateSheet();
      const ss = sheet.getParent();
      let setupSheet = ss.getSheetByName('Setup');
      
      if (!setupSheet) {
        setupSheet = createSetupSheet(ss);
      }
      
      const setupData = setupSheet.getRange('B2:B11').getValues();
      
      return {
        enableAI: setupData[0][0] !== false,
        enableContext: setupData[1][0] === true,
        contextWindow: parseInt(setupData[2][0] || 5),
        enableDemographics: setupData[3][0] !== false,
        promptsBeforeDemographics: parseInt(setupData[4][0] || 3),
        autoAdvanceScenarios: setupData[5][0] !== false,
        autoCloseOnComplete: setupData[6][0] !== false,
        geminiApiKey: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
        allowOutOfClass: setupData[7][0] !== false,
        timezone: setupData[8][0] || 'Asia/Singapore',
        enableExitSurvey: setupData[9][0] !== false
      };
    } catch (error) {
      console.error('Error reading setup sheet, using defaults:', error);
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
  }, CacheManager.DURATIONS.CONFIG);
}

/**
 * Cached version of getAllScenariosForParticipant
 */
function getAllScenariosCached(participantId) {
  const cacheKey = `scenarios_${participantId}`;
  
  return CacheManager.get(cacheKey, () => {
    // Original logic
    try {
      const sheet = getOrCreateSheet();
      const ss = sheet.getParent();
      
      let scenariosSheet = ss.getSheetByName('Scenarios');
      if (!scenariosSheet) {
        scenariosSheet = createExampleScenariosSheet(ss);
      }
      
      const data = scenariosSheet.getDataRange().getValues();
      const scenarios = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1]) {
          const scenario = {
            id: row[0],
            text: row[1],
            imageUrl: row[2] || null,
            options: []
          };
          
          for (let j = 0; j < 5; j++) {
            const optionIdx = 3 + (j * 2);
            const scoreIdx = 4 + (j * 2);
            
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
          }
        }
      }
      
      return scenarios;
    } catch (error) {
      console.error('Error getting scenarios:', error);
      return [];
    }
  }, CacheManager.DURATIONS.SCENARIOS);
}

/**
 * Optimized sheet reader - reads only necessary rows
 */
function getRecentSheetData(participantId, limit = 10) {
  const cacheKey = `recent_${participantId}_${limit}`;
  
  return CacheManager.get(cacheKey, () => {
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    // Calculate range to read (last N rows)
    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows = lastRow - startRow + 1;
    
    if (numRows <= 0) return [];
    
    // Read only the necessary rows
    const data = sheet.getRange(startRow, 1, numRows, 10).getValues();
    const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
    
    // Filter for participant
    const participantCol = headers.indexOf('Participant ID');
    return data.filter(row => row[participantCol] === participantId);
  }, CacheManager.DURATIONS.SHORT);
}

/**
 * Batch load all initial data in one call
 */
function getInitialData(participantId) {
  console.log('Loading initial data for:', participantId);
  
  // Use parallel fetching where possible
  const config = getConfigCached();
  const scenarios = getAllScenariosCached(participantId);
  
  // Check demographics status
  const demographicsStatus = CacheManager.get(
    `demographics_${participantId}`,
    () => checkDemographicsStatus(participantId),
    CacheManager.DURATIONS.SESSION
  );
  
  return {
    config: config,
    scenarios: scenarios,
    demographicsStatus: demographicsStatus,
    timestamp: new Date().toISOString()
  };
}

/**
 * Optimized participant history fetch
 */
function getParticipantHistoryCached(participantId, limit = 20) {
  const cacheKey = `history_${participantId}_${limit}`;
  
  return CacheManager.get(cacheKey, () => {
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];
    
    // Read from the end backwards (most recent first)
    const startRow = Math.max(2, lastRow - 100); // Check last 100 rows
    const numRows = lastRow - startRow + 1;
    
    const data = sheet.getRange(startRow, 1, numRows, 10).getValues();
    const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
    
    const participantCol = headers.indexOf('Participant ID');
    const promptCol = headers.indexOf('Prompt');
    const responseCol = headers.indexOf('AI Response');
    const timestampCol = headers.indexOf('Timestamp');
    
    // Filter and sort
    const history = data
      .filter(row => row[participantCol] === participantId)
      .map(row => ({
        timestamp: row[timestampCol],
        prompt: row[promptCol],
        response: row[responseCol]
      }))
      .reverse() // Most recent first
      .slice(0, limit);
    
    return history;
  }, CacheManager.DURATIONS.PARTICIPANT);
}

/**
 * Cache warming - preload common data
 */
function warmCache() {
  console.log('Warming cache...');
  
  // Preload configuration
  getConfigCached();
  
  // Get sheet reference to check size
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  
  console.log(`Cache warmed. Sheet has ${lastRow} rows.`);
  
  return {
    success: true,
    sheetRows: lastRow,
    timestamp: new Date().toISOString()
  };
}

/**
 * Clear all caches (admin function)
 */
function clearAllCaches() {
  CacheManager.invalidate('*');
  return { success: true, message: 'All caches cleared' };
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  // Apps Script doesn't provide cache stats directly
  // We can track hits/misses if needed
  return {
    message: 'Cache is active',
    durations: CacheManager.DURATIONS
  };
}