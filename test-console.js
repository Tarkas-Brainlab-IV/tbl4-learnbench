// Run these commands in the browser console to test functionality

// Test 1: Check if marked.js loaded
console.log('Marked.js loaded?', typeof marked !== 'undefined');

// Test 2: Manually parse markdown
if (typeof marked !== 'undefined') {
  const testMd = '# Test\n**Bold** and *italic*\n- List item';
  console.log('Test markdown:', marked.parse(testMd));
}

// Test 3: Check if demographics modal exists
const modal = document.getElementById('demographicsModal');
console.log('Demographics modal found?', modal !== null);

// Test 4: Manually show demographics modal
function testShowModal() {
  const modal = document.getElementById('demographicsModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.classList.add('active');
    console.log('Modal should be visible now');
  } else {
    console.error('Modal not found');
  }
}

// Test 5: Check session data
console.log('Session data:', sessionData);

// Test 6: Check CONFIG
console.log('CONFIG:', typeof CONFIG !== 'undefined' ? CONFIG : 'CONFIG not defined');

// To manually trigger demographics:
// testShowModal()

// To test markdown rendering:
function testMarkdown() {
  const output = document.getElementById('output');
  if (output && typeof marked !== 'undefined') {
    output.innerHTML = marked.parse('# Hello\n**This is bold** and *this is italic*\n\n- Item 1\n- Item 2\n\n`code block`');
    console.log('Markdown test rendered');
  } else {
    console.error('Output element or marked.js not available');
  }
}

console.log('=== Test functions loaded ===');
console.log('Run testShowModal() to show demographics');
console.log('Run testMarkdown() to test markdown rendering');