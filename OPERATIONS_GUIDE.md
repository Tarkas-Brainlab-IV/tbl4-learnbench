# LearnBench Operations Guide

## How Participant Management Works

### Overview
LearnBench uses a simple participant ID system. You assign IDs to participants, and they enter them when using the platform. All data is tracked by these IDs in your Google Sheet.

## Participant ID Strategies

### 1. Anonymous Numeric IDs
```
P001, P002, P003...
```
- Simple and anonymous
- Easy to track sequentially
- No personal information exposed

### 2. Cohort-Based IDs
```
A001, A002... (Cohort A)
B001, B002... (Cohort B)
C001, C002... (Cohort C)
```
- Built-in cohort grouping
- Easy to analyze by group

### 3. Session-Based IDs
```
2024S1-001 (Spring 2024, Student 001)
2024F1-001 (Fall 2024, Student 001)
```
- Includes temporal information
- Useful for longitudinal studies

### 4. Self-Generated IDs
Let participants create their own anonymous ID using a formula:
```
"First 3 letters of birth month + last 2 digits of phone number"
Example: JAN47, MAR92, DEC15
```
- No need to track assignments
- Participants can remember their ID
- Still relatively anonymous

## Operational Workflow

### Before the Session

1. **Decide on ID scheme** (see options above)

2. **Create participant roster** (optional):
   ```
   Spreadsheet with:
   - Assigned ID
   - Real Name (kept separate)
   - Email (for sending instructions)
   - Cohort
   ```

3. **Prepare instructions** to share:
   ```
   Welcome to LearnBench!
   
   Your participant ID: [ID]
   URL: [your-deployment-url]
   
   Please keep your ID for future sessions.
   ```

### During the Session

1. **Share the URL** and IDs with participants
2. **Monitor the Google Sheet** in real-time:
   - Open your data sheet
   - Watch responses come in live
   - Check for any errors

3. **Troubleshooting common issues**:
   - "I forgot my ID" → Check your roster
   - "Nothing happens when I submit" → Try incognito mode
   - "Error message" → Check if API is overloaded

### After the Session

1. **Export data** from Google Sheets:
   - File → Download → CSV/Excel
   - Use pivot tables for analysis

2. **Analyze by cohort**:
   ```
   Filter by Cohort ID column
   Compare prompt strategies
   Measure response quality
   ```

## Data Management

### Your Google Sheet Structure
The system automatically creates these columns:
- **Timestamp**: When submitted
- **Participant ID**: User-entered ID
- **Cohort ID**: Selected cohort (A, B, or C)
- **Prompt**: What they typed
- **AI Response**: What the AI returned
- **Model**: Which AI model responded
- **Token Count**: Length of interaction
- **Processing Time**: Response speed

### Privacy Considerations

1. **No Personal Data**: The system doesn't collect names, emails, or IP addresses
2. **ID Mapping**: Keep any ID-to-name mapping in a separate, secure document
3. **Data Retention**: Delete the Google Sheet when no longer needed

### Advanced Features

#### Custom Cohorts
Edit `index.html` to add more cohorts:
```html
<option value="morning">Morning Session</option>
<option value="afternoon">Afternoon Session</option>
<option value="online">Online Participants</option>
```

#### Bulk ID Generation
Use this spreadsheet formula to generate IDs:
```
="P"&TEXT(ROW(),"000")
```
Generates: P001, P002, P003...

#### Session Tracking
Add a hidden session field to track multiple uses:
- Week 1, Week 2, etc.
- Pre-test, Post-test
- Practice, Assessment

## Best Practices

1. **Test First**: Always test with your own ID before sharing
2. **Have Backup IDs**: In case someone forgets theirs
3. **Monitor Live**: Keep the sheet open during sessions
4. **Clear Instructions**: Explain exactly what participants should do
5. **Incognito Mode**: Recommend this to avoid login conflicts

## Quick Reference Card for Participants

```
LearnBench Quick Start
=====================
1. Go to: [URL]
2. Enter your ID: [Their ID]
3. Select your group: [Cohort]
4. Type your prompt
5. Click Submit
6. Read AI response
7. Try different prompts!

Having issues? Try:
- Incognito/Private window
- Different browser
- Refresh and try again
```

## Analyzing Results

### Basic Metrics
- Prompt count per participant
- Average prompt length
- Response time patterns
- Model usage (which AI responded)

### Quality Indicators
- Prompt complexity
- Iteration patterns (do they refine prompts?)
- Success rate (non-error responses)

### Export for Analysis
1. Download as CSV
2. Import to Excel/R/Python
3. Group by participant/cohort
4. Calculate metrics
5. Generate reports

This operational model gives you full control while keeping the participant experience simple and friction-free.