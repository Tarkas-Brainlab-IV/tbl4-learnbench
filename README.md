# LearnBench

A web-based system for conducting human-AI teaming prompting experiments using Google Apps Script and the Gemini API.

## Overview

LearnBench provides a streamlined platform for:
- Collecting text and image-based prompts from experiment participants
- Processing multimodal prompts through AI models (Gemini 1.5)
- Logging all interactions to Google Sheets
- Real-time display of AI responses
- CodeMirror-based prompt editor with syntax highlighting
- Scenario-based experiments with configurable workflows

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
2. Enter participant ID (last 4 characters of NRIC)
3. Complete optional demographics survey
4. Review scenario and respond to questions
5. Write prompts in the CodeMirror editor
6. Optionally attach images by:
   - Dragging and dropping onto the attachment area
   - Pasting from clipboard (Ctrl/Cmd+V)
   - Clicking to browse and select files
7. Submit prompts to receive AI responses
8. All interactions are automatically logged

## Features

- **Rich Text Editor**: CodeMirror with line numbers and syntax highlighting
- **Multimodal AI Support**: Submit text prompts with optional images
- **Image Upload Options**: 
  - Drag and drop images onto the upload area
  - Paste images from clipboard (Ctrl/Cmd+V)
  - Click to select images via file dialog
- **Real-time Processing**: Immediate AI responses from Gemini
- **Automatic Logging**: All prompts and responses saved to Google Sheets
- **Participant Tracking**: ID and cohort-based organization
- **Response Metadata**: Timestamps, token counts, processing time
- **Keyboard Shortcuts**: Ctrl+Enter to submit prompt

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

## Configuration

### Setup Sheet
The system creates a "Setup" sheet in your Google Sheets with configurable parameters:
- **Enable AI**: Toggle AI responses on/off
- **Enable Context**: Maintain conversation context across prompts
- **Context Window**: Number of previous messages to include (default: 5)
- **Enable Demographics**: Show/hide demographics survey
- **Prompts Before Demographics**: When to show the survey (default: after 1 prompt)
- **Auto Advance Scenarios**: Automatically move to next scenario
- **Auto Close on Complete**: End session when all scenarios are done

### Image Support
The system supports multimodal prompts with Gemini 1.5:
- **Max file size**: 4MB per image
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Multiple upload methods**: Drag & drop, paste, or file selection
- Images are base64 encoded and sent with the prompt to Gemini

## Customization

### Adding Scenarios
Edit the scenarios in the Setup sheet or modify `getAllScenariosForParticipant()` in Code.js

### Changing AI Models
The system automatically tries Gemini 1.5 Flash first, then falls back to Gemini Pro if needed. To modify:
```javascript
const models = [
  { name: 'gemini-1.5-flash', url: '...' },
  { name: 'gemini-pro', url: '...' }
];
```

### UI Themes
The interface supports light, dark, and system themes. Users can switch using the theme buttons in the header.

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