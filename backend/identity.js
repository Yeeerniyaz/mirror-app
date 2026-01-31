import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// Путь к файлу настроек: /home/yerniyaz/.config/MirrorApp/identity.json
const DATA_PATH = app.getPath('userData');
const IDENTITY_FILE = path.join(DATA_PATH, 'identity.json');

// --- Инициализация ID устройства ---
export const getDeviceId = () => {
  let data = {};
  try {
    if (fs.existsSync(IDENTITY_FILE)) {
      data = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error("Identity Read Error:", e);
  }

  if (!data.deviceId) {
    data.deviceId = `mirror-${uuidv4().slice(0, 8)}`;
    saveIdentity(data);
  }
  return data.deviceId;
};

// --- Работа с Токеном Пользователя ---
export const getUserToken = () => {
  try {
    if (fs.existsSync(IDENTITY_FILE)) {
      const data = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf-8'));
      return data.token || null;
    }
  } catch (e) { return null; }
  return null;
};

export const saveUserToken = (token) => {
  let data = {};
  try {
    if (fs.existsSync(IDENTITY_FILE)) {
      data = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf-8'));
    }
  } catch (e) {}
  
  data.token = token;
  saveIdentity(data);
  console.log("💾 Token Saved!");
};

export const clearUserToken = () => {
  saveUserToken(null);
  console.log("🗑 Token Cleared");
};

// Вспомогательная функция сохранения
function saveIdentity(data) {
  try {
    if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Identity Write Error:", e);
  }
}