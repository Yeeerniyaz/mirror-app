import { useState } from 'react';

const API_URL = "http://localhost:5005/api/led";

export function useLed() {
  const [loading, setLoading] = useState(false);

  // Универсальная функция отправки
  const sendCmd = async (payload) => {
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("LED Error:", e);
    }
    setLoading(false);
  };

  // Готовые методы для кнопок
  const setMode = (mode) => sendCmd({ mode });
  const setColor = (r, g, b) => sendCmd({ mode: "STATIC", color: [r, g, b] });
  const setBrightness = (val) => sendCmd({ bright: parseFloat(val) });
  const setSpeed = (val) => sendCmd({ speed: parseInt(val) });
  const setLedsCount = (num) => sendCmd({ config: { num: parseInt(num) } });
  
  // Выключение
  const turnOff = () => sendCmd({ mode: "OFF" });

  return { 
    loading, 
    setMode, 
    setColor, 
    setBrightness, 
    setSpeed, 
    setLedsCount,
    turnOff 
  };
}