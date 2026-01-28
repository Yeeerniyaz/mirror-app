import { app, ipcMain } from "electron";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { autoUpdater } = require("electron-updater");

// Функция принимает "getter" для окна, так как окно создается позже
export const setupUpdater = (getMainWindow) => {
  
  const sendStatus = (text) => {
    const win = getMainWindow();
    if (win) win.webContents.send("update_status", text);
  };

  // IPC слушатель от кнопки в React
  ipcMain.on("check-for-updates", () => {
    if (app.isPackaged) {
      sendStatus("Поиск обновлений...");
      autoUpdater.checkForUpdatesAndNotify().catch(() => sendStatus("Ошибка апдейтера"));
    } else {
      sendStatus("Dev-mode: обновления отключены");
    }
  });

  // События авто-апдейтера
  autoUpdater.on("checking-for-update", () => sendStatus("Связь с сервером..."));
  autoUpdater.on("update-available", () => sendStatus("Найдена новая версия!"));
  autoUpdater.on("update-not-available", () => {
    sendStatus("У вас актуальная версия");
    setTimeout(() => sendStatus(""), 4000);
  });
  autoUpdater.on("error", (err) => sendStatus("Ошибка: " + err.message.substring(0, 20)));
  
  autoUpdater.on("download-progress", (p) => {
    const win = getMainWindow();
    if (win) win.webContents.send("update_progress", p.percent);
  });

  autoUpdater.on("update-downloaded", () => {
    sendStatus("Готово! Перезапуск...");
    setTimeout(() => autoUpdater.quitAndInstall(), 3000);
  });
};