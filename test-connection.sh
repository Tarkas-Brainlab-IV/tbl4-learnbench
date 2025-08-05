#!/bin/bash

echo "Testing connection to Apps Script project..."
echo "Script ID: 1QeoELCzLgZ7YgqrzeKzWE0oBncJOsOreU-6O_q9YR-qD4ul6Oe3pT5So"
echo ""

# Test if clasp can connect
if command -v clasp &> /dev/null; then
    echo "Running: clasp status"
    clasp status
    
    echo ""
    echo "Running: clasp pull --dry-run"
    clasp pull --dry-run
else
    echo "clasp is not installed"
fi