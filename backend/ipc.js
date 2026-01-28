import { ipcMain, BrowserWindow } from "electron";
import { exec } from "child_process";

export const setupIpc = (deviceId) => {
  
  // 1. Отдаем ID в React
  ipcMain.handle('get-device-id', () => deviceId);

  // 2. Курсор (мыши)
  ipcMain.on("set-cursor", (event, type) => {
    // Отправляем обратно отправителю (окну)
    event.sender.send("cursor-changed", type);
  });

  // 3. Питание
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
      if (err) exec(`DISPLAY=:0 dbus-send --session --type=method_call --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:"Main.panel.statusArea.aggregateMenu._network.menu.toggle();"`);
    });
  });

  // 5. Запуск приложений (YouTube TV и др.)
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
};