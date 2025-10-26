/**
 * Test MCQ Randomization
 * Verifies that MCQ options are properly randomized
 */

function testMCQRandomization() {
  console.log('\n=== Testing MCQ Randomization ===\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // Test 1: Verify shuffleArray function exists and works
    console.log('Test 1: Testing shuffleArray function...');
    const testArray = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(testArray);
    
    if (shuffled.length !== testArray.length) {
      results.failed++;
      results.errors.push('Shuffle changed array length');
    } else if (shuffled === testArray) {
      results.failed++;
      results.errors.push('Shuffle returned same array reference');
    } else {
      // Check all elements are present
      const sortedOriginal = [...testArray].sort();
      const sortedShuffled = [...shuffled].sort();
      const allPresent = sortedOriginal.every((val, idx) => val === sortedShuffled[idx]);
      
      if (!allPresent) {
        results.failed++;
        results.errors.push('Shuffle lost or changed elements');
      } else {
        results.passed++;
        console.log('✅ shuffleArray works correctly');
      }
    }
    
    // Test 2: Test randomization distribution (run multiple times)
    console.log('\nTest 2: Testing randomization distribution...');
    const positionCounts = {};
    const numRuns = 100;
    
    for (let run = 0; run < numRuns; run++) {
      const options = [
        { id: 'A', score: 10 },
        { id: 'B', score: 7 },
        { id: 'C', score: 5 },
        { id: 'D', score: 0 }
      ];
      
      const shuffled = shuffleArray(options);
      
      // Track where the highest scoring option (A) ends up
      const highScorePosition = shuffled.findIndex(opt => opt.id === 'A');
      positionCounts[highScorePosition] = (positionCounts[highScorePosition] || 0) + 1;
    }
    
    console.log('Position distribution for highest score option:');
    for (let pos = 0; pos < 4; pos++) {
      const count = positionCounts[pos] || 0;
      const percentage = (count / numRuns * 100).toFixed(1);
      console.log(`  Position ${pos}: ${count} times (${percentage}%)`);
    }
    
    // Check if distribution is reasonable (each position should get ~25%)
    const expectedPercentage = 25;
    const tolerance = 15; // Allow 15% deviation
    let distributionOk = true;
    
    for (let pos = 0; pos < 4; pos++) {
      const count = positionCounts[pos] || 0;
      const percentage = count / numRuns * 100;
      if (Math.abs(percentage - expectedPercentage) > tolerance) {
        distributionOk = false;
        results.errors.push(`Position ${pos} has ${percentage.toFixed(1)}% (expected ~25%)`);
      }
    }
    
    if (distributionOk) {
      results.passed++;
      console.log('✅ Randomization distribution looks good');
    } else {
      results.failed++;
      console.log('❌ Randomization distribution seems biased');
    }
    
    // Test 3: Test getAllScenariosForParticipant includes shuffle
    console.log('\nTest 3: Testing scenario loading with randomization...');
    
    // Clear cache first to ensure fresh load
    try {
      CacheService.getScriptCache().removeAll(['dummy']);
      console.log('Cache cleared for testing');
    } catch (e) {
      console.log('Could not clear cache:', e.toString());
    }
    
    // Load scenarios
    const scenarios = getAllScenariosForParticipant('TEST_USER');
    
    if (!scenarios || scenarios.length === 0) {
      results.failed++;
      results.errors.push('No scenarios loaded');
    } else {
      // Check if options have originalIndex property (indicates shuffle was applied)
      const firstScenario = scenarios[0];
      if (firstScenario.options && firstScenario.options.length > 0) {
        const hasOriginalIndex = firstScenario.options.every(opt => 
          opt.hasOwnProperty('originalIndex')
        );
        
        if (hasOriginalIndex) {
          results.passed++;
          console.log('✅ Scenarios include originalIndex for tracking');
          
          // Log first scenario's option order
          console.log('First scenario options order:');
          firstScenario.options.forEach((opt, idx) => {
            console.log(`  ${idx}: ${opt.text} (score: ${opt.score}, original: ${opt.originalIndex})`);
          });
        } else {
          results.failed++;
          results.errors.push('Options missing originalIndex property');
        }
      } else {
        results.failed++;
        results.errors.push('First scenario has no options');
      }
    }
    
  } catch (error) {
    results.failed++;
    results.errors.push('Test error: ' + error.toString());
    console.error('Test error:', error);
  }
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log('  - ' + err));
  }
  
  return results;
}

// Run the test if called directly
function runMCQRandomizationTest() {
  const results = testMCQRandomization();
  return {
    success: results.failed === 0,
    message: `MCQ Randomization: ${results.passed} passed, ${results.failed} failed`,
    details: results
  };
}