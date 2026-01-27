import { app, BrowserWindow, ipcMain, screen, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { createRequire } from "module";

// Настройка для работы с ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Подключаем модули, которые требуют CommonJS
const { autoUpdater } = require("electron-updater");

let mainWindow;

// Регистрация привилегий для протокола file:// (важно сделать до ready)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "file",
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    kiosk: false,
    frame: false, // Без рамок
    backgroundColor: "#000000",
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Снимает блокировку локальных ресурсов
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  // ПУТЬ К ФАЙЛАМ:
  // В билде AppImage main.js лежит в resources/app.asar/
  // index.html лежит в resources/app.asar/dist/
  const indexPath = isDev
    ? "http://localhost:5173"
    : path.join(__dirname, "dist", "index.html");

  const startUrl = isDev ? indexPath : `file://${indexPath}`;

  console.log("VECTOR OS Loading:", startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- IPC ЛОГИКА (Связь с React) ---

// 1. Управление курсором
ipcMain.on("set-cursor", (event, type) => {
  if (mainWindow) {
    mainWindow.webContents.send("cursor-changed", type);
  }
});

// 2. Системный Wi-Fi (nmtui)
ipcMain.on("open-wifi-settings", () => {
  console.log("!!! VECTOR OS: Запуск системных настроек в ТЕМНОЙ теме...");

  // Мы принудительно выставляем GTK_THEME=Yaru-dark
  // Это заставит окно открыться с черным фоном
  const cmd = `
    export DISPLAY=:0;
    export GTK_THEME=Yaru-dark;
    export XDG_CURRENT_DESKTOP=GNOME;
    export XDG_RUNTIME_DIR=/run/user/$(id -u);
    gnome-control-center wifi
  `;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка запуска: ${error.message}`);
      // Запасной вариант, если Yaru-dark не найден
      exec('DISPLAY=:0 GTK_THEME=Adwaita-dark gnome-control-center wifi');
    }
  });
});

// 3. Питание системы
ipcMain.on("system-cmd", (event, cmd) => {
  console.log(`System Command: ${cmd}`);
  if (cmd === "reboot") exec("sudo reboot");
  if (cmd === "shutdown") exec("sudo shutdown -h now");
});

// 4. Запуск приложений (YouTube TV и др.)
ipcMain.on("launch", (event, { data, type }) => {
  if (type === "sys") {
    // Запуск системных команд или скриптов
    exec(data);
  } else {
    // Запуск сайтов (YouTube TV, Google Keep и т.д.) в новом окне поверх зеркала
    let win = new BrowserWindow({
      fullscreen: true,
      kiosk: true,
      frame: false,
      backgroundColor: "#000000",
    });
    win.loadURL(data);
    win.on("closed", () => {
      win = null;
    });
  }
});

// --- АВТООБНОВЛЕНИЯ (Electron Updater) ---

// --- Обработка обновлений ---

ipcMain.on("check-for-updates", () => {
  console.log("Кнопка нажата, режим packaged:", app.isPackaged);

  if (app.isPackaged) {
    if (mainWindow) {
      mainWindow.webContents.send("update_status", "Поиск обновлений...");
    }
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      if (mainWindow)
        mainWindow.webContents.send("update_status", "Ошибка апдейтера");
    });
  } else {
    if (mainWindow)
      mainWindow.webContents.send("update_status", "Dev-mode: Ок");
  }
});

// Слушатели для AppImage (чтобы текст менялся на экране)
autoUpdater.on("checking-for-update", () => {
  mainWindow?.webContents.send("update_status", "Связь с сервером...");
});

autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("update_status", "Найдена новая версия!");
});

autoUpdater.on("update-not-available", () => {
  mainWindow?.webContents.send("update_status", "У вас актуальная версия");
  setTimeout(() => {
    mainWindow?.webContents.send("update_status", "");
  }, 4000);
});

autoUpdater.on("error", (err) => {
  mainWindow?.webContents.send(
    "update_status",
    "Ошибка: " + err.message.substring(0, 20),
  );
});

autoUpdater.on("download-progress", (p) => {
  mainWindow?.webContents.send("update_progress", p.percent);
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update_status", "Готово! Перезапуск...");
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 3000);
});

// --- ЗАПУСК ПРИЛОЖЕНИЯ ---

app.whenReady().then(() => {
  createWindow();

  // Отправляем версию приложения в React через 3 секунды после старта
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.webContents.send("app-version", app.getVersion());
    }
  }, 3000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
