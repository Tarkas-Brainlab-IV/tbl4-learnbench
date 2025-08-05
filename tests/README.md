# LearnBench Testing Guide

## Overview

LearnBench includes comprehensive testing to ensure reliability and correctness of the experiment platform. Tests are designed to run both locally (for development) and within Google Apps Script (for production validation).

## Test Structure

### 1. Unit Tests (`apps-script/tests.js`)
- NRIC hashing functionality
- Cohort detection logic
- Monthly cohort ID generation
- Clustering analysis algorithms
- Prompt processing
- Security features (rate limiting, validation)
- Cold start recovery
- Data validation

### 2. Core Tests (`apps-script/tests-core.js`)
Simplified tests focusing on essential functionality:
- Basic NRIC hashing
- Monthly cohort IDs
- Sheet operations
- Clustering calculations
- Prompt processing (mock mode)
- Cold start fix

### 3. Integration Tests (`apps-script/tests-integration.js`)
End-to-end scenarios:
- Complete user sessions
- Classroom activity simulation
- Month boundary transitions
- Cold start recovery
- Rate limiting protection
- Context memory system

## Running Tests

### In Google Apps Script

1. **From the Menu**
   - Open your Google Sheet
   - Look for "LearnBench Tests" menu
   - Select test suite to run

2. **From Script Editor**
   ```javascript
   // Run all tests
   runAllTests()
   
   // Run specific test suite
   runCoreTests()
   runIntegrationTests()
   
   // Run E2E test
   runE2ETest()
   ```

3. **Validate Setup**
   ```javascript
   validateSetup()
   ```

### Locally (Development)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run tests**
   ```bash
   npm test              # Run all tests
   npm run test:local    # Same as npm test
   npm run test:watch    # Watch mode (requires nodemon)
   ```

3. **Test results**
   - Console output with pass/fail status
   - JSON report saved to `tests/test-report.json`

## Test Environment Setup

### Google Apps Script
```javascript
// Set up test environment
setupTestEnvironment()

// Clean up after tests
cleanupTestEnvironment()
```

### Properties for Testing
- `USE_MOCK_RESPONSES`: Set to 'true' for mock AI responses
- `TEST_MODE`: Set to 'true' during testing
- `ENABLE_CONTEXT`: Toggle context memory feature

## Writing New Tests

### Unit Test Example
```javascript
TestFramework.test('My new feature works', () => {
  const result = myNewFunction('input');
  assert.equal(result, 'expected output');
  assert.ok(result.property, 'Should have property');
});
```

### Integration Test Example
```javascript
runScenario('New User Workflow', () => {
  // Step 1: User action
  const login = generateParticipantHash('TEST');
  
  // Step 2: System response
  const cohort = detectCohort(login.hash);
  
  // Step 3: Verification
  if (!cohort) throw new Error('Should detect cohort');
  
  return 'Workflow completed';
}, results);
```

## Common Test Scenarios

### 1. Testing NRIC Hashing
```javascript
const hash1 = generateParticipantHash('123A');
const hash2 = generateParticipantHash('123a'); // Case insensitive
assert.equal(hash1.hash, hash2.hash);
```

### 2. Testing Cohort Detection
```javascript
// Mock schedule data
mockProperties.setProperty('CLASS_SCHEDULE', JSON.stringify([...]));

// Test detection
const cohort = detectCohortFromSchedule();
```

### 3. Testing Rate Limiting
```javascript
// First request succeeds
const result1 = processPrompt({...});
assert.ok(result1.success);

// Immediate second request fails
const result2 = processPrompt({...});
assert.notOk(result2.success);
```

## Debugging Failed Tests

1. **Check test output**
   - Look for specific error messages
   - Check line numbers in stack traces

2. **Use console logging**
   ```javascript
   console.log('Debug value:', variable);
   ```

3. **Check test data**
   - Verify mock data is set up correctly
   - Check sheet structure matches expectations

4. **Common issues**
   - Missing properties in test environment
   - Incorrect date/timezone handling
   - Rate limiting affecting sequential tests

## CI/CD Integration

### Automated Testing
```javascript
// Set up time-based trigger
function setupTestAutomation() {
  ScriptApp.newTrigger('runTestsForCI')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}
```

### Test Notifications
```javascript
// Set email for test failures
PropertiesService.getScriptProperties()
  .setProperty('TEST_NOTIFICATION_EMAIL', 'your-email@example.com');
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Mocking**: Use mocks for external dependencies
4. **Assertions**: Use clear, descriptive assertions
5. **Coverage**: Test both success and failure paths

## Test Coverage

Current test coverage includes:
- ✅ Authentication (NRIC hashing)
- ✅ Cohort detection and assignment
- ✅ Monthly cohort ID generation
- ✅ Clustering analysis
- ✅ Prompt processing
- ✅ Rate limiting
- ✅ Cold start recovery
- ✅ Data logging
- ✅ Security validations

## Troubleshooting

### "Identifier already declared" error
- Check for duplicate variable declarations
- Ensure mocks are properly scoped

### "Cannot read property of undefined"
- Verify all required properties are set
- Check mock object initialization

### Rate limit errors in tests
- Add delays between prompt submissions
- Use `Utilities.sleep(3100)` for 3+ second delays

### Test data not clearing
- Run `cleanupTestEnvironment()`
- Manually clear test sheets if needed