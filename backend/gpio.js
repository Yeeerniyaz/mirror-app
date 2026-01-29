import i2c from "i2c-bus";

let sensorInterval;
let ws281x;
let channel;

// Константы подключения
const LIGHT_PIN = 21; // GPIO 21 (Физический Пин №40)
const NUM_LEDS = 8;  // Измени на количество диодов в своей ленте
const ADDR_AHT21 = 0x38;
const ADDR_ENS160 = 0x53;

// Динамическая загрузка библиотеки для ленты (только для RPi)
async function initLedLib() {
  try {
    const mod = await import("rpi-ws281x-native");
    ws281x = mod.default;
    
    channel = ws281x(NUM_LEDS, {
      gpio: LIGHT_PIN,
      brightness: 150,
      stripType: ws281x.stripType.WS2812B
    });
    
    console.log("🌈 WS2812B: Библиотека загружена и инициализирована");
    
    // Приветственная вспышка оранжевым при старте
    const pixels = channel.array;
    const orange = (255 << 16) | (165 << 8) | 0;
    for (let i = 0; i < NUM_LEDS; i++) pixels[i] = orange;
    ws281x.render();
    
  } catch (e) {
    console.warn("⚠️ WS2812B: Режим симуляции (на Windows библиотека не работает)");
  }
}

export const setupGpio = async (deviceId, mqttClient, getMainWindow) => {
  await initLedLib();
  console.log("🔌 GPIO: Запуск VECTOR (ENS160 + AHT21)");

  try {
    const bus = await i2c.openPromisified(1);
    
    // Инициализация ENS160 (перевод в рабочий режим)
    await bus.writeByte(ADDR_ENS160, 0x10, 0x02);

    sensorInterval = setInterval(async () => {
      try {
        // --- Чтение AHT21 (Температура и Влажность) ---
        await bus.i2cWrite(ADDR_AHT21, 3, Buffer.from([0xac, 0x33, 0x00]));
        await new Promise(r => setTimeout(r, 100)); // Время на замер
        const ahtBuf = Buffer.alloc(7);
        await bus.i2cRead(ADDR_AHT21, 7, ahtBuf);
        
        const humidity = ((ahtBuf[1] << 12 | ahtBuf[2] << 4 | ahtBuf[3] >> 4) / 0x100000) * 100;
        const temperature = (((ahtBuf[3] & 0x0F) << 16 | ahtBuf[4] << 8 | ahtBuf[5]) / 0x100000) * 200 - 50;

        // --- Чтение ENS160 (Качество воздуха) ---
        const aqi = await bus.readByte(ADDR_ENS160, 0x21) & 0x07;
        const eco2 = await bus.readWord(ADDR_ENS160, 0x24);

        const data = {
          temp: temperature.toFixed(1),
          hum: humidity.toFixed(1),
          co2: eco2,
          aqi: aqi,
          timestamp: Date.now()
        };

        // 1. Отправка в React (на экран зеркала)
        const win = getMainWindow();
        if (win) {
          win.webContents.send('sensors-data', {
            temp: data.temp,
            hum: data.hum,
            co2: data.co2
          });
        }

        // 2. Отправка в облако (MQTT)
        if (mqttClient?.connected) {
          mqttClient.publish(`vector/${deviceId}/sensors`, JSON.stringify(data));
        }

      } catch (err) {
        console.error("❌ Ошибка чтения датчиков:", err.message);
      }
    }, 5000); // Опрос каждые 5 секунд

  } catch (err) {
    console.error("❌ I2C не доступен:", err.message);
  }
};

// Управление лентой
export const controlLed = (command, payload) => {
  if (!ws281x || !channel) return;
  const pixels = channel.array;

  if (command === 'LED_OFF') {
    for (let i = 0; i < NUM_LEDS; i++) pixels[i] = 0;
    ws281x.render();
    console.log("🌈 LED: Выключено");
  } 
  
  else if (command === 'LED_COLOR') {
    // Формат payload: "255,165,0"
    const [r, g, b] = payload.split(',').map(Number);
    const color = (r << 16) | (g << 8) | b;
    for (let i = 0; i < NUM_LEDS; i++) pixels[i] = color;
    ws281x.render();
    console.log(`🌈 LED: Цвет изменен на RGB(${r},${g},${b})`);
  }
};

// Очистка при выключении
export const cleanupGpio = () => {
  if (sensorInterval) clearInterval(sensorInterval);
  if (ws281x) {
    ws281x.reset();
  }
  console.log("🔌 GPIO: Остановлено");
};