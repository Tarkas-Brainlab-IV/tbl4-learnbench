// Secure ID generation and validation functions

// Generate a hash-based ID from user details
function generateSecureId(email, name) {
  // Create a unique string from user details
  const userData = email.toLowerCase() + '|' + name.toLowerCase();
  
  // Generate SHA-256 hash
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, userData);
  
  // Convert to hex and take first 8 characters
  const hexHash = hash.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  
  // Format as readable ID: XXXX-XXXX
  return hexHash.substr(0, 4).toUpperCase() + '-' + hexHash.substr(4, 4).toUpperCase();
}

// Generate time-based unique ID (no personal info needed)
function generateTimeBasedId() {
  const now = new Date();
  const timestamp = now.getTime();
  
  // Add random component
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  // Create ID: last 6 digits of timestamp + random
  const timeComponent = timestamp.toString().slice(-6);
  
  return `T${timeComponent}-${random}`;
}

// Validate participant session
function validateSession(participantId, sessionData) {
  const validationRules = {
    minPromptLength: 10,           // Minimum characters
    maxPromptsPerMinute: 10,       // Rate limiting
    maxPromptsPerSession: 100,     // Total limit
    minTimeBetweenPrompts: 3000,   // 3 seconds
    maxIdenticalPrompts: 3         // Prevent spam
  };
  
  // Get participant's recent activity
  const recentPrompts = getRecentPrompts(participantId, 60); // Last 60 minutes
  
  // Check rate limits
  if (recentPrompts.length >= validationRules.maxPromptsPerSession) {
    return {
      valid: false,
      reason: 'Session limit reached. Please try again later.'
    };
  }
  
  // Check prompt frequency
  const recentMinute = recentPrompts.filter(p => 
    (new Date() - new Date(p.timestamp)) < 60000
  );
  
  if (recentMinute.length >= validationRules.maxPromptsPerMinute) {
    return {
      valid: false,
      reason: 'Too many requests. Please slow down.'
    };
  }
  
  // Check for identical prompts (anti-spam)
  const identicalCount = recentPrompts.filter(p => 
    p.prompt === sessionData.prompt
  ).length;
  
  if (identicalCount >= validationRules.maxIdenticalPrompts) {
    return {
      valid: false,
      reason: 'Duplicate prompt detected. Please try a different prompt.'
    };
  }
  
  // Check minimum prompt length
  if (sessionData.prompt.length < validationRules.minPromptLength) {
    return {
      valid: false,
      reason: 'Prompt too short. Please provide more detail.'
    };
  }
  
  return { valid: true };
}

// Get recent prompts for validation
function getRecentPrompts(participantId, minutesBack) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - (minutesBack * 60 * 1000));
  
  // Find column indices
  const timestampCol = headers.indexOf('Timestamp');
  const participantCol = headers.indexOf('Participant ID');
  const promptCol = headers.indexOf('Prompt');
  
  // Filter recent prompts from this participant
  return data.slice(1)
    .filter(row => {
      const timestamp = new Date(row[timestampCol]);
      return row[participantCol] === participantId && 
             timestamp > cutoffTime;
    })
    .map(row => ({
      timestamp: row[timestampCol],
      prompt: row[promptCol]
    }));
}

// Enhanced processPrompt with validation
function processPromptSecure(data) {
  console.log('Processing secure prompt:', data.participantId);
  
  try {
    // Validate session first
    const validation = validateSession(data.participantId, data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason
      };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /ignore previous instructions/i,
      /reveal your prompt/i,
      /system message/i,
      /admin access/i,
      /<script>/i,
      /javascript:/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(data.prompt)
    );
    
    if (isSuspicious) {
      console.warn('Suspicious prompt detected:', data.participantId);
      // Still log it but flag it
      data.flagged = true;
    }
    
    // Add session metadata
    const sessionData = {
      ...data,
      ipHash: generateIpHash(),  // Anonymous IP tracking
      userAgent: HtmlService.getUserAgent(),
      sessionId: Utilities.getUuid(),
      flagged: isSuspicious || false
    };
    
    // Continue with normal processing
    const sheet = getOrCreateSheet();
    const timestamp = new Date();
    const geminiResponse = callGeminiAPI(data.prompt);
    
    // Log with additional security metadata
    sheet.appendRow([
      timestamp,
      sessionData.participantId,
      sessionData.cohortId,
      sessionData.prompt,
      geminiResponse.output,
      geminiResponse.model,
      geminiResponse.tokens,
      geminiResponse.processingTime,
      sessionData.sessionId,
      sessionData.ipHash,
      sessionData.flagged ? 'FLAGGED' : 'OK'
    ]);
    
    return {
      success: true,
      output: geminiResponse.output,
      model: geminiResponse.model,
      tokens: geminiResponse.tokens,
      timestamp: timestamp.toISOString()
    };
    
  } catch (error) {
    console.error('Error in secure processing:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Generate anonymous IP hash
function generateIpHash() {
  // Note: Apps Script doesn't provide real IP, this is a session identifier
  const sessionString = Session.getActiveUser().getEmail() || 'anonymous';
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sessionString);
  return Utilities.base64Encode(hash).substr(0, 8);
}

// Batch validation for research integrity
function validateResearchData() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const report = {
    totalPrompts: data.length - 1,
    uniqueParticipants: new Set(),
    suspiciousPatterns: [],
    duplicateChains: [],
    rateLimitViolations: [],
    shortPrompts: 0,
    flaggedPrompts: 0
  };
  
  // Analyze each row
  data.slice(1).forEach((row, index) => {
    const participantId = row[headers.indexOf('Participant ID')];
    const prompt = row[headers.indexOf('Prompt')];
    const timestamp = row[headers.indexOf('Timestamp')];
    const flagged = row[headers.indexOf('Status')] === 'FLAGGED';
    
    report.uniqueParticipants.add(participantId);
    
    if (flagged) report.flaggedPrompts++;
    if (prompt.length < 10) report.shortPrompts++;
    
    // Check for copy-paste chains (multiple participants, same prompt)
    const samePrompt = data.slice(1).filter(r => 
      r[headers.indexOf('Prompt')] === prompt
    );
    
    if (samePrompt.length > 3) {
      report.duplicateChains.push({
        prompt: prompt.substr(0, 50) + '...',
        count: samePrompt.length,
        participants: samePrompt.map(r => r[headers.indexOf('Participant ID')])
      });
    }
  });
  
  report.uniqueParticipants = report.uniqueParticipants.size;
  
  return report;
}

// Generate participant access tokens (more secure than simple IDs)
function generateAccessTokens(count, prefix = 'LB') {
  const tokens = [];
  
  for (let i = 0; i < count; i++) {
    // Generate cryptographically secure random token
    const randomBytes = Utilities.newBlob(Utilities.getUuid()).getBytes();
    const token = Utilities.base64Encode(randomBytes)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substr(0, 12);
    
    tokens.push(`${prefix}-${token}`);
  }
  
  // Save tokens to a secure sheet
  const tokenSheet = SpreadsheetApp.create('LearnBench Access Tokens - ' + new Date().toISOString());
  tokenSheet.getActiveSheet().getRange(1, 1, tokens.length, 1).setValues(tokens.map(t => [t]));
  
  console.log('Access tokens generated. Sheet URL:', tokenSheet.getUrl());
  
  return {
    tokens: tokens,
    sheetUrl: tokenSheet.getUrl()
  };
}