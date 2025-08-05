# Development Guide

This guide explains how to efficiently develop and iterate on the NERV LearnBench Google Apps Script project.

## Quick Start

```bash
# First time setup
npm install
npm run setup  # Installs clasp, logs in, creates project

# Development
npm run watch  # Auto-pushes changes to Google
npm run logs   # View real-time logs in terminal
```

## Clasp Workflow

### Initial Setup

1. **Install clasp globally**:
   ```bash
   npm install -g @google/clasp
   ```

2. **Login to Google**:
   ```bash
   clasp login
   ```
   This opens a browser for OAuth authentication.

3. **Create project** (first time only):
   ```bash
   clasp create --title "NERV LearnBench" --type webapp --rootDir ./apps-script
   ```
   This creates a `.clasp.json` file with your script ID.

### Daily Development

1. **Start watch mode**:
   ```bash
   npm run watch
   # or
   clasp push --watch
   ```
   Any changes to files in `apps-script/` are automatically pushed to Google.

2. **View logs** in another terminal:
   ```bash
   npm run logs
   # or
   clasp logs --tail
   ```

3. **Make changes** in your favorite editor:
   - Edit `apps-script/Code.gs` for server logic
   - Edit `apps-script/index.html` for UI changes
   - Changes are pushed automatically in watch mode

### Testing Changes

1. **Open in browser**:
   ```bash
   npm run open
   ```

2. **Test the web app**:
   - In Apps Script editor: Deploy → Test deployments
   - Click the URL to test your changes

### Deployment

```bash
npm run deploy
# or use the automated script
./scripts/deploy.sh
```

## VS Code Integration

### Recommended Extensions

1. **Google Apps Script** - Syntax highlighting for .gs files
2. **ESLint** - JavaScript linting
3. **Prettier** - Code formatting

### Settings

Add to `.vscode/settings.json`:
```json
{
  "files.associations": {
    "*.gs": "javascript"
  },
  "editor.formatOnSave": true
}
```

## Type Definitions

For better IntelliSense in VS Code:

```bash
npm install --save-dev @types/google-apps-script
```

Add to the top of your .gs files:
```javascript
// @ts-check
```

## Advanced Features

### Using ES6+ Features

While Apps Script supports ES6, be careful with:
- No `import/export` (use script order in appsscript.json)
- No `async/await` (use Promises or callbacks)
- Limited array methods in older runtimes

### Environment Variables

Use Script Properties for sensitive data:

```javascript
// Set in Apps Script: File → Project Properties → Script Properties
const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
```

### Local Development with Mock Data

Create `apps-script/mock.gs` for local testing:
```javascript
// Only runs locally, not pushed to Google
function mockGeminiResponse(prompt) {
  return {
    output: "Mock response for: " + prompt,
    tokens: 100
  };
}
```

Add to `.claspignore`:
```
mock.gs
```

## Troubleshooting

### "Push failed"
- Check `.clasp.json` exists and has correct script ID
- Ensure you're logged in: `clasp login --status`

### "Permission denied"
- Re-authenticate: `clasp login --reauthorize`
- Check Apps Script project permissions

### Changes not appearing
- Ensure watch mode is running
- Check for syntax errors in console
- Hard refresh the web app (Ctrl+Shift+R)

### Type errors in VS Code
- Install type definitions: `npm install --save-dev @types/google-apps-script`
- Add `// @ts-check` to top of files

## Best Practices

1. **Use watch mode** during development for instant feedback
2. **Keep logs open** in a separate terminal
3. **Test incrementally** - small changes are easier to debug
4. **Use version control** - commit `.clasp.json` (without sensitive data)
5. **Document API changes** in code comments

## CI/CD Integration

For automated deployments, create a service account:

1. Create service account in Google Cloud Console
2. Download JSON key
3. Use in GitHub Actions:

```yaml
- name: Deploy to Apps Script
  run: |
    echo "${{ secrets.CLASP_CREDS }}" > ~/.clasprc.json
    npm run push
    npm run deploy
```

## Resources

- [Clasp Documentation](https://github.com/google/clasp)
- [Apps Script Best Practices](https://developers.google.com/apps-script/guides/best-practices)
- [Apps Script Reference](https://developers.google.com/apps-script/reference)