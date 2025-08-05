#!/usr/bin/env node

// Local test runner for PromptLab
// This simulates the Google Apps Script environment locally

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🧪 PromptLab Local Test Runner${colors.reset}\n`);

// Load test files
function loadTestFiles() {
  const testFiles = [
    '../apps-script/Code.js',
    '../apps-script/clustering-analysis.js',
    '../apps-script/tests.js'
  ];
  
  let combinedCode = '';
  
  testFiles.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      let content = fs.readFileSync(filePath, 'utf8');
      // Remove module exports to avoid conflicts
      content = content.replace(/if \(typeof module !== 'undefined'\)[\s\S]*?}/g, '');
      combinedCode += content + '\n\n';
    } catch (e) {
      console.error(`${colors.red}Failed to load ${file}: ${e.message}${colors.reset}`);
    }
  });
  
  return combinedCode;
}

// Run tests in simulated environment
function runTests() {
  const code = loadTestFiles();
  
  try {
    // Create sandbox environment
    const sandbox = {
      console: console,
      Date: Date,
      Math: Math,
      JSON: JSON,
      // Mock Google Apps Script APIs
      SpreadsheetApp: {
        getActiveSpreadsheet: () => ({
          getSheetByName: () => null,
          insertSheet: () => mockSheet
        })
      },
      PropertiesService: {
        getScriptProperties: () => mockProperties
      },
      Utilities: {
        computeDigest: () => Array(32).fill(0).map(() => Math.floor(Math.random() * 256)),
        DigestAlgorithm: { SHA_256: 'SHA_256' }
      },
      UrlFetchApp: {
        fetch: () => ({
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ 
            candidates: [{ content: { parts: [{ text: 'Mock response' }] } }] 
          })
        })
      },
      // Test framework
      TestFramework: {
        tests: [],
        results: [],
        test: function(name, fn) { this.tests.push({ name, testFunction: fn }); },
        runAll: function() {
          this.results = [];
          const startTime = Date.now();
          let passed = 0, failed = 0;
          
          this.tests.forEach(test => {
            try {
              process.stdout.write(`Running: ${test.name}... `);
              test.testFunction();
              passed++;
              console.log(`${colors.green}✓${colors.reset}`);
              this.results.push({ name: test.name, passed: true });
            } catch (error) {
              failed++;
              console.log(`${colors.red}✗${colors.reset}`);
              console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
              this.results.push({ name: test.name, passed: false, error: error.message });
            }
          });
          
          return { total: this.tests.length, passed, failed, duration: Date.now() - startTime, results: this.results };
        },
        clear: function() { this.tests = []; this.results = []; }
      },
      assert: {
        equal: (a, b, msg) => { if (a !== b) throw new Error(msg || `Expected ${b} but got ${a}`); },
        notEqual: (a, b, msg) => { if (a === b) throw new Error(msg || `Expected ${a} to not equal ${b}`); },
        ok: (v, msg) => { if (!v) throw new Error(msg || `Expected truthy value but got ${v}`); },
        notOk: (v, msg) => { if (v) throw new Error(msg || `Expected falsy value but got ${v}`); },
        match: (s, p, msg) => { if (!p.test(s)) throw new Error(msg || `"${s}" does not match ${p}`); },
        contains: (h, n, msg) => { if (h.indexOf(n) === -1) throw new Error(msg || `"${h}" does not contain "${n}"`); }
      },
      Mock: {
        createMockSheet: () => mockSheet,
        createMockProperties: () => mockProperties,
        createMockUtilities: () => mockUtilities
      }
    };
    
    // Mock objects
    const mockSheet = {
      data: [['Timestamp', 'Participant ID', 'Cohort ID', 'Prompt', 'Model Response', 'Response Time (ms)', 'Status']],
      getDataRange: function() {
        return {
          getValues: () => this.data,
          setValues: (v) => { this.data = v; }
        };
      },
      getRange: function(r, c, nr, nc) {
        return {
          getValues: () => {
            const result = [];
            for (let i = 0; i < nr; i++) {
              const row = [];
              for (let j = 0; j < nc; j++) {
                row.push(this.data[r + i - 1] ? this.data[r + i - 1][c + j - 1] : '');
              }
              result.push(row);
            }
            return result;
          },
          setValues: (v) => {
            for (let i = 0; i < v.length; i++) {
              if (!this.data[r + i - 1]) this.data[r + i - 1] = [];
              for (let j = 0; j < v[i].length; j++) {
                this.data[r + i - 1][c + j - 1] = v[i][j];
              }
            }
          }
        };
      },
      getLastRow: function() { return this.data.length; },
      appendRow: function(row) { this.data.push(row); }
    };
    
    const mockProperties = {
      props: {},
      getProperty: function(k) { return this.props[k] || null; },
      setProperty: function(k, v) { this.props[k] = v; return this; },
      deleteProperty: function(k) { delete this.props[k]; return this; },
      getProperties: function() { return Object.assign({}, this.props); }
    };
    
    const mockUtilities = {
      computeDigest: () => Array(32).fill(0).map(() => Math.floor(Math.random() * 256)),
      DigestAlgorithm: { SHA_256: 'SHA_256' }
    };
    
    // Add mocks to sandbox
    sandbox.mockSheet = mockSheet;
    sandbox.mockProperties = mockProperties;
    sandbox.mockUtilities = mockUtilities;
    
    // Execute code in sandbox
    const script = new Function(...Object.keys(sandbox), code + '\nreturn runAllTests();');
    const results = script(...Object.values(sandbox));
    
    // Display results
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}Test Results Summary${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`Duration: ${results.duration}ms`);
    
    if (results.failed > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      results.results.filter(r => !r.passed).forEach(r => {
        console.log(`  ${colors.red}✗ ${r.name}${colors.reset}`);
        console.log(`    ${r.error}`);
      });
    }
    
    // Generate report
    generateReport(results);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (e) {
    console.error(`${colors.red}Test execution failed: ${e.message}${colors.reset}`);
    console.error(e.stack);
    process.exit(1);
  }
}

// Generate test report
function generateReport(results) {
  const reportPath = path.join(__dirname, 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      duration: results.duration
    },
    details: results.results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.blue}Test report saved to: ${reportPath}${colors.reset}`);
}

// Run the tests
runTests();