import { app, BrowserWindow, ipcMain, screen, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { createRequire } from "module";

// --- НАСТРОЙКА ОКРУЖЕНИЯ ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Модули, требующие CommonJS
const { autoUpdater } = require("electron-updater");

let mainWindow;

// Регистрация протокола file:// (необходимо для загрузки локальных ресурсов в ESM)
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
    kiosk: true, // Режим киоска для VECTOR
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Разрешаем загрузку локального index.html
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  // В AppImage путь ведет внутрь ресурсов .asar
  const indexPath = isDev
    ? "http://localhost:5173"
    : path.join(__dirname, "dist", "index.html");

  const startUrl = isDev ? indexPath : `file://${indexPath}`;

  console.log("VECTOR OS STATUS: Loading", startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- IPC ЛОГИКА (Взаимодействие с React) ---

// 1. Управление курсором (Dashboard vs Settings)
ipcMain.on("set-cursor", (event, type) => {
  if (mainWindow) {
    mainWindow.webContents.send("cursor-changed", type);
  }
});

// 2. Системный Wi-Fi (Вызов меню GNOME через DBus)
ipcMain.on("open-wifi-settings", () => {
  console.log("Запуск системных настроек Wi-Fi...");
  // Команда для вызова настроек Wi-Fi в Ubuntu/Gnome
  exec("gnome-control-center wifi");
  // Если у тебя чистый Raspbian (LXDE), используй:
  // exec('rc_gui'); или просто вызывай панель nm-connection-editor
});

// 3. Системные команды (Питание)
ipcMain.on("system-cmd", (event, cmd) => {
  console.log(`VECTOR OS: Executing ${cmd}`);
  if (cmd === "reboot") exec("sudo reboot");
  if (cmd === "shutdown") exec("sudo shutdown -h now");
});

// 4. Запуск внешних приложений
ipcMain.on("launch", (event, { data, type, isTV }) => {
  console.log(`VECTOR OS: Launching external ${type} content`);
});

// --- АВТООБНОВЛЕНИЯ ---

ipcMain.on("check-for-updates", () => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("update_status", "Доступно обновление...");
});

autoUpdater.on("download-progress", (p) => {
  mainWindow?.webContents.send("update_progress", p.percent);
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update_status", "Готово к установке");
  autoUpdater.quitAndInstall();
});

// --- ЗАПУСК ---

app.whenReady().then(() => {
  createWindow();

  // Передача версии в React для отображения в Settings
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
