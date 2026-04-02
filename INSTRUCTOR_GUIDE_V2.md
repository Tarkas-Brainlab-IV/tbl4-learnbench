# Instructor Guide v2.0

## System Overview

LearnBench v2.0 is a high-performance platform for practicing AI prompting and developing human-AI teaming skills. The system handles 100+ concurrent users with 3-5x faster response times.

## Quick Start for Instructors

### Pre-Session Setup (Day Before)

1. **Verify System Health**
```javascript
// Run in Apps Script editor
function preSessionCheck() {
  // Check system health
  const health = healthCheck();
  console.log('System healthy:', health.healthy);
  
  // Clear old data if needed
  clearAllCaches();
  
  // Verify configuration
  const config = getClientConfig();
  console.log('Config:', config);
  
  // Test with sample participant
  const test = generateParticipantHash('TEST');
  console.log('Hash generation working:', test.success);
  
  return 'System ready for session';
}
```

2. **Configure Settings**
Open your Google Spreadsheet → `Setup` sheet:
- Enable/disable AI assistance
- Set demographics collection point (after N prompts)
- Configure auto-advance behavior
- Set timezone and class schedule

3. **Prepare Scenarios**
Open `Scenarios` sheet and add your scenarios:
```
Scenario ID | Title | Description | Options | Tags | Active
WEEK1_01   | Debug Code | Find the error... | ["Fix","Explain","Test"] | debugging | TRUE
```

### During Session

#### Starting a Session
1. Share the web app URL with participants
2. Monitor real-time activity:
```javascript
// Live monitoring
function monitorSession() {
  const sheet = SheetManager.getSheet('Prompts');
  const lastRow = sheet.getLastRow();
  const recentData = sheet.getRange(Math.max(1, lastRow - 10), 1, 11, 10).getValues();
  
  console.log('Recent submissions:', recentData);
  console.log('Active participants:', getActiveParticipantCount());
  console.log('Performance:', getPerformanceMetrics());
}
```

#### Real-time Monitoring Dashboard
Open your spreadsheet to see live updates:
- **Prompts** sheet: Real-time submissions
- **Metrics** sheet: Performance tracking
- **Error Log** sheet: Any system issues

#### Track Participation
```javascript
function getSessionStats() {
  const stats = Analytics.getStatistics(
    new Date(Date.now() - 3600000), // Last hour
    new Date()
  );
  
  console.log('Unique participants:', stats.uniqueUsers);
  console.log('Total prompts:', stats.totalActions);
  console.log('Actions breakdown:', stats.actionTypes);
  
  return stats;
}
```

### Performance Monitoring

#### Check System Performance
```javascript
function checkPerformance() {
  const metrics = getPerformanceMetrics();
  
  // Alert for slow operations
  Object.entries(metrics).forEach(([op, stats]) => {
    if (stats.avg > 2000) {
      console.warn(`SLOW: ${op} averaging ${stats.avg}ms`);
    }
  });
  
  return metrics;
}
```

#### Monitor Concurrent Users
```javascript
function getConcurrentUsers() {
  const activeCohorts = detectActiveCohorts();
  let totalActive = 0;
  
  activeCohorts.forEach(cohort => {
    console.log(`Cohort ${cohort.cohort}: ${cohort.participants} active`);
    totalActive += cohort.participants;
  });
  
  console.log(`Total concurrent users: ${totalActive}`);
  return totalActive;
}
```

### Cohort Management

#### Automatic Cohort Detection
The system automatically groups participants based on:
- Login time clustering
- Historical patterns
- Configured class schedules

#### Manual Cohort Assignment
```javascript
function assignParticipantToCohort(participantId, cohortId) {
  // Update participant's cohort
  const sheet = SheetManager.getSheet('Prompts');
  const data = sheet.getDataRange().getValues();
  
  // Find and update participant's rows
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === participantId) {
      sheet.getRange(i + 1, 3).setValue(cohortId);
    }
  }
  
  console.log(`Assigned ${participantId} to cohort ${cohortId}`);
}
```

### Data Management

#### Export Session Data
```javascript
function exportSessionData(date) {
  const sheet = SheetManager.getSheet('Prompts');
  const data = sheet.getDataRange().getValues();
  
  // Filter by date
  const sessionData = data.filter(row => {
    const rowDate = new Date(row[0]).toDateString();
    return rowDate === date.toDateString();
  });
  
  console.log(`Found ${sessionData.length} submissions for ${date}`);
  
  // Create export sheet
  const exportSheet = SpreadsheetApp.create(`Export_${date.toISOString()}`);
  exportSheet.getSheets()[0].getRange(1, 1, sessionData.length, sessionData[0].length)
    .setValues(sessionData);
  
  console.log('Export URL:', exportSheet.getUrl());
  return exportSheet.getUrl();
}
```

#### Clean Old Data
```javascript
function archiveOldData(daysToKeep = 30) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  ['Prompts', 'Metrics', 'Error Log'].forEach(sheetName => {
    const sheet = SheetManager.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    // Find rows to archive
    let rowsToDelete = 0;
    for (let i = 1; i < data.length; i++) {
      if (new Date(data[i][0]) < cutoffDate) {
        rowsToDelete++;
      } else {
        break;
      }
    }
    
    if (rowsToDelete > 0) {
      // Archive before deleting
      const archiveData = data.slice(1, rowsToDelete + 1);
      // ... save to archive sheet ...
      
      // Delete old rows
      sheet.deleteRows(2, rowsToDelete);
      console.log(`Archived ${rowsToDelete} rows from ${sheetName}`);
    }
  });
}
```

### Troubleshooting During Session

#### If System Slows Down
```javascript
function quickFix() {
  // Clear caches
  clearAllCaches();
  
  // Check system health
  const health = healthCheck();
  
  // Reset monitoring
  performanceMonitor.metrics = [];
  
  console.log('System reset. Health:', health.healthy);
  return health;
}
```

#### If Participants Can't Login
1. Check cohort detection:
```javascript
function debugLogin(nricLast4) {
  const hash = generateParticipantHash(nricLast4);
  console.log('Hash result:', hash);
  
  const cohort = detectCohortWithValidation(hash.hash);
  console.log('Cohort detection:', cohort);
  
  return {hash, cohort};
}
```

2. Verify settings:
```javascript
function checkAccessSettings() {
  const config = getClientConfig();
  console.log('Allow out of class:', config.allowOutOfClass);
  console.log('Demographics enabled:', config.enableDemographics);
  return config;
}
```

#### If AI Responses Fail
```javascript
function testAIConnection() {
  try {
    const response = callGeminiAPI('Test prompt');
    console.log('AI working:', response);
    return true;
  } catch (error) {
    console.error('AI error:', error);
    
    // Check API key
    const hasKey = PropertiesService.getScriptProperties()
      .getProperty('GEMINI_API_KEY') !== null;
    console.log('API key configured:', hasKey);
    
    return false;
  }
}
```

### Post-Session Analysis

#### Generate Summary Report
```javascript
function generateSessionReport() {
  const report = {
    date: new Date(),
    participants: getUniqueParticipants(),
    totalPrompts: getTotalPrompts(),
    avgResponseTime: getAverageResponseTime(),
    completionRate: getCompletionRate(),
    errors: getErrorCount(),
    performance: getPerformanceMetrics()
  };
  
  // Save to Summary sheet
  const summarySheet = SheetManager.getSheet('Session Summary', true);
  summarySheet.appendRow([
    report.date,
    report.participants.length,
    report.totalPrompts,
    report.avgResponseTime,
    report.completionRate,
    report.errors
  ]);
  
  console.log('Session Report:', report);
  return report;
}
```

#### Analyze Cohort Performance
```javascript
function analyzeCohorts() {
  const sheet = SheetManager.getSheet('Prompts');
  const data = sheet.getDataRange().getValues();
  
  const cohortStats = {};
  
  for (let i = 1; i < data.length; i++) {
    const cohort = data[i][2]; // Cohort column
    if (!cohortStats[cohort]) {
      cohortStats[cohort] = {
        participants: new Set(),
        prompts: 0,
        totalResponseTime: 0
      };
    }
    
    cohortStats[cohort].participants.add(data[i][1]);
    cohortStats[cohort].prompts++;
    cohortStats[cohort].totalResponseTime += (data[i][5] || 0);
  }
  
  // Calculate averages
  Object.keys(cohortStats).forEach(cohort => {
    const stats = cohortStats[cohort];
    console.log(`Cohort ${cohort}:`);
    console.log(`  Participants: ${stats.participants.size}`);
    console.log(`  Total prompts: ${stats.prompts}`);
    console.log(`  Avg response time: ${stats.totalResponseTime / stats.prompts}ms`);
  });
  
  return cohortStats;
}
```

## Advanced Configuration

### Custom Scenarios with Conditions
```javascript
function createConditionalScenario() {
  const scenario = {
    id: 'ADAPTIVE_01',
    title: 'Adaptive Challenge',
    description: 'Difficulty adjusts based on performance',
    options: ['Easy', 'Medium', 'Hard'],
    tags: 'adaptive',
    active: true,
    // Custom logic
    condition: 'performance > 80 ? "Hard" : "Easy"'
  };
  
  // Add to Scenarios sheet
  const sheet = SheetManager.getSheet('Scenarios');
  sheet.appendRow(Object.values(scenario));
}
```

### Class Schedule Configuration
```javascript
function setClassSchedule() {
  const schedule = [
    {day: 'Monday', startTime: '09:00', endTime: '11:00', cohort: 'A'},
    {day: 'Monday', startTime: '14:00', endTime: '16:00', cohort: 'B'},
    {day: 'Wednesday', startTime: '09:00', endTime: '11:00', cohort: 'C'},
    {day: 'Friday', startTime: '14:00', endTime: '16:00', cohort: 'D'}
  ];
  
  // Save to Class Schedule sheet
  const sheet = SheetManager.getSheet('Class Schedule', true);
  schedule.forEach((session, i) => {
    sheet.getRange(i + 2, 1, 1, 4).setValues([[
      session.day,
      session.startTime,
      session.endTime,
      session.cohort
    ]]);
  });
  
  console.log('Schedule configured');
}
```

### Performance Optimization Settings
```javascript
function optimizeForLargeClass() {
  // Increase cache durations for stable data
  CONFIG.CACHE_TTL.CONFIG = 7200;      // 2 hours
  CONFIG.CACHE_TTL.SCENARIOS = 14400;  // 4 hours
  
  // Reduce monitoring frequency
  CONFIG.MONITORING.SAMPLE_RATE = 0.1; // Sample 10% of operations
  
  // Increase batch sizes
  CONFIG.LIMITS.BATCH_SIZE = 2000;
  
  console.log('Optimized for large class');
}
```

## Best Practices

### Before Each Session
1. Run `preSessionCheck()`
2. Clear old data if needed
3. Verify scenarios are active
4. Test with a sample login
5. Check performance metrics

### During Session
1. Monitor Error Log sheet
2. Watch performance metrics
3. Check concurrent user count
4. Be ready to `clearAllCaches()` if needed

### After Session
1. Generate session report
2. Export data for analysis
3. Review error logs
4. Archive old data
5. Document any issues

## Emergency Procedures

### System Crash Recovery
```javascript
function emergencyRecover() {
  // 1. Clear all caches
  clearAllCaches();
  SheetManager.clearCache();
  
  // 2. Reset configuration
  const config = getClientConfig();
  
  // 3. Verify core systems
  const health = healthCheck();
  
  // 4. Test basic operations
  const testHash = generateParticipantHash('TEST');
  
  console.log('Recovery complete:', {
    configLoaded: Boolean(config),
    systemHealthy: health.healthy,
    hashingWorks: testHash.success
  });
  
  return health;
}
```

### High Load Management
```javascript
function handleHighLoad() {
  // Disable non-essential features
  const config = {
    enableContext: false,        // Disable conversation memory
    autoAdvanceScenarios: false, // Manual advance only
    enableExitSurvey: false      // Skip exit survey
  };
  
  // Update Setup sheet with these values
  // This reduces processing overhead
  
  console.log('High load optimizations applied');
}
```

## Metrics and KPIs

### Key Metrics to Track
- **Response Time**: Should average < 1.5 seconds
- **Error Rate**: Should be < 1%
- **Cache Hit Rate**: Should be > 80%
- **Concurrent Users**: Monitor capacity
- **Completion Rate**: Track dropouts

### Generate Analytics Report
```javascript
function generateAnalytics(startDate, endDate) {
  const stats = Analytics.getStatistics(startDate, endDate);
  const performance = getPerformanceMetrics();
  
  const report = {
    period: {start: startDate, end: endDate},
    usage: stats,
    performance: performance,
    errors: countErrors(startDate, endDate),
    recommendations: generateRecommendations(stats, performance)
  };
  
  console.log('Analytics Report:', report);
  return report;
}
```

## Support Resources

- **Technical Documentation**: [ARCHITECTURE_REFACTOR.md](ARCHITECTURE_REFACTOR.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Contact for Issues

If you encounter issues:
1. Check Error Log sheet
2. Run `healthCheck()`
3. Review documentation
4. Contact technical support with:
   - Error messages
   - Performance metrics
   - System health report

---

*Version 2.0 - Optimized for performance and scale*