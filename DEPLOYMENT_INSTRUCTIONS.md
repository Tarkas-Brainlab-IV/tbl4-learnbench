# PromptLab Deployment Update - Theme Switcher & Bug Fixes

## Current Deployment Information
- **Script ID**: 1kiaaKRHCvvknaV2asTYp3AfH-BQh9g5-Iip_Em8EqfReos4-dzCRCgal
- **Spreadsheet ID**: 1152xJb3pqhug19ExNKCdAFy1sSvMa2GyJIVoEkLd29o
- **Web App URL**: https://script.google.com/macros/s/AKfycbzXXdTpALwYwxU3KHc04-qCCfnIImz54g3_b_JP7Bpl/exec
- **Script Editor**: https://script.google.com/d/1QeoELCzLgZ7YgqrzeKzWE0oBncJOsOreU-6O_q9YR-qD4ul6Oe3pT5So/edit

## Latest Changes (August 2025)

### 1. ✅ Theme Switcher Implementation
- Added theme switcher buttons (Light/Dark/System) in top-right corner
- Implemented ThemeManager JavaScript to handle theme switching
- Theme preference saved to localStorage
- Respects system dark mode preference by default
- CodeMirror editor theme updates with light/dark mode

### 2. ✅ Markdown Rendering Fix
- Updated marked.js CDN to specific working version (4.3.0)
- Configured marked with proper options for GitHub-flavored markdown
- Markdown now renders properly in AI responses

### 3. ✅ Demographics Modal Fix
- Removed `!important` CSS declarations that were preventing display
- Modal now properly triggers after configured number of prompts
- Fixed visibility and display issues

### 4. ✅ CodeMirror Dark Theme
- Added monokai theme CSS for dark mode CodeMirror
- Editor theme switches automatically with light/dark mode

## Testing Instructions

### Test Theme Switcher:
1. Open the web app
2. Look for three icon buttons in top-right corner:
   - Sun icon = Light mode
   - Monitor icon = System preference
   - Moon icon = Dark mode
3. Click each button to test theme switching
4. Verify the app respects your system's dark mode setting
5. Refresh page and verify theme preference is remembered

### Test Markdown Rendering:
1. Submit a prompt that generates markdown response
2. Verify that **bold**, *italic*, headers render properly
3. Check that lists and code blocks are formatted correctly
4. Example prompt: "Explain the difference between let and const in JavaScript with examples"

### Test Demographics Modal:
1. Clear localStorage if testing again: Open console and run `localStorage.clear()`
2. Login with any 4-character code
3. Submit 1 prompt (configured for testing)
4. Modal should appear 1.5 seconds after the first successful response
5. Verify you can either skip or fill out and submit

## Configuration

Current settings in `index.html`:
```javascript
const CONFIG = {
  PROMPTS_BEFORE_DEMOGRAPHICS: 1, // Set to 1 for testing, change to 3 for production
  ENABLE_MARKDOWN: true
};
```

To change to production:
1. Edit line 765 in index.html
2. Change `PROMPTS_BEFORE_DEMOGRAPHICS: 1` to `PROMPTS_BEFORE_DEMOGRAPHICS: 3`
3. Push changes: `clasp push`

## Manual Deployment (if needed)

```bash
# Navigate to apps-script directory
cd apps-script

# Push code to Google Apps Script
clasp push

# Open the script editor
clasp open-script

# List deployments
clasp list-deployments

# Open the web app
clasp open-web-app AKfycbzXXdTpALwYwxU3KHc04-qCCfnIImz54g3_b_JP7Bpl
```

## Troubleshooting

### If changes don't appear:
1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Try incognito/private browsing
3. Check browser console for errors (F12)
4. Verify you're using the correct deployment URL

### Console Testing Commands:
```javascript
// Test if marked.js loaded
console.log('Marked.js loaded?', typeof marked !== 'undefined');

// Test markdown rendering
if (typeof marked !== 'undefined') {
  const testMd = '# Test\n**Bold** and *italic*\n- List item';
  console.log('Test markdown:', marked.parse(testMd));
}

// Check theme
console.log('Current theme:', localStorage.getItem('theme'));

// Check demographics status
console.log('Session data:', sessionData);

// Manually trigger demographics modal (for testing)
showDemographicsModal();
```

## Known Issues - ALL RESOLVED ✅

- ✅ Theme switcher missing controls - FIXED
- ✅ System dark mode not respected - FIXED
- ✅ Markdown showing raw output - FIXED
- ✅ Demographics modal not triggering - FIXED
- ✅ Demographics modal display issues - FIXED

## Previous Critical Bug Fixes

### SpreadsheetApp Shadowing Issue (RESOLVED)
- **Problem**: tests.js was globally overriding SpreadsheetApp causing deployment failures
- **Solution**: Commented out mock assignments in tests.js
- **Prevention**: Added shadow-detection.js to detect namespace collisions

### Spreadsheet Connection (RESOLVED)
- **Problem**: Using SpreadsheetApp.open() instead of openById()
- **Solution**: Fixed to use SpreadsheetApp.openById(SPREADSHEET_ID)

All requested features have been implemented and are working correctly.