import { ipcMain, BrowserWindow, app } from "electron";
import { exec } from "child_process";
import { requestPairingCode, getAliceStatus, logoutAlice } from "./alice.js";
import { socket } from "./socket.js"; 
// ❌ UPDATER ИМПОРТЫ АЛЫП ТАСТАЛДЫ (main.js өзі қосады)
import { saveUserToken } from "./identity.js"; 

export const setupIpc = (deviceId) => {
  
  // 1. ID беру
  ipcMain.handle('get-device-id', () => deviceId);

  // 2. Курсор (мыши)
  ipcMain.on("set-cursor", (event, type) => {
    // Қате шықпас үшін тексеріс қостым
    if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send("cursor-changed", type);
    }
  });

  // 3. Питание (Reboot/Shutdown)
  ipcMain.on("system-cmd", (event, cmd) => {
    if (cmd === "reboot") exec("sudo reboot");
    if (cmd === "shutdown") exec("sudo shutdown -h now");
  });

  // 4. Wi-Fi (GNOME / Linux)
  ipcMain.on("open-wifi-settings", () => {
    const cmd = `
      export DISPLAY=:0;
      export XDG_CURRENT_DESKTOP=GNOME;
      gnome-control-center wifi
    `;
    exec(cmd, (err) => {
      // Fallback
      if (err) exec(`DISPLAY=:0 dbus-send --session --type=method_call --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:"Main.panel.statusArea.aggregateMenu._network.menu.toggle();"`);
    });
  });

  // 5. Запуск приложений
  ipcMain.on("launch", (event, { data, type }) => {
    if (type === "sys") {
      exec(data);
    } else {
      let win = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        frame: false,
        backgroundColor: "#000000",
      });
      win.loadURL(data);
      win.on("closed", () => { win = null; });
    }
  });

  // 6. АЛИСА (Yandex Alice Integration)
  ipcMain.handle('alice:pair', async () => {
    return await requestPairingCode();
  });

  ipcMain.handle('alice:status', () => {
    return getAliceStatus();
  });

  ipcMain.handle('alice:logout', () => {
    return logoutAlice();
  });

  // --- 7. UPDATER ---
  // ❌ 'check-for-updates' тыңдаушысы АЛЫП ТАСТАЛДЫ (updater.js өзі жасайды)

  ipcMain.on('get-app-version', (event) => {
      event.reply('app-version', app.getVersion());
  });

  // --- 8. SOCKET.IO SYNC (Config & Pairing) ---
  
  // A. Config сұрау (React -> Electron -> Server)
  ipcMain.on('get-config', () => {
      console.log("ipc: get-config requested. Asking server...");
      socket.emit('request_config'); 
  });

  // B. Жаңа config келді (Server -> Electron -> React)
  socket.on('config_updated', (newConfig) => {
      console.log("ipc: 🔥 config received from server", newConfig);
      BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) win.webContents.send('config-updated', newConfig);
      });
  });

  // C. СӘТТІ ЖҰПТАУ (Server -> Electron -> React)
  socket.on('pairing_success', (data) => {
      console.log("ipc: 🔗 Pairing Success!", data);
      
      // 1. Токенді файлға сақтаймыз
      if (data.userId) {
          saveUserToken(data.userId);
      }

      // 2. React-қа хабарлаймыз
      BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) win.webContents.send('alice-status-changed', 'online');
      });
  });

  // D. Командалар (Server -> Electron -> React/System)
  socket.on('command', (cmd) => {
      console.log("ipc: 🤖 command received", cmd);
      if (cmd.type === 'reboot') exec("sudo reboot");
      
      BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) win.webContents.send('command', cmd);
      });
  });
};