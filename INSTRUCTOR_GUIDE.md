# PromptLab Instructor Guide

## Quick Reference

### 🚀 First-Time Setup (10 minutes)

1. **Deploy the system**:
   ```bash
   # Copy code to Google Apps Script
   node scripts/quick-setup.js
   ```

2. **Configure schedule** (run in Apps Script):
   ```javascript
   setupYourClassSchedule()
   ```

3. **Get free API key**:
   - Visit: https://makersuite.google.com/app/apikey
   - Add to Script Properties: `GEMINI_API_KEY`

4. **Deploy & share URL** with students

### 📊 During Class

**Monitor Activity**:
- Open the Google Sheet (auto-created as "Experiment Data")
- Watch submissions appear in real-time
- Check "Session Type" column for IN_CLASS confirmation

**If Issues Arise**:
- Rate limit errors → Normal, prevents abuse
- UNASSIGNED cohorts → Run `fixColdStart()` after class
- No responses → Check API key and limits

### 📈 After Class

**Fix Unassigned Entries**:
```javascript
fixColdStart()  // Assigns cohorts based on timing
```

**Generate Reports**:
```javascript
generateClusteringReport()  // Weekly summary
analyzeSubmissionClustering('2024-11-A-SS', 7)  // Specific cohort
```

**Export Data**:
- File → Download → CSV/Excel
- All anonymized, ready for analysis

## Key Features for Instructors

### 1. Automatic Cohort Detection
- Students automatically assigned to correct cohort
- Monthly IDs track semester progress
- Example: `2024-11-A-SS` = November 2024, Cohort A, Sat/Sun

### 2. Privacy Protection
- Students use last 4 NRIC chars
- Converted to anonymous 8-char hash
- No personal data stored

### 3. Smart Analytics
- **Clustering analysis** detects synchronized class activity
- **Cold start recovery** fixes early submissions
- **Rate limiting** prevents gaming the system

### 4. Flexible Configuration

**Enable conversation memory**:
```javascript
PropertiesService.getScriptProperties()
  .setProperty('ENABLE_CONTEXT', 'true');
```

**Allow out-of-class submissions**:
```javascript
PropertiesService.getScriptProperties()
  .setProperty('ALLOW_OUT_OF_CLASS', 'true');
```

## Common Scenarios

### Scenario: First Few Students Show "UNASSIGNED"
**Why**: System needs multiple students to detect cohort
**Fix**: Run `fixColdStart()` after 5+ students submit

### Scenario: Student Can't Submit
**Why**: Rate limit (3-second cooldown)
**Fix**: Tell them to wait a few seconds

### Scenario: Testing Before Class
**Solution**: Enable mock responses
```javascript
PropertiesService.getScriptProperties()
  .setProperty('USE_MOCK_RESPONSES', 'true');
```

### Scenario: Analyzing Participation
```javascript
// See who participated in last class
const sheet = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName('Experiment Data');
const data = sheet.getDataRange().getValues();

// Filter by cohort and date
const cohortA = data.filter(row => 
  row[2].includes('2024-11-A-SS') && 
  row[6] === 'IN_CLASS'
);
```

## Data Columns Explained

| Column | Description | Example |
|--------|-------------|---------|
| Timestamp | Submission time | 2024-11-30 10:15:23 |
| Participant ID | Anonymous hash | A7F2E3B1 |
| Cohort ID | Monthly cohort | 2024-11-A-SS |
| Prompt | Student's question | "What is machine learning?" |
| Model Response | AI answer | "Machine learning is..." |
| Response Time | Processing duration | 1523 (ms) |
| Status | Submission status | OK / RATE_LIMITED |
| Context Used | Memory enabled? | true / false |
| Session Type | Class detection | IN_CLASS / OUT_OF_CLASS |

## Tips for Research

1. **Consistent Timing**: Run experiments at scheduled class times
2. **Monitor Quality**: Check for copy-paste patterns
3. **Track Progress**: Compare monthly cohort performance
4. **Privacy First**: Never try to reverse-engineer hashes
5. **Experimental Neutrality**: Students see no branding or experiment indicators

## Troubleshooting Checklist

- [ ] API key set in Script Properties?
- [ ] Class schedule configured?
- [ ] Web app deployed with correct permissions?
- [ ] Students using correct NRIC format (last 4 chars)?
- [ ] Within Gemini free tier limits (60 req/min)?

## Support Functions

```javascript
// Validate setup
validateSetup()

// Run tests
runCoreTests()

// Check recent activity
const recent = sheet.getDataRange().getValues()
  .slice(-20);  // Last 20 entries
```