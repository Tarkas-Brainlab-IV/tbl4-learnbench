#!/bin/bash

# Deploy v2.0 files to Google Apps Script using clasp

echo "🚀 Deploying PromptLab v2.0 Architecture..."

# Check if clasp is logged in
if ! clasp login --status > /dev/null 2>&1; then
    echo "❌ Not logged in to clasp. Running 'clasp login'..."
    clasp login
fi

# Check if we're in a clasp project
if [ ! -f ".clasp.json" ]; then
    echo "❌ No .clasp.json found. Initialize with existing project?"
    echo "Enter your Script ID (from Apps Script URL):"
    read SCRIPT_ID
    clasp clone $SCRIPT_ID
fi

echo "📦 Pushing new files to Google Apps Script..."

# Push all files
clasp push

if [ $? -eq 0 ]; then
    echo "✅ Files pushed successfully!"
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Open your Apps Script project:"
    clasp open
    
    echo ""
    echo "2. In the Apps Script editor, run this test:"
    echo "   function testV2() {"
    echo "     const health = healthCheck();"
    echo "     console.log('System health:', health);"
    echo "     return health;"
    echo "   }"
    
    echo ""
    echo "3. Deploy the new version:"
    echo "   Deploy → Manage deployments → Edit → New version"
    
else
    echo "❌ Push failed. Try manual deployment."
fi