// Demographics collection and storage functions
// NOTE: This file is DEPRECATED - using saveDemographicsMain in Code.js instead

// DEPRECATED - Old demographics saving function (DO NOT USE)
function saveDemographics_OLD(data) {
  try {
    const sheet = getOrCreateDemographicsSheet();
    
    // Add server timestamp
    data.serverTimestamp = new Date();
    
    // Prepare row data
    const row = [
      data.serverTimestamp,
      data.participantId,
      data.age || '',
      data.gender || '',
      data.education || '',
      data.discipline || '',
      data.english || '',
      data.coding || '',
      data.ai_usage || '',
      data.military || '',
      'true', // Demographics provided
      'true'  // Consent given
    ];
    
    // Safely append to sheet
    safeAppendRow(sheet, row);
    
    // Log the collection
    console.log('Demographics saved for participant:', data.participantId);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error saving demographics:', error);
    throw error;
  }
}

// Record consent only (no demographics)
function recordConsent(participantId) {
  try {
    const sheet = getOrCreateDemographicsSheet();
    
    // Minimal row with consent only
    const row = [
      new Date(), // Timestamp
      participantId,
      '', // age
      '', // gender
      '', // education
      '', // discipline
      '', // english
      '', // coding
      '', // ai_usage
      '', // military
      'false', // Demographics provided
      'true'   // Consent given
    ];
    
    safeAppendRow(sheet, row);
    
    console.log('Consent recorded for participant:', participantId);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error recording consent:', error);
    throw error;
  }
}

// Get or create demographics sheet
function getOrCreateDemographicsSheet() {
  // Delegate to the robust sheet manager
  return getDemographicsSheet();
}

// Check if participant has already provided demographics
function checkDemographicsStatus(participantId) {
  try {
    const sheet = getOrCreateDemographicsSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === participantId) {
        return {
          hasProvidedDemographics: true,
          demographicsProvided: data[i][10] === 'true',
          consentGiven: data[i][11] === 'true'
        };
      }
    }
    
    return {
      hasProvidedDemographics: false,
      demographicsProvided: false,
      consentGiven: false
    };
    
  } catch (error) {
    console.error('Error checking demographics status:', error);
    return {
      hasProvidedDemographics: false,
      demographicsProvided: false,
      consentGiven: false
    };
  }
}

// Get the main spreadsheet (reuse from main Code.js)
function getOrCreateSpreadsheet() {
  // Delegate to the main function to avoid duplication
  const sheet = getOrCreateSheet();
  return sheet.getParent();
}

// Generate summary statistics for demographics
function getDemographicsSummary() {
  try {
    const sheet = getOrCreateDemographicsSheet();
    const data = sheet.getDataRange().getValues();
    
    const summary = {
      totalParticipants: data.length - 1, // Exclude header
      withDemographics: 0,
      consentOnly: 0,
      ageDistribution: {},
      genderDistribution: {},
      educationDistribution: {},
      disciplineDistribution: {},
      codingDistribution: {},
      aiUsageDistribution: {},
      militaryDistribution: {}
    };
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Count demographics provided
      if (row[10] === 'true') {
        summary.withDemographics++;
      } else {
        summary.consentOnly++;
      }
      
      // Count distributions (only if value provided)
      if (row[2]) summary.ageDistribution[row[2]] = (summary.ageDistribution[row[2]] || 0) + 1;
      if (row[3]) summary.genderDistribution[row[3]] = (summary.genderDistribution[row[3]] || 0) + 1;
      if (row[4]) summary.educationDistribution[row[4]] = (summary.educationDistribution[row[4]] || 0) + 1;
      if (row[5]) summary.disciplineDistribution[row[5]] = (summary.disciplineDistribution[row[5]] || 0) + 1;
      if (row[7]) summary.codingDistribution[row[7]] = (summary.codingDistribution[row[7]] || 0) + 1;
      if (row[8]) summary.aiUsageDistribution[row[8]] = (summary.aiUsageDistribution[row[8]] || 0) + 1;
      if (row[9]) summary.militaryDistribution[row[9]] = (summary.militaryDistribution[row[9]] || 0) + 1;
    }
    
    return summary;
    
  } catch (error) {
    console.error('Error generating demographics summary:', error);
    throw error;
  }
}