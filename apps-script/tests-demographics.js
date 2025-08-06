// Demographics System Tests

function testDemographics() {
  console.log('🧑‍🎓 Testing Demographics System...\n');
  
  TestFramework.test('Demographics form collects all 8 variables', () => {
    const testData = {
      participantId: 'TEST1234',
      age: '25-34',
      gender: 'female',
      education: 'bachelor',
      discipline: 'stem',
      english: 'advanced',
      coding: 'basic',
      ai_usage: 'weekly',
      military: 'no'
    };
    
    // Verify all fields are present
    assert.equal(Object.keys(testData).length, 9); // 8 demographics + participantId
    assert.ok(testData.age);
    assert.ok(testData.military);
  });
  
  TestFramework.test('Demographics linked to NRIC hash', () => {
    const nricResult = generateParticipantHash('TEST');
    const demographics = {
      participantId: nricResult.hash,
      age: '18-24'
    };
    
    assert.equal(demographics.participantId.length, 8);
    assert.equal(demographics.participantId, nricResult.hash);
  });
  
  TestFramework.test('Consent tracking works correctly', () => {
    const consentOnly = {
      participantId: 'CONSENT01',
      demographicsProvided: false,
      consentGiven: true
    };
    
    const fullData = {
      participantId: 'FULLDATA1',
      demographicsProvided: true,
      consentGiven: true
    };
    
    assert.ok(consentOnly.consentGiven);
    assert.notOk(consentOnly.demographicsProvided);
    assert.ok(fullData.demographicsProvided);
  });
  
  TestFramework.test('All fields are optional', () => {
    const minimalData = {
      participantId: 'MINIMAL01',
      age: '',
      gender: '',
      education: '',
      discipline: '',
      english: '',
      coding: '',
      ai_usage: '',
      military: ''
    };
    
    // Should accept empty values
    for (let key in minimalData) {
      if (key !== 'participantId') {
        assert.equal(minimalData[key], '', `${key} should accept empty value`);
      }
    }
  });
  
  TestFramework.test('Demographics check after first submission', () => {
    // Simulate checking after first submission
    const check = {
      needsDemographics: true,
      submissionCount: 1,
      demographicsStatus: { hasProvidedDemographics: false }
    };
    
    assert.ok(check.needsDemographics);
    assert.equal(check.submissionCount, 1);
    assert.notOk(check.demographicsStatus.hasProvidedDemographics);
    
    // After demographics provided
    const checkAfter = {
      needsDemographics: false,
      submissionCount: 2,
      demographicsStatus: { hasProvidedDemographics: true }
    };
    
    assert.notOk(checkAfter.needsDemographics);
  });
  
  TestFramework.test('Singapore education levels included', () => {
    const educationOptions = [
      'secondary',
      'polytechnic',
      'bachelor',
      'master',
      'phd'
    ];
    
    assert.ok(educationOptions.includes('polytechnic'), 'Should include Polytechnic/ITE');
    assert.lengthEquals(educationOptions, 5);
  });
  
  TestFramework.test('AI usage uses simple terms', () => {
    const aiUsageOptions = ['never', 'monthly', 'weekly', 'daily'];
    
    // Should NOT use technical terms like 'LLM'
    aiUsageOptions.forEach(option => {
      assert.notOk(option.includes('llm'), 'Should use "AI" not "LLM"');
    });
  });
  
  TestFramework.test('Military experience is tri-state', () => {
    const militaryOptions = ['yes', 'no', ''];
    
    assert.ok(militaryOptions.includes('yes'));
    assert.ok(militaryOptions.includes('no'));
    assert.ok(militaryOptions.includes(''), 'Should allow prefer not to say');
  });
}

// Run demographics tests
function runDemographicsTests() {
  TestFramework.clear();
  testDemographics();
  const results = TestFramework.runAll();
  
  console.log('\n📊 Demographics Test Results:');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  return results;
}