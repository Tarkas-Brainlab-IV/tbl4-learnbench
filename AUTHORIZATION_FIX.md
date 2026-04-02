# LearnBench Authorization Fix

## ✅ The Solution

The `SpreadsheetApp.create is not a function` error occurs because the script hasn't been authorized yet. Here's how to fix it:

## Step 1: Authorize the Script (Required!)

1. **Open the Apps Script editor**
2. **Open `sheet-manager.js`**
3. **Run the `authorizeAndSetup()` function**
4. **Grant all requested permissions** when prompted:
   - Google Drive (to create/access files)
   - Google Sheets (to create/modify spreadsheets)

This function will:
- Trigger the authorization flow
- Create the data spreadsheet
- Store its ID for future use
- Set up all required sheets

## Step 2: Verify Setup

Run `testSheetAccess()` to confirm everything is working:
- Should show "✅ Sheet access working"
- Will display the spreadsheet URL

## Step 3: Deploy Web App

1. Deploy → New deployment
2. **IMPORTANT**: Set "Execute as: Me"
3. Set "Who has access: Anyone with the link"
4. Copy the deployment URL

## Why This Happened

1. **Google Apps Script requires explicit authorization** before accessing Drive/Sheets
2. **Web apps can't trigger authorization** - it must be done in the editor
3. **Without authorization**, all SpreadsheetApp/DriveApp calls fail

## Key Improvements Made

Based on expert code review:

1. **LockService** prevents race conditions when multiple users submit
2. **Store spreadsheet ID** instead of searching by name (faster, more reliable)
3. **Safe append** handles content over 50k characters
4. **Proper error handling** with fallbacks

## If Still Having Issues

1. Make sure you're logged in with the correct Google account
2. Check that your account has permission to create Drive files
3. Try running `authorizeAndSetup()` again
4. Check the execution transcript for specific errors

## For Instructors

After authorization:
1. The spreadsheet is created at the URL shown in logs
2. All submissions will be logged there
3. Demographics sheet is automatically protected
4. System handles concurrent users properly

Remember: **Authorization is a one-time setup** by the script owner. Students never need to authorize anything.