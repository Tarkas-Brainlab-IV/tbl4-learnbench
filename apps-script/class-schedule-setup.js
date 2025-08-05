// Your specific class schedule configuration
// Run this in the Apps Script editor after deployment

function setupYourClassSchedule() {
  // Note: The schedule now uses base cohort letters (A,B,C,D)
  // The system automatically generates monthly IDs like "2024-11-A"
  
  const schedule = [
    // Cohort A - Weekend mornings
    { day: 'Saturday', startTime: '09:00', endTime: '12:00', cohort: 'A' },
    { day: 'Sunday', startTime: '09:00', endTime: '12:00', cohort: 'A' },
    
    // Cohort B - Weekend afternoons
    { day: 'Saturday', startTime: '13:00', endTime: '16:00', cohort: 'B' },
    { day: 'Sunday', startTime: '13:00', endTime: '16:00', cohort: 'B' },
    
    // Cohort C - Monday/Wednesday evenings
    { day: 'Monday', startTime: '19:00', endTime: '22:00', cohort: 'C' },
    { day: 'Wednesday', startTime: '19:00', endTime: '22:00', cohort: 'C' },
    
    // Cohort D - Tuesday/Thursday evenings
    { day: 'Tuesday', startTime: '19:00', endTime: '22:00', cohort: 'D' },
    { day: 'Thursday', startTime: '19:00', endTime: '22:00', cohort: 'D' }
  ];
  
  // Set the schedule
  PropertiesService.getScriptProperties().setProperty('CLASS_SCHEDULE', JSON.stringify(schedule));
  PropertiesService.getScriptProperties().setProperty('TIMEZONE', 'Asia/Singapore');
  PropertiesService.getScriptProperties().setProperty('ALLOW_OUT_OF_CLASS', 'false'); // Start with strict mode
  
  console.log('Class schedule configured successfully!');
  console.log('');
  console.log('Base cohorts:');
  console.log('  A: Sat/Sun 9:00-12:00');
  console.log('  B: Sat/Sun 13:00-16:00');
  console.log('  C: Mon/Wed 19:00-22:00');
  console.log('  D: Tue/Thu 19:00-22:00');
  console.log('');
  console.log('Monthly cohort IDs will be generated automatically:');
  console.log('  November 2024: 2024-11-A-SS, 2024-11-B-SS, 2024-11-C-MW, 2024-11-D-TT');
  console.log('  December 2024: 2024-12-A-SS, 2024-12-B-SS, 2024-12-C-MW, 2024-12-D-TT');
  console.log('');
  console.log('ID Format: YYYY-MM-[Cohort]-[Days]');
  console.log('  SS = Saturday/Sunday');
  console.log('  MW = Monday/Wednesday');
  console.log('  TT = Tuesday/Thursday');
  console.log('');
  console.log('Out-of-class submissions: BLOCKED');
  
  return 'Schedule configured successfully!';
}

// View current month's cohorts
function viewCurrentCohorts() {
  const now = new Date();
  const cohorts = ['A', 'B', 'C', 'D'];
  
  console.log(`Current month cohorts (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}):`);
  cohorts.forEach(c => {
    console.log(`  ${generateMonthlyCohortId(c)}`);
  });
  
  // Show next month too
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  console.log(`\nNext month cohorts (${nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}):`);
  cohorts.forEach(c => {
    console.log(`  ${generateMonthlyCohortId(c, nextMonth)}`);
  });
}

// Demonstrate month boundary handling
function testMonthBoundary() {
  console.log('Testing month boundary cohort assignment:');
  console.log('==========================================');
  
  // Test dates around month boundaries
  const testDates = [
    new Date('2024-11-25'), // Monday, Nov 25 (early in last week)
    new Date('2024-11-26'), // Tuesday, Nov 26 (D cohort starts)
    new Date('2024-11-29'), // Friday, Nov 29 (no cohort)
    new Date('2024-11-30'), // Saturday, Nov 30 (A/B cohorts start - should be December!)
    new Date('2024-12-01'), // Sunday, Dec 1
    new Date('2024-12-02'), // Monday, Dec 2 (C cohort starts)
  ];
  
  testDates.forEach(date => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    console.log(`\n${dayName} ${dateStr}:`);
    
    // Test each cohort
    if (date.getDay() === 0 || date.getDay() === 6) {
      console.log(`  Cohort A: ${generateMonthlyCohortId('A', date)}`);
      console.log(`  Cohort B: ${generateMonthlyCohortId('B', date)}`);
    } else if (date.getDay() === 1 || date.getDay() === 3) {
      console.log(`  Cohort C: ${generateMonthlyCohortId('C', date)}`);
    } else if (date.getDay() === 2 || date.getDay() === 4) {
      console.log(`  Cohort D: ${generateMonthlyCohortId('D', date)}`);
    } else {
      console.log(`  No cohorts scheduled`);
    }
  });
  
  console.log('\n==========================================');
  console.log('Notice: Saturday Nov 30 cohorts → December cohorts!');
}