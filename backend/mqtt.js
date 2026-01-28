import mqtt from "mqtt";
import { exec } from "child_process";
import { controlLed } from "./gpio.js"; 

// 👇 НОВЫЙ АДРЕС БРОКЕРА
const MQTT_BROKER = "mqtt://82.115.43.240:1883";

export const setupMqtt = (deviceId) => {
  console.log('☁️ Connecting to Vector Cloud (82.115.43.240)...');
  
  const client = mqtt.connect(MQTT_BROKER, {
    reconnectPeriod: 5000
  });

  client.on('connect', () => {
    console.log('✅ MQTT Online');
    client.subscribe(`vector/${deviceId}/cmd`);
    client.publish(`vector/${deviceId}/status`, 'ONLINE');
  });

  client.on('message', (topic, message) => {
    const msgStr = message.toString();
    console.log(`📩 Cloud Command: ${msgStr}`);

    // --- СИСТЕМНЫЕ КОМАНДЫ ---
    if (msgStr === 'ON') exec('vcgencmd display_power 1');
    if (msgStr === 'OFF') exec('vcgencmd display_power 0');
    if (msgStr === 'REBOOT') exec('sudo reboot');

    // --- ЛЕНТА ---
    if (msgStr.startsWith('LED_')) {
      const parts = msgStr.split(':');
      controlLed(parts[0], parts[1]);
    }
  });

  client.on('error', (err) => console.log('❌ MQTT Error:', err.message));
  
  return client;
};