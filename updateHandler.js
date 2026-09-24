/**
 * Auto-Update Handler for DMR Application
 * Add this to your index.html: <script src="updateHandler.js"></script>
 */

let updateState = {
    available: false,
    downloaded: false,
    version: null
};

// Listen for update events
if (window.updateAPI) {
    // Update available
    window.updateAPI.onUpdateAvailable((data) => {
        console.log('Update available:', data.version);
        updateState.available = true;
        updateState.version = data.version;
        
        // Show notification to user
        showUpdateNotification('info', `Update ${data.version} is available. It will be downloaded automatically.`);
    });

    // Update not available
    window.updateAPI.onUpdateNotAvailable(() => {
        console.log('Already on latest version');
        updateState.available = false;
    });

    // Update downloaded and ready to install
    window.updateAPI.onUpdateDownloaded((data) => {
        console.log('Update downloaded:', data.version);
        updateState.downloaded = true;
        
        // Show notification with restart option
        showUpdateNotification('success', `Update ${data.version} is ready! Click "Restart" to install.`, true);
    });

    // Download progress
    window.updateAPI.onUpdateProgress((progress) => {
        console.log(`Download progress: ${progress.percent.toFixed(2)}%`);
        updateProgressBar(progress.percent);
    });

    // Update error
    window.updateAPI.onUpdateError((error) => {
        console.error('Update error:', error);
        showUpdateNotification('error', `Update failed: ${error.error}`);
    });
}

/**
 * Display update notification
 * @param {string} type - 'info', 'success', 'error'
 * @param {string} message - Notification message
 * @param {boolean} showRestartBtn - Show restart button
 */
function showUpdateNotification(type, message, showRestartBtn = false) {
    // Create or get notification container
    let container = document.getElementById('update-notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'update-notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            z-index: 10000;
        `;
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'info' ? '#3b82f6' : type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
    `;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);

    if (showRestartBtn) {
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Restart';
        restartBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: 1px solid white;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
        `;
        restartBtn.onclick = () => {
            window.updateAPI.restartAndInstall();
        };
        notification.appendChild(restartBtn);
    }

    container.appendChild(notification);

    // Auto-remove after 10 seconds (unless it's an action required notification)
    setTimeout(() => {
        if (!showRestartBtn) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 10000);
}

/**
 * Update progress bar during download
 * @param {number} percent - Download progress percentage
 */
function updateProgressBar(percent) {
    let progressBar = document.getElementById('update-progress-bar');
    if (!progressBar) {
        // Create progress bar
        progressBar = document.createElement('div');
        progressBar.id = 'update-progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #10b981);
            width: 0%;
            transition: width 0.3s ease;
            z-index: 9999;
        `;
        document.body.appendChild(progressBar);
    }
    progressBar.style.width = percent + '%';

    // Hide when complete
    if (percent >= 100) {
        setTimeout(() => {
            progressBar.style.opacity = '0';
            progressBar.style.transition = 'opacity 0.5s ease';
        }, 500);
    }
}

/**
 * Manually check for updates (can be called from UI button)
 */
function manualCheckForUpdates() {
    if (window.updateAPI) {
        window.updateAPI.checkForUpdates().then(result => {
            if (result.success) {
                console.log('Checked for updates:', result.data);
            } else {
                console.error('Failed to check for updates:', result.error);
            }
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Log when ready
console.log('✓ Update handler initialized');
