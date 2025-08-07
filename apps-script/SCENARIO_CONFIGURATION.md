# Scenario System Configuration Guide

## Quick Setup

### 1. Run Setup Functions in Google Apps Script
Open your Google Apps Script project and run these functions in the console:

```javascript
// First, ensure the Setup sheet exists
ensureSetupSheet()

// Test that scenarios are loading correctly
testScenarioSystem()
```

## 2. Configure the Setup Sheet

The Setup sheet controls all experiment behavior. After running `ensureSetupSheet()`, you'll have a sheet with these settings:

| Setting | Column B Value | Description |
|---------|---------------|-------------|
| Enable AI Assistance | ☑️ or ☐ | Shows/hides AI prompt section |
| Enable Context (Multi-turn) | ☑️ or ☐ | Allows AI to remember conversation |
| Context Window Size | Number (e.g., 5) | Previous exchanges to remember |
| Enable Demographics | ☑️ or ☐ | Collect demographic information |
| Prompts Before Demographics | Number (e.g., 3) | When to show demographics form |
| Auto-advance Scenarios | ☑️ or ☐ | **Auto-move to next scenario** |
| Auto-close on Complete | ☑️ or ☐ | **Close browser after last scenario** |
| Allow Out of Class | ☑️ or ☐ | Allow off-schedule submissions |
| Timezone | Text (e.g., Asia/Singapore) | For scheduling |

### Important Settings for Multiple Scenarios:
- **Auto-advance Scenarios (Row 7, Column B)**: Check this box to automatically advance
- **Auto-close on Complete (Row 8, Column B)**: Check this box to auto-end session

## 3. Add Multiple Scenarios

In the **Scenarios** sheet, add your scenarios with this format:

| Column | Field | Example |
|--------|-------|---------|
| A | ScenarioID | S001 |
| B | ScenarioText | ## Emergency Response\n\nYou arrive at an accident... |
| C | ImageURL | https://example.com/image.jpg (optional) |
| D | Option1 | Call emergency services |
| E | Score1 | 10 |
| F | Option2 | Help injured people |
| G | Score2 | 5 |
| H | Option3 | Direct traffic |
| I | Score3 | 3 |
| J | Option4 | Document the scene |
| K | Score4 | 1 |

**Add more scenarios by adding more rows!**

## Troubleshooting

### Scenarios Not Advancing?

1. **Check Console Output**: Press F12 in browser, look for messages like:
   - "Loaded 2 scenarios"
   - "Auto-advance enabled? true"
   - "Advancing to scenario index: 1"

2. **Verify Setup Sheet Config**:
   ```javascript
   // Run in Apps Script console
   testScenarioSystem()
   ```
   This will show current configuration and loaded scenarios.

3. **Check the Setup Sheet**:
   - Open your Google Sheet
   - Go to the "Setup" tab
   - Verify Row 7, Column B has a checkmark (Auto-advance Scenarios)
   - Verify Row 8, Column B has a checkmark (Auto-close on Complete)

4. **Verify Scenarios Are Loading**:
   - Check that your Scenarios sheet has multiple rows
   - Each scenario needs at least one option
   - ScenarioID and ScenarioText are required

### Manual Configuration Override

If the Setup sheet isn't working, you can manually set properties:

```javascript
// Run these in Apps Script console to force settings
PropertiesService.getScriptProperties().setProperty('AUTO_ADVANCE_SCENARIOS', 'true');
PropertiesService.getScriptProperties().setProperty('AUTO_CLOSE_ON_COMPLETE', 'true');
```

## How It Works

1. **Page Load**: System loads all scenarios from the Scenarios sheet
2. **First Scenario**: Displays with progress indicator (e.g., "Scenario 1 of 3")
3. **User Selects Option**: Clicks one of the multiple choice options
4. **Submit Response**: User clicks "Submit Response"
5. **Auto-Advance**: After 2 seconds, automatically loads next scenario
6. **Final Scenario**: After last submission, shows completion message
7. **Auto-Close**: Window closes after 5 seconds (if enabled)

## Testing Your Setup

1. Add 2-3 test scenarios to your Scenarios sheet
2. Run `testScenarioSystem()` to verify they load
3. Open the web app and login
4. You should see "Scenario 1 of X" at the top
5. Select an option and submit
6. Watch for automatic transition to next scenario
7. After final scenario, session should end automatically

## Configuration Not Working?

The system reads configuration in this order:
1. First tries the Setup sheet (Column B values)
2. Falls back to Script Properties if sheet read fails
3. Uses hardcoded defaults as last resort

To force refresh configuration:
1. Make changes in Setup sheet
2. Reload the web page (Ctrl+R or Cmd+R)
3. Configuration is loaded fresh on each page load