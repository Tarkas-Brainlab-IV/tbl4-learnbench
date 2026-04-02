# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LearnBench is a web-based platform for practicing AI prompting and developing human-AI teaming skills through structured exercises. Built on Google Apps Script and the Gemini API, with data stored in Google Sheets.

Key features:
- Scenario-based exercises with MCQ (Multiple Choice Questions)
- MCQ randomization using Fisher-Yates shuffle algorithm
- Multimodal prompts (text + images) via Gemini 1.5
- Demographics collection and exit surveys
- Real-time AI responses with CodeMirror editor
- Participant tracking via hashed NRIC identifiers

## Essential Commands

```bash
# Initial setup
npm install
npm run setup          # Login and create GAS project

# Development workflow
npm run push           # Push files to Google Apps Script
npm run deploy         # Deploy web app
npm run watch          # Auto-push on file changes
npm run logs           # View real-time execution logs

# Testing
npm test               # Run all tests locally (simple test runner)
npm run test:local     # Run full test suite locally
npm run test:gas       # Run tests in Google Apps Script environment
npm run test:watch     # Auto-run tests on file changes

# Quick setup (alternative for manual deployment)
node scripts/quick-setup.js  # Copies files to clipboard for manual deployment
```

## Architecture & Key Patterns

### Core Architecture
The application follows a modular architecture with:
- **Entry Point**: `/apps-script/Code.js` contains `doGet()` web app handler and main application logic
- **UI Layer**: HTML files (`index.html`, `demographics-form.html`) with embedded JavaScript, using CodeMirror for syntax highlighting
- **Data Layer**: Google Sheets operations through `sheet-manager.js` with LockService to prevent race conditions
- **Caching Layer**: Multi-level caching system in `cache-manager.js` (Script, User, Document caches with different TTLs)
- **Configuration**: Stored in Google Sheets "Setup" tab, cached for performance (1-hour TTL)
- **Scenarios**: CSV files in `/scenarios/` directory define exercise scenarios with MCQ options
- **Testing**: Custom test framework in `test-framework.js` with separate test files for core, integration, and demographics

### Critical Development Patterns

**Cache Management** (READ `/apps-script/DEBUGGING-CRITICAL-NOTES.md` FOR CRITICAL CACHE GOTCHAS):
- Google Apps Script caches persist across deployments (up to 2 hours)
- **ALWAYS clear caches FIRST when debugging**: `CacheService.getScriptCache().removeAll(['dummy'])`
- Cache corruption causes mysterious failures (e.g., old data structures appearing after deployment)
- Use cache versioning: `const cacheKey = \`scenarios_\${participantId}_v2\`` when data structures change
- Cache durations in `CacheManager.DURATIONS`: CONFIG (1h), SCENARIOS (2h), PARTICIPANT (5m), etc.

**Performance Optimizations**:
- Batch sheet operations (5x faster for writes)
- Smart sheet reading (last 50 rows only, 100x faster)
- Config caching reduces reads by 95%
- Memory caching for conversation context
- MCQ options cached with participant ID to maintain consistent randomization order

**Error Handling**:
- All functions should wrap errors with structured error objects
- Recovery mechanisms for cache failures
- Comprehensive logging for debugging
- Use LockService for sheet creation to prevent race conditions

### Google Apps Script Specifics

**Required OAuth Scopes**:
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/script.storage`
- `https://www.googleapis.com/auth/script.external_request`

**Script Properties Required**:
- `GEMINI_API_KEY`: Store the Gemini API key here (never in code)

**Deployment Settings**:
- Execute as: Me
- Access: Anyone (anonymous)
- Runtime: V8
- Timezone: Asia/Singapore

## Testing Strategy

The codebase uses a custom testing framework (`test-framework.js`):
- Unit tests for individual functions
- Integration tests for end-to-end scenarios
- Performance tests with timing measurements
- Mock responses available for API testing

Run tests locally first (`npm test`), then in GAS environment (`npm run test:gas`) to catch environment-specific issues.

## Key Files Reference

### Core Application Files
- **Main Logic**: `/apps-script/Code.js` - Application entry point with `doGet()` handler, participant hash generation
- **Caching**: `/apps-script/cache-manager.js` - CacheManager with `shuffleArray()`, multi-level caching
- **Sheets**: `/apps-script/sheet-manager.js` - All Google Sheets operations with LockService
- **UI**: `/apps-script/index.html` - Main exercise interface with CodeMirror
- **Demographics**: `/apps-script/demographics-form.html` - Demographics survey page

### Configuration & Data
- **GAS Config**: `/apps-script/appsscript.json` - OAuth scopes and runtime settings
- **Scenarios**: `/scenarios/learnbench_scenarios_rev2_S016_S030.csv` - Exercise scenarios with MCQ
- **Scenario Generator**: `/scenarios/scenarios.py` - Python script to generate scenario CSV

### Testing Files
- **Framework**: `/apps-script/test-framework.js` - Custom testing framework
- **Core Tests**: `/apps-script/tests-core.js` - Core functionality tests
- **Integration Tests**: `/apps-script/tests-integration.js` - End-to-end scenarios
- **Demographics Tests**: `/apps-script/tests-demographics.js` - Demographics flow tests
- **Legacy Tests**: `/apps-script/tests.js` - Original test suite

### Critical Documentation
- **Debugging Guide**: `/apps-script/DEBUGGING-CRITICAL-NOTES.md` - **MUST READ** for cache issues and troubleshooting
- **README**: `/README.md` - Setup instructions and feature overview

## Common Development Tasks

### Modifying Exercise Logic
1. Edit main logic in `Code.js` or relevant module (e.g., `cache-manager.js`, `sheet-manager.js`)
2. Update tests in `tests-core.js`, `tests-integration.js`, or `tests-demographics.js`
3. Run `npm test` locally to catch syntax errors
4. Push with `npm run push`
5. **Clear all caches** via Apps Script console or `emergency-cache-clear.js`
6. Test in GAS environment with `npm run test:gas`
7. Monitor with `npm run logs` for real-time debugging

### Adding/Modifying Scenarios
1. Edit `/scenarios/scenarios.py` to define new scenarios
2. Run the Python script to regenerate CSV (or edit CSV directly)
3. Upload CSV to Google Sheets "Scenarios" tab
4. Clear scenario cache: `CacheService.getScriptCache().remove('scenarios_*')`
5. Test with `?action=testRandomization` to verify MCQ randomization

### Debugging Issues (CRITICAL: Read this when things break)
1. **ALWAYS clear all caches FIRST** (see `/apps-script/DEBUGGING-CRITICAL-NOTES.md`):
   ```javascript
   CacheService.getScriptCache().removeAll(['dummy']);
   CacheService.getUserCache().removeAll(['dummy']);
   ```
2. Check for duplicate function definitions: `grep -r "function functionName" apps-script/`
3. Check for function overrides: `grep -r "functionName =" apps-script/`
4. View logs: `npm run logs` (Apps Script) and browser console (client-side)
5. Use test endpoints: `?action=healthCheck` or `?action=testRandomization`
6. Verify correct spreadsheet ID in Script Properties
7. Check OAuth scopes in `appsscript.json` if getting permission errors

## Important Constraints

### Google Apps Script Limits
- **Execution time**: 6-minute limit for web app requests
- **Cache size**: Script (100KB/key), User (10KB/key), Document (50KB/key)
- **Cache duration**: Up to 21,600 seconds (6 hours), typically use 1-2 hours
- **Sheets API quotas**: Use batch operations (`setValues()` vs multiple `setValue()`)
- **File loading**: Files load alphabetically; later files can override earlier functions

### Security & Validation
- **NRIC hashing**: Participant IDs use SHA-256 hash with salt, 8-character prefix
- **API keys**: Store in Script Properties (`GEMINI_API_KEY`), never in code
- **Input validation**: Always validate NRIC format (4 chars), email formats
- **Deployment**: Execute as "Me", access "Anyone" for anonymous sessions

### MCQ Randomization Specifics
- **Fisher-Yates shuffle**: Implemented in `cache-manager.js` as `shuffleArray()`
- **Consistency**: Randomized order cached per participant to maintain same order across page loads
- **Cache key**: `mcq_order_${participantId}_${scenarioId}` for participant-specific randomization