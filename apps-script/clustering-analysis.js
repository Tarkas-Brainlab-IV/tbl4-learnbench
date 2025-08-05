// Clustering analysis functions for detecting in-class vs out-of-class submissions

// Analyze submission patterns for a cohort
function analyzeSubmissionClustering(cohortId, dateRange) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Get column indices
  const timestampCol = headers.indexOf('Timestamp');
  const participantCol = headers.indexOf('Participant ID');
  const cohortCol = headers.indexOf('Cohort ID');
  
  // Filter by cohort and date range
  const cohortSubmissions = data.slice(1)
    .filter(row => row[cohortCol] === cohortId)
    .map(row => ({
      timestamp: new Date(row[timestampCol]),
      participant: row[participantCol]
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  
  // Group by session (gaps > 4 hours indicate new session)
  const sessions = [];
  let currentSession = [];
  
  cohortSubmissions.forEach((submission, i) => {
    if (currentSession.length === 0) {
      currentSession.push(submission);
    } else {
      const timeDiff = (submission.timestamp - currentSession[currentSession.length - 1].timestamp) / (1000 * 60 * 60);
      if (timeDiff > 4) {
        // New session
        sessions.push(currentSession);
        currentSession = [submission];
      } else {
        currentSession.push(submission);
      }
    }
  });
  
  if (currentSession.length > 0) {
    sessions.push(currentSession);
  }
  
  // Analyze each session
  const sessionAnalysis = sessions.map(session => {
    const timestamps = session.map(s => s.timestamp.getTime());
    const uniqueParticipants = new Set(session.map(s => s.participant)).size;
    
    // Calculate clustering metrics
    const sessionStart = new Date(Math.min(...timestamps));
    const sessionEnd = new Date(Math.max(...timestamps));
    const duration = (sessionEnd - sessionStart) / (1000 * 60); // minutes
    const submissionRate = session.length / (duration || 1);
    
    // Calculate time gaps between submissions
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push((timestamps[i] - timestamps[i-1]) / (1000 * 60)); // minutes
    }
    
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    
    // Clustering score (higher = more clustered)
    const clusteringScore = calculateClusteringScore(session, duration, uniqueParticipants);
    
    return {
      date: sessionStart.toDateString(),
      startTime: sessionStart.toTimeString().substr(0, 5),
      endTime: sessionEnd.toTimeString().substr(0, 5),
      duration: Math.round(duration),
      submissions: session.length,
      participants: uniqueParticipants,
      avgGapMinutes: Math.round(avgGap),
      maxGapMinutes: Math.round(maxGap),
      submissionRate: submissionRate.toFixed(2),
      clusteringScore: clusteringScore,
      likelyInClass: clusteringScore > 0.7
    };
  });
  
  return sessionAnalysis;
}

// Calculate clustering score (0-1, higher = more clustered)
function calculateClusteringScore(session, duration, participants) {
  // Factors that indicate in-class clustering:
  // 1. High participation rate (many students)
  // 2. Concentrated time window (< 3 hours)
  // 3. Regular submission pattern
  // 4. Multiple submissions per participant
  
  const participationScore = Math.min(participants / 10, 1); // Normalize to expected class size
  const durationScore = duration < 180 ? 1 : Math.max(0, 1 - (duration - 180) / 180);
  const densityScore = Math.min(session.length / (participants * 3), 1); // Expect ~3 prompts per student
  
  // Check for regular intervals (in-class tends to have waves of submissions)
  const timestamps = session.map(s => s.timestamp.getTime());
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i-1]);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const intervalVariance = intervals.reduce((sum, interval) => 
    sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const regularityScore = 1 / (1 + intervalVariance / (avgInterval * avgInterval));
  
  // Weighted average
  return (
    participationScore * 0.4 +
    durationScore * 0.3 +
    densityScore * 0.2 +
    regularityScore * 0.1
  );
}

// Real-time classification for current submission
function classifySubmission(participantId, cohortId) {
  const now = new Date();
  const recentWindow = 30; // minutes
  
  // Get recent submissions from same cohort
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const recentSubmissions = data.slice(1)
    .filter(row => {
      const timestamp = new Date(row[headers.indexOf('Timestamp')]);
      const timeDiff = (now - timestamp) / (1000 * 60);
      return row[headers.indexOf('Cohort ID')] === cohortId && 
             timeDiff >= 0 && timeDiff <= recentWindow;
    });
  
  const uniqueParticipants = new Set(recentSubmissions.map(row => 
    row[headers.indexOf('Participant ID')]
  )).size;
  
  // Classification rules
  if (uniqueParticipants >= 5) {
    return {
      classification: 'LIKELY_IN_CLASS',
      confidence: Math.min(uniqueParticipants / 10, 1),
      reason: `${uniqueParticipants} active participants in last ${recentWindow} minutes`
    };
  } else if (uniqueParticipants >= 2) {
    return {
      classification: 'POSSIBLY_IN_CLASS',
      confidence: 0.5,
      reason: `${uniqueParticipants} active participants in last ${recentWindow} minutes`
    };
  } else {
    return {
      classification: 'LIKELY_OUT_OF_CLASS',
      confidence: 0.8,
      reason: 'Low concurrent activity'
    };
  }
}

// Weekly report function
function generateClusteringReport() {
  const cohorts = ['A', 'B', 'C', 'D'];
  const report = {};
  
  cohorts.forEach(cohort => {
    const analysis = analyzeSubmissionClustering(cohort, 7); // Last 7 days
    report[cohort] = {
      totalSessions: analysis.length,
      likelyClassSessions: analysis.filter(s => s.likelyInClass).length,
      sessions: analysis
    };
  });
  
  console.log('Clustering Analysis Report:', JSON.stringify(report, null, 2));
  return report;
}