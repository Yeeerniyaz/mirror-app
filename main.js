import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disableHardwareAcceleration(); 

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        backgroundColor: '#000000',
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false,
            webSecurity: false 
        }
    });

    const url = app.isPackaged 
        ? `file://${path.join(__dirname, 'dist/index.html')}` 
        : 'http://localhost:5173';
    
    mainWindow.loadURL(url);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('app-version', app.getVersion());
    });
}

// --- ОБНОВЛЕНИЯ ---
ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
        mainWindow?.webContents.send('update_status', 'Поиск обновлений...');
    } else {
        mainWindow?.webContents.send('update_status', 'Dev-mode: Ок');
    }
});

autoUpdater.on('update-available', () => mainWindow?.webContents.send('update_status', 'Найдено обновление!'));
autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update_status', 'У вас последняя версия');
    setTimeout(() => mainWindow?.webContents.send('update_status', ''), 4000);
});
autoUpdater.on('download-progress', (p) => mainWindow?.webContents.send('update_progress', p.percent));
autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update_status', 'Готово! Перезапуск...');
    setTimeout(() => autoUpdater.quitAndInstall(), 3000);
});

// --- СИСТЕМА ---
ipcMain.on('system-cmd', (event, cmd) => {
    if (cmd === 'reboot') exec('sudo reboot');
    if (cmd === 'start-ap') {
        exec('nmcli device wifi hotspot ssid VECTOR_MIRROR password vector123');
    }
});

ipcMain.on('launch', (event, { data, type, isTV }) => {
    if (type === 'sys') exec(data);
    else {
        let win = new BrowserWindow({ fullscreen: true, kiosk: true, frame: false });
        win.loadURL(data);
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });