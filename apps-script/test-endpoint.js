/**
 * Web endpoint for testing MCQ randomization
 * Access via: your-web-app-url?action=testRandomization
 */

function doTestRandomization() {
  // Simple test that can be called via web
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test 1: Check shuffle function
  const testArray = ['A', 'B', 'C', 'D'];
  const shuffled1 = shuffleArray(testArray);
  const shuffled2 = shuffleArray(testArray);
  const shuffled3 = shuffleArray(testArray);
  
  results.tests.push({
    name: 'Shuffle Function',
    passed: shuffled1.length === 4 && shuffled2.length === 4,
    details: {
      original: testArray,
      shuffle1: shuffled1,
      shuffle2: shuffled2,
      shuffle3: shuffled3,
      note: 'Each shuffle should produce different order'
    }
  });
  
  // Test 2: Load scenarios and check randomization
  const scenarios = getAllScenariosForParticipant('TEST_RANDOM_' + Date.now());
  
  if (scenarios && scenarios.length > 0) {
    const firstScenario = scenarios[0];
    const hasOptions = firstScenario.options && firstScenario.options.length > 0;
    const hasOriginalIndex = hasOptions && firstScenario.options[0].hasOwnProperty('originalIndex');
    
    // Check if highest score is NOT always first
    const highestScoreFirst = hasOptions && 
      Math.max(...firstScenario.options.map(o => o.score)) === firstScenario.options[0].score;
    
    results.tests.push({
      name: 'Scenario Options Randomization',
      passed: hasOptions && hasOriginalIndex,
      details: {
        scenarioId: firstScenario.id,
        optionCount: firstScenario.options ? firstScenario.options.length : 0,
        hasOriginalIndex: hasOriginalIndex,
        highestScoreFirst: highestScoreFirst,
        optionOrder: firstScenario.options ? firstScenario.options.map(o => ({
          text: o.text.substring(0, 20) + '...',
          score: o.score,
          originalIndex: o.originalIndex
        })) : []
      }
    });
  } else {
    results.tests.push({
      name: 'Scenario Options Randomization',
      passed: false,
      error: 'No scenarios loaded'
    });
  }
  
  return results;
}

// Add to doGet handler
function handleTestRandomization() {
  const results = doTestRandomization();
  return ContentService
    .createTextOutput(JSON.stringify(results, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}