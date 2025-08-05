# NERV LearnBench

A web-based system for conducting human-AI teaming prompting experiments using Google Apps Script and the Gemini API.

## Overview

NERV LearnBench provides a streamlined platform for:
- Collecting prompts from experiment participants
- Processing prompts through AI models (Gemini)
- Logging all interactions to Google Sheets
- Real-time display of AI responses
- CodeMirror-based prompt editor with syntax highlighting

## Architecture

- **Frontend**: HTML5 with CodeMirror editor
- **Backend**: Google Apps Script
- **Storage**: Google Sheets
- **AI Model**: Google Gemini API (configurable)
- **Hosting**: Google Apps Script Web App

## Setup Instructions

### Method 1: Quick Setup (No Authentication Issues)

1. **Run the quick setup script**:
   ```bash
   node scripts/quick-setup.js
   ```
   This copies the first file to your clipboard.

2. **Go to [script.google.com](https://script.google.com)** and create a new project

3. **Paste** the clipboard content into Code.gs

4. **Run the script again** for each file:
   ```bash
   node scripts/quick-setup.js  # Copies index.html → Create HTML file
   node scripts/quick-setup.js  # Copies appsscript.json → See note below
   ```
   
   **For appsscript.json**: Go to Project Settings (⚙️) → Check "Show appsscript.json"

5. **Deploy** your Web App in the Apps Script editor

### Method 2: Automated Setup with Clasp

If authentication works for you:
```bash
npm install
npm run setup  # Login and create project
npm run push   # Push files
npm run deploy # Deploy web app
```

### Method 3: Manual Copy

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Manually copy each file from `apps-script/` folder

### 3. Configure Gemini API (Optional)

To use the real Gemini API instead of mock responses:

1. Enable the Generative Language API in [Google Cloud Console](https://console.cloud.google.com)
2. Create an API key
3. In Apps Script: File → Project Properties → Script Properties
4. Add property: `GEMINI_API_KEY` with your API key
5. Uncomment the `callGeminiAPIProduction` function in Code.gs
6. Replace the mock implementation with the production version

### 4. Deploy the Web App

**Using Clasp**:
```bash
npm run deploy
```

**Or manually in Apps Script editor**:
1. Deploy → New deployment
2. Configuration:
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone (or "Anyone with the link" for restricted access)
3. Click "Deploy"
4. Copy the deployment URL

### 5. Development Workflow

**Watch for changes** (auto-push on save):
```bash
npm run watch  # Or: clasp push --watch
```

**View logs in real-time**:
```bash
npm run logs  # Or: clasp logs --tail
```

**Pull changes from Google**:
```bash
npm run pull  # Or: clasp pull
```

### 6. Access Permissions

On first deployment, you'll need to:
1. Review permissions
2. Grant access to:
   - Google Sheets (for data logging)
   - External network access (for Gemini API)

## Usage

### For Experimenters

1. Share the deployment URL with participants
2. Monitor responses in the automatically created Google Sheet
3. Export data for analysis

### For Participants

1. Open the provided URL
2. Enter participant ID and select cohort
3. Write prompts in the CodeMirror editor
4. Submit to see AI responses
5. All interactions are automatically logged

## Features

- **Rich Text Editor**: CodeMirror with line numbers and syntax highlighting
- **Real-time Processing**: Immediate AI responses
- **Automatic Logging**: All prompts and responses saved to Google Sheets
- **Participant Tracking**: ID and cohort-based organization
- **Response Metadata**: Timestamps, token counts, processing time
- **Keyboard Shortcuts**: Ctrl+Enter to submit

## Data Structure

The Google Sheet logs the following columns:
- Timestamp
- Participant ID
- Cohort ID
- Prompt
- AI Response
- Model Used
- Token Count
- Processing Time (ms)

## Customization

### Adding New Cohorts
Edit the cohort dropdown in `index.html`:
```html
<option value="cohort-d">Cohort D</option>
```

### Changing AI Models
Modify the `callGeminiAPI` function to use different models or providers (OpenAI, Anthropic, local models).

### UI Themes
Update the CodeMirror theme in `index.html`:
```javascript
theme: 'monokai', // Change to 'default', 'dracula', etc.
```

## Security Considerations

- API keys are stored in Script Properties (not in code)
- Web app executes under deployer's account
- Participant data is isolated in Google Sheets
- No client-side API calls

## Troubleshooting

### "Permission Denied" Error
- Ensure the web app is deployed with proper access settings
- Check that all required APIs are enabled

### No AI Response
- Verify Gemini API key is set correctly
- Check quota limits in Google Cloud Console
- Review execution logs in Apps Script editor

### Sheet Not Created
- Ensure the script has Drive and Sheets permissions
- Check for existing sheets with the same name

## Future Enhancements

- Multiple prompt types/templates
- Rubric-based scoring integration
- Export to various formats (CSV, JSON)
- A/B testing different models
- Time pressure experiments
- Multi-turn conversations

## License

MIT License - See LICENSE file for details