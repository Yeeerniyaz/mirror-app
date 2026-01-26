import { useEffect, useState } from "react";
import { Box, Progress, ActionIcon, Group } from "@mantine/core";

// Импортируем компоненты страниц
import { Dashboard } from "./pages/Dashboard";
import { Hub } from "./pages/Hub";
import { Settings } from "./pages/Settings";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
const SENSORS_API = "http://127.0.0.1:5005/api/sensors";

export default function App() {
  const [page, setPage] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: "--", hum: "--", co2: "--" });
  const [weather, setWeather] = useState({ temp: "--", code: 0 });
  const [news, setNews] = useState(["Загрузка VECTOR OS..."]);
  const [updStatus, setUpdStatus] = useState("");
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState("N/A");

  const { ipcRenderer } = window.require ? window.require("electron") : { ipcRenderer: null };

  const launch = (data, type, isTV = false) => ipcRenderer?.send("launch", { data, type, isTV });
  const sendCmd = (cmd) => ipcRenderer?.send("system-cmd", cmd);
  const updateMirror = () => ipcRenderer?.send("check-for-updates");

  const fetchData = async () => {
    try {
      const [wRes, nRes, sRes] = await Promise.all([
        fetch(WEATHER_API).then((r) => r.json()),
        fetch("https://api.rss2json.com/v1/api.json?rss_url=https://tengrinews.kz/news.rss").then((r) => r.json()),
        fetch(SENSORS_API).then((r) => r.json()).catch(() => null),
      ]);
      setWeather({ temp: Math.round(wRes.current_weather.temperature), code: wRes.current_weather.weathercode });
      setNews(nRes.items.map((i) => i.title));
      if (sRes) setSensors({ temp: sRes.temp, hum: sRes.hum, co2: sRes.co2 });
    } catch (e) { console.error("Sync error:", e); }
  };

  useEffect(() => {
    // Управление слайдами через стрелки клавиатуры
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, 2));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
    };

    // Управление колесиком (свайп)
    const handleWheel = (e) => {
      if (e.deltaY > 0) setPage((p) => Math.min(p + 1, 2));
      else if (e.deltaY < 0) setPage((p) => Math.max(p - 1, 0));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel);

    ipcRenderer?.on("update_status", (e, msg) => setUpdStatus(msg));
    ipcRenderer?.on("update_progress", (e, prg) => setUpdProgress(prg));
    ipcRenderer?.on("app-version", (e, ver) => setAppVersion(ver));
    ipcRenderer?.send("get-app-version");

    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    fetchData();
    const dataTimer = setInterval(fetchData, 30000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      clearInterval(clockTimer);
      clearInterval(dataTimer);
    };
  }, []);

  return (
    <Box style={{ backgroundColor: "#000", height: "100vh", width: "100vw", overflow: "hidden", color: "white" }}>
      {/* Прогресс обновления */}
      {updStatus && (
        <Box style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10000, width: 400, background: "#111", padding: "15px", border: "1px solid #333", borderRadius: "8px" }}>
          <Text size="xs" fw={900} mb={5} c="orange" style={{ letterSpacing: "2px" }}>{updStatus.toUpperCase()}</Text>
          <Progress value={updProgress} color="orange" size="sm" animated />
        </Box>
      )}

      {/* Контейнер слайдера */}
      <Box style={{ 
        display: "flex", 
        width: "300vw", 
        height: "100vh", 
        transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)", 
        transform: `translateX(-${page * 100}vw)` 
      }}>
        <Dashboard time={time} weather={weather} sensors={sensors} news={news} />
        <Hub launch={launch} />
        <Settings 
          brightness={brightness} 
          setBrightness={setBrightness} 
          sendCmd={sendCmd} 
          updateMirror={updateMirror} 
          appVersion={appVersion} 
          ipcRenderer={ipcRenderer} 
        />
      </Box>

      {/* Индикаторы страниц (точки) */}
      <Box style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <Group gap="xs">
          {[0, 1, 2].map((i) => (
            <Box key={i} style={{ 
              width: i === page ? 20 : 8, 
              height: 8, 
              borderRadius: 4, 
              backgroundColor: i === page ? 'orange' : '#333',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </Group>
      </Box>
    </Box>
  );
}