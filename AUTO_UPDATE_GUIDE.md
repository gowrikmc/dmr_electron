# Auto-Update Setup Guide for DMR Electron App

## Overview
Your DMR application now has auto-update capability configured to use GitHub Releases. This guide explains how to set it up and use it.

## What's Been Done

1. ✅ Added `electron-updater` to dependencies
2. ✅ Added `electron-log` for logging
3. ✅ Updated `index.js` with auto-update handlers
4. ✅ Updated `preload.js` with update API
5. ✅ Created `updateHandler.js` for UI notifications
6. ✅ Configured GitHub as the update provider

## Configuration

Your `package.json` is already configured with GitHub releases:
```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "gowrims",
    "repo": "dmr_electron"
  }
}
```

## How Auto-Update Works

### 1. **Check on Startup**
- App checks for updates 2 seconds after launch
- Automatic notification if update is available

### 2. **Periodic Checks**
- Checks for updates every hour while app is running
- Silent check (only notifies if update available)

### 3. **Download & Install**
- Auto-downloads available updates in background
- Notifies user when ready to restart
- User can click "Restart" to apply update immediately

## Using Auto-Updates

### Option 1: Add Update Handler to Your HTML

Add this line to your `index.html` (in any page you want update notifications):

```html
<script src="updateHandler.js"></script>
```

This will:
- Show notifications for available updates
- Display download progress bar
- Show "Restart" button when update is ready
- Handle all update events automatically

### Option 2: Manual Implementation

Use the `window.updateAPI` directly in your code:

```javascript
// Check for updates manually
window.updateAPI.checkForUpdates();

// Listen for update available
window.updateAPI.onUpdateAvailable((data) => {
    console.log('Update available:', data.version);
    // Show your custom UI
});

// Listen for download progress
window.updateAPI.onUpdateProgress((progress) => {
    console.log(`Download: ${progress.percent.toFixed(2)}%`);
});

// Listen for update ready to install
window.updateAPI.onUpdateDownloaded((data) => {
    console.log('Ready to install version:', data.version);
    // Show restart button
});

// Restart and install
window.updateAPI.restartAndInstall();
```

## Publishing Updates on GitHub

### Step 1: Ensure Git and GitHub Remote
```bash
git remote add origin https://github.com/gowrims/dmr_electron.git
git branch -M main
git push -u origin main
```

### Step 2: Create Release Build
```bash
npm run build
```
This creates an executable installer in the `dist/` folder.

### Step 3: Create GitHub Release
1. Go to: https://github.com/gowrims/dmr_electron/releases
2. Click "Create a new release"
3. Tag version: `v1.0.1` (semantic versioning)
4. Upload the `.exe` file from `dist/` folder as asset
5. Add release notes
6. Publish release

### Step 4: Update App Version
Update `version` in `package.json` to match your release tag:
```json
"version": "1.0.1"
```

## Auto-Update Flow

```
┌─────────────────────┐
│   App Starts        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ Check GitHub Releases       │
│ (after 2 seconds)           │
└──────────┬──────────────────┘
           │
           ├─► No Update ──► Continue Running
           │
           └─► Update Found
               │
               ▼
           Notify User (info message)
           │
           ▼
           Download in Background
           │
           ├─► Show Progress Bar
           │
           ▼
           Download Complete
           │
           ▼
           Notify User (with Restart button)
           │
           ├─► User Clicks Restart
           │   │
           │   ▼
           │   Quit App & Install Update
           │   │
           │   ▼
           │   Auto-Restart with New Version
           │
           └─► User Ignores
               │
               ▼
               Installed on Next Restart
```

## Testing Update System

### Local Testing (Without GitHub)

To test locally, you can temporarily update the publish provider in `package.json`:

```json
"build": {
  "publish": {
    "provider": "generic",
    "url": "http://localhost:3000/releases/"
  }
}
```

Then run:
```bash
npm run build
http-server dist/ -p 3000  # Serve local updates
```

### Production Testing

Before releasing v1.0.1:
1. Keep v1.0.0 as current version
2. Build and create GitHub release for v1.0.1
3. Update `package.json` to v1.0.0 (downgrade temporarily)
4. Run the app and test that it detects v1.0.1 update

## Troubleshooting

### Updates Not Detecting

1. **Check GitHub Release**
   - Verify release tag format: `v1.0.1` (with 'v' prefix)
   - Confirm `.exe` file is uploaded as release asset
   - Check release is not marked as "Pre-release"

2. **Check Version Mismatch**
   - Current app version must be lower than release version
   - Release tag must be higher: e.g., app v1.0.0 → release v1.0.1

3. **Check Logs**
   ```javascript
   // Logs saved to:
   // Windows: %APPDATA%/dmr/logs/main.log
   ```

4. **Check Internet Connection**
   - Ensure app can reach GitHub API
   - Check firewall/proxy settings

### Update Download Fails

1. **GitHub Rate Limiting**
   - GitHub API has rate limits
   - Wait 1 hour before retrying

2. **Insufficient Disk Space**
   - Ensure enough space for download and install

3. **File Permissions**
   - Ensure app has permission to write to installation directory
   - Try running as Administrator

## Configuration Reference

### Auto-Update Timing (in index.js)

```javascript
// Initial check delay (milliseconds)
setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
}, 2000);  // Change 2000 to different value

// Periodic check interval (milliseconds)
setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
}, 60 * 60 * 1000);  // 60 * 60 * 1000 = 1 hour
```

### Notification Styling

Edit `updateHandler.js` to customize notification appearance:
- Colors: Change `#3b82f6`, `#10b981`, `#ef4444`
- Position: Change `top: 20px; right: 20px;`
- Timeout: Change `10000` (milliseconds)

## Security Best Practices

1. **Sign Releases** (Optional but Recommended)
   - Use code signing certificates
   - Verify updates before installation

2. **HTTPS Only**
   - Always use HTTPS for update sources
   - Never use HTTP in production

3. **Version Validation**
   - Semantic versioning: `MAJOR.MINOR.PATCH`
   - Only release stable versions

## Next Steps

1. ✅ Test auto-update locally
2. ✅ Create your first GitHub release (v1.0.1)
3. ✅ Add `<script src="updateHandler.js"></script>` to your HTML
4. ✅ Build production version
5. ✅ Deploy to users

## Additional Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Semantic Versioning](https://semver.org/)

---

**Questions?** Check the console logs in DevTools for detailed update information.
