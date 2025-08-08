# CRITICAL DEBUGGING NOTES - MUST READ

## THE CACHE PROBLEM FROM HELL
**Date: August 8, 2025**

### What Happened
A working Google Apps Script deployment suddenly stopped working without any code changes. Scenarios were loading in the backend but displaying with the wrong data structure in the frontend. The issue persisted even when reverting to previously working deployments.

### Root Cause
**CACHE CORRUPTION** - Google Apps Script's CacheService was serving stale/corrupted data that persisted across deployments for up to 2 hours.

### Critical Lessons Learned

## 1. ALWAYS CLEAR CACHES FIRST
When debugging Google Apps Script issues, **ALWAYS** clear all caches before anything else:
```javascript
// Clear ALL caches - Script, User, and Document
CacheService.getScriptCache().removeAll(['dummy']);
CacheService.getUserCache().removeAll(['dummy']);
CacheService.getDocumentCache().removeAll(['dummy']);
```

## 2. CACHE PERSISTS ACROSS DEPLOYMENTS
- Cache data persists even when you redeploy to different versions
- A deployment that worked before can fail if bad data gets cached
- Cache duration can be up to 2 hours (7200 seconds)
- **YOU CANNOT TRUST CACHED DATA**

## 3. DUPLICATE CODE IS EVIL
Having multiple versions of the same function in different files causes:
- Confusion about which version is actually running
- Inconsistent behavior between cached and non-cached calls
- Hours of debugging hell

Found duplicates in:
- `Code.js` (main implementation)
- `cache-manager.js` (cached version)
- `fix-scenario-loading.js` (override version)
- `scenario-fix.js` (another fix attempt)
- `scenario-debug.js` (debug version)

## 4. GOOGLE APPS SCRIPT GOTCHAS

### File Loading Order
- Files load alphabetically
- Later files can override functions from earlier files
- `fix-scenario-loading.js` loads after `Code.js` and can override functions

### Function Overrides
```javascript
// This silently replaces the original function
getAllScenariosForParticipant = getAllScenariosForParticipantFIXED;
```

### Spreadsheet References
- Using `sheet.getParent()` can get the wrong spreadsheet if you have multiple
- Always use `SpreadsheetApp.openById(SPECIFIC_ID)` for critical data

## 5. DEBUGGING CHECKLIST

When things go wrong:

1. **Clear all caches** (see function above)
2. **Check for duplicate function definitions**
   ```bash
   grep -r "function functionName" .
   ```
3. **Check for function overrides**
   ```bash
   grep -r "functionName =" .
   ```
4. **Verify the correct spreadsheet is being used**
5. **Check console logs in BOTH places:**
   - Apps Script Editor logs (View → Logs)
   - Browser Developer Console
6. **Test with cache bypassed:**
   ```javascript
   // Add cache bypass to critical functions
   const BYPASS_CACHE = true;
   if (BYPASS_CACHE) {
     // Direct implementation
   } else {
     // Cached version
   }
   ```

## 6. SYMPTOMS OF CACHE CORRUPTION

Watch for these signs:
- Data structure changes (e.g., 'title' instead of 'text')
- Old data appearing after code changes
- Inconsistent behavior between users
- Working code suddenly failing without changes
- Different results in test vs production

## 7. PREVENTION STRATEGIES

### Use Cache Versioning
```javascript
const CACHE_VERSION = 'v2'; // Increment when structure changes
const cacheKey = `scenarios_${participantId}_${CACHE_VERSION}`;
```

### Add Cache Bypass Flag
```javascript
function getAllScenariosForParticipant(participantId, bypassCache = false) {
  if (bypassCache || GLOBAL_BYPASS_CACHE) {
    return directImplementation();
  }
  return cachedImplementation();
}
```

### Clear Cache on Structure Changes
```javascript
// Add to your deployment script
function onDeploy() {
  clearAllCaches();
  console.log('Caches cleared on deployment');
}
```

## 8. EMERGENCY FIXES

### When Nothing Else Works
1. Create new spreadsheet (nuclear option)
2. Rename all cached functions to force fresh execution
3. Add timestamp to all cache keys to force refresh
4. Use Script Properties instead of CacheService for critical data

### Quick Cache Clear Function
```javascript
function emergencyCacheClear() {
  // This clears EVERYTHING
  const cache = CacheService.getScriptCache();
  cache.removeAll(['dummy']); // Trick to clear entire cache
  
  // Also clear any participant-specific caches
  for (let i = 0; i < 1000; i++) {
    try {
      cache.remove(`scenarios_${i}`);
      cache.remove(`config_${i}`);
      cache.remove(`history_${i}`);
    } catch (e) {
      // Ignore errors
    }
  }
  
  return 'All caches forcefully cleared';
}
```

## 9. NEVER FORGET

- **Deployments can work one day and fail the next due to cache**
- **The same code can produce different results based on cache state**
- **Clear cache should be your FIRST debugging step, not last**
- **Don't create multiple versions of the same function**
- **Test with cache disabled when debugging**

## 10. THE GOLDEN RULE

**When in doubt, clear the cache and try again.**

---

### Time Wasted on This Issue: 3+ hours
### Could Have Been Solved In: 5 minutes with cache clear

Remember: The cache is not your friend. It's a necessary evil that will bite you when you least expect it.