/**
 * Shadow Detection Test Suite
 * 
 * CRITICAL: This file tests for shadowing of Google Apps Script built-in services.
 * Shadowing these services is a common source of cryptic errors like:
 * - "SpreadsheetApp.open is not a function"
 * - "DriveApp.getFileById is not a function"
 * - "PropertiesService is undefined"
 * 
 * RUN THIS BEFORE EVERY DEPLOYMENT!
 */

/**
 * Main shadow detection test - RUN THIS FIRST!
 * Tests all critical Google Apps Script services for shadowing
 */
function detectShadowedServices() {
  console.log('=== SHADOW DETECTION TEST ===');
  console.log('Testing for shadowed Google Apps Script services...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // List of critical GAS services and their required methods
  const criticalServices = [
    {
      name: 'SpreadsheetApp',
      requiredMethods: ['openById', 'create', 'getActiveSpreadsheet', 'open', 'openByUrl'],
      critical: true
    },
    {
      name: 'DriveApp',
      requiredMethods: ['getFileById', 'getFilesByName', 'createFile', 'createFolder', 'getFolderById'],
      critical: true
    },
    {
      name: 'PropertiesService',
      requiredMethods: ['getScriptProperties', 'getUserProperties', 'getDocumentProperties'],
      critical: true
    },
    {
      name: 'HtmlService',
      requiredMethods: ['createHtmlOutput', 'createHtmlOutputFromFile', 'createTemplate'],
      critical: true
    },
    {
      name: 'UrlFetchApp',
      requiredMethods: ['fetch', 'fetchAll'],
      critical: true
    },
    {
      name: 'Utilities',
      requiredMethods: ['computeDigest', 'base64Encode', 'base64Decode', 'sleep', 'formatDate'],
      critical: true
    },
    {
      name: 'Logger',
      requiredMethods: ['log', 'clear', 'getLog'],
      critical: false
    },
    {
      name: 'ScriptApp',
      requiredMethods: ['getService', 'getProjectKey', 'getScriptId'],
      critical: false
    },
    {
      name: 'Session',
      requiredMethods: ['getActiveUser', 'getEffectiveUser', 'getTemporaryActiveUserKey'],
      critical: false
    }
  ];
  
  // Test each service
  criticalServices.forEach(service => {
    const testResult = testService(service);
    
    if (testResult.status === 'PASS') {
      results.passed.push(testResult);
    } else if (testResult.status === 'FAIL') {
      results.failed.push(testResult);
    } else {
      results.warnings.push(testResult);
    }
  });
  
  // Print results
  console.log('\n=== TEST RESULTS ===\n');
  
  if (results.failed.length > 0) {
    console.log('❌ CRITICAL FAILURES DETECTED:');
    results.failed.forEach(result => {
      console.log(`   ${result.serviceName}: ${result.message}`);
      if (result.missingMethods.length > 0) {
        console.log(`      Missing methods: ${result.missingMethods.join(', ')}`);
      }
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(result => {
      console.log(`   ${result.serviceName}: ${result.message}`);
    });
    console.log('');
  }
  
  if (results.passed.length > 0) {
    console.log('✅ PASSED:');
    results.passed.forEach(result => {
      console.log(`   ${result.serviceName}: ${result.methodCount} methods verified`);
    });
    console.log('');
  }
  
  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Total services tested: ${criticalServices.length}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n🚨 DEPLOYMENT BLOCKED: Critical services are shadowed!');
    console.log('Fix these issues before deploying:');
    console.log('1. Search for any assignments to these service names');
    console.log('2. Check for "var/let/const ServiceName = ..." anywhere in your code');
    console.log('3. Look for destructuring like "{ ServiceName } = ..."');
    console.log('4. Check test files - they often contain mocks that shadow services');
    
    // Try to find the culprit
    findShadowSource(results.failed);
    
    return false;
  } else {
    console.log('\n✅ All critical services are intact. Safe to deploy!');
    return true;
  }
}

/**
 * Test a single service for shadowing
 */
function testService(serviceConfig) {
  const { name, requiredMethods, critical } = serviceConfig;
  
  try {
    // Check if service exists
    if (typeof this[name] === 'undefined') {
      return {
        status: critical ? 'FAIL' : 'WARN',
        serviceName: name,
        message: 'Service is undefined',
        missingMethods: requiredMethods,
        methodCount: 0
      };
    }
    
    const service = this[name];
    
    // Check if it's an object
    if (typeof service !== 'object' && typeof service !== 'function') {
      return {
        status: critical ? 'FAIL' : 'WARN',
        serviceName: name,
        message: `Service is ${typeof service} instead of object/function`,
        missingMethods: requiredMethods,
        methodCount: 0
      };
    }
    
    // Check for required methods
    const missingMethods = [];
    let foundMethods = 0;
    
    requiredMethods.forEach(method => {
      if (typeof service[method] === 'function') {
        foundMethods++;
      } else {
        missingMethods.push(method);
      }
    });
    
    // Determine status
    if (missingMethods.length === 0) {
      return {
        status: 'PASS',
        serviceName: name,
        message: 'All methods present',
        missingMethods: [],
        methodCount: foundMethods
      };
    } else if (missingMethods.length === requiredMethods.length) {
      return {
        status: critical ? 'FAIL' : 'WARN',
        serviceName: name,
        message: 'Service exists but has no expected methods (likely shadowed)',
        missingMethods: missingMethods,
        methodCount: foundMethods
      };
    } else {
      return {
        status: 'WARN',
        serviceName: name,
        message: 'Some methods missing',
        missingMethods: missingMethods,
        methodCount: foundMethods
      };
    }
    
  } catch (error) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      serviceName: name,
      message: `Error testing service: ${error.toString()}`,
      missingMethods: requiredMethods,
      methodCount: 0
    };
  }
}

/**
 * Try to find where services are being shadowed
 */
function findShadowSource(failedServices) {
  console.log('\n🔍 SEARCHING FOR SHADOW SOURCE...');
  
  failedServices.forEach(failure => {
    const serviceName = failure.serviceName;
    
    // Check if the service has been replaced with a mock
    try {
      const service = this[serviceName];
      
      if (service && typeof service === 'object') {
        const keys = Object.keys(service);
        console.log(`\n${serviceName} has been replaced with an object containing:`, keys.slice(0, 5));
        
        // Check for common mock patterns
        if (keys.includes('mock') || keys.includes('Mock') || keys.includes('_mock')) {
          console.log(`  ⚠️  Likely a mock object from test files`);
        }
        
        // Check if it looks like a partial mock
        if (keys.length < 5) {
          console.log(`  ⚠️  Only ${keys.length} properties - likely a partial mock or stub`);
        }
      }
    } catch (e) {
      // Ignore errors here
    }
  });
  
  console.log('\nCommon shadow sources to check:');
  console.log('1. tests.js - Test files often mock services globally');
  console.log('2. test-framework.js - Test frameworks may override services');
  console.log('3. Any file with "mock" in the name');
  console.log('4. Top-level variable declarations in any .gs/.js file');
  console.log('5. HTML files with server-side templating that assigns variables');
}

/**
 * Quick pre-deployment check - call this before deploying
 */
function preDeploymentCheck() {
  console.log('=== PRE-DEPLOYMENT CHECKLIST ===\n');
  
  let allPassed = true;
  
  // 1. Check for shadowed services
  console.log('1. Checking for shadowed services...');
  const shadowCheck = detectShadowedServices();
  if (!shadowCheck) {
    allPassed = false;
  }
  
  // 2. Check script properties
  console.log('\n2. Checking script properties...');
  try {
    const props = PropertiesService.getScriptProperties();
    const requiredProps = ['SPREADSHEET_ID', 'GEMINI_API_KEY'];
    const missingProps = [];
    
    requiredProps.forEach(prop => {
      const value = props.getProperty(prop);
      if (!value || value === 'YOUR_API_KEY_HERE') {
        missingProps.push(prop);
        console.log(`   ❌ ${prop}: Not set or using placeholder`);
      } else {
        console.log(`   ✅ ${prop}: Set`);
      }
    });
    
    if (missingProps.length > 0) {
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking properties: ${error.toString()}`);
    allPassed = false;
  }
  
  // 3. Check spreadsheet connection
  console.log('\n3. Checking spreadsheet connection...');
  try {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (spreadsheetId) {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      console.log(`   ✅ Connected to: ${ss.getName()}`);
    } else {
      console.log('   ❌ No SPREADSHEET_ID configured');
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ Cannot connect to spreadsheet: ${error.toString()}`);
    allPassed = false;
  }
  
  // Final verdict
  console.log('\n=== DEPLOYMENT READINESS ===');
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - Ready to deploy!');
    return true;
  } else {
    console.log('❌ DEPLOYMENT BLOCKED - Fix the issues above first');
    return false;
  }
}

/**
 * Test for specific known problematic patterns
 */
function testForCommonShadowPatterns() {
  console.log('=== TESTING FOR COMMON SHADOW PATTERNS ===\n');
  
  const patterns = [
    {
      name: 'Global SpreadsheetApp assignment',
      test: () => {
        // Check if SpreadsheetApp has been reassigned
        return typeof SpreadsheetApp.openById === 'function';
      },
      fix: 'Search for "SpreadsheetApp =" in all files'
    },
    {
      name: 'Global DriveApp assignment',
      test: () => {
        return typeof DriveApp.getFileById === 'function';
      },
      fix: 'Search for "DriveApp =" in all files'
    },
    {
      name: 'Mock objects not properly scoped',
      test: () => {
        // Check if common mock properties exist
        if (typeof SpreadsheetApp === 'object') {
          return !SpreadsheetApp.hasOwnProperty('mock') && 
                 !SpreadsheetApp.hasOwnProperty('_isMock');
        }
        return true;
      },
      fix: 'Ensure all mocks are function-scoped, not global'
    },
    {
      name: 'Test mode leaking into production',
      test: () => {
        return typeof TEST_MODE === 'undefined' || TEST_MODE === false;
      },
      fix: 'Check that TEST_MODE is not set to true in production'
    }
  ];
  
  patterns.forEach(pattern => {
    try {
      const passed = pattern.test();
      if (passed) {
        console.log(`✅ ${pattern.name}`);
      } else {
        console.log(`❌ ${pattern.name}`);
        console.log(`   Fix: ${pattern.fix}`);
      }
    } catch (error) {
      console.log(`⚠️  ${pattern.name}: Error during test`);
      console.log(`   ${error.toString()}`);
    }
  });
}

/**
 * Generate a report of all global variables that might shadow GAS services
 */
function reportGlobalNamespace() {
  console.log('=== GLOBAL NAMESPACE REPORT ===\n');
  
  const gasServices = [
    'SpreadsheetApp', 'DriveApp', 'DocumentApp', 'SlidesApp', 'FormsApp',
    'CalendarApp', 'GmailApp', 'GroupsApp', 'MapsApp', 'SitesApp',
    'PropertiesService', 'ScriptApp', 'Session', 'HtmlService', 'ContentService',
    'UrlFetchApp', 'Utilities', 'Logger', 'console', 'CacheService',
    'LockService', 'MailApp', 'Browser'
  ];
  
  const conflicts = [];
  const safe = [];
  
  gasServices.forEach(serviceName => {
    try {
      const service = this[serviceName];
      if (typeof service !== 'undefined') {
        // Check if it looks like the real service
        const isReal = checkIfRealService(serviceName, service);
        if (isReal) {
          safe.push(serviceName);
        } else {
          conflicts.push({
            name: serviceName,
            type: typeof service,
            keys: typeof service === 'object' ? Object.keys(service).slice(0, 5) : []
          });
        }
      }
    } catch (e) {
      // Service doesn't exist or error accessing it
    }
  });
  
  if (conflicts.length > 0) {
    console.log('⚠️  POTENTIAL CONFLICTS FOUND:');
    conflicts.forEach(conflict => {
      console.log(`   ${conflict.name}:`);
      console.log(`      Type: ${conflict.type}`);
      if (conflict.keys.length > 0) {
        console.log(`      Keys: ${conflict.keys.join(', ')}`);
      }
    });
  }
  
  console.log(`\n✅ ${safe.length} services appear intact`);
  console.log(`⚠️  ${conflicts.length} potential conflicts`);
  
  return { safe, conflicts };
}

/**
 * Check if a service looks like the real GAS service
 */
function checkIfRealService(serviceName, service) {
  // Define expected methods for each service
  const expectedMethods = {
    'SpreadsheetApp': ['openById', 'create'],
    'DriveApp': ['getFileById', 'createFile'],
    'PropertiesService': ['getScriptProperties'],
    'HtmlService': ['createHtmlOutput'],
    'UrlFetchApp': ['fetch'],
    'Utilities': ['computeDigest'],
    'Logger': ['log'],
    'console': ['log']
  };
  
  const expected = expectedMethods[serviceName];
  if (!expected) return true; // Don't know what to expect, assume it's real
  
  // Check if all expected methods exist
  return expected.every(method => typeof service[method] === 'function');
}

// Auto-run shadow detection when script loads (optional)
// Uncomment the line below to automatically check on every script execution
// detectShadowedServices();