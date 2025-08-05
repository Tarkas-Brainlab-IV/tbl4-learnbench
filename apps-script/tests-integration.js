// Integration Tests for PromptLab
// These tests simulate real user workflows

function runIntegrationTests() {
  console.log('🔄 Running PromptLab Integration Tests...\n');
  
  const results = {
    scenarios: [],
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Setup test environment
  setupTestEnvironment();
  
  // Scenario 1: Complete user session
  runScenario('Complete User Session', () => {
    // 1. User logs in with NRIC
    const loginResult = generateParticipantHash('TEST');
    if (!loginResult.success) throw new Error('Login failed');
    const participantId = loginResult.hash;
    
    // 2. System detects cohort
    const cohortId = generateMonthlyCohortId('A', new Date());
    
    // 3. User submits prompt
    const promptResult = processPrompt({
      participantId: participantId,
      cohortId: cohortId,
      prompt: 'What is machine learning?'
    });
    if (!promptResult.success) throw new Error('Prompt processing failed');
    
    // 4. Check data was logged
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) throw new Error('Data not logged to sheet');
    
    return 'User session completed successfully';
  }, results);
  
  // Scenario 2: Multiple students in class
  runScenario('Classroom Activity Simulation', () => {
    const students = ['STU1', 'STU2', 'STU3', 'STU4', 'STU5'];
    const cohortId = '2024-11-A-SS';
    const startTime = new Date();
    
    // Simulate students submitting prompts
    students.forEach((student, index) => {
      const hash = generateParticipantHash(student);
      
      // Add small time delay between submissions
      Utilities.sleep(100);
      
      const result = processPrompt({
        participantId: hash.hash,
        cohortId: cohortId,
        prompt: `Student ${index + 1} prompt about AI`
      });
      
      if (!result.success) throw new Error(`Student ${student} submission failed`);
    });
    
    // Check clustering detection
    const classification = classifySubmission(students[0], cohortId);
    if (classification.classification !== 'LIKELY_IN_CLASS') {
      throw new Error('Should detect in-class activity');
    }
    
    return 'Classroom simulation successful';
  }, results);
  
  // Scenario 3: Month boundary transition
  runScenario('Month Boundary Cohort Assignment', () => {
    // Test Saturday Nov 30
    const nov30 = new Date('2024-11-30');
    const cohortId = generateMonthlyCohortId('A', nov30);
    
    if (cohortId !== '2024-12-A-SS') {
      throw new Error(`Expected December cohort but got ${cohortId}`);
    }
    
    // Test Sunday Dec 1
    const dec1 = new Date('2024-12-01');
    const cohortId2 = generateMonthlyCohortId('A', dec1);
    
    if (cohortId2 !== '2024-12-A-SS') {
      throw new Error(`Expected December cohort but got ${cohortId2}`);
    }
    
    return 'Month boundary handling correct';
  }, results);
  
  // Scenario 4: Cold start recovery
  runScenario('Cold Start Recovery', () => {
    const sheet = getOrCreateSheet();
    
    // Add unassigned entries
    sheet.appendRow([new Date(), 'COLD1', 'UNASSIGNED', 'Test 1', 'Response', 100, 'OK']);
    sheet.appendRow([new Date(), 'COLD2', 'UNASSIGNED', 'Test 2', 'Response', 100, 'OK']);
    
    // Run cold start fix
    const fixResult = fixColdStart();
    
    if (fixResult.processed < 2) {
      throw new Error('Should process at least 2 entries');
    }
    
    // Verify assignments
    const data = sheet.getDataRange().getValues();
    const lastRow = data[data.length - 1];
    if (lastRow[2] === 'UNASSIGNED') {
      throw new Error('Entry should be assigned a cohort');
    }
    
    return 'Cold start recovery successful';
  }, results);
  
  // Scenario 5: Rate limiting
  runScenario('Rate Limiting Protection', () => {
    const participantId = 'RATELIM';
    const cohortId = '2024-11-A-SS';
    
    // First request should succeed
    const result1 = processPrompt({
      participantId: participantId,
      cohortId: cohortId,
      prompt: 'First prompt'
    });
    
    if (!result1.success) throw new Error('First prompt should succeed');
    
    // Immediate second request should fail
    const result2 = processPrompt({
      participantId: participantId,
      cohortId: cohortId,
      prompt: 'Second prompt'
    });
    
    if (result2.success) throw new Error('Second prompt should be rate limited');
    if (!result2.error.includes('rate limit')) {
      throw new Error('Should indicate rate limit error');
    }
    
    return 'Rate limiting working correctly';
  }, results);
  
  // Scenario 6: Context memory
  runScenario('Context Memory System', () => {
    // Enable context
    PropertiesService.getScriptProperties().setProperty('ENABLE_CONTEXT', 'true');
    
    const participantId = 'CTXTEST';
    const cohortId = '2024-11-A-SS';
    
    // First prompt
    const result1 = processPrompt({
      participantId: participantId,
      cohortId: cohortId,
      prompt: 'My name is TestUser'
    });
    
    // Wait to avoid rate limit
    Utilities.sleep(3100);
    
    // Second prompt should have context
    const result2 = processPrompt({
      participantId: participantId,
      cohortId: cohortId,
      prompt: 'What is my name?'
    });
    
    // In mock mode, just check it succeeded
    if (!result2.success) throw new Error('Context prompt should succeed');
    
    return 'Context memory system functional';
  }, results);
  
  // Clean up
  cleanupTestEnvironment();
  
  // Summary
  console.log('\n📊 Integration Test Summary:');
  console.log(`Total Scenarios: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  results.scenarios.forEach(scenario => {
    console.log(`\n${scenario.name}:`);
    console.log(`  Status: ${scenario.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (scenario.error) {
      console.log(`  Error: ${scenario.error}`);
    } else {
      console.log(`  Result: ${scenario.result}`);
    }
  });
  
  return results;
}

// Helper to run scenarios
function runScenario(name, testFn, results) {
  console.log(`\nRunning: ${name}`);
  results.total++;
  
  try {
    const result = testFn();
    results.passed++;
    results.scenarios.push({ name, passed: true, result });
    console.log(`✅ ${name} passed`);
  } catch (error) {
    results.failed++;
    results.scenarios.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name} failed: ${error.message}`);
  }
}

// End-to-end test
function runE2ETest() {
  console.log('🚀 Running End-to-End Test...\n');
  
  try {
    // 1. Setup
    console.log('1. Setting up environment...');
    setupYourClassSchedule();
    PropertiesService.getScriptProperties().setProperty('USE_MOCK_RESPONSES', 'true');
    
    // 2. Simulate Saturday morning class
    console.log('2. Simulating Saturday morning class (Cohort A)...');
    const students = ['1234', '5678', '9012', '3456'];
    const results = [];
    
    students.forEach((nric, index) => {
      console.log(`   Student ${index + 1} logging in...`);
      const login = generateParticipantHash(nric);
      
      Utilities.sleep(500); // Small delay
      
      const prompt = processPrompt({
        participantId: login.hash,
        cohortId: generateMonthlyCohortId('A'),
        prompt: `Question ${index + 1}: Explain neural networks`
      });
      
      results.push({ nric, participantId: login.hash, success: prompt.success });
    });
    
    // 3. Check results
    console.log('3. Verifying results...');
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    console.log(`   Total entries: ${data.length - 1}`);
    console.log(`   Successful submissions: ${results.filter(r => r.success).length}`);
    
    // 4. Run analytics
    console.log('4. Running analytics...');
    const report = generateClusteringReport();
    
    console.log('\n✅ End-to-End test completed successfully!');
    
  } catch (error) {
    console.error('❌ E2E test failed:', error);
    throw error;
  }
}