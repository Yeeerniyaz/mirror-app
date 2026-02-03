import mqtt from "mqtt";
import { exec } from "child_process";
import fetch from "node-fetch"; 
import { getUserToken, saveUserToken } from "./identity.js";
// ✅ Убрали импорт sendBleCommand

const MQTT_BROKER = "mqtt://82.115.43.240:1883";
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
    client.subscribe(`vector/${deviceId}/cmd`);
    client.subscribe(`vector/${deviceId}/auth`);
    client.publish(`vector/${deviceId}/status`, 'ONLINE');

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

    // --- 3. ЛЕНТА (LED) -> Возвращаем управление через Python/HTTP 💡 ---
    
    if (msgStr === 'LED_OFF') {
        sendCommandToPython('/led/off', { state: false });
    }
    
    if (msgStr.startsWith('LED_COLOR:')) {
        try {
            const rgbStr = msgStr.split(':')[1]; 
            const [r, g, b] = rgbStr.split(',').map(Number);
            sendCommandToPython('/led/color', { color: [r, g, b] });
        } catch (e) { console.error("Color Error:", e); }
    }

    if (msgStr.startsWith('LED_MODE:')) {
        const mode = msgStr.split(':')[1];
        sendCommandToPython('/led/mode', { mode: mode });
    }
  });

  client.on('error', (err) => console.log('❌ MQTT Error:', err.message));
  
  return client;
};

function startSensorLoop(client, deviceId) {
    if (sensorInterval) clearInterval(sensorInterval);

    sensorInterval = setInterval(async () => {
        try {
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
                client.publish(`vector/${deviceId}/state`, JSON.stringify(payload));
            }
        } catch (e) {
            // Python API пока недоступен — не беда
        }
    }, 30000);
}

async function sendCommandToPython(endpoint, body) {
    try {
        await fetch(`${PYTHON_API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) { 
        // Если Python загружен в Electron, убедись, что API сервер запущен
        console.error("Python API Offline"); 
    }
}