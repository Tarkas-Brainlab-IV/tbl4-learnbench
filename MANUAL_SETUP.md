# Manual Setup Guide (Alternative to Clasp)

If you're experiencing authentication issues with clasp, here's how to set up the project manually while still maintaining version control.

## Option 1: Direct Script Editor Setup

1. **Create the Apps Script project**:
   - Go to [script.google.com](https://script.google.com)
   - Sign out of all Google accounts except the one you want to use
   - Create a new project
   - Name it "NERV LearnBench"

2. **Add files manually**:
   - Create new files in the editor:
     - `Code.gs` (already exists, replace content)
     - `index.html` (File → New → HTML file)
   - Copy content from your local files

3. **Get the Script ID**:
   - In Apps Script editor: File → Project Properties
   - Copy the Script ID
   - Create `.clasp.json` locally:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "./apps-script"
   }
   ```

## Option 2: Apps Script GitHub Assistant

1. **Install the GitHub Assistant**:
   - In Apps Script editor: Extensions → Apps Script GitHub Assistant
   - Authorize and connect to your GitHub account

2. **Link to repository**:
   - Repository: `NERVsystems/nerv-learnbench`
   - Branch: `main`
   - Folder: `apps-script`

3. **Push/Pull code**:
   - Use the GitHub Assistant UI to sync changes

## Option 3: Copy-Paste Helper Script

Create this bookmarklet for easier copying:

```javascript
javascript:(function(){
  const files = ['Code.gs', 'index.html', 'appsscript.json'];
  const baseUrl = 'https://raw.githubusercontent.com/NERVsystems/nerv-learnbench/main/apps-script/';
  files.forEach(async (file) => {
    const response = await fetch(baseUrl + file);
    const content = await response.text();
    console.log(`===== ${file} =====`);
    console.log(content);
    console.log('\n\n');
  });
})();
```

## Option 4: Using Google Colab as Bridge

1. **Create a Colab notebook**:
   ```python
   !pip install google-auth google-auth-oauthlib google-auth-httplib2
   !npm install -g @google/clasp
   
   # Authenticate
   from google.colab import auth
   auth.authenticate_user()
   
   # Clone your repo
   !git clone https://github.com/NERVsystems/nerv-learnbench.git
   !cd nerv-learnbench && clasp create --title "NERV LearnBench" --type webapp --rootDir ./apps-script
   ```

## Option 5: Container-based Development

```bash
# Create a Docker container for clasp
docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.clasprc.json:/root/.clasprc.json \
  node:18 bash

# Inside container
npm install -g @google/clasp
cd /workspace
clasp login --no-localhost
# Follow the URL and paste the code
```

## Fixing the Redirect Loop

If you want to fix the clasp authentication issue:

1. **Clear all Google sessions**:
   - Go to [accounts.google.com](https://accounts.google.com)
   - Sign out of ALL accounts
   - Clear browser cookies for google.com

2. **Use incognito/private mode**:
   ```bash
   clasp login --no-localhost
   ```
   This gives you a URL to open in any browser

3. **Use a different port**:
   ```bash
   clasp login --localhost-port 8090
   ```

4. **Manual token setup**:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
   - Download as JSON
   - Place at `~/.clasprc.json`

## Development Without Clasp

If clasp continues to fail, you can still maintain a good workflow:

### Local Development Setup

1. **Create a sync script** (`sync.js`):
```javascript
const fs = require('fs');
const path = require('path');

// Read local files
const files = {
  'Code.gs': fs.readFileSync('./apps-script/Code.gs', 'utf8'),
  'index.html': fs.readFileSync('./apps-script/index.html', 'utf8'),
  'appsscript.json': fs.readFileSync('./apps-script/appsscript.json', 'utf8')
};

// Output for easy copying
console.log('Copy these to Apps Script editor:\n');
Object.entries(files).forEach(([name, content]) => {
  console.log(`\n===== ${name} =====\n`);
  console.log(content);
});
```

2. **Run the sync script**:
```bash
node sync.js > files-to-copy.txt
```

3. **Use the Apps Script API directly**:
```bash
# Get an access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Update files via API
curl -X PUT \
  "https://script.googleapis.com/v1/projects/YOUR_SCRIPT_ID/content" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @apps-script-content.json
```

## Recommended: Hybrid Approach

1. **Initial setup**: Use the manual web interface
2. **Get Script ID**: Save it in `.clasp.json`
3. **Development**: Edit locally in VS Code
4. **Deployment**: Use the sync script or GitHub Assistant
5. **Version control**: Commit all changes to Git

This way you get the benefits of local development without fighting authentication issues.