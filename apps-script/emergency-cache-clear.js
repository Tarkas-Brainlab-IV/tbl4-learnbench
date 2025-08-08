/**
 * EMERGENCY: Clear ALL caches to fix corrupted data
 */
function emergencyClearAllCaches() {
  console.log('=== EMERGENCY CACHE CLEAR ===');
  
  try {
    // Clear script cache
    const scriptCache = CacheService.getScriptCache();
    scriptCache.removeAll(['dummy']); // This clears the entire cache
    console.log('Cleared script cache');
  } catch (e) {
    console.log('Script cache clear error:', e);
  }
  
  try {
    // Clear user cache
    const userCache = CacheService.getUserCache();
    userCache.removeAll(['dummy']); // This clears the entire cache
    console.log('Cleared user cache');
  } catch (e) {
    console.log('User cache clear error:', e);
  }
  
  try {
    // Clear document cache
    const docCache = CacheService.getDocumentCache();
    docCache.removeAll(['dummy']); // This clears the entire cache
    console.log('Cleared document cache');
  } catch (e) {
    console.log('Document cache clear error:', e);
  }
  
  // Also clear any script properties that might be caching data
  try {
    const props = PropertiesService.getScriptProperties();
    const allProps = props.getProperties();
    const cacheKeys = Object.keys(allProps).filter(key => 
      key.includes('cache') || key.includes('scenario') || key.includes('SCENARIO')
    );
    
    if (cacheKeys.length > 0) {
      props.deleteProperty(cacheKeys);
      console.log('Cleared property-based caches:', cacheKeys);
    }
  } catch (e) {
    console.log('Property cache clear error:', e);
  }
  
  return 'All caches cleared successfully';
}

/**
 * Test scenario loading after cache clear
 */
function testScenarioLoadingAfterCacheClear() {
  // First clear all caches
  emergencyClearAllCaches();
  
  // Now test loading
  console.log('Testing scenario loading after cache clear...');
  const scenarios = getAllScenariosForParticipant('TEST_USER');
  
  console.log('Scenarios loaded:', scenarios.length);
  if (scenarios.length > 0) {
    console.log('First scenario structure:', {
      id: scenarios[0].id,
      hasText: !!scenarios[0].text,
      hasTitle: !!scenarios[0].title,
      textPreview: scenarios[0].text ? scenarios[0].text.substring(0, 50) : 'NO TEXT',
      titlePreview: scenarios[0].title ? scenarios[0].title.substring(0, 50) : 'NO TITLE',
      optionsCount: scenarios[0].options.length,
      firstOption: scenarios[0].options[0]
    });
  }
  
  return scenarios;
}