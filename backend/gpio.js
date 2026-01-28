import { exec } from "child_process";

// Таймеры для симуляции
let sensorInterval;
let ledStatus = { r: 0, g: 0, b: 0, brightness: 0 };

export const setupGpio = (deviceId, mqttClient) => {
  console.log("🔌 GPIO: Запущен режим симуляции (Заглушки)");
  console.log("   - BME280 (Temp/Hum/Press) [VIRTUAL]");
  console.log("   - ENS160 (CO2/TVOC)       [VIRTUAL]");
  console.log("   - WS2812B (LED Strip)     [VIRTUAL]");

  // 1. СИМУЛЯТОР ДАТЧИКОВ (Отправляем данные раз в 5 сек)
  sensorInterval = setInterval(() => {
    if (!mqttClient || !mqttClient.connected) return;

    // Генерируем фейковые данные (как будто дома тепло и свежо)
    const fakeData = {
      bme: {
        temp: (24 + Math.random()).toFixed(1),      // ~24.5 °C
        hum: (45 + Math.random() * 5).toFixed(1),   // ~47%
        press: (760 + Math.random()).toFixed(0)     // ~760 мм рт.ст.
      },
      ens: {
        co2: (400 + Math.random() * 50).toFixed(0), // ~420 ppm (Чистый воздух)
        tvoc: (10 + Math.random() * 5).toFixed(0),  // Индекс качества
        aqi: 1
      },
      timestamp: Date.now()
    };

    // Публикуем в топик: vector/{ID}/sensors
    mqttClient.publish(`vector/${deviceId}/sensors`, JSON.stringify(fakeData));
    // console.log("📡 Sensors data sent:", fakeData); // Раскомментируй для отладки
  }, 5000);
};

// 2. УПРАВЛЕНИЕ ЛЕНТОЙ (Принимает команды от mqtt.js)
export const controlLed = (command, payload) => {
  // command: 'LED_COLOR', 'LED_OFF', 'LED_EFFECT'
  
  if (command === 'LED_OFF') {
    ledStatus = { r: 0, g: 0, b: 0, brightness: 0 };
    console.log("🌈 LED STRIP: OFF");
    // Тут потом будет реальный код: ws281x.reset();
  } 
  
  else if (command === 'LED_COLOR') {
    // Ожидаем payload вида "255,0,0" (Красный)
    const [r, g, b] = payload.split(',').map(Number);
    ledStatus = { r, g, b, brightness: 255 };
    console.log(`🌈 LED STRIP: Color set to R:${r} G:${g} B:${b}`);
    // Тут потом будет реальный код: ws281x.render(pixels);
  }

  else if (command === 'LED_EFFECT') {
    console.log(`🌈 LED STRIP: Playing effect "${payload}"`);
    // Например "RAINBOW" или "ALICE_LISTENING"
  }
};

// Очистка при выходе
export const cleanupGpio = () => {
  if (sensorInterval) clearInterval(sensorInterval);
  console.log("🔌 GPIO: Stopped");
};