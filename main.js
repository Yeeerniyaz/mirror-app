import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec, execSync } from 'child_process';
// Исправление ошибки импорта CommonJS модуля в ESM
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disableHardwareAcceleration(); 

let mainWindow;

/**
 * Функция открытия внешних сервисов (YouTube, Календарь и т.д.)
 */
function openService(url, isTV = false) {
    let win = new BrowserWindow({
        fullscreen: true, // Всегда во весь экран
        backgroundColor: '#000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            userAgent: isTV ? "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.111 Safari/537.36" : undefined
        }
    });

    win.loadURL(url);

    // Добавляем ТОЛЬКО кнопку закрытия, не трогая оригинальный CSS сайта
  
}

/**
 * Обработка системных команд
 */
ipcMain.on('launch', (event, { data, type, isTV }) => {
    if (type === 'sys') {
        exec(data);
    } else {
        openService(data, isTV);
    }
});

// Управление яркостью (через sudo tee)
ipcMain.on('set-brightness', (event, value) => {
    const brightness = Math.round((value / 100) * 255);
    exec(`echo ${brightness} | sudo tee /sys/class/backlight/*/brightness`);
});

// Команды системы (удален shutdown, оставлен только reboot)
ipcMain.on('system-cmd', (event, cmd) => {
    if (cmd === 'reboot') {
        exec('sudo reboot');
    }
});

ipcMain.on('update-software', () => {
    // Команда для обновления через git и перезапуска
    exec('cd ~/projects/vector-standalone && git pull && npm install && npm run build && sudo reboot');
});

/**
 * Основные функции запуска
 */
function startPythonBridge() {
    const dbPath = path.join(app.getPath('userData'), 'vector.db');
    const pythonScriptPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'python', 'bridge.py') 
        : path.join(__dirname, 'src', 'python', 'bridge.py');
    
    const pyProcess = spawn('python3', [pythonScriptPath, dbPath]);
    pyProcess.stdout.on('data', (data) => console.log(`[Python]: ${data}`));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    const url = app.isPackaged 
        ? `file://${path.join(__dirname, 'dist/index.html')}` 
        : 'http://localhost:5173';

    mainWindow.loadURL(url);

    // Вывод статуса обновления на экран (Dashboard)
    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update_status', 'Найдено обновление...');
    });
    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('update_progress', progress.percent);
    });
    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update_status', 'Обновление готово. Перезагрузка...');
        setTimeout(() => { autoUpdater.quitAndInstall(); }, 3000);
    });
}

app.whenReady().then(() => {
    startPythonBridge();
    createWindow();
    if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});