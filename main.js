import { app, BrowserWindow, screen, protocol } from "electron";
import path from "path";
import fs from "fs"; // Для работы с конфигом
import { spawn } from "child_process"; // Для запуска Python
import { fileURLToPath } from "url";

// --- МИКРОСЕРВИСЫ ---
import { getDeviceId } from "./backend/identity.js"; 
import { setupMqtt } from "./backend/mqtt.js"; 
import { setupIpc } from "./backend/ipc.js"; 
import { setupUpdater } from "./backend/updater.js";
import { setupBle } from "./backend/ble.js"; // 💎 НОВОЕ: Импорт BLE менеджера

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к общему конфигу для синхронизации с Python
const configPath = path.join(process.cwd(), 'config.json');
let pythonProcess = null; // Храним процесс здесь, чтобы убить его при выходе

/**
 * Автоматическое создание config.json, если он отсутствует.
 * Использует ID, сгенерированный функцией getDeviceId.
 */
function ensureConfigExists(id) {
    if (!fs.existsSync(configPath)) {
        console.log("📄 Конфиг не найден. Создаю config.json с ID:", id);
        const defaultConfig = {
            deviceId: id,
            ledCount: 300,
            city: "Almaty",
            mqttBroker: "82.115.43.240",
            language: "ru",
            kioskMode: true
        };
        try {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            console.log("✅ Общий конфиг успешно создан!");
        } catch (err) {
            console.error("❌ Ошибка записи конфига:", err);
        }
    }
}

/**
 * Запуск Python Bridge как дочернего процесса.
 * Он запустится только ПОСЛЕ того, как мы подготовим конфиг.
 */
function startPythonBridge() {
    // Путь: папка_проекта/python/bridge.py
    const scriptPath = path.join(process.cwd(), 'python', 'bridge.py');
    
    console.log("🚀 Запуск Python Bridge из:", scriptPath);
    
    pythonProcess = spawn('python3', [scriptPath], {
        stdio: 'inherit' // Логи Python будут видны в терминале Electron
    });

    pythonProcess.on('error', (err) => {
        console.error('❌ Не удалось запустить Python Bridge:', err);
    });
}

let mainWindow;

// 1. ИНИЦИАЛИЗАЦИЯ
const deviceId = getDeviceId(); // Получаем уникальный ID
ensureConfigExists(deviceId);   // Сначала создаем файл настроек
startPythonBridge();            // Запускаем Python (для датчиков и системы)
setupBle();                     // 💎 НОВОЕ: Запускаем прямой поиск ESP32 для управления светом

// Настройка связи
const mqttClient = setupMqtt(deviceId, null); //
setupIpc(deviceId, mqttClient); //
setupUpdater(() => mainWindow); //

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
  
  mainWindow.on("closed", () => { 
    mainWindow = null; 
  });

  mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send("app-version", app.getVersion());
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // При закрытии окна убиваем Python, чтобы не висел в процессах
  if (pythonProcess) {
    console.log("🛑 Остановка Python Bridge...");
    pythonProcess.kill();
  }
  
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});