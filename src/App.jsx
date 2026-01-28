import { useState, useEffect } from "react";
import { Box, Progress, Text, MantineProvider } from "@mantine/core";
import { useMirrorData } from "./hooks/useMirrorData";

import { Dashboard } from "./pages/Dashboard";
import { Hub } from "./pages/Hub";
import { Settings } from "./pages/Settings";

// Подключаем IPC для Electron
const ipc = window.require ? window.require("electron").ipcRenderer : null;

export default function App() {
  const [page, setPage] = useState(0);

  // Данные из хука (погода, новости и т.д.)
  const {
    time,
    sensors,
    weather,
    news,
    updStatus,
    updProgress,
    appVersion,
    setUpdStatus,
  } = useMirrorData();

  // --- СИСТЕМНЫЕ КОМАНДЫ (ЧЕРЕЗ ELECTRON) ---
  
  const openWifiSettings = () => ipc?.send("open-wifi-settings");
  
  const launch = (data, type, isTV = false) => ipc?.send("launch", { data, type, isTV });
  
  const updateMirror = () => ipc?.send("check-for-updates");

  // Команды для системного меню (перезагрузка и т.д.)
  // Теперь мы шлем их просто в Electron, он сам разберется
  const sendCmd = (cmd) => {
    setUpdStatus(`ВЫПОЛНЕНИЕ: ${cmd.toUpperCase()}...`);
    ipc?.send("system-cmd", cmd);
    setTimeout(() => setUpdStatus(""), 2000);
  };

  // --- НАВИГАЦИЯ КЛАВИШАМИ ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, 2));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
      // Для отладки: пробел переключает страницы по кругу
      if (e.key === " ") setPage((p) => (p + 1) % 3);
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
          // Скрываем курсор только на главном экране
          cursor: page === 0 ? "none" : "default",
        }}
      >
        {/* ВЕРХНИЙ БАР ОБНОВЛЕНИЙ */}
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
            <Text size="xs" fw={900} mb={updProgress > 0 ? 10 : 0} ta="center" style={{ letterSpacing: "3px" }}>
              {updStatus.toUpperCase()}
            </Text>
            {updProgress > 0 && (
              <Progress value={updProgress} color="white" size="xs" animated />
            )}
          </Box>
        )}

        {/* СЛАЙДЕР СТРАНИЦ */}
        <Box
          style={{
            display: "flex",
            width: "300vw",
            height: "100vh",
            transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: `translateX(-${page * 100}vw)`,
          }}
        >
          {/* СТРАНИЦА 0: ГЛАВНЫЙ ЭКРАН */}
          <Dashboard time={time} weather={weather} sensors={sensors} news={news} />
          
          {/* СТРАНИЦА 1: ПРИЛОЖЕНИЯ */}
          <Hub launch={launch} />
          
          {/* СТРАНИЦА 2: НАСТРОЙКИ */}
          <Settings
            sendCmd={sendCmd}
            updateMirror={updateMirror}
            appVersion={appVersion}
            openWifiSettings={openWifiSettings}
          />
        </Box>

        {/* ИНДИКАТОРЫ СТРАНИЦ (ТОЧКИ) */}
        <Box style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
          <div style={{ display: "flex", gap: "15px" }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                onClick={() => setPage(i)} // Можно кликнуть мышкой
                style={{
                  width: i === page ? 25 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === page ? "white" : "#111",
                  border: i === page ? "none" : "1px solid #222",
                  transition: "all 0.4s ease",
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
        </Box>
      </Box>
    </MantineProvider>
  );
}