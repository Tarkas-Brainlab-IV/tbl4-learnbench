// Test Framework for Google Apps Script
// Simple but effective testing framework for GAS environment

const TestFramework = {
  tests: [],
  results: [],
  
  // Register a test
  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  },
  
  // Run all tests
  runAll() {
    this.results = [];
    console.log('🧪 Running LearnBench Tests...\n');
    
    const startTime = new Date().getTime();
    let passed = 0;
    let failed = 0;
    
    this.tests.forEach(test => {
      try {
        console.log(`Running: ${test.name}`);
        test.testFunction();
        passed++;
        this.results.push({ name: test.name, passed: true });
        console.log(`✅ PASSED: ${test.name}`);
      } catch (error) {
        failed++;
        this.results.push({ name: test.name, passed: false, error: error.toString() });
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error}`);
      }
    });
    
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    
    console.log('\n📊 Test Results:');
    console.log(`   Total: ${this.tests.length}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${duration}ms`);
    
    return {
      total: this.tests.length,
      passed,
      failed,
      duration,
      results: this.results
    };
  },
  
  // Clear all tests
  clear() {
    this.tests = [];
    this.results = [];
  }
};

// Assertion helpers
const assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  },
  
  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected ${actual} to not equal ${expected}`);
    }
  },
  
  deepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Deep equality failed:\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
  },
  
  ok(value, message) {
    if (!value) {
      throw new Error(message || `Expected truthy value but got ${value}`);
    }
  },
  
  notOk(value, message) {
    if (value) {
      throw new Error(message || `Expected falsy value but got ${value}`);
    }
  },
  
  throws(fn, message) {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(message || 'Expected function to throw');
    }
  },
  
  match(actual, pattern, message) {
    if (!pattern.test(actual)) {
      throw new Error(message || `"${actual}" does not match pattern ${pattern}`);
    }
  },
  
  contains(haystack, needle, message) {
    if (haystack.indexOf(needle) === -1) {
      throw new Error(message || `"${haystack}" does not contain "${needle}"`);
    }
  },
  
  lengthEquals(array, expectedLength, message) {
    if (array.length !== expectedLength) {
      throw new Error(message || `Expected length ${expectedLength} but got ${array.length}`);
    }
  }
};

// Mock utilities for testing
const Mock = {
  // Mock Google Sheets API
  createMockSheet() {
    const data = [['Timestamp', 'Participant ID', 'Cohort ID', 'Prompt', 'Model Response', 'Response Time (ms)', 'Status']];
    return {
      data: data,
      getDataRange() {
        return {
          getValues() { return data; },
          setValues(values) { data = values; }
        };
      },
      getRange(row, col, numRows, numCols) {
        return {
          getValues() {
            const result = [];
            for (let r = 0; r < numRows; r++) {
              const rowData = [];
              for (let c = 0; c < numCols; c++) {
                rowData.push(data[row + r - 1] ? data[row + r - 1][col + c - 1] : '');
              }
              result.push(rowData);
            }
            return result;
          },
          setValues(values) {
            for (let r = 0; r < values.length; r++) {
              if (!data[row + r - 1]) data[row + r - 1] = [];
              for (let c = 0; c < values[r].length; c++) {
                data[row + r - 1][col + c - 1] = values[r][c];
              }
            }
          }
        };
      },
      getLastRow() { return data.length; },
      appendRow(row) { data.push(row); }
    };
  },
  
  // Mock PropertiesService
  createMockProperties() {
    const props = {};
    return {
      getProperty(key) { return props[key] || null; },
      setProperty(key, value) { props[key] = value; return this; },
      deleteProperty(key) { delete props[key]; return this; },
      getProperties() { return Object.assign({}, props); }
    };
  },
  
  // Mock Utilities
  createMockUtilities() {
    return {
      computeDigest(algorithm, data) {
        // Simple mock hash for testing
        const hash = [];
        for (let i = 0; i < 32; i++) {
          hash.push(Math.floor(Math.random() * 256));
        }
        return hash;
      },
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      }
    };
  }
};

// Export for use in tests
if (typeof module !== 'undefined') {
  module.exports = { TestFramework, assert, Mock };
}