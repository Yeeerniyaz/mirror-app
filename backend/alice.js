import { net } from 'electron';
import { getDeviceId, getUserToken, clearUserToken } from './identity.js';

// Адрес твоего сервера
const CLOUD_URL = 'https://vector.yeee.kz';

// --- 1. ПРОВЕРКА СТАТУСА ---
export const getAliceStatus = () => {
  const token = getUserToken();
  return { 
    status: token ? "online" : "disconnected",
    token: token ? "LINKED" : null 
  };
};

// --- 2. ЗАПРОС КОДА (PAIRING) ---
// Новая функция: Зеркало просит у сервера цифры для привязки
export const requestPairingCode = () => {
  console.log("🚀 Requesting Pairing Code...");

  return new Promise((resolve) => {
    const deviceId = getDeviceId();
    
    // Создаем HTTP запрос к серверу
    const request = net.request({
      method: 'POST',
      url: `${CLOUD_URL}/pair`,
      headers: { 'Content-Type': 'application/json' }
    });

    // Обработка ответа
    request.on('response', (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          if (response.statusCode === 200) {
            const json = JSON.parse(data);
            console.log("🔢 Code Received:", json.code);
            resolve({ success: true, code: json.code });
          } else {
            console.error("❌ Pair Request Failed:", response.statusCode, data);
            resolve({ success: false, error: "server_error" });
          }
        } catch (e) {
          console.error("JSON Parse Error:", e);
          resolve({ success: false, error: "parse_error" });
        }
      });
    });

    request.on('error', (err) => {
      console.error("❌ Network Error:", err);
      resolve({ success: false, error: "network_error" });
    });

    // Отправляем ID устройства в теле запроса и завершаем
    request.write(JSON.stringify({ deviceId }));
    request.end();
  });
};

// --- 3. ВЫХОД ---
export const logoutAlice = () => {
  clearUserToken();
  return { success: true };
};