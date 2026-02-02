import mqtt from "mqtt";
import { exec } from "child_process";
import fetch from "node-fetch"; 
import { getUserToken, saveUserToken } from "./identity.js";
import { sendBleCommand } from "./ble.js"; // 💎 ИМПОРТ ФУНКЦИИ BLE

// 👇 АДРЕС ТВОЕГО БРОКЕРА
const MQTT_BROKER = "mqtt://82.115.43.240:1883";
// 👇 АДРЕС PYTHON-МОСТА (оставляем для датчиков)
const PYTHON_API = "http://localhost:5005";

let sensorInterval = null;

export const setupMqtt = (deviceId, mainWindow) => {
  const token = getUserToken(); 
  
  console.log(`☁️ Connecting to Vector Cloud [${deviceId}]...`);

  const client = mqtt.connect(MQTT_BROKER, {
    reconnectPeriod: 5000,
    clientId: deviceId,
    username: deviceId, 
    password: token || "anon"
  });

  client.on('connect', () => {
    console.log('✅ MQTT Online');
    
    // Подписываемся на команды управления
    client.subscribe(`vector/${deviceId}/cmd`);
    // Подписываемся на авторизацию
    client.subscribe(`vector/${deviceId}/auth`);
    
    // Сообщаем, что мы живы
    client.publish(`vector/${deviceId}/status`, 'ONLINE');

    // 👇 ЗАПУСКАЕМ ОТПРАВКУ ДАТЧИКОВ (Каждые 30 сек)
    startSensorLoop(client, deviceId);
  });

  client.on('message', async (topic, message) => {
    const msgStr = message.toString();
    console.log(`📩 Cloud MSG: ${msgStr}`);

    // --- 0. АВТОРИЗАЦИЯ ---
    if (topic.includes('/auth')) {
        try {
            const data = JSON.parse(msgStr);
            if (data.type === 'AUTH_SUCCESS') {
                console.log("🔓 MQTT Auth Success!");
                saveUserToken("LINKED_VIA_CLOUD");
                if (mainWindow) mainWindow.webContents.send('alice-status-changed', 'online');
            }
        } catch (e) { console.error("Auth Error:", e); }
    }

    // --- 1. ЭКРАН ---
    if (msgStr === 'ON') exec('vcgencmd display_power 1');
    if (msgStr === 'OFF') exec('vcgencmd display_power 0');

    // --- 2. ПЕРЕЗАГРУЗКА ---
    if (msgStr === 'REBOOT') sendCommandToPython('/system/reboot', { action: 'reboot' });

    // --- 3. ЛЕНТА (LED) -> ТЕПЕРЬ ЧЕРЕЗ BLE 💎 ---
    
    // Выключение
    if (msgStr === 'LED_OFF') {
        sendBleCommand('OFF'); 
    }
    
    // Яркость (ESP32 пока не поддерживает команду яркости через BLE,
    // но если допишешь в main.py, можно будет раскомментировать)
    /*
    if (msgStr.startsWith('LED_BRIGHT:')) {
        const val = parseInt(msgStr.split(':')[1]);
        // sendBleCommand({ brightness: val }); // Нужно добавить поддержку в ESP32
    }
    */

    // Цвет
    if (msgStr.startsWith('LED_COLOR:')) {
        try {
            const rgbStr = msgStr.split(':')[1]; 
            const [r, g, b] = rgbStr.split(',').map(Number);
            // Отправляем JSON, как ждет ESP32
            sendBleCommand({ color: [r, g, b] });
        } catch (e) { console.error("Color Error:", e); }
    }

    // Режимы (FIRE, RAINBOW, POLICE...)
    if (msgStr.startsWith('LED_MODE:')) {
        const mode = msgStr.split(':')[1];
        // Отправляем название режима текстом
        sendBleCommand(mode);
    }
  });

  client.on('error', (err) => console.log('❌ MQTT Error:', err.message));
  
  return client;
};

// 👇 ФУНКЦИЯ: Опрос датчиков и отправка в облако
function startSensorLoop(client, deviceId) {
    if (sensorInterval) clearInterval(sensorInterval);

    sensorInterval = setInterval(async () => {
        try {
            // 1. Спрашиваем у Python данные датчиков (CO2, Temp и т.д.)
            const res = await fetch(`${PYTHON_API}/api/sensors`); 
            
            if (res.ok) {
                const data = await res.json();
                
                const payload = {
                    temp: data.temp || 0,
                    hum: data.hum || 0,
                    co2: data.co2 || 400,
                    pressure: data.pressure || 760,
                    on: true 
                };

                // 2. Отправляем в Облако
                client.publish(`vector/${deviceId}/state`, JSON.stringify(payload));
            }
        } catch (e) {
            // Тихо игнорируем ошибки связи с локальным Python-сервером
        }
    }, 30000); // 30 секунд
}

async function sendCommandToPython(endpoint, body) {
    try {
        await fetch(`${PYTHON_API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) { console.error("Python Bridge Error"); }
}