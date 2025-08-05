# Troubleshooting Guide

## Common Web App Errors and Solutions

### 1. "Sorry, unable to open the file at this time"
**Cause**: Multiple Google accounts logged in
**Solution**: 
- Open in incognito/private window
- Or sign out of all accounts except the one that owns the script
- Or use this URL format (remove `/u/1/`): 
  ```
  https://script.google.com/macros/s/AKfycbxBeU18pth9jXUitQVdcKW2H9OaRbueKqjwnex2SFs0JNy_xBpvm2amweEjckwwkug1gg/exec
  ```

### 2. "You need permission"
**Cause**: Web app access settings
**Solution**:
1. In Apps Script editor: Deploy → Manage deployments
2. Click pencil icon to edit
3. Change "Who has access" to "Anyone"
4. Update deployment

### 3. Blank page or no content
**Cause**: HTML file not found or script error
**Solution**:
1. Check that `index.html` exists in the file list
2. Try the test URL to verify basic functionality:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=test
   ```

### 4. "Script function not found: doGet"
**Cause**: Code.gs not properly saved
**Solution**:
1. Open Apps Script editor
2. Make sure Code.gs contains the doGet function
3. Save (Ctrl+S)
4. Deploy → New deployment

## Quick Diagnostic Steps

1. **Test basic functionality**:
   - In Apps Script editor, run this function:
   ```javascript
   function testDoGet() {
     const result = doGet();
     console.log(result.getContent());
   }
   ```

2. **Check deployment settings**:
   - Deploy → Manage deployments
   - Should show:
     - Execute as: Me (your email)
     - Who has access: Anyone

3. **Verify files**:
   - Code.gs ✓
   - index.html ✓
   - appsscript.json ✓

4. **Test with minimal HTML**:
   Replace doGet() temporarily with:
   ```javascript
   function doGet() {
     return HtmlService.createHtmlOutput('<h1>It works!</h1>');
   }
   ```

## Access URLs

Your web app can be accessed at:
- Main URL: `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`
- Dev URL: `https://script.google.com/macros/s/DEPLOYMENT_ID/dev` (shows latest code)
- Test URL: Add `?page=test` to load test.html

## Still Having Issues?

1. **Create fresh deployment**:
   ```bash
   # In Apps Script editor
   Deploy → New deployment → Web app
   ```

2. **Check execution transcript**:
   - View → Executions
   - Look for errors in recent executions

3. **Enable Drive API** (if getting Drive errors):
   - Resources → Advanced Google services
   - Enable Drive API

4. **Share the specific error message** you're seeing for more targeted help.