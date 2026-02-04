import { useEffect } from "react";

// Python сервер адресі (useLed-пен бірдей)
const API_BASE = "http://localhost:5005";
const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useHardwareBridge() {
  useEffect(() => {
    if (!ipc) return;

    // Electron-нан "command" келгенде іске қосылады
    const handleCommand = (_event, cmd) => {
      console.log("⚡ React: Command received via IPC ->", cmd);

      // 1. LED командасы (Түс, Режим, ON/OFF)
      if (cmd.led) {
        fetch(`${API_BASE}/led/command`, { // Python-да осы endpoint бар екеніне көз жеткіз, немесе бөліп жібер
           // Егер Python-да бөлек-бөлек болса, switch қолданамыз:
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(cmd.led) 
        }).then(() => console.log("✅ LED command sent to Python"))
          .catch(e => console.error("❌ LED Error:", e));
        
        // ЕСКЕРТУ: Python жағында (app.py) әмбебап қабылдағыш болмаса, 
        // useLed-тегідей нақты endpoint-терге бөлу керек:
        if (cmd.led.color) sendToPython('/led/color', { color: cmd.led.color });
        if (cmd.led.mode) sendToPython('/led/mode', { mode: cmd.led.mode });
        if (typeof cmd.led.on === 'boolean') {
             if (cmd.led.on) sendToPython('/led/on', {}); // Немесе логикаңа қарай
             else sendToPython('/led/off', {});
        }
      }

      // 2. Экран командасы
      if (cmd.screen) {
        // Python-да экранды басқаратын endpoint болса
        fetch(`${API_BASE}/screen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cmd.screen)
        }).catch(e => console.error("❌ Screen Error:", e));
      }
    };

    ipc.on("command", handleCommand);
    return () => ipc.removeListener("command", handleCommand);
  }, []);
}

// Көмекші функция
function sendToPython(endpoint, body) {
    fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).catch(e => console.error(`❌ Python Error [${endpoint}]:`, e));
}