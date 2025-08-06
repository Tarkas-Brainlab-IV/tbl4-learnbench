// Check if participant needs to complete demographics
function checkNeedsDemographics(participantId) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const participantCol = headers.indexOf('Participant ID');
    
    // Count submissions by this participant
    let submissionCount = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][participantCol] === participantId) {
        submissionCount++;
      }
    }
    
    // Check demographics status
    const demographicsStatus = checkDemographicsStatus(participantId);
    
    return {
      needsDemographics: submissionCount === 1 && !demographicsStatus.hasProvidedDemographics,
      submissionCount: submissionCount,
      demographicsStatus: demographicsStatus
    };
    
  } catch (error) {
    console.error('Error checking demographics need:', error);
    return {
      needsDemographics: false,
      submissionCount: 0,
      demographicsStatus: { hasProvidedDemographics: false }
    };
  }
}

// Modified processPrompt to include demographics check
function processPromptWithDemographicsCheck(data) {
  // First process the prompt normally
  const result = processPrompt(data);
  
  // Then check if demographics needed (after first submission)
  if (result.success) {
    const demographicsCheck = checkNeedsDemographics(data.participantId);
    result.needsDemographics = demographicsCheck.needsDemographics;
  }
  
  return result;
}