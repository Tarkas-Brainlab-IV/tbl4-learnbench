// This file contains the production Gemini API implementation
// Copy this function to replace the mock callGeminiAPI in Code.gs

// Call Gemini API - PRODUCTION VERSION
function callGeminiAPI(prompt) {
  const startTime = Date.now();
  
  // Get API key from script properties
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not found in script properties. Please add it in Project Settings → Script Properties');
  }
  
  // Use Gemini 1.5 Flash for faster responses
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY;
  
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
    console.log('Calling Gemini API with prompt:', prompt.substring(0, 100) + '...');
    
    const response = UrlFetchApp.fetch(API_URL, options);
    const responseText = response.getContentText();
    const json = JSON.parse(responseText);
    
    if (response.getResponseCode() !== 200) {
      console.error('Gemini API error response:', json);
      throw new Error(json.error?.message || 'API request failed');
    }
    
    // Extract the response text
    const output = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    
    // Get token count if available
    const promptTokens = json.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = json.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = json.usageMetadata?.totalTokenCount || (promptTokens + candidatesTokens);
    
    console.log('Gemini API success. Tokens used:', totalTokens);
    
    return {
      output: output,
      model: 'gemini-1.5-flash',
      tokens: totalTokens,
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('Error details:', error.toString());
    
    // Return a user-friendly error message
    return {
      output: `I encountered an error: ${error.toString()}. Please check the API key and try again.`,
      model: 'error',
      tokens: 0,
      processingTime: Date.now() - startTime
    };
  }
}