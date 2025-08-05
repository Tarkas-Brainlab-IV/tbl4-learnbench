#!/bin/bash

# Script to prepare files for manual copying to Google Apps Script
# This avoids authentication issues with clasp

echo "📋 Preparing files for Google Apps Script..."
echo "========================================"
echo ""
echo "Instructions:"
echo "1. Go to https://script.google.com"
echo "2. Create a new project or open existing one"
echo "3. Copy each file content below into the corresponding file"
echo ""
echo "========================================"

# Function to output file content with markers
output_file() {
    local file=$1
    local name=$2
    echo ""
    echo "📄 FILE: $name"
    echo "========================================"
    cat "$file"
    echo ""
    echo "========================================"
    echo ""
}

# Output each file
output_file "apps-script/Code.gs" "Code.gs"
output_file "apps-script/index.html" "index.html"
output_file "apps-script/appsscript.json" "appsscript.json"

echo ""
echo "✅ Files ready to copy!"
echo ""
echo "After copying:"
echo "1. Deploy → New deployment"
echo "2. Select 'Web app' as type"
echo "3. Execute as: Me"
echo "4. Who has access: Anyone (or Anyone with link)"
echo "5. Deploy and copy the URL"

# Optionally copy to clipboard (macOS)
if command -v pbcopy &> /dev/null; then
    echo ""
    echo "📋 Copying Code.gs to clipboard..."
    cat "apps-script/Code.gs" | pbcopy
    echo "✅ Code.gs is now in your clipboard. Paste it into the Apps Script editor."
    echo ""
    echo "Run this script again and it will copy the next file (index.html) to clipboard."
fi