#!/usr/bin/env node

/**
 * Quick setup script that handles copying files to clipboard sequentially
 * Run multiple times to copy each file
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const files = [
  { name: 'Code.gs', path: 'apps-script/Code.gs' },
  { name: 'index.html', path: 'apps-script/index.html' },
  { name: 'appsscript.json', path: 'apps-script/appsscript.json' }
];

// Track which file was last copied
const stateFile = '.last-copied';
let lastCopiedIndex = -1;

try {
  if (fs.existsSync(stateFile)) {
    lastCopiedIndex = parseInt(fs.readFileSync(stateFile, 'utf8'));
  }
} catch (e) {
  // Ignore errors
}

// Determine next file to copy
const nextIndex = (lastCopiedIndex + 1) % files.length;
const fileToGopy = files[nextIndex];

console.log(`📋 NERV LearnBench - Quick Setup Helper`);
console.log(`======================================`);
console.log();

// Read and copy file content
try {
  const content = fs.readFileSync(fileToGopy.path, 'utf8');
  
  // Copy to clipboard (macOS)
  if (process.platform === 'darwin') {
    execSync('pbcopy', { input: content });
    console.log(`✅ Copied ${fileToGopy.name} to clipboard!`);
  } else {
    console.log(`File: ${fileToGopy.name}`);
    console.log(`-------------------`);
    console.log(content);
  }
  
  // Save state
  fs.writeFileSync(stateFile, nextIndex.toString());
  
  console.log();
  console.log(`📝 Instructions:`);
  console.log(`1. Go to https://script.google.com`);
  console.log(`2. ${nextIndex === 0 ? 'Create a new project' : 'Open your project'}`);
  
  if (fileToGopy.name === 'Code.gs') {
    console.log(`3. Replace the default Code.gs content`);
  } else if (fileToGopy.name === 'index.html') {
    console.log(`3. Click the + next to Files → HTML → Name it "index"`);
  } else if (fileToGopy.name === 'appsscript.json') {
    console.log(`3. Click Project Settings (gear icon) → Show "appsscript.json" manifest file → Check the box`);
    console.log(`4. Go back to Editor → You'll see appsscript.json → Click it`);
  }
  
  console.log(`${fileToGopy.name === 'appsscript.json' ? '5' : '4'}. Paste the clipboard content (Cmd+V)`);
  console.log(`${fileToGopy.name === 'appsscript.json' ? '6' : '5'}. Save (Cmd+S)`);
  console.log();
  
  if (nextIndex < files.length - 1) {
    console.log(`⏭️  Run this script again to copy the next file: ${files[nextIndex + 1].name}`);
  } else {
    console.log(`🎉 All files copied! Now:`);
    console.log(`   - Deploy → New deployment`);
    console.log(`   - Select "Web app"`);
    console.log(`   - Deploy and get your URL`);
    // Reset for next run
    try { fs.unlinkSync(stateFile); } catch (e) {}
  }
  
} catch (error) {
  console.error(`❌ Error reading file: ${error.message}`);
}