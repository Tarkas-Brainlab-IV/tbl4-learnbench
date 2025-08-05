# Gemini API Setup Guide

## Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

## Step 2: Add API Key to Apps Script

1. In Apps Script editor: **Project Settings** (gear icon)
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Property name: `GEMINI_API_KEY`
5. Value: Your API key
6. Click **Save script properties**

## Step 3: Update Code.gs

Replace the mock `callGeminiAPI` function with the real one:

```javascript
// Call Gemini API - PRODUCTION VERSION
function callGeminiAPI(prompt) {
  const startTime = Date.now();
  
  // Get API key from script properties
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found in script properties');
  }
  
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(API_URL, options);
    const json = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      console.error('Gemini API error:', json);
      throw new Error(json.error?.message || 'API request failed');
    }
    
    const output = json.candidates[0].content.parts[0].text;
    const tokens = json.usageMetadata?.totalTokenCount || 0;
    
    return {
      output: output,
      model: 'gemini-pro',
      tokens: tokens,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to mock if API fails
    return {
      output: 'Error calling Gemini API: ' + error.toString() + '. Using fallback response.',
      model: 'error-fallback',
      tokens: 0,
      processingTime: Date.now() - startTime
    };
  }
}
```

## Step 4: Test

1. Run `testFullProcess()` in Apps Script editor
2. Check the logs for any errors
3. Try in your web app

## Alternative: Use Gemini 1.5 Flash (Faster & Cheaper)

Change the model in the URL:
```javascript
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY;
```

## Free Tier Limits

- **Gemini Pro**: 60 requests per minute
- **Gemini 1.5 Flash**: 15 requests per minute
- Both have generous daily quotas for experiments

## Troubleshooting

**"API key not valid"**:
- Make sure you're using the correct API key
- Check that the key is saved in Script Properties

**"Quota exceeded"**:
- You've hit the rate limit
- Wait a minute and try again
- Consider using exponential backoff

**No response**:
- Check the Execution logs in Apps Script
- Verify the API URL is correct
- Test with a simple prompt first