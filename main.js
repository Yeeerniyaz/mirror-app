import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GPU жеделдетуді өшіру (Raspberry Pi-де тұрақты жұмыс істеу үшін маңызды)
app.disableHardwareAcceleration(); 

let mainWindow;

/**
 * PYTHON BRIDGE: Датчиктермен байланыс
 */
function startPythonBridge() {
  const isPackaged = app.isPackaged;
  const dbPath = path.join(app.getPath('userData'), 'vector.db');
  const pythonScriptPath = isPackaged
    ? path.join(process.resourcesPath, 'python', 'bridge.py')
    : path.join(__dirname, 'src', 'python', 'bridge.py');

  // Кітапханаларды тексеру (фонда)
  try {
    execSync('python3 -m pip install flask flask-cors smbus2 adafruit-circuitpython-ahtx0 adafruit-circuitpython-ens160 --break-system-packages', { stdio: 'ignore' });
  } catch (e) {
    console.log('Python libs check done.');
  }

  const pyProcess = spawn('python3', [pythonScriptPath, dbPath]);
  pyProcess.stdout.on('data', (data) => console.log(`[Python]: ${data}`));
  pyProcess.stderr.on('data', (data) => console.error(`[Python Error]: ${data}`));
}

/**
 * IPC HANDLERS: Жүйелік командалар
 */

// 1. Сервистерді ашу (YouTube TV, Calendar және т.б.)
ipcMain.on('launch', (event, { data, type, isTV }) => {
    if (type === 'sys') {
        exec(data); // Жүйелік бағдарлама (Calculator, т.б.)
    } else {
        let win = new BrowserWindow({
            fullscreen: true,
            backgroundColor: '#000',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                // YouTube TV үшін Smart TV режимін алдап қосу
                userAgent: isTV ? "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.111 Safari/537.36" : undefined
            }
        });
        win.loadURL(data);
        // ESC басса - терезені жабу
        win.webContents.on('before-input-event', (e, input) => {
            if (input.key === 'Escape') win.close();
        });
    }
});

// 2. Жарықтықты реттеу (Raspberry Pi дисплейі үшін)
ipcMain.on('set-brightness', (event, value) => {
    // Мәнді 0-255 диапазонына айналдыру
    const brightness = Math.round((value / 100) * 255);
    exec(`echo ${brightness} | sudo tee /sys/class/backlight/*/brightness`, (err) => {
        if (err) console.error("Жарықтықты реттеу мүмкін емес. Рұқсат немесе драйвер қатесі.");
    });
});

// 3. Жүйені басқару (Reboot/Shutdown)
ipcMain.on('system-cmd', (event, cmd) => {
    if (cmd === 'reboot') exec('sudo reboot');
    if (cmd === 'shutdown') exec('sudo shutdown -h now');
});

// 4. VECTOR бағдарламасын жаңарту (Update)
ipcMain.on('update-software', () => {
    console.log("Жаңарту басталды...");
    const updateCmd = 'cd ~/projects/vector-standalone && git pull && npm install && npm run build && reboot';
    exec(updateCmd, (err) => {
        if (err) console.error("Жаңарту кезінде қате:", err);
    });
});

/**
 * MAIN WINDOW: Басты терезені ашу
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // React-те window.require жұмыс істеуі үшін
    }
  });

  const url = app.isPackaged 
    ? `file://${path.join(__dirname, 'dist/index.html')}` 
    : 'http://localhost:5173';

  mainWindow.loadURL(url);
}

app.whenReady().then(() => {
  startPythonBridge();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});