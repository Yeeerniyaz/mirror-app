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

function openService(url, isTV = false) {
    let win = new BrowserWindow({
        fullscreen: true,
        kiosk: true, 
        frame: false,
        backgroundColor: '#000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            userAgent: isTV ? "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.111 Safari/537.36" : undefined
        }
    });
    win.loadURL(url);
    win.webContents.on('did-finish-load', () => {
        win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
    });
}

// Управление запуском сервисов
ipcMain.on('launch', (event, { data, type, isTV }) => {
    if (type === 'sys') exec(data);
    else openService(data, isTV);
});

// Управление яркостью монитора Raspberry
ipcMain.on('set-brightness', (event, value) => {
    const b = Math.round((value / 100) * 255);
    exec(`echo ${b} | sudo tee /sys/class/backlight/*/brightness`);
});

// Системные команды: Ребут, Выключение и Wi-Fi Hotspot
ipcMain.on('system-cmd', (event, cmd) => {
    if (cmd === 'reboot') exec('sudo reboot');
    if (cmd === 'shutdown') exec('sudo shutdown -h now');
    if (cmd === 'start-ap') {
        // Команда для поднятия точки доступа на Raspberry Pi
        exec('nmcli device wifi hotspot ssid VECTOR_MIRROR password vector123');
    }
});

// Обновления
ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
        mainWindow.webContents.send('update_status', 'Проверка обновлений...');
    } else {
        mainWindow.webContents.send('update_status', 'Dev-mode: Ок');
    }
});

ipcMain.on('get-app-version', (event) => {
    event.reply('app-version', app.getVersion());
});

autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update_status', 'У вас последняя версия');
    setTimeout(() => mainWindow.webContents.send('update_status', ''), 4000);
});

autoUpdater.on('download-progress', (p) => {
    mainWindow.webContents.send('update_progress', p.percent);
    mainWindow.webContents.send('update_status', 'Загрузка...');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_status', 'Готово! Перезапуск...');
    setTimeout(() => { autoUpdater.quitAndInstall(); }, 3000);
});

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
    const url = app.isPackaged ? `file://${path.join(__dirname, 'dist/index.html')}` : 'http://localhost:5173';
    mainWindow.loadURL(url);
    
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('app-version', app.getVersion());
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });