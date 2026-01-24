import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';


app.disableHardwareAcceleration(); // <--- Raspberry Pi үшін GPU-ды өшіру (қателерді кетіреді)

// ... қалған код

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function startPythonBridge() {
  const isPackaged = app.isPackaged;
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'vector.db');
  
  // Определяем путь к Python-скрипту (в разработке и в AppImage)
  const pythonScriptPath = isPackaged
    ? path.join(process.resourcesPath, 'python', 'bridge.py')
    : path.join(__dirname, 'src', 'python', 'bridge.py');

  // Шаг 1: Проверка и установка библиотек перед запуском
  try {
    // Проверяем наличие Flask и CORS
    execSync('python3 -c "import flask, flask_cors"', { stdio: 'ignore' });
  } catch (e) {
    console.log('Библиотеки Python не найдены. Устанавливаю...');
    try {
      execSync('pip3 install flask flask-cors smbus2 adafruit-circuitpython-ahtx0 adafruit-circuitpython-ens160', { stdio: 'inherit' });
    } catch (err) {
      console.error('Ошибка при установке библиотек:', err);
    }
  }

  // Шаг 2: Запуск процесса. Передаем путь к БД как первый аргумент
  const pyProcess = spawn('python3', [pythonScriptPath, dbPath]);

  pyProcess.stdout.on('data', (data) => console.log(`[Python]: ${data}`));
  pyProcess.stderr.on('data', (data) => console.error(`[Python Error]: ${data}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000'
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  startPythonBridge(); // Запускаем бэкенд перед окном
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});