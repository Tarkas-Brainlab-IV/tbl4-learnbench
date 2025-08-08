# 🚀 Deploy New Architecture to Google Apps Script

## Method 1: Automated Deployment with Clasp (RECOMMENDED)

### Prerequisites
Ensure clasp is installed and configured:
```bash
npm install -g @google/clasp
clasp login  # If not already logged in
```

### Deploy All Files
```bash
# From project root directory
cd /path/to/nerv-learnbench

# Push all files to Google Apps Script
clasp push

# Or force push if you want to overwrite
clasp push --force

# Open the project in browser
clasp open-script
```

### Deploy Specific Files Only
```bash
# Push only the new architecture files
clasp push --files \
  apps-script/config-manager.js \
  apps-script/error-handler.js \
  apps-script/validation-utils.js \
  apps-script/business-logic.js \
  apps-script/sheet-manager-v2.js \
  apps-script/monitoring.js \
  apps-script/Code-refactored.js \
  apps-script/tests-refactored.js
```

### Check Deployment Status
```bash
# View which files are tracked
clasp status

# View recent pushes in logs
clasp logs
```

### Create New Deployment Version
```bash
# Deploy a new version
clasp deploy --description "v2.0 - Performance Refactor"

# List all deployments
clasp deployments

# Open the deployed web app
clasp open-web-app [deploymentId]
```

## Method 2: Manual Deployment Steps

### 1. Open Google Apps Script
Go to your project: https://script.google.com

### 2. Create New Files
For each new module:
- Click `+` next to Files
- Select "Script"
- Name it (without .gs extension)
- Paste the code

### 3. File Mapping

| Local File | Google Apps Script Name |
|------------|------------------------|
| config-manager.js | ConfigManager |
| error-handler.js | ErrorHandler |
| validation-utils.js | ValidationUtils |
| business-logic.js | BusinessLogic |
| sheet-manager-v2.js | SheetManagerV2 |
| monitoring.js | Monitoring |
| Code-refactored.js | Code (REPLACE) |
| tests-refactored.js | TestsRefactored |

### 4. IMPORTANT: Backup Current Code.gs
Before replacing Code.gs:
1. Copy current Code.gs content
2. Create new file "CodeBackup.gs"
3. Paste old code there
4. Then replace Code.gs with Code-refactored.js content

### 5. Initialize the New System
After all files are deployed, run this in the Apps Script editor:

```javascript
function deploymentTest() {
  console.log('Testing new deployment...');
  
  // Check all modules loaded
  console.log('CONFIG exists:', typeof CONFIG !== 'undefined');
  console.log('ErrorHandler exists:', typeof ErrorHandler !== 'undefined');
  console.log('Validators exists:', typeof Validators !== 'undefined');
  console.log('SheetManager exists:', typeof SheetManager !== 'undefined');
  
  // Run health check
  const health = healthCheck();
  console.log('Health check:', health);
  
  // Run tests
  const tests = runAllTestsRefactored();
  console.log('Tests:', tests.passed + '/' + tests.total);
  
  return 'Deployment successful!';
}
```

### 6. Update Web App Deployment
1. Deploy → Manage deployments
2. Edit deployment (pencil icon)
3. Version: "New version"
4. Description: "v2.0 - Performance refactor"
5. Update

## Verification Commands

After deployment, test these in the Apps Script editor:

```javascript
// Check system health
healthCheck()

// View performance metrics  
getPerformanceMetrics()

// Test core functions
generateParticipantHash('TEST')

// Run test suite
runAllTestsRefactored()

// Check configuration
getClientConfig()
```

## Rollback Plan

If something goes wrong:

1. Restore Code.gs from CodeBackup.gs
2. Delete the new files
3. Redeploy previous version

## Quick Deployment Commands Reference

```bash
# Initial setup (one-time)
npm install -g @google/clasp
clasp login
clasp clone [scriptId]  # Or use existing .clasp.json

# Daily deployment workflow
clasp push              # Deploy all changes
clasp open-script       # Open in browser
clasp logs --tail       # Watch logs in real-time

# Version management
clasp version "v2.0 Release"  # Create version
clasp deployments             # List deployments
clasp deploy --description "Production v2.0"
```

## Troubleshooting Deployment

### "ReferenceError: CONFIG is not defined"
- Make sure ConfigManager.gs is created and saved
- File load order matters - config should load first

### "healthCheck is not defined"  
- Check that Code.gs has been updated with refactored version
- Make sure all new files are saved

### Functions not appearing
- Save all files (Ctrl+S)
- Refresh the editor
- Check for syntax errors in console

## Post-Deployment Checklist

- [ ] All new files created in Apps Script
- [ ] Code.gs updated with refactored version
- [ ] Old Code.gs backed up
- [ ] deploymentTest() runs successfully
- [ ] healthCheck() returns healthy: true
- [ ] Web app redeployed with new version
- [ ] Test with sample participant login

---

Remember: The new code is in your local `/apps-script/` folder - you need to copy it to Google Apps Script!