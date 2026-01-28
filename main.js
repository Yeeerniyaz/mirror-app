import { app, BrowserWindow, screen, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// --- МИКРОСЕРВИСЫ ---
import { getDeviceId } from "./backend/identity.js";
import { setupMqtt } from "./backend/mqtt.js";
import { setupIpc } from "./backend/ipc.js";
import { setupUpdater } from "./backend/updater.js";
import { setupGpio, cleanupGpio } from "./backend/gpio.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// 1. ИНИЦИАЛИЗАЦИЯ
const deviceId = getDeviceId();          
const mqttClient = setupMqtt(deviceId);  

// 👇 ВАЖНОЕ ИЗМЕНЕНИЕ: Передаем () => mainWindow третьим аргументом
setupGpio(deviceId, mqttClient, () => mainWindow); 

setupIpc(deviceId);                      
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
    kiosk: false, // Для тестов false, потом true
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
  cleanupGpio(); // Останавливаем таймеры
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});