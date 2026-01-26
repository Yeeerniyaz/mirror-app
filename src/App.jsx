import { useState, useEffect } from "react";
import { Box, Progress, Text } from "@mantine/core";
import { useMirrorData } from "./hooks/useMirrorData";

import { Dashboard } from "./pages/Dashboard";
import { Hub } from "./pages/Hub";
import { Settings } from "./pages/Settings";
import { SetupMode } from "./pages/SetupMode";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

export default function App() {
  const [page, setPage] = useState(0);
  const [brightness, setBrightness] = useState(100);
  
  // Достаем resetWifi из нашего хука
  const { 
    time, 
    sensors, 
    weather, 
    news, 
    updStatus, 
    updProgress, 
    appVersion, 
    portalInfo, 
    setUpdStatus,
    resetWifi 
  } = useMirrorData();

  const isConfiguring = portalInfo.needs_setup;

  const launch = (data, type, isTV = false) => ipc?.send("launch", { data, type, isTV });
  const sendCmd = (cmd) => ipc?.send("system-cmd", cmd);
  const updateMirror = () => ipc?.send("check-for-updates");

  const updatePython = async () => {
    setUpdStatus("ОБНОВЛЕНИЕ ДАТЧИКОВ...");
    try {
      const res = await fetch("http://127.0.0.1:5005/api/system/update-python", { method: "POST" });
      setUpdStatus(res.ok ? "PYTHON ОБНОВЛЕН!" : "ОШИБКА СЕРВЕРА");
    } catch (e) { setUpdStatus("PYTHON НЕ ОТВЕЧАЕТ"); }
    setTimeout(() => setUpdStatus(""), 4000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, 2));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Box style={{ backgroundColor: "#000", height: "100vh", width: "100vw", overflow: "hidden", color: "white" }}>
      {isConfiguring && <SetupMode sensors={sensors} portalInfo={portalInfo} />}

      {updStatus && (
        <Box style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10000, width: 350, background: "#111", padding: "15px", border: "1px solid #333", borderRadius: "8px" }}>
          <Text size="xs" fw={900} mb={5} c="orange" ta="center" style={{ letterSpacing: "2px" }}>{updStatus.toUpperCase()}</Text>
          <Progress value={updProgress} color="orange" size="sm" animated />
        </Box>
      )}

      <Box style={{ display: isConfiguring ? "none" : "flex", width: "300vw", height: "100vh", transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)", transform: `translateX(-${page * 100}vw)` }}>
        <Dashboard time={time} weather={weather} sensors={sensors} news={news} />
        <Hub launch={launch} />
        <Settings 
          brightness={brightness} 
          setBrightness={setBrightness} 
          sendCmd={sendCmd} 
          updateMirror={updateMirror} 
          updatePython={updatePython} 
          resetWifi={resetWifi} 
          appVersion={appVersion} 
        />
      </Box>

      {!isConfiguring && (
        <Box style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
          <div style={{ display: "flex", gap: "10px" }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} style={{ width: i === page ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? "white" : "#333", transition: "all 0.3s ease" }} />
            ))}
          </div>
        </Box>
      )}
    </Box>
  );
}