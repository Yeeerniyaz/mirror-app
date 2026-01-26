import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Отключаем аппаратное ускорение для стабильности на Raspberry Pi
app.disableHardwareAcceleration(); 

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        backgroundColor: '#000000',
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false, // Для прямого доступа к ipcRenderer
            webSecurity: false 
        }
    });

    // Путь для работы в AppImage и в режиме разработки
    const url = app.isPackaged 
        ? `file://${path.join(__dirname, 'dist/index.html')}` 
        : 'http://localhost:5173';
    
    mainWindow.loadURL(url);

    // Отправка версии приложения на фронтенд при загрузке
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('app-version', app.getVersion());
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- ФУНКЦИОНАЛ ОБНОВЛЕНИЙ (AppImage через твой сервер) ---
ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
        mainWindow?.webContents.send('update_status', 'Поиск обновлений...');
    } else {
        mainWindow?.webContents.send('update_status', 'Dev-mode: Ок');
    }
});

autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update_status', 'Найдено обновление!');
});

autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update_status', 'У вас последняя версия');
    setTimeout(() => {
        mainWindow?.webContents.send('update_status', '');
    }, 4000);
});

autoUpdater.on('download-progress', (p) => {
    mainWindow?.webContents.send('update_progress', p.percent);
});

autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update_status', 'Готово! Перезапуск...');
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 3000);
});

autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update_status', 'Ошибка обновления');
    console.error(err);
});

// --- СИСТЕМА ---
ipcMain.on('system-cmd', (event, cmd) => {
    if (cmd === 'reboot') {
        exec('sudo reboot');
    }
    // Логика точки доступа (start-ap) удалена по твоему запросу
});

// --- ЗАПУСК ПРИЛОЖЕНИЙ (HUB) ---
ipcMain.on('launch', (event, { data, type }) => {
    if (type === 'sys') {
        // Запуск системных команд или скриптов
        exec(data);
    } else {
        // Запуск сайтов (YouTube TV, Google Keep и т.д.) в новом окне поверх зеркала
        let win = new BrowserWindow({ 
            fullscreen: true, 
            kiosk: true, 
            frame: false,
            backgroundColor: '#000000'
        });
        win.loadURL(data);
        win.on('closed', () => { win = null; });
    }
});

// --- ИНИЦИАЛИЗАЦИЯ ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});