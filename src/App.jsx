import { useState, useEffect } from "react";
import { Box, Progress, Text, MantineProvider } from "@mantine/core";
import { useMirrorData } from "./hooks/useMirrorData";

import { Dashboard } from "./pages/Dashboard";
import { Hub } from "./pages/Hub";
import { Settings } from "./pages/Settings";

import { useHardwareBridge } from "./hooks/useHardwareBridge";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

export default function App() {
  useHardwareBridge();
  const [page, setPage] = useState(0);
  const TOTAL_PAGES = 3; // Енді тек 3 бет

  const {
    time,
    sensors,
    weather,
    news,
    updStatus,
    updProgress,
    appVersion,
    setUpdStatus,
    config,
  } = useMirrorData();

  // --- СИСТЕМНЫЕ КОМАНДЫ ---
  const openWifiSettings = () => ipc?.send("open-wifi-settings");
  const updateMirror = () => ipc?.send("check-for-updates");

  const sendCmd = (cmd) => {
    setUpdStatus(`ВЫПОЛНЕНИЕ: ${cmd.toUpperCase()}...`);
    ipc?.send("system-cmd", cmd);
    setTimeout(() => setUpdStatus(""), 2000);
  };

  // --- LOOP (БЕСКОНЕЧНЫЙ) НАВИГАЦИЯ ЛОГИКАСЫ ---
  const nextPage = () => setPage((p) => (p === TOTAL_PAGES - 1 ? 0 : p + 1));
  const prevPage = () => setPage((p) => (p === 0 ? TOTAL_PAGES - 1 : p - 1));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === " ") nextPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark">
      <Box
        style={{
          backgroundColor: "#000",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          color: "white",
          cursor: page === 0 ? "none" : "default",
        }}
      >
        {/* UPDATES BAR */}
        {updStatus && (
          <Box
            style={{
              position: "fixed",
              top: 40,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10000,
              width: 320,
              background: "rgba(5,5,5,0.95)",
              padding: "20px",
              border: "1px solid #111",
              borderRadius: "4px",
            }}
          >
            <Text
              size="xs"
              fw={900}
              mb={updProgress > 0 ? 10 : 0}
              ta="center"
              style={{ letterSpacing: "3px" }}
            >
              {updStatus.toUpperCase()}
            </Text>
            {updProgress > 0 && (
              <Progress value={updProgress} color="white" size="xs" animated />
            )}
          </Box>
        )}

        {/* СЛАЙДЕР (3 BET) */}
        <Box
          style={{
            display: "flex",
            width: "300vw", // 400vw-дан 300vw-ға өзгертілді
            height: "100vh",
            transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: `translateX(-${page * 100}vw)`,
          }}
        >
          {/* 1. DASHBOARD */}
          <Box style={{ width: "100vw", height: "100vh" }}>
            <Dashboard
              time={time}
              weather={weather}
              sensors={sensors}
              news={news}
              config={config}
            />
          </Box>

          {/* 2. HUB */}
          <Box style={{ width: "100vw", height: "100vh" }}>
            <Hub setPage={setPage} />
          </Box>

          {/* 3. SETTINGS (LedControl осы беттің ішінде) */}
          <Box style={{ width: "100vw", height: "100vh" }}>
            <Settings
              sendCmd={sendCmd}
              updateMirror={updateMirror}
              appVersion={appVersion}
              openWifiSettings={openWifiSettings}
              config={config}
            />
          </Box>
        </Box>

        {/* DOTS (ИНДИКАТОРЛАР) */}
        <Box
          style={{
            position: "fixed",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", gap: "15px" }}>
            {[0, 1, 2].map((i) => ( // Массив 0, 1, 2 болып қысқартылды
              <Box
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: i === page ? 25 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === page ? "white" : "#333",
                  border: i === page ? "none" : "1px solid #444",
                  transition: "all 0.4s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </Box>
      </Box>
    </MantineProvider>
  );
}