import { BrowserWindow, session } from 'electron';
import { getUserToken, saveUserToken, clearUserToken } from './identity.js';
import { setupMqtt } from './mqtt.js';

// Адрес твоего облака
const AUTH_URL = 'https://vector.yeee.kz/auth'; 
const LOGIN_API_URL = 'https://vector.yeee.kz/login';

let authWindow = null;

// --- 1. ПРОВЕРКА СТАТУСА ---
export const getAliceStatus = () => {
  const token = getUserToken();
  return { 
    status: token ? "online" : "disconnected",
    token: token ? "SECRET" : null 
  };
};

// --- 2. ВХОД ЧЕРЕЗ ОКНО (Magic) ---
export const loginYandex = async () => {
  console.log("🚀 Starting Auth Flow...");

  return new Promise((resolve) => {
    // Создаем окно авторизации (поверх киоска)
    authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      alwaysOnTop: true, // Чтобы было видно поверх зеркала
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    // Чистим куки перед входом, чтобы можно было сменить аккаунт
    session.defaultSession.clearStorageData();

    // Загружаем твою страницу входа
    authWindow.loadURL(AUTH_URL);

    // 🕵️‍♂️ ШПИОН: Перехватываем ответ от сервера на запрос /login
    // Твой сервер возвращает JSON { token: "..." } при успехе.
    // Electron умеет читать этот ответ.
    const filter = { urls: [LOGIN_API_URL] };

    session.defaultSession.webRequest.onCompleted(filter, (details) => {
      // К сожалению, прочитать тело ответа в onCompleted сложно (безопасность).
      // Поэтому мы используем трюк: 
      // Если статус 200 на POST /login -> значит успех.
      // А токен мы вытащим через инъекцию JS.
      
      if (details.statusCode === 200 && details.method === 'POST') {
        console.log("✅ Login Success Detected!");
        
        // Внедряем код в страницу, чтобы забрать токен из LocalStorage или ответа
        // В твоем случае authController.js просто отдает JSON.
        // Самый простой способ для текущего бэкенда:
        // Пользователь ввел данные -> Сервер ответил JSON.
        // Браузер отобразит этот JSON. Мы прочитаем текст страницы.
        
        setTimeout(async () => {
            try {
                // Читаем содержимое страницы (там должен быть JSON)
                const pageText = await authWindow.webContents.executeJavaScript('document.body.innerText');
                const response = JSON.parse(pageText);

                if (response.token) {
                    saveUserToken(response.token);
                    console.log("🔑 Token Captured:", response.token);
                    
                    // Перезапускаем MQTT с новым токеном
                    // (Здесь нужен deviceId, но mqtt.js сам его возьмет, если мы рестартнем app,
                    // но лучше просто уведомить интерфейс)
                    
                    authWindow.close();
                    resolve({ success: true, token: response.token });
                }
            } catch (e) {
                console.error("Auth Parsing Error:", e);
            }
        }, 1000);
      }
    });

    authWindow.on('closed', () => {
      authWindow = null;
      resolve({ success: false, reason: "closed_by_user" });
    });
  });
};

// --- 3. ВЫХОД ---
export const logoutAlice = () => {
  clearUserToken();
  return { success: true };
};