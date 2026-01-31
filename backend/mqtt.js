import mqtt from "mqtt";
import { exec } from "child_process";

// 👇 АДРЕС ТВОЕГО БРОКЕРА
const MQTT_BROKER = "mqtt://82.115.43.240:1883";
// 👇 АДРЕС PYTHON-МОСТА (Локальный сервер на Малине)
const PYTHON_API = "http://localhost:5005/api";

export const setupMqtt = (deviceId, getMainWindow) => {
  console.log('☁️ Connecting to Vector Cloud (82.115.43.240)...');
  
  const client = mqtt.connect(MQTT_BROKER, {
    reconnectPeriod: 5000
  });

  client.on('connect', () => {
    console.log('✅ MQTT Online');
    client.subscribe(`vector/${deviceId}/cmd`);
    client.publish(`vector/${deviceId}/status`, 'ONLINE');
  });

  client.on('message', async (topic, message) => {
    const msgStr = message.toString();
    console.log(`📩 Cloud Command: ${msgStr}`);

    // --- 1. ЭКРАН (Оставляем в Electron, это системные команды) ---
    if (msgStr === 'ON') exec('vcgencmd display_power 1');
    if (msgStr === 'OFF') exec('vcgencmd display_power 0');

    // --- 2. ПЕРЕЗАГРУЗКА (Через Python надежнее, у него sudo) ---
    if (msgStr === 'REBOOT') {
       sendCommandToPython('/system/reboot', {}, 'POST');
    }

    // --- 3. ЛЕНТА (Пересылаем команду Питону) ---
    // Команда приходит вида: "LED_COLOR:255,165,0" или "LED_OFF"
    
    if (msgStr === 'LED_OFF') {
        sendCommandToPython('/led', { state: 'OFF' });
    }
    
    if (msgStr.startsWith('LED_COLOR:')) {
        try {
            // Парсим "255,165,0"
            const rgbStr = msgStr.split(':')[1]; 
            const [r, g, b] = rgbStr.split(',').map(Number);
            const hex = rgbToHex(r, g, b); // Превращаем в #FFA500
            
            // Отправляем приказ Питону
            sendCommandToPython('/led', { state: 'ON', color: hex });
        } catch (e) {
            console.error("Ошибка парсинга цвета:", e);
        }
    }
  });

  client.on('error', (err) => console.log('❌ MQTT Error:', err.message));
  
  return client;
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Функция отправки приказа Питону
async function sendCommandToPython(endpoint, body, method = 'POST') {
    try {
        await fetch(`${PYTHON_API}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) {
        // Ошибки связи не должны ломать приложение, просто пишем в лог
        console.error(`Ошибка отправки в Python (${endpoint}):`, e.message);
    }
}

// Конвертер RGB в HEX (Python ждет HEX)
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}