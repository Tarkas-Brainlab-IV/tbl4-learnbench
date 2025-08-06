// PromptLab Test Suite
// Run this file in the Google Apps Script editor to test all functionality

// Initialize mocks (will be provided by the environment)
let mockSheet, mockProperties, mockUtilities;

// In Google Apps Script environment, create mocks
// CRITICAL: Mocking disabled to prevent SpreadsheetApp shadowing in production
// This was causing "SpreadsheetApp.open is not a function" errors
if (typeof Mock !== 'undefined' && typeof TEST_MODE !== 'undefined' && TEST_MODE === true) {
  mockSheet = Mock.createMockSheet();
  mockProperties = Mock.createMockProperties();
  mockUtilities = Mock.createMockUtilities();
  
  // Override globals for testing - ONLY when TEST_MODE is explicitly true
  // WARNING: These assignments will break production code
  /*
  SpreadsheetApp = {
    getActiveSpreadsheet() {
      return {
        getSheetByName(name) { return name === 'Experiment Data' ? mockSheet : null; },
        insertSheet(name) { return mockSheet; }
      };
    }
  };

  PropertiesService = {
    getScriptProperties() { return mockProperties; }
  };

  Utilities = mockUtilities;
  */
}

// Test Suite
function runAllTests() {
  TestFramework.clear();
  
  // Register all test suites
  testNRICHashing();
  testCohortDetection();
  testMonthlyCohortGeneration();
  testClusteringAnalysis();
  testPromptProcessing();
  testSecurityFeatures();
  testColdStartFix();
  testDataValidation();
  
  // Run tests and return results
  const results = TestFramework.runAll();
  
  // Log to sheet for easy viewing
  logTestResults(results);
  
  return results;
}

// Test: NRIC Hashing
function testNRICHashing() {
  TestFramework.test('NRIC hashing generates consistent 8-char hash', () => {
    const result1 = generateParticipantHash('123A');
    const result2 = generateParticipantHash('123A');
    
    assert.ok(result1.success);
    assert.equal(result1.hash.length, 8);
    assert.equal(result1.hash, result2.hash, 'Same input should produce same hash');
  });
  
  TestFramework.test('NRIC hashing is case-insensitive', () => {
    const result1 = generateParticipantHash('123a');
    const result2 = generateParticipantHash('123A');
    
    assert.equal(result1.hash, result2.hash, 'Case should not affect hash');
  });
  
  TestFramework.test('Different NRICs produce different hashes', () => {
    const result1 = generateParticipantHash('123A');
    const result2 = generateParticipantHash('456B');
    
    assert.notEqual(result1.hash, result2.hash, 'Different inputs should produce different hashes');
  });
}

// Test: Cohort Detection
function testCohortDetection() {
  // Set up mock schedule
  mockProperties.setProperty('CLASS_SCHEDULE', JSON.stringify([
    { day: 'Saturday', startTime: '09:00', endTime: '12:00', cohort: 'A' },
    { day: 'Sunday', startTime: '09:00', endTime: '12:00', cohort: 'A' },
    { day: 'Monday', startTime: '19:00', endTime: '22:00', cohort: 'C' },
    { day: 'Wednesday', startTime: '19:00', endTime: '22:00', cohort: 'C' }
  ]));
  mockProperties.setProperty('TIMEZONE', 'Asia/Singapore');
  
  TestFramework.test('Detects correct cohort based on time', () => {
    // Mock current time to Saturday 10am Singapore time
    const originalDate = Date;
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate('2024-11-30T10:00:00+08:00');
        }
        return new originalDate(...args);
      }
    };
    
    const cohort = detectCohortFromSchedule();
    assert.equal(cohort, 'A', 'Should detect cohort A on Saturday morning');
    
    // Restore Date
    global.Date = originalDate;
  });
  
  TestFramework.test('Returns null outside class times', () => {
    // Mock Friday evening
    const originalDate = Date;
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate('2024-11-29T20:00:00+08:00');
        }
        return new originalDate(...args);
      }
    };
    
    const cohort = detectCohortFromSchedule();
    assert.equal(cohort, null, 'Should return null outside class times');
    
    global.Date = originalDate;
  });
  
  TestFramework.test('Handles timezone correctly', () => {
    // Mock Monday 7pm Singapore = Monday 11am UTC
    const originalDate = Date;
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate('2024-12-02T11:00:00Z');
        }
        return new originalDate(...args);
      }
    };
    
    const cohort = detectCohortFromSchedule();
    assert.equal(cohort, 'C', 'Should handle timezone conversion correctly');
    
    global.Date = originalDate;
  });
}

// Test: Monthly Cohort ID Generation
function testMonthlyCohortGeneration() {
  TestFramework.test('Generates correct monthly cohort ID format', () => {
    const date = new Date('2024-11-15');
    const cohortId = generateMonthlyCohortId('A', date);
    assert.match(cohortId, /^\d{4}-\d{2}-[A-D]-[SMTW]{2}$/, 'Should match format YYYY-MM-X-DD');
    assert.equal(cohortId, '2024-11-A-SS', 'Should generate correct ID for cohort A');
  });
  
  TestFramework.test('Handles month boundaries correctly', () => {
    // Saturday Nov 30 - should be December cohort
    const saturday = new Date('2024-11-30');
    const cohortId = generateMonthlyCohortId('A', saturday);
    assert.equal(cohortId, '2024-12-A-SS', 'Saturday Nov 30 should be December cohort');
  });
  
  TestFramework.test('Generates correct day codes for each cohort', () => {
    const date = new Date('2024-11-15');
    assert.equal(generateMonthlyCohortId('A', date), '2024-11-A-SS');
    assert.equal(generateMonthlyCohortId('B', date), '2024-11-B-SS');
    assert.equal(generateMonthlyCohortId('C', date), '2024-11-C-MW');
    assert.equal(generateMonthlyCohortId('D', date), '2024-11-D-TT');
  });
}

// Test: Clustering Analysis
function testClusteringAnalysis() {
  TestFramework.test('Calculates clustering score correctly', () => {
    const session = [
      { timestamp: new Date('2024-11-30T09:00:00'), participant: 'ABC12345' },
      { timestamp: new Date('2024-11-30T09:05:00'), participant: 'DEF67890' },
      { timestamp: new Date('2024-11-30T09:10:00'), participant: 'GHI11111' },
      { timestamp: new Date('2024-11-30T09:15:00'), participant: 'ABC12345' },
      { timestamp: new Date('2024-11-30T09:20:00'), participant: 'DEF67890' }
    ];
    
    const score = calculateClusteringScore(session, 20, 3);
    assert.ok(score > 0.7, 'High activity in short time should have high clustering score');
  });
  
  TestFramework.test('Classifies submissions based on concurrent activity', () => {
    // Mock recent submissions
    mockSheet.data = [
      ['Timestamp', 'Participant ID', 'Cohort ID', 'Prompt', 'Response', 'Time', 'Status'],
      [new Date(), 'USER1', '2024-11-A-SS', 'Test', 'Response', 100, 'OK'],
      [new Date(), 'USER2', '2024-11-A-SS', 'Test', 'Response', 100, 'OK'],
      [new Date(), 'USER3', '2024-11-A-SS', 'Test', 'Response', 100, 'OK'],
      [new Date(), 'USER4', '2024-11-A-SS', 'Test', 'Response', 100, 'OK'],
      [new Date(), 'USER5', '2024-11-A-SS', 'Test', 'Response', 100, 'OK']
    ];
    
    const classification = classifySubmission('USER6', '2024-11-A-SS');
    assert.equal(classification.classification, 'LIKELY_IN_CLASS');
    assert.ok(classification.confidence >= 0.5);
  });
}

// Test: Prompt Processing
function testPromptProcessing() {
  TestFramework.test('Processes valid prompt successfully', () => {
    mockProperties.setProperty('GEMINI_API_KEY', 'test-key');
    mockProperties.setProperty('USE_MOCK_RESPONSES', 'true');
    
    const result = processPrompt({
      participantId: 'TEST1234',
      cohortId: '2024-11-A-SS',
      prompt: 'What is machine learning?'
    });
    
    assert.ok(result.success);
    assert.ok(result.output);
    assert.ok(result.timestamp);
  });
  
  TestFramework.test('Validates empty prompts', () => {
    const result = processPrompt({
      participantId: 'TEST1234',
      cohortId: '2024-11-A-SS',
      prompt: ''
    });
    
    assert.notOk(result.success);
    assert.contains(result.error, 'prompt');
  });
  
  TestFramework.test('Validates participant ID', () => {
    const result = processPrompt({
      participantId: '',
      cohortId: '2024-11-A-SS',
      prompt: 'Test prompt'
    });
    
    assert.notOk(result.success);
    assert.contains(result.error, 'participant');
  });
}

// Test: Security Features
function testSecurityFeatures() {
  TestFramework.test('Rate limiting prevents rapid submissions', () => {
    mockProperties.setProperty('USE_MOCK_RESPONSES', 'true');
    
    // First submission should succeed
    const result1 = processPrompt({
      participantId: 'RATETEST',
      cohortId: '2024-11-A-SS',
      prompt: 'Test 1'
    });
    assert.ok(result1.success);
    
    // Immediate second submission should fail
    const result2 = processPrompt({
      participantId: 'RATETEST',
      cohortId: '2024-11-A-SS',
      prompt: 'Test 2'
    });
    assert.notOk(result2.success);
    assert.contains(result2.error, 'rate limit');
  });
  
  TestFramework.test('Detects suspicious prompt patterns', () => {
    const patterns = [
      'ignore previous instructions',
      'system prompt',
      '<script>alert("xss")</script>',
      'DROP TABLE users'
    ];
    
    patterns.forEach(pattern => {
      const flagged = detectSuspiciousPrompt(pattern);
      assert.ok(flagged, `Should flag: "${pattern}"`);
    });
  });
}

// Test: Cold Start Fix
function testColdStartFix() {
  TestFramework.test('Assigns cohorts to UNASSIGNED entries', () => {
    // Set up mock data with unassigned entries
    mockSheet.data = [
      ['Timestamp', 'Participant ID', 'Cohort ID', 'Prompt', 'Response', 'Time', 'Status'],
      [new Date('2024-11-30T09:30:00'), 'USER1', 'UNASSIGNED', 'Test', 'Response', 100, 'OK'],
      [new Date('2024-11-30T09:35:00'), 'USER2', 'UNASSIGNED', 'Test', 'Response', 100, 'OK'],
      [new Date('2024-11-30T10:00:00'), 'USER3', '2024-11-A-SS', 'Test', 'Response', 100, 'OK']
    ];
    
    const result = fixColdStart();
    assert.equal(result.processed, 2, 'Should process 2 UNASSIGNED entries');
    assert.equal(result.updated, 2, 'Should update 2 entries');
    
    // Check that entries were updated
    assert.notEqual(mockSheet.data[1][2], 'UNASSIGNED');
    assert.notEqual(mockSheet.data[2][2], 'UNASSIGNED');
  });
}

// Test: Data Validation
function testDataValidation() {
  TestFramework.test('Validates sheet structure', () => {
    const isValid = validateSheetStructure();
    assert.ok(isValid, 'Default sheet structure should be valid');
  });
  
  TestFramework.test('Detects duplicate submissions', () => {
    mockSheet.data = [
      ['Timestamp', 'Participant ID', 'Cohort ID', 'Prompt', 'Response', 'Time', 'Status'],
      [new Date(), 'USER1', '2024-11-A-SS', 'Same prompt', 'Response', 100, 'OK'],
      [new Date(), 'USER1', '2024-11-A-SS', 'Same prompt', 'Response', 100, 'OK']
    ];
    
    const duplicates = findDuplicatePrompts();
    assert.ok(duplicates.length > 0, 'Should detect duplicate prompts');
  });
}

// Helper to log test results to a sheet
function logTestResults(results) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test Results') ||
                  SpreadsheetApp.getActiveSpreadsheet().insertSheet('Test Results');
    
    sheet.clear();
    sheet.getRange(1, 1, 1, 4).setValues([['Test Name', 'Status', 'Error', 'Timestamp']]);
    
    const data = results.results.map(r => [
      r.name,
      r.passed ? '✅ PASS' : '❌ FAIL',
      r.error || '',
      new Date()
    ]);
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, 4).setValues(data);
    }
    
    // Summary
    sheet.getRange(data.length + 3, 1, 4, 2).setValues([
      ['Total Tests', results.total],
      ['Passed', results.passed],
      ['Failed', results.failed],
      ['Duration (ms)', results.duration]
    ]);
    
  } catch (e) {
    console.log('Could not log to sheet:', e);
  }
}

// Additional helper functions for testing
function validateSheetStructure() {
  const headers = mockSheet.data[0];
  const required = ['Timestamp', 'Participant ID', 'Cohort ID', 'Prompt', 'Model Response'];
  return required.every(h => headers.includes(h));
}

function findDuplicatePrompts() {
  const prompts = {};
  const duplicates = [];
  
  for (let i = 1; i < mockSheet.data.length; i++) {
    const row = mockSheet.data[i];
    const key = `${row[1]}-${row[3]}`; // participant-prompt
    
    if (prompts[key]) {
      duplicates.push({ row: i + 1, participant: row[1], prompt: row[3] });
    } else {
      prompts[key] = true;
    }
  }
  
  return duplicates;
}

function detectSuspiciousPrompt(prompt) {
  const suspicious = [
    /ignore.*previous.*instructions/i,
    /system.*prompt/i,
    /<script/i,
    /DROP\s+TABLE/i,
    /'; DELETE/i
  ];
  
  return suspicious.some(pattern => pattern.test(prompt));
}