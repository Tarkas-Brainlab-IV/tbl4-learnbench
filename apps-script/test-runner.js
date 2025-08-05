// Test Runner for LearnBench
// This file provides menu items and functions to run tests in Google Apps Script

// Add menu items to run tests
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('LearnBench Tests')
    .addItem('Run All Tests', 'runTestsFromMenu')
    .addItem('Run NRIC Tests', 'runNRICTests')
    .addItem('Run Cohort Tests', 'runCohortTests')
    .addItem('Run Security Tests', 'runSecurityTests')
    .addSeparator()
    .addItem('Clear Test Results', 'clearTestResults')
    .addItem('Export Test Report', 'exportTestReport')
    .addToUi();
}

// Menu handlers
function runTestsFromMenu() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Run All Tests?',
    'This will run the complete test suite. Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    const results = runAllTests();
    
    ui.alert(
      'Test Results',
      `Tests completed!\n\nTotal: ${results.total}\nPassed: ${results.passed}\nFailed: ${results.failed}\n\nCheck the "Test Results" sheet for details.`,
      ui.ButtonSet.OK
    );
  }
}

function runNRICTests() {
  TestFramework.clear();
  testNRICHashing();
  const results = TestFramework.runAll();
  showTestResults('NRIC Tests', results);
}

function runCohortTests() {
  TestFramework.clear();
  testCohortDetection();
  testMonthlyCohortGeneration();
  const results = TestFramework.runAll();
  showTestResults('Cohort Tests', results);
}

function runSecurityTests() {
  TestFramework.clear();
  testSecurityFeatures();
  const results = TestFramework.runAll();
  showTestResults('Security Tests', results);
}

function clearTestResults() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test Results');
  if (sheet) {
    sheet.clear();
    SpreadsheetApp.getUi().alert('Test results cleared');
  }
}

function exportTestReport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test Results');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('No test results found. Run tests first.');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const report = generateTestReport(data);
  
  // Create a new document with the report
  const doc = DocumentApp.create('LearnBench Test Report - ' + new Date().toLocaleDateString());
  doc.getBody().setText(report);
  
  const ui = SpreadsheetApp.getUi();
  ui.alert('Test Report Created', `Report saved as: ${doc.getName()}\n\nURL: ${doc.getUrl()}`, ui.ButtonSet.OK);
}

// Helper functions
function showTestResults(title, results) {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    title + ' Results',
    `Total: ${results.total}\nPassed: ${results.passed}\nFailed: ${results.failed}\n\nDuration: ${results.duration}ms`,
    ui.ButtonSet.OK
  );
}

function generateTestReport(data) {
  let report = 'LEARNBENCH TEST REPORT\n';
  report += '=====================\n\n';
  report += 'Generated: ' + new Date().toString() + '\n\n';
  
  // Find summary section
  let summaryStart = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'Total Tests') {
      summaryStart = i;
      break;
    }
  }
  
  if (summaryStart > 0) {
    report += 'SUMMARY\n-------\n';
    for (let i = summaryStart; i < Math.min(summaryStart + 4, data.length); i++) {
      report += data[i][0] + ': ' + data[i][1] + '\n';
    }
    report += '\n';
  }
  
  report += 'DETAILED RESULTS\n----------------\n';
  for (let i = 1; i < data.length && i < summaryStart; i++) {
    if (data[i][0]) {
      report += '\n' + data[i][0] + '\n';
      report += 'Status: ' + data[i][1] + '\n';
      if (data[i][2]) {
        report += 'Error: ' + data[i][2] + '\n';
      }
    }
  }
  
  return report;
}

// Continuous Integration helpers
function runTestsForCI() {
  // This function can be triggered by external scripts or time-based triggers
  const results = runAllTests();
  
  // Log results for CI systems
  console.log('CI_TEST_RESULTS:', JSON.stringify(results));
  
  // Send notification if tests fail
  if (results.failed > 0) {
    sendTestFailureNotification(results);
  }
  
  return results;
}

function sendTestFailureNotification(results) {
  // Get email from script properties
  const email = PropertiesService.getScriptProperties().getProperty('TEST_NOTIFICATION_EMAIL');
  if (!email) return;
  
  const subject = `LearnBench Test Failure: ${results.failed} tests failed`;
  const body = `
LearnBench automated tests have failed.

Summary:
- Total Tests: ${results.total}
- Passed: ${results.passed}
- Failed: ${results.failed}
- Duration: ${results.duration}ms

Failed Tests:
${results.results.filter(r => !r.passed).map(r => '- ' + r.name + ': ' + r.error).join('\n')}

Please check the test results sheet for more details.
  `;
  
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    console.error('Failed to send test notification:', e);
  }
}

// Test environment setup
function setupTestEnvironment() {
  // Create test properties
  PropertiesService.getScriptProperties().setProperty('USE_MOCK_RESPONSES', 'true');
  PropertiesService.getScriptProperties().setProperty('TEST_MODE', 'true');
  
  // Create test schedule
  const testSchedule = [
    { day: 'Saturday', startTime: '09:00', endTime: '12:00', cohort: 'A' },
    { day: 'Sunday', startTime: '09:00', endTime: '12:00', cohort: 'A' },
    { day: 'Saturday', startTime: '13:00', endTime: '16:00', cohort: 'B' },
    { day: 'Sunday', startTime: '13:00', endTime: '16:00', cohort: 'B' },
    { day: 'Monday', startTime: '19:00', endTime: '22:00', cohort: 'C' },
    { day: 'Wednesday', startTime: '19:00', endTime: '22:00', cohort: 'C' },
    { day: 'Tuesday', startTime: '19:00', endTime: '22:00', cohort: 'D' },
    { day: 'Thursday', startTime: '19:00', endTime: '22:00', cohort: 'D' }
  ];
  
  PropertiesService.getScriptProperties().setProperty('CLASS_SCHEDULE', JSON.stringify(testSchedule));
  PropertiesService.getScriptProperties().setProperty('TIMEZONE', 'Asia/Singapore');
  
  console.log('Test environment configured');
}

// Cleanup test environment
function cleanupTestEnvironment() {
  PropertiesService.getScriptProperties().deleteProperty('TEST_MODE');
  PropertiesService.getScriptProperties().deleteProperty('USE_MOCK_RESPONSES');
  console.log('Test environment cleaned up');
}