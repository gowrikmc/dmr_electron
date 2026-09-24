const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    fetchUnits: () => ipcRenderer.invoke('get-db-username'),
    login: (username, password) => ipcRenderer.invoke('login', { username, password })
});

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: (defaultPath) => ipcRenderer.invoke('select-folder', defaultPath),
    getImagesFromFolder: (folderPath) => ipcRenderer.invoke('get-images', folderPath),
    getFilePreview: (filePath, fileName) => ipcRenderer.invoke('get-file-preview', filePath, fileName)
});

contextBridge.exposeInMainWorld("DocApi", {
    Doc: () => ipcRenderer.invoke('GetDocumentDescription')
});

contextBridge.exposeInMainWorld("FilePathApi", {
    Path: () => ipcRenderer.invoke("GetFilePath")
});

contextBridge.exposeInMainWorld('dbAPI', {
    callOpPatientdata: (type, flag, value) => ipcRenderer.invoke('GetPatientData', { type, flag, value }),
    InertPatientdata: (username, patientid, document) => ipcRenderer.invoke('InsertPatientData', { username, patientid, document }),
    GetIpNumberIndexCount: (ipno) => ipcRenderer.invoke('GetIpNoIndexCount',{ipno})
});

contextBridge.exposeInMainWorld('IndexAPI', {
    index: (username, patientid, document) => ipcRenderer.invoke('InsertPatientData', { username, patientid, document }),
    fileindex: (dmrinxid, rowno,filename,filepath) => ipcRenderer.invoke('InsertFileData', { dmrinxid, rowno, filename, filepath })
});

contextBridge.exposeInMainWorld('fileAPI', {
    moveFile: (sourcePath, destFolder, filename) => ipcRenderer.invoke('move-file', sourcePath, destFolder, filename)
});

contextBridge.exposeInMainWorld('getfile', {
    viewfile: (username) => ipcRenderer.invoke('view-file', username),
    openFile: (filepath, filename) => ipcRenderer.invoke('open-file', filepath, filename),
    readFile: (filepath, filename) => ipcRenderer.invoke('read-file', filepath, filename)
});

contextBridge.exposeInMainWorld('settingsAPI', {
    getUsers: () => ipcRenderer.invoke('GetUsers'),
    addUser: (username, password, role,active) => ipcRenderer.invoke('AddUser', { username, password, role,active }),
    updateUser: (username, password, role) => ipcRenderer.invoke('UpdateUser', { username, password, role }),
    deleteUser: (username) => ipcRenderer.invoke('DeleteUser', username)
});

contextBridge.exposeInMainWorld('pathAPI', {
    getPaths: () => ipcRenderer.invoke('GetFilepath'),
    savePaths: (dataPath, backupPath) => ipcRenderer.invoke('SavePaths', {dataPath, backupPath }),
    addPath: (path, description) => ipcRenderer.invoke('AddPath', { path, description })
});

// ── Auto-Update API ──
contextBridge.exposeInMainWorld('updateAPI', {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    restartAndInstall: () => ipcRenderer.send('restart-app'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, data) => callback(data)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (event) => callback()),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, data) => callback(data)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, progress) => callback(progress)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, error) => callback(error)),
    removeUpdateListener: (channel) => ipcRenderer.removeAllListeners(channel)
});