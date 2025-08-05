// Core LearnBench Tests - Simplified for easier debugging
// These tests focus on the core functionality without complex mocking

// Test runner function
function runCoreTests() {
  console.log('🧪 Running LearnBench Core Tests...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  // Test 1: NRIC Hashing
  try {
    console.log('Testing NRIC hashing...');
    const hash1 = generateParticipantHash('123A');
    const hash2 = generateParticipantHash('123A');
    const hash3 = generateParticipantHash('456B');
    
    if (hash1.hash !== hash2.hash) throw new Error('Same NRIC should produce same hash');
    if (hash1.hash === hash3.hash) throw new Error('Different NRICs should produce different hashes');
    if (hash1.hash.length !== 8) throw new Error('Hash should be 8 characters');
    
    results.passed++;
    results.details.push('✅ NRIC hashing works correctly');
    console.log('✅ NRIC hashing tests passed');
  } catch (e) {
    results.failed++;
    results.details.push('❌ NRIC hashing failed: ' + e.message);
    console.log('❌ NRIC hashing failed:', e.message);
  }
  results.total++;
  
  // Test 2: Monthly Cohort ID Generation
  try {
    console.log('\nTesting monthly cohort ID generation...');
    const novemberDate = new Date('2024-11-15');
    const cohortA = generateMonthlyCohortId('A', novemberDate);
    const cohortC = generateMonthlyCohortId('C', novemberDate);
    
    if (cohortA !== '2024-11-A-SS') throw new Error('Cohort A should be 2024-11-A-SS');
    if (cohortC !== '2024-11-C-MW') throw new Error('Cohort C should be 2024-11-C-MW');
    
    // Test month boundary
    const saturdayNov30 = new Date('2024-11-30');
    const boundaryId = generateMonthlyCohortId('A', saturdayNov30);
    if (boundaryId !== '2024-12-A-SS') throw new Error('Saturday Nov 30 should generate December cohort');
    
    results.passed++;
    results.details.push('✅ Monthly cohort ID generation works correctly');
    console.log('✅ Monthly cohort ID tests passed');
  } catch (e) {
    results.failed++;
    results.details.push('❌ Monthly cohort ID failed: ' + e.message);
    console.log('❌ Monthly cohort ID failed:', e.message);
  }
  results.total++;
  
  // Test 3: Sheet Operations
  try {
    console.log('\nTesting sheet operations...');
    const sheet = getOrCreateSheet();
    if (!sheet) throw new Error('Should create or get sheet');
    
    // Test headers
    const headers = sheet.getDataRange().getValues()[0];
    if (!headers.includes('Timestamp')) throw new Error('Should have Timestamp header');
    if (!headers.includes('Participant ID')) throw new Error('Should have Participant ID header');
    
    results.passed++;
    results.details.push('✅ Sheet operations work correctly');
    console.log('✅ Sheet operations tests passed');
  } catch (e) {
    results.failed++;
    results.details.push('❌ Sheet operations failed: ' + e.message);
    console.log('❌ Sheet operations failed:', e.message);
  }
  results.total++;
  
  // Test 4: Clustering Score Calculation
  try {
    console.log('\nTesting clustering score calculation...');
    const session = [
      { timestamp: new Date('2024-11-30T09:00:00'), participant: 'USER1' },
      { timestamp: new Date('2024-11-30T09:05:00'), participant: 'USER2' },
      { timestamp: new Date('2024-11-30T09:10:00'), participant: 'USER3' }
    ];
    
    const score = calculateClusteringScore(session, 10, 3);
    if (typeof score !== 'number') throw new Error('Score should be a number');
    if (score < 0 || score > 1) throw new Error('Score should be between 0 and 1');
    
    results.passed++;
    results.details.push('✅ Clustering score calculation works correctly');
    console.log('✅ Clustering score tests passed');
  } catch (e) {
    results.failed++;
    results.details.push('❌ Clustering score failed: ' + e.message);
    console.log('❌ Clustering score failed:', e.message);
  }
  results.total++;
  
  // Test 5: Prompt Processing (Mock Mode)
  try {
    console.log('\nTesting prompt processing...');
    PropertiesService.getScriptProperties().setProperty('USE_MOCK_RESPONSES', 'true');
    
    const result = processPrompt({
      participantId: 'TEST1234',
      cohortId: '2024-11-A-SS',
      prompt: 'Test prompt'
    });
    
    if (!result.success) throw new Error('Should process prompt successfully');
    if (!result.output) throw new Error('Should return output');
    
    results.passed++;
    results.details.push('✅ Prompt processing works correctly');
    console.log('✅ Prompt processing tests passed');
  } catch (e) {
    results.failed++;
    results.details.push('❌ Prompt processing failed: ' + e.message);
    console.log('❌ Prompt processing failed:', e.message);
  }
  results.total++;
  
  // Test 6: Cold Start Fix
  try {
    console.log('\nTesting cold start fix...');
    // First add some test data
    const sheet = getOrCreateSheet();
    sheet.appendRow([new Date(), 'USER1', 'UNASSIGNED', 'Test', 'Response', 100, 'OK']);
    
    const result = fixColdStart();
    if (typeof result.processed !== 'number') throw new Error('Should return processed count');
    
    results.passed++;
    results.details.push('✅ Cold start fix works correctly');
    console.log('✅ Cold start fix tests passed');
  } catch (e) {
    results.failed++;
    results.details.push('❌ Cold start fix failed: ' + e.message);
    console.log('❌ Cold start fix failed:', e.message);
  }
  results.total++;
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  // Log to sheet
  logCoreTestResults(results);
  
  return results;
}

// Helper to log results
function logCoreTestResults(results) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Core Test Results');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Core Test Results');
    }
    
    sheet.clear();
    sheet.getRange(1, 1, 1, 3).setValues([['Test', 'Result', 'Timestamp']]);
    
    const data = results.details.map(detail => [
      detail,
      detail.startsWith('✅') ? 'PASS' : 'FAIL',
      new Date()
    ]);
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, 3).setValues(data);
    }
    
    // Add summary
    sheet.getRange(data.length + 3, 1, 3, 2).setValues([
      ['Total Tests', results.total],
      ['Passed', results.passed],
      ['Failed', results.failed]
    ]);
    
  } catch (e) {
    console.error('Could not log to sheet:', e);
  }
}

// Quick validation function
function validateSetup() {
  console.log('🔍 Validating LearnBench setup...\n');
  
  const checks = [];
  
  // Check 1: Properties
  try {
    const props = PropertiesService.getScriptProperties();
    const schedule = props.getProperty('CLASS_SCHEDULE');
    if (schedule) {
      checks.push('✅ Class schedule configured');
    } else {
      checks.push('❌ Class schedule not configured - run setupYourClassSchedule()');
    }
  } catch (e) {
    checks.push('❌ Error checking properties: ' + e.message);
  }
  
  // Check 2: Sheet structure
  try {
    const sheet = getOrCreateSheet();
    const headers = sheet.getDataRange().getValues()[0];
    if (headers.length >= 7) {
      checks.push('✅ Sheet structure is valid');
    } else {
      checks.push('❌ Sheet structure incomplete');
    }
  } catch (e) {
    checks.push('❌ Error checking sheet: ' + e.message);
  }
  
  // Check 3: API Key
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (apiKey) {
      checks.push('✅ Gemini API key configured');
    } else {
      checks.push('⚠️  No API key - will use mock responses');
    }
  } catch (e) {
    checks.push('❌ Error checking API key: ' + e.message);
  }
  
  checks.forEach(check => console.log(check));
  
  return checks;
}