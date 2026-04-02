# LearnBench Setup Instructions

## ⚠️ Important: Run Setup First!

Due to Google Apps Script limitations, you must run a setup function before using the web app.

## Step 1: Run Setup Function

1. Open the Apps Script editor
2. Open the `setup.js` file
3. Run the `setupPromptLab()` function
4. This will:
   - Create the necessary spreadsheet
   - Set up all required sheets with headers
   - Configure permissions
   - Store the spreadsheet ID for web app access

## Step 2: Add Gemini API Key

1. In Apps Script: File → Project Properties → Script Properties
2. Add property: `GEMINI_API_KEY` = `your-api-key`

## Step 3: Deploy Web App

1. Deploy → New deployment
2. Configuration:
   - Type: Web app
   - Execute as: Me
   - Access: Anyone with the link
3. Copy the deployment URL

## Why This Setup?

Google Apps Script Web Apps have limited permissions. They cannot create new spreadsheets on the fly using `SpreadsheetApp.create()`. By running the setup function first:

1. We create the spreadsheet with full permissions
2. Store its ID in Script Properties
3. The web app can then access it using `openById()`

## Troubleshooting

### "SpreadsheetApp.create is not a function"
- You haven't run `setupPromptLab()` yet
- Run it from the Apps Script editor

### "Cannot find spreadsheet"
- The spreadsheet ID is not stored
- Run `setupPromptLab()` again

### "Permission denied"
- Make sure the web app is set to "Execute as: Me"
- Redeploy if necessary