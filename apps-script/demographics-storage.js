// Demographics collection and storage functions

// Save demographics data to separate sheet
function saveDemographics(data) {
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
    
    // Append to sheet
    sheet.appendRow(row);
    
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
    
    sheet.appendRow(row);
    
    console.log('Consent recorded for participant:', participantId);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error recording consent:', error);
    throw error;
  }
}

// Get or create demographics sheet
function getOrCreateDemographicsSheet() {
  const SHEET_NAME = 'Demographics';
  
  // Get the main spreadsheet
  const spreadsheet = getOrCreateSpreadsheet();
  
  // Check if demographics sheet exists
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    // Create new sheet
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    
    // Set up headers
    const headers = [
      'Timestamp',
      'Participant ID',
      'Age Group',
      'Gender', 
      'Education',
      'Discipline',
      'English Proficiency',
      'Coding Experience',
      'AI Usage',
      'Military Experience',
      'Demographics Provided',
      'Consent Given'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#f0f0f0')
      .setFontWeight('bold');
    
    // Set column widths
    sheet.setColumnWidth(1, 150); // Timestamp
    sheet.setColumnWidth(2, 100); // Participant ID
    
    // Protect the sheet (only owner can edit)
    const protection = sheet.protect().setDescription('Demographics data - restricted access');
    protection.removeEditors(protection.getEditors());
    if (Session.getActiveUser()) {
      protection.addEditor(Session.getActiveUser());
    }
    
    console.log('Created demographics sheet with headers');
  }
  
  return sheet;
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