// Optimized Sheet Operations
// Batch operations and smarter data handling

/**
 * Optimized append row - uses batch operations when possible
 */
function appendRowOptimized(sheet, rowData) {
  try {
    // Get the next row position
    const lastRow = sheet.getLastRow();
    const nextRow = lastRow + 1;
    
    // Use setValues for better performance than appendRow
    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Invalidate relevant caches
    if (typeof CacheManager !== 'undefined') {
      const participantId = rowData[1]; // Assuming participant ID is in column 2
      CacheManager.invalidate(`recent_${participantId}_*`);
      CacheManager.invalidate(`history_${participantId}_*`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in optimized append:', error);
    // Fallback to regular appendRow
    sheet.appendRow(rowData);
    return true;
  }
}

/**
 * Batch append multiple rows at once
 */
function batchAppendRows(sheet, rowsData) {
  if (!rowsData || rowsData.length === 0) return;
  
  try {
    const lastRow = sheet.getLastRow();
    const nextRow = lastRow + 1;
    
    // Append all rows in one operation
    sheet.getRange(nextRow, 1, rowsData.length, rowsData[0].length)
      .setValues(rowsData);
    
    console.log(`Batch appended ${rowsData.length} rows`);
    return true;
  } catch (error) {
    console.error('Batch append failed:', error);
    // Fallback to individual appends
    rowsData.forEach(row => sheet.appendRow(row));
    return false;
  }
}

/**
 * Get sheet with caching of the sheet reference
 */
let cachedSheet = null;
let cachedSheetTime = 0;
const SHEET_CACHE_DURATION = 60000; // 1 minute

function getOrCreateSheetOptimized() {
  const now = Date.now();
  
  // Return cached sheet if still valid
  if (cachedSheet && (now - cachedSheetTime) < SHEET_CACHE_DURATION) {
    return cachedSheet;
  }
  
  // Get or create sheet
  const SHEET_NAME = 'Prompts';
  const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID not found in script properties');
  }
  
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
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
  }
  
  // Cache the sheet reference
  cachedSheet = sheet;
  cachedSheetTime = now;
  
  return sheet;
}

/**
 * Optimized data fetch - reads only what's needed
 */
function getParticipantDataOptimized(participantId, maxRows = 20) {
  const sheet = getOrCreateSheetOptimized();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return [];
  
  // Binary search could be implemented here for very large sheets
  // For now, read last N rows and filter
  const startRow = Math.max(2, lastRow - Math.min(maxRows * 5, 100));
  const numRows = lastRow - startRow + 1;
  
  if (numRows <= 0) return [];
  
  // Read only needed columns
  const dataRange = sheet.getRange(startRow, 1, numRows, 5); // Only first 5 columns
  const data = dataRange.getValues();
  
  // Filter for participant
  return data
    .filter(row => row[1] === participantId) // Column B is Participant ID
    .slice(-maxRows); // Get last N rows
}

/**
 * Pre-warm the sheet cache on script load
 */
function prewarmSheetCache() {
  try {
    getOrCreateSheetOptimized();
    console.log('Sheet cache pre-warmed');
  } catch (e) {
    console.error('Failed to pre-warm sheet cache:', e);
  }
}

/**
 * Get sheet statistics for monitoring
 */
function getSheetStats() {
  const sheet = getOrCreateSheetOptimized();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  // Estimate data size
  const estimatedCells = lastRow * lastCol;
  const estimatedSizeMB = (estimatedCells * 50) / (1024 * 1024); // Assume 50 bytes per cell
  
  return {
    rows: lastRow,
    columns: lastCol,
    estimatedCells: estimatedCells,
    estimatedSizeMB: estimatedSizeMB.toFixed(2),
    warning: estimatedSizeMB > 50 ? 'Sheet is getting large, consider archiving old data' : null
  };
}