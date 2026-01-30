import { app, BrowserWindow, screen, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// --- МИКРОСЕРВИСЫ ---
import { getDeviceId } from "./backend/identity.js";
import { setupMqtt } from "./backend/mqtt.js";
import { setupIpc } from "./backend/ipc.js";
import { setupUpdater } from "./backend/updater.js";
// ❌ УДАЛЕНО: import { setupGpio... } — Это больше не нужно!

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// 1. ИНИЦИАЛИЗАЦИЯ
const deviceId = getDeviceId();

// 👇 ВАЖНО: Передаем mainWindow, чтобы MQTT мог отправлять данные от Python на экран
const mqttClient = setupMqtt(deviceId, () => mainWindow);

// ❌ УДАЛЕНО: setupGpio(...) — Теперь этим занимается Python!

// 👇 ВАЖНО: Передаем mqttClient, чтобы React мог отправлять команды Python'у
setupIpc(deviceId, mqttClient);

setupUpdater(() => mainWindow);

protocol.registerSchemesAsPrivileged([
  { scheme: "file", privileges: { standard: true, secure: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    kiosk: false, // В продакшене поставь true
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  const isDev = process.env.NODE_ENV === "development";
  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "dist", "index.html")}`;

  console.log("VECTOR OS Loading:", startUrl);
  mainWindow.loadURL(startUrl);
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send("app-version", app.getVersion());
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // ❌ УДАЛЕНО: cleanupGpio() — Python сам разберется
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});