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

    // Удален лишний вызов new BrowserWindow!
    
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('app-version', app.getVersion());
    });
}

// --- Обработка обновлений ---

ipcMain.on('check-for-updates', () => {
    console.log("Кнопка нажата, режим packaged:", app.isPackaged);
    
    if (app.isPackaged) {
        if (mainWindow) {
            mainWindow.webContents.send('update_status', 'Поиск обновлений...');
        }
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            if (mainWindow) mainWindow.webContents.send('update_status', 'Ошибка апдейтера');
        });
    } else {
        if (mainWindow) mainWindow.webContents.send('update_status', 'Dev-mode: Ок');
    }
});

// Слушатели для AppImage (чтобы текст менялся на экране)
autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update_status', 'Связь с сервером...');
});

autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update_status', 'Найдена новая версия!');
});

autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update_status', 'У вас актуальная версия');
    setTimeout(() => {
        mainWindow?.webContents.send('update_status', '');
    }, 4000);
});

autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update_status', 'Ошибка: ' + err.message.substring(0, 20));
});

autoUpdater.on('download-progress', (p) => {
    mainWindow?.webContents.send('update_progress', p.percent);
});

autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update_status', 'Готово! Перезапуск...');
    setTimeout(() => { autoUpdater.quitAndInstall(); }, 3000);
});

// --- Системные команды ---

ipcMain.on('system-cmd', (event, cmd) => {
    if (cmd === 'reboot') exec('sudo reboot');
    if (cmd === 'start-ap') {
        exec('nmcli device wifi hotspot ssid VECTOR_MIRROR password vector123');
    }
});

ipcMain.on('launch', (event, { data, type, isTV }) => {
    if (type === 'sys') exec(data);
    else {
        let win = new BrowserWindow({ 
            fullscreen: true, 
            kiosk: true, 
            frame: false,
            backgroundColor: '#000' 
        });
        win.loadURL(data);
    }
});

ipcMain.on('get-app-version', (event) => {
    event.reply('app-version', app.getVersion());
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });