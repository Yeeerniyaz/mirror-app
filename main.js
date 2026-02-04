import { app, BrowserWindow, screen, protocol } from "electron";
import path from "path";
import fs from "fs"; 
import { fileURLToPath } from "url";

// --- МИКРОСЕРВИСЫ ---
import { getDeviceId } from "./backend/identity.js";
// ❌ MQTT алып тасталды
import { setupIpc } from "./backend/ipc.js";
import { setupUpdater } from "./backend/updater.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к конфигу
const configPath = path.join(process.cwd(), 'config.json');

/**
 * Создает config.json, если его нет.
 */
function ensureConfigExists(id) {
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            deviceId: id,
            ledCount: 300,
            city: "Almaty",
            // mqttBroker жойылды, енді керек емес
            language: "ru",
            kioskMode: true
        };
        try {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            console.log("✅ Конфиг создан");
        } catch (err) {
            console.error("❌ Ошибка записи:", err);
        }
    }
}

let mainWindow;

// 1. ИНИЦИАЛИЗАЦИЯ
const deviceId = getDeviceId();
ensureConfigExists(deviceId);

// Socket.IO логикасы енді setupIpc немесе бөлек модулде (socket.js) жүреді
// MQTT клиентін құруды алып тастадық

setupIpc(deviceId); // ✅ mqttClient аргументі енді керек емес
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
    kiosk: true, // Включаем режим киоска для VECTOR OS
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

  mainWindow.loadURL(startUrl);
  
  mainWindow.on("closed", () => { 
    mainWindow = null; 
  });

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