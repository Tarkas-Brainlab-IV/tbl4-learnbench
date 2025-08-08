/**
 * Test the entire scenario loading and display pipeline
 */
function testScenarioDisplay() {
  console.log('=== TESTING SCENARIO DISPLAY PIPELINE ===');
  
  // Step 1: Check if spreadsheet ID is correct
  const scriptProperties = PropertiesService.getScriptProperties();
  const PROMPTLAB_SHEET_ID = scriptProperties.getProperty('PROMPTLAB_SHEET_ID');
  console.log('1. PROMPTLAB_SHEET_ID:', PROMPTLAB_SHEET_ID);
  
  if (PROMPTLAB_SHEET_ID !== '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo') {
    console.log('ERROR: Wrong spreadsheet ID!');
    console.log('Expected: 1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo');
    console.log('Got:', PROMPTLAB_SHEET_ID);
    return false;
  }
  
  // Step 2: Test getAllScenariosForParticipant
  console.log('\n2. Testing getAllScenariosForParticipant...');
  const scenarios = getAllScenariosForParticipant('TEST_USER');
  console.log('Scenarios returned:', scenarios);
  console.log('Number of scenarios:', scenarios ? scenarios.length : 0);
  
  if (!scenarios || scenarios.length === 0) {
    console.log('ERROR: No scenarios returned!');
    return false;
  }
  
  console.log('First scenario:', scenarios[0]);
  
  // Step 3: Test getInitialDataBatch
  console.log('\n3. Testing getInitialDataBatch...');
  const batchData = getInitialDataBatch('TEST_USER');
  console.log('Batch data returned:', batchData);
  console.log('Success?', batchData.success);
  console.log('Has scenarios?', batchData.scenarios ? 'YES' : 'NO');
  console.log('Number of scenarios in batch:', batchData.scenarios ? batchData.scenarios.length : 0);
  
  if (!batchData.success || !batchData.scenarios || batchData.scenarios.length === 0) {
    console.log('ERROR: Batch data does not contain scenarios!');
    return false;
  }
  
  // Step 4: Verify scenario structure
  console.log('\n4. Verifying scenario structure...');
  const testScenario = batchData.scenarios[0];
  console.log('Scenario ID:', testScenario.id);
  console.log('Scenario text length:', testScenario.text ? testScenario.text.length : 0);
  console.log('Scenario text preview:', testScenario.text ? testScenario.text.substring(0, 100) : 'NO TEXT');
  console.log('Number of options:', testScenario.options ? testScenario.options.length : 0);
  
  if (testScenario.options && testScenario.options.length > 0) {
    console.log('Options:');
    testScenario.options.forEach((opt, i) => {
      console.log(`  Option ${i+1}: ${opt.text} (score: ${opt.score})`);
    });
  }
  
  // Step 5: Check what HTML expects
  console.log('\n5. What the HTML expects:');
  console.log('- scenarios array with objects containing:');
  console.log('  - id (string)');
  console.log('  - text (string with markdown)');
  console.log('  - options (array of {id, text, score})');
  console.log('  - imageUrl (optional)');
  
  // Step 6: Return full test results
  const result = {
    spreadsheetIdCorrect: PROMPTLAB_SHEET_ID === '1KGdR1nkk5ZnQCq6twKvSXuyQRPZLqnzqKYqCjPeqHoo',
    scenariosLoadDirectly: scenarios && scenarios.length > 0,
    batchLoadWorks: batchData.success && batchData.scenarios && batchData.scenarios.length > 0,
    scenarioStructureValid: testScenario && testScenario.id && testScenario.text && testScenario.options,
    firstScenario: testScenario
  };
  
  console.log('\n=== TEST RESULTS ===');
  console.log(JSON.stringify(result, null, 2));
  
  return result;
}

/**
 * Create a minimal test HTML to verify scenario display works
 */
function getTestHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Scenario Display Test</title>
  <script src="https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js"></script>
</head>
<body>
  <h1>Scenario Display Test</h1>
  <div id="status">Loading...</div>
  <div id="scenarioSection" style="border: 1px solid #ccc; padding: 20px; margin: 20px;">
    <h2>Scenario</h2>
    <div id="scenarioText" style="background: #f0f0f0; padding: 10px;"></div>
    <div id="responseOptions" style="margin-top: 20px;"></div>
  </div>
  
  <script>
    console.log('Test page loaded');
    
    // Call backend to get scenarios
    google.script.run
      .withSuccessHandler((data) => {
        console.log('Received data:', data);
        document.getElementById('status').textContent = 'Data received: ' + JSON.stringify(data);
        
        if (data.scenarios && data.scenarios.length > 0) {
          const scenario = data.scenarios[0];
          
          // Display scenario text
          const textEl = document.getElementById('scenarioText');
          if (typeof marked !== 'undefined') {
            textEl.innerHTML = marked.parse(scenario.text);
          } else {
            textEl.textContent = scenario.text;
          }
          
          // Display options
          const optionsEl = document.getElementById('responseOptions');
          scenario.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt.text + ' (score: ' + opt.score + ')';
            btn.style.cssText = 'display: block; margin: 5px; padding: 10px;';
            optionsEl.appendChild(btn);
          });
          
          document.getElementById('status').textContent = 'Scenario displayed successfully!';
        } else {
          document.getElementById('status').textContent = 'ERROR: No scenarios in data';
        }
      })
      .withFailureHandler((error) => {
        console.error('Error:', error);
        document.getElementById('status').textContent = 'ERROR: ' + error;
      })
      .getInitialDataBatch('TEST_USER');
  </script>
</body>
</html>
  `;
}

/**
 * Serve test page
 */
function doGetTest(e) {
  return HtmlService.createHtmlOutput(getTestHTML())
    .setTitle('Scenario Test')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}