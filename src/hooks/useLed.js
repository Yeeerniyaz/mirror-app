import { useState } from 'react';

// Python Bridge адресі
const API_BASE = "http://localhost:5005";

export function useLed() {
  const [loading, setLoading] = useState(false);

  // Универсалды сұрау жіберуші функция
  const sendRequest = async (endpoint, body) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("LED Control Error:", e);
    }
    setLoading(false);
  };

  return {
    loading,

    // 1. Түсті өзгерту (RGB)
    setColor: (r, g, b) => sendRequest('/led/color', { color: [r, g, b] }),

    // 2. Режимді ауыстыру (RAINBOW, FIRE, GEMINI...)
    setMode: (mode) => sendRequest('/led/mode', { mode }),

    // 3. Жарықтық (0-255)
    setBrightness: (val) => sendRequest('/led/brightness', { value: parseInt(val) }),

    // 4. Жылдамдық (0-100)
    setSpeed: (val) => sendRequest('/led/speed', { value: parseInt(val) }),

    // 5. Өшіру
    turnOff: () => sendRequest('/led/off', {}),
  };
}