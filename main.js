import { app, BrowserWindow, screen, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// --- МИКРОСЕРВИСЫ ---
import { getDeviceId } from "./backend/identity.js";
import { setupMqtt } from "./backend/mqtt.js";
import { setupIpc } from "./backend/ipc.js";
import { setupUpdater } from "./backend/updater.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// 1. ИНИЦИАЛИЗАЦИЯ
const deviceId = getDeviceId();

// 👇 ИСПРАВЛЕНО: Передаем null, так как окно еще не создано.
// (Наша версия mqtt.js пока не умеет работать с функцией-геттером)
const mqttClient = setupMqtt(deviceId, null);

// 👇 Передаем mqttClient, чтобы React мог отправлять команды Python'у
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
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});