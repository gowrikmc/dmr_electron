const { app, BrowserWindow, screen, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fss = require('fs/promises');
const sharp = require('sharp');
const { moveFile } = require('./fileOps');

// Configure auto-updater logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;

const envCandidates = [
    path.join(app.getPath('userData'), 'eb.env'),
    path.join(app.getPath('userData'), '.env'),
    path.join(process.resourcesPath, 'eb.env'),
    path.join(process.resourcesPath, '.env'),
    path.join(__dirname, 'eb.env'),
    path.join(__dirname, '.env')
];
const envPath = envCandidates.find(candidate => fs.existsSync(candidate));

if (envPath) {
    require('dotenv').config({ path: envPath });
}

if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL is missing. Add eb.env to ${app.getPath('userData')}.`);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tif', '.tiff', '.pdf'];
const previewExtensions = new Set(['.tif', '.tiff']);

function getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.pdf': 'application/pdf'
    };
    return mimeMap[ext] || null;
}

// Handle folder selection
ipcMain.handle('select-folder', async (event, defaultPath) => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        defaultPath: defaultPath || undefined   // opens at this path if provided
    });
    return result.canceled ? null : result.filePaths[0];
});

// Read images from selected folder
ipcMain.handle('get-images', async (event, folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        const images = files
            .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
            .map(file => ({
                name: file,
                path: path.join(folderPath, file).replace(/\\/g, '/')
            }));
        return { success: true, images };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('get-file-preview', async (event, filePath, fileName) => {
    try {
        const ext = path.extname(fileName).toLowerCase();
        if (previewExtensions.has(ext)) {
            const pngBuffer = await sharp(filePath).png().toBuffer();
            return { success: true, data: pngBuffer.toString('base64'), mime: 'image/png' };
        }

        const mime = getMimeType(fileName);
        const data = await fss.readFile(filePath);
        return { success: true, data: data.toString('base64'), mime };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


ipcMain.handle('get-db-username', async () => {
    try {
        const result = await pool.query("SELECT current_user");
        return result.rows[0].current_user;
    }
    catch (err) { console.error(err); return []; }
});

ipcMain.handle('login', async (event, { username, password }) => {
    const userRes = await pool.query(
        "SELECT DUAP_PASSWORD as password, DUAP_ROLE as role FROM DMR_USERNAMEANDPASSWORD WHERE DUAP_USERNAME=$1",
        [username]
    );
    if (userRes.rows.length === 0) return { success: false };

    const hashedPassword = userRes.rows[0].password;
    const isMatch = hashedPassword == password;

    if (isMatch) return { success: true, role: userRes.rows[0].role };
    return { success: false };
});

ipcMain.handle('GetDocumentDescription', async () => {
    try {
        const DocDes = await pool.query(
            "SELECT b.value_description as doc FROM list_type a INNER JOIN list_of_values b ON a.list_typeid = b.list_type WHERE b.active = 'T' and a.list_type LIKE 'dmr document description' ORDER BY b.value_description"
        );

        if (DocDes.rows.length === 0) {
            return { success: false, message: "No document descriptions found." };
        }

        return { success: true, data: DocDes.rows };

    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
});

async function GetFilePath() {
    try {
        const result = await pool.query(
            "SELECT DSADP_SOURCEPATH as sourcepath, DSADP_DESTINATIONPATH as destinationpath FROM DMR_SOURCEANDDESTINATION_PATH"
        );

        if (result.rows.length === 0) {
            return { success: true, data: [] };
        }

        return { success: true, data: result.rows };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

ipcMain.handle('GetFilePath', async () => {
    return await GetFilePath();
});

async function savePathsToDb(dataPath, backupPath) {
    try {
        if (!dataPath && !backupPath) {
            return { success: false, error: 'Both paths are required.' };
        }

        const existing = await pool.query('SELECT 1 FROM DMR_SOURCEANDDESTINATION_PATH');

        if (existing.rows.length) {
            await pool.query(
                'UPDATE DMR_SOURCEANDDESTINATION_PATH SET DSADP_SOURCEPATH = $1, DSADP_DESTINATIONPATH = $2',
                [dataPath, backupPath]
            );
        } else {
            await pool.query(
                'INSERT INTO DMR_SOURCEANDDESTINATION_PATH (DSADP_SOURCEPATH, DSADP_DESTINATIONPATH) VALUES ($1, $2)',
                [dataPath, backupPath]
            );
        }

        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

ipcMain.handle('SavePaths', async (event, { dataPath, backupPath }) => {
    return await savePathsToDb(dataPath, backupPath);
});

ipcMain.handle('AddPath', async (event, { path, description }) => {
    return await savePathsToDb(path, description || '');
});

ipcMain.handle('GetPatientData', async (event, { type, flag, value }) => {
    let query = "";
    if (type == 'OP') {
                query = `SELECT patient_name,op_no AS num,registration_date::TEXT 
                FROM visit_entry WHERE ${flag == 'UHID' ? flag : 'op_no'}::text ILIKE '%' || $1`;
    }
    if (type == 'IP') {
                query = `select 
                ip.ward_patientname  as patient_name,
                ip.ip_no AS NUM,
                to_char(ip.admn_date,'DD-MM-YYYY') as registration_date,
                to_char(ip.discharge_date,'DD-MM-YYYY') AS discharge_date
                from int_ip_admission ip where ip.discharge_date is not null and ip.reg_type = 'IP'
                and ${flag == 'UHID' ? flag : 'ip_no'}::text ILIKE '%' || $1
                union 
                select patient_name,num,registration_date,discharge_date  
                from gowri_discharge_summary gds 
                where num::text ILIKE '%' || $1`;
    }
    if (type == 'ER') {
                query = `
                select 
                iia.dis_name as patient_name,
                iia.ip_no AS NUM,
                to_char(iia.admn_date,'DD-MM-YYYY') as registration_date,
                to_char(iia.discharge_date,'DD-MM-YYYY') AS discharge_date
                from int_ip_admission iia where 
                iia.reg_type  = 'ER' and iia.discharge_date is not null and iia.ip_no  LIKE '%' || $1`;
    }

    const PatientData = await pool.query(query, [value]);

    if (PatientData.rows.length === 0) {
        return { success: false, error: "No records found." };
    }

    return {
        success: true,
        data: PatientData.rows
    };
});

ipcMain.handle('InsertPatientData', async (event, { username, patientid, document }) => {
    try {
        const queryText = `
            WITH existing AS (
                SELECT dmrindexid FROM dmrindex WHERE opipno = $2 and documentdescription = $3 LIMIT 1
            ),
            inserted AS (
                INSERT INTO dmrindex (username,createdby,opipno,documentdescription)
                SELECT $1,$1,$2, $3
                WHERE NOT EXISTS (SELECT 1 FROM existing)
                RETURNING dmrindexid
            )
            SELECT dmrindexid FROM inserted
            UNION ALL
            SELECT dmrindexid FROM existing;
        `;

        const insertdata = await pool.query(queryText, [username, patientid, document]);
        const dmrindexid = insertdata.rows[0].dmrindexid;

        return {
            success: true,
            id: dmrindexid
        };
    } catch (error) {
        console.error("Database insertion failed:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('InsertFileData', async (event, { dmrinxid, rowno, filename, filepath }) => {
    try {
        const insertdata = await pool.query(
            "INSERT INTO dmrindex_det(dmrindexid,dmrindex_detrow,filename,filelocation) VALUES ($1, $2, $3,$4) RETURNING dmrindex_detid",
            [dmrinxid, rowno, filename, filepath,]
        );
        const newId = insertdata.rows[0].id;
        return {
            success: true,
            id: newId
        };
    } catch (error) {
        console.error("Database insertion failed:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('move-file', async (event, sourcePath, destFolder, filename) => {
    try {
        const newPath = await moveFile(sourcePath, destFolder, filename);
        return { success: true, newPath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("view-file", async (event, username) => {
    try {
        const queryText = `select d.username ,d.opipno,d.documentdescription ,dd.filelocation ,dd.filename 
            from dmrindex d join dmrindex_det dd on d.dmrindexid = dd.dmrindexid where d.username = $1`;
        const result = await pool.query(queryText, [username]);
        return { success: true, data: result.rows };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("open-file", async (event, filepath, filename) => {
    try {
        const fullPath = path.join(filepath, filename);
        const err = await shell.openPath(fullPath);
        if (err) return { success: false, error: err };
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("read-file", async (event, filepath, filename) => {
    try {
        const fullPath = path.join(filepath, filename);
        const ext = path.extname(filename).toLowerCase();

        if (previewExtensions.has(ext)) {
            const pngBuffer = await sharp(fullPath).png().toBuffer();
            return { success: true, data: pngBuffer.toString('base64'), mime: 'image/png' };
        }

        const data = await fss.readFile(fullPath);
        return { success: true, data: data.toString('base64') };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("GetUsers", async () => {
    try {
        const result = await pool.query("SELECT DUAP_USERNAME as username, DUAP_ROLE as role, 'T' as active, DUAP_PASSWORD as password FROM DMR_USERNAMEANDPASSWORD");
        return { success: true, data: result.rows };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("AddUser", async (event, { username, password, role, active }) => {
    try {
        const insertQuery = "INSERT INTO DMR_USERNAMEANDPASSWORD (DUAP_USERNAME, DUAP_PASSWORD, DUAP_ROLE) VALUES ($1, $2, $3)";
        await pool.query(insertQuery, [username, password, role]);
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle("GetFilepath", async () => {
    return await GetFilePath();
});

ipcMain.handle("GetIpNoIndexCount", async (event, { ipNo }) => {
    try {
        const result = await pool.query(
            "SELECT COUNT(*) as count FROM dmrindex_det WHERE dmrindexid IN (SELECT dmrindexid FROM dmrindex WHERE opipno = $1)",
            [ipNo]
        );
        return { success: true, data: result.rows[0].count };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

function createWindow() {
    const { workAreaSize } = screen.getPrimaryDisplay();

    const width = Math.floor(workAreaSize.width * 0.90);
    const height = Math.floor(workAreaSize.height * 0.90);

    const win = new BrowserWindow({
        width,
        height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            menuBarVisible: false
        }
    });
    win.loadFile('index.html');
    win.center();
    return win;
}



// ── Auto-Updater Handlers ──
autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    mainWindow?.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate
    });
});

autoUpdater.on('update-not-available', () => {
    log.info('Already on latest version');
    mainWindow?.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    mainWindow?.webContents.send('update-downloaded', {
        version: info.version
    });
});

autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    mainWindow?.webContents.send('update-error', { error: err.message });
});

autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        total: progress.total,
        transferred: progress.transferred
    });
});

// IPC handler to restart and install updates
ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
});

// IPC handler to check for updates manually
ipcMain.handle('check-for-updates', async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, data: result };
    } catch (error) {
        log.error('Error checking for updates:', error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    mainWindow = createWindow();

    // Check for updates on app start (after 2 seconds)
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 2000);

    // Check for updates every hour
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });