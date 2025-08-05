# PromptLab

An intelligent web-based platform for conducting AI prompting experiments with automated cohort detection and comprehensive analytics.

## Overview

PromptLab is designed for educational research, providing:
- **Secure NRIC-based authentication** (Singapore students)
- **Intelligent cohort detection** using clustering analysis
- **Automatic monthly cohort IDs** with smart boundary handling
- **Real-time AI responses** via Google Gemini API
- **Comprehensive data logging** to Google Sheets
- **Built-in security** and rate limiting

## Key Features

### 🔐 Privacy-First Authentication
- Students log in with last 4 characters of NRIC
- Converted to anonymous hash IDs
- No personal data stored

### 🎯 Smart Cohort Management
- **Automatic detection** based on class schedule
- **Monthly cohort IDs**: `YYYY-MM-X-DD` format (e.g., `2024-11-A-SS`)
- **Clustering analysis** to detect in-class vs out-of-class submissions
- **Month boundary handling** (Saturday Nov 30 → December cohort)

### 📊 Class Schedule (Singapore)
- **Cohort A**: Saturday/Sunday 9:00-12:00
- **Cohort B**: Saturday/Sunday 13:00-16:00  
- **Cohort C**: Monday/Wednesday 19:00-22:00
- **Cohort D**: Tuesday/Thursday 19:00-22:00

## Quick Start

### 1. Setup Google Apps Script Project

```bash
# Clone the repository
git clone https://github.com/NERVsystems/promptlab.git
cd promptlab

# Option A: Automated setup (if clasp auth works)
npm install
npm run setup
npm run push
npm run deploy

# Option B: Quick manual setup
node scripts/quick-setup.js  # Copies files to clipboard
# Then paste into script.google.com
```

### 2. Configure Class Schedule

In Google Apps Script editor, run:
```javascript
setupYourClassSchedule()
```

### 3. Get Gemini API Key (Free)

1. Go to: https://makersuite.google.com/app/apikey
2. Create API key (no credit card required)
3. Add to Script Properties:
```javascript
PropertiesService.getScriptProperties()
  .setProperty('GEMINI_API_KEY', 'your-key-here');
```

### 4. Deploy Web App

1. Deploy → New deployment
2. Settings:
   - Type: Web app
   - Execute as: Me
   - Access: Anyone with the link
3. Copy the deployment URL

## Usage

### For Students

1. **Access the URL** provided by instructor
2. **Enter last 4 characters** of NRIC (e.g., "123A")
3. **Write prompts** in the code editor
4. **Submit** to see AI responses
5. **Continue experimenting** - all data is logged automatically

### For Instructors

1. **Monitor in real-time** via Google Sheets
2. **Run analytics** to identify patterns
3. **Fix cold starts** with batch processing
4. **Export data** for research analysis

## Advanced Features

### Context Memory (Optional)
Enable conversation memory between prompts:
```javascript
PropertiesService.getScriptProperties()
  .setProperty('ENABLE_CONTEXT', 'true');
```

### Rate Limiting
- 10 prompts/minute per student
- 3-second minimum between prompts
- Prevents system abuse

### Cold Start Recovery
Fix unassigned cohorts after initial deployment:
```javascript
fixColdStart()  // Run in Apps Script editor
```

## Testing

### Run Tests in Google Apps Script
```javascript
runAllTests()        // Complete test suite
runCoreTests()       // Essential functionality
runIntegrationTests() // End-to-end scenarios
```

### Run Tests Locally
```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
```

## Data Structure

Google Sheets columns:
- `Timestamp` - Submission time
- `Participant ID` - Anonymous hash (8 chars)
- `Cohort ID` - Monthly cohort (e.g., "2024-11-A-SS")
- `Prompt` - Student's input
- `Model Response` - AI output
- `Response Time (ms)` - Processing duration
- `Status` - OK/FLAGGED/RATE_LIMITED
- `Context Used` - true/false
- `Session Type` - IN_CLASS/OUT_OF_CLASS/UNKNOWN

## Security & Privacy

- ✅ NRIC hashed with SHA-256 + salt
- ✅ No personal data stored
- ✅ Rate limiting protection
- ✅ Suspicious prompt detection
- ✅ Secure API key storage
- ✅ Audit trail for all submissions

## Troubleshooting

### "Rate limit exceeded"
- Wait 3 seconds between prompts
- Check if student is submitting too rapidly

### Cohorts showing as "UNASSIGNED"
- Run `fixColdStart()` to batch-assign cohorts
- Ensure class schedule is configured

### No AI responses
- Verify Gemini API key is set
- Check you're within free tier limits (60 req/min)
- Enable mock responses for testing:
  ```javascript
  PropertiesService.getScriptProperties()
    .setProperty('USE_MOCK_RESPONSES', 'true');
  ```

## Analytics & Reporting

### Weekly Clustering Report
```javascript
generateClusteringReport()
```

### Session Analysis
```javascript
analyzeSubmissionClustering('2024-11-A-SS', 7) // Last 7 days
```

## Development

### File Structure
```
apps-script/
├── index.html              # Main UI
├── Code.js                 # Core logic
├── clustering-analysis.js  # Cohort detection
├── class-schedule-setup.js # Configuration
├── tests.js               # Test suite
└── test-runner.js         # Test utilities
```

### Key Functions
- `generateParticipantHash()` - NRIC to anonymous ID
- `generateMonthlyCohortId()` - Dynamic cohort IDs
- `detectCohort()` - Smart cohort assignment
- `processPrompt()` - Handle submissions
- `classifySubmission()` - In-class detection
- `fixColdStart()` - Batch cohort assignment

## Contributing

1. Fork the repository
2. Create feature branch
3. Run tests: `npm test`
4. Submit pull request

## License

MIT License - See LICENSE file

## Support

For issues or questions:
- GitHub Issues: https://github.com/NERVsystems/promptlab/issues
- Documentation: See `/tests/README.md` for testing guide