# LearnBench Security & Research Integrity Guide

## Secure ID Generation Options

### 1. Cryptographic Tokens (Most Secure)
```javascript
// Generate 10 secure tokens
generateAccessTokens(10, 'STUDY1')
// Output: STUDY1-Kx9mN2pQ4vRt
```
- Impossible to guess
- No personal info exposed
- One-time generation

### 2. Hashed Personal IDs
```javascript
// Hash email + name
generateSecureId('student@university.edu', 'John Doe')
// Output: A7F2-9BC4
```
- Consistent (same input = same ID)
- Anonymous but verifiable
- Can't reverse to get personal info

### 3. Time-Based Unique IDs
```javascript
generateTimeBasedId()
// Output: T849231-7623
```
- No personal info needed
- Includes timestamp component
- Random suffix prevents collisions

## Potential Abuse Scenarios & Prevention

### 1. Multiple Submissions
**Threat**: Participant submits many times to skew data
**Prevention**:
- Rate limiting (10 prompts/minute max)
- Session limits (100 prompts/session)
- Minimum 3-second delay between prompts

### 2. Copy-Paste Chains
**Threat**: Participants share/copy prompts
**Prevention**:
- Detect identical prompts across participants
- Flag duplicate chains in data
- Validation report shows patterns

### 3. Bot/Script Attacks
**Threat**: Automated submissions
**Prevention**:
- Rate limiting
- Suspicious pattern detection
- Session validation
- (Optional) Add reCAPTCHA

### 4. Prompt Injection
**Threat**: Trying to manipulate AI or access system
**Prevention**:
- Pattern matching for suspicious prompts
- Auto-flagging of injection attempts
- Still logs but marks as "FLAGGED"

### 5. ID Guessing/Sharing
**Threat**: Unauthorized access with others' IDs
**Prevention**:
- Use cryptographic tokens
- Time-limited sessions
- IP hash tracking (anonymous)
- Anomaly detection

### 6. Data Tampering
**Threat**: Trying to manipulate results
**Prevention**:
- Server-side validation only
- Immutable Google Sheets logging
- Timestamp verification
- Session metadata tracking

## Implementation Examples

### Basic Security Setup
```javascript
// In Code.js, replace processPrompt with:
function processPrompt(data) {
  return processPromptSecure(data);
}
```

### Generate Secure IDs for Study
```javascript
// Run in Apps Script editor:
function setupStudy() {
  // Generate 50 secure participant tokens
  const result = generateAccessTokens(50, 'FALL24');
  console.log('Tokens saved to:', result.sheetUrl);
}
```

### Validate Research Data
```javascript
// Run after data collection:
function auditData() {
  const report = validateResearchData();
  console.log('Audit Report:', report);
  // Shows: duplicate prompts, suspicious patterns, etc.
}
```

## Enhanced Sheet Structure

With security features, your sheet will have:
- Standard columns (timestamp, ID, prompt, etc.)
- **Session ID**: Unique per session
- **IP Hash**: Anonymous identifier
- **Status**: OK or FLAGGED
- **Validation**: Pass/fail reasons

## Privacy-Preserving Features

1. **No Real IPs**: Only anonymous hashes
2. **No Emails**: Unless you explicitly collect
3. **No Browser Fingerprinting**: Respects privacy
4. **Secure Storage**: Google's infrastructure
5. **Access Control**: Only you see the data

## Best Practices for Research Integrity

### Before Launch
1. Generate cryptographic tokens
2. Test rate limits
3. Set up monitoring
4. Plan for anomalies

### During Collection
1. Monitor live for unusual patterns
2. Check flagged entries
3. Watch for rate limit hits
4. Note any technical issues

### After Collection
1. Run validation report
2. Remove obvious spam/tests
3. Check for participant overlap
4. Statistical outlier analysis
5. Document any exclusions

## Quick Implementation

### Option 1: Maximum Security
```javascript
// Use all features
- Cryptographic tokens
- Rate limiting  
- Pattern detection
- Session validation
- Audit trails
```

### Option 2: Balanced Approach
```javascript
// Good security, less friction
- Time-based IDs
- Basic rate limiting
- Duplicate detection
- Simple validation
```

### Option 3: Minimal Security
```javascript
// For trusted environments
- Hash-based IDs
- Basic logging
- Manual review
```

## Red Flags in Data

Watch for:
- Same prompt across many IDs
- Rapid-fire submissions
- Very short prompts
- Injection attempts
- Unusual time patterns
- Geographic impossibilities

## Recovery Procedures

If compromised:
1. Generate new access tokens
2. Filter data by session metadata
3. Use statistical methods to identify outliers
4. Document exclusion criteria
5. Consider time-window analysis

This security approach balances research integrity with participant privacy and usability.