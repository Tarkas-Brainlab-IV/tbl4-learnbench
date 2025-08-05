#!/bin/bash

# NERV LearnBench Deployment Script
# This script automates the deployment process for the Apps Script project

set -e  # Exit on error

echo "🚀 NERV LearnBench Deployment Script"
echo "===================================="

# Check if clasp is installed
if ! command -v clasp &> /dev/null; then
    echo "❌ clasp is not installed. Installing..."
    npm install -g @google/clasp
fi

# Check if .clasp.json exists
if [ ! -f ".clasp.json" ]; then
    echo "❌ .clasp.json not found. Creating new project..."
    
    # Check if user is logged in
    if ! clasp login --status &> /dev/null; then
        echo "📝 Please log in to Google..."
        clasp login
    fi
    
    echo "📁 Creating new Apps Script project..."
    clasp create --title "NERV LearnBench" --type webapp --rootDir ./apps-script
fi

# Push latest changes
echo "📤 Pushing latest changes to Google Apps Script..."
clasp push

# Deploy
echo "🎯 Creating new deployment..."
DEPLOYMENT_ID=$(clasp deploy --description "Deployment $(date '+%Y-%m-%d %H:%M:%S')" | grep -oE '[a-zA-Z0-9_-]{20,}' | tail -1)

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "❌ Failed to get deployment ID"
    exit 1
fi

# Get deployment URL
echo "🔍 Getting deployment URL..."
DEPLOYMENT_INFO=$(clasp deployments | grep "$DEPLOYMENT_ID")

# Open in browser
echo "🌐 Opening Apps Script project..."
clasp open

echo ""
echo "✅ Deployment complete!"
echo "===================================="
echo "Deployment ID: $DEPLOYMENT_ID"
echo ""
echo "Next steps:"
echo "1. In the Apps Script editor, go to Deploy > Manage deployments"
echo "2. Click on the latest deployment to get the Web App URL"
echo "3. Share this URL with experiment participants"
echo ""
echo "For development:"
echo "  npm run watch  # Auto-push changes"
echo "  npm run logs   # View real-time logs"