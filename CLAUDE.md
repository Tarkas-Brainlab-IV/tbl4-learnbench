# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NERV LearnBench is a web-based human-AI collaboration experiment platform that uses Google Apps Script and the Gemini API for conducting prompting experiments. Data is stored in Google Sheets and the application runs as a Google Apps Script Web App.

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
npm test               # Run all tests locally
npm run test:gas       # Run tests in Google Apps Script environment

# Quick setup (alternative for manual deployment)
node scripts/quick-setup.js  # Copies files to clipboard
```

## Architecture & Key Patterns

### Core Architecture
The application follows a modular architecture with:
- **Entry Point**: `/apps-script/Code.js` contains the main application logic and web app handlers
- **UI Layer**: HTML files with embedded JavaScript, using CodeMirror for syntax highlighting
- **Data Layer**: Google Sheets operations through `sheet-manager.js`
- **Caching Layer**: Multi-level caching system in `cache-manager.js` (Script, User, Document caches)
- **Configuration**: Stored in Google Sheets "Setup" tab, cached for performance

### Critical Development Patterns

**Cache Management**:
- Google Apps Script caches persist across deployments (up to 2 hours)
- When debugging issues, ALWAYS clear caches first: `CacheService.getScriptCache().removeAll()`
- Cache corruption can cause mysterious failures - check `DEBUGGING-CRITICAL-NOTES.md`

**Performance Optimizations**:
- Batch sheet operations (5x faster for writes)
- Smart sheet reading (last 50 rows only, 100x faster)
- Config caching reduces reads by 95%
- Memory caching for conversation context

**Error Handling**:
- All functions should wrap errors with structured error objects
- Recovery mechanisms for cache failures
- Comprehensive logging for debugging

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

- **Main Logic**: `/apps-script/Code.js` - Application entry point
- **Caching**: `/apps-script/cache-manager.js` - Critical for performance
- **Sheets**: `/apps-script/sheet-manager.js` - All Google Sheets operations
- **Testing**: `/apps-script/test-framework.js` and `tests*.js` files
- **Config**: `/apps-script/appsscript.json` - GAS project configuration
- **Debugging**: `DEBUGGING-CRITICAL-NOTES.md` - Critical troubleshooting guide

## Common Development Tasks

When modifying experiment logic:
1. Check `Code.js` for the main flow
2. Update tests in `tests.js` or `tests-integration.js`
3. Run `npm test` locally first
4. Push with `npm run push` and test in GAS environment
5. Clear caches if seeing unexpected behavior

When debugging issues:
1. First clear all caches (see `DEBUGGING-CRITICAL-NOTES.md`)
2. Check logs with `npm run logs`
3. Use the health check endpoint: `?action=healthCheck`
4. Review performance metrics in logs

## Important Constraints

- Google Apps Script has a 6-minute execution time limit
- Cache size limits: Script (100KB/key), User (10KB/key), Document (50KB/key)
- Sheets API has quotas - use batch operations
- Always validate user input (NRIC, email formats)
- Never store sensitive data (API keys) in code