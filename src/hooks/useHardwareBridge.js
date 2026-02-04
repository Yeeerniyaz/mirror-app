import { useEffect } from 'react';

const PYTHON_API = "http://127.0.0.1:5005";

export const useHardwareBridge = () => {
  // HSV форматын RGB-ге айналдыру (Python Bridge үшін)
  const hsvToRgb = (h, s, v) => {
    s /= 100;
    v /= 100;
    let r, g, b;
    let i = Math.floor(h / 60);
    let f = h / 60 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = 0; g = 0; b = 0;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Python-ға дерек жіберу
  const sendToHardware = async (endpoint, body) => {
    try {
      const response = await fetch(`${PYTHON_API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        console.log(`✅ Sent to Python: ${endpoint}`, body);
      } else {
        console.warn(`⚠️ Python responded with error for ${endpoint}: ${response.status}`);
      }
    } catch (e) {
      console.error("❌ Python Bridge Error:", e.message);
    }
  };

  useEffect(() => {
    const electron = window.require ? window.require("electron").ipcRenderer : null;
    if (!electron) {
      console.warn("🔗 Bridge: Electron IPC not found. Make sure you are in Electron environment.");
      return;
    }

    console.log("🔗 Bridge active: Listening for commands...");

    const handleCommand = (event, command) => {
      console.log("🤖 Received in Hook:", command);

      if (!command) return;

      // --- 1. ЭКРАНДЫ БАСҚАРУ (HDMI Power) ---
      // Бұл бөлім Dashboard-тағы SCR батырмасы үшін жауап береді
      if (command.screen !== undefined) {
        const screenState = typeof command.screen === 'object' ? command.screen.on : command.screen;
        console.log("🖥 Sending Screen Command to Bridge:", screenState);
        sendToHardware("/screen", { on: !!screenState });
      }

      // --- 2. LED ЖАРЫҒЫН БАСҚАРУ ---
      if (command.led) {
        const { color, mode, on, brightness, speed } = command.led;

        // Өшіру/Қосу
        if (on === false) {
          sendToHardware("/led/off", {});
        } else if (on === true && !color && !mode) {
          sendToHardware("/led/on", {});
        }

        // Түс (RGB айналдыру)
        if (color) {
          const rgb = hsvToRgb(color.h, color.s, color.v);
          sendToHardware("/led/color", { color: rgb });

          if (mode) {
            setTimeout(() => sendToHardware("/led/mode", { mode: mode.toUpperCase() }), 100);
          }
        } 
        // Тек режимді ауыстыру
        else if (mode) {
          sendToHardware("/led/mode", { mode: mode.toUpperCase() });
        }

        // Жарықтық (Brightness)
        if (brightness !== undefined) {
          sendToHardware("/led/brightness", { value: parseInt(brightness) });
        }

        // Жылдамдық (Speed)
        if (speed !== undefined) {
          sendToHardware("/led/speed", { value: parseInt(speed) });
        }
      }
    };

    electron.on("command", handleCommand);
    return () => electron.removeAllListeners("command");
  }, []);

  return null;
};