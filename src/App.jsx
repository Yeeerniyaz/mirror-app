import { useEffect, useState } from "react";
import { Box, Progress, Group } from "@mantine/core";

import { Dashboard } from "./pages/Dashboard";
import { Hub } from "./pages/Hub";
import { Settings } from "./pages/Settings";
import { SetupMode } from "./pages/SetupMode";

const WEATHER_API =
  "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
const SENSORS_API = "http://127.0.0.1:5005/api/sensors";

export default function App() {
  const [page, setPage] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: "--", hum: "--", co2: "--" });
  const [weather, setWeather] = useState({ temp: "--", code: 0 });
  const [news, setNews] = useState([]);
  const [updStatus, setUpdStatus] = useState("");
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState("N/A");
  const [isConfiguring, setIsConfiguring] = useState(false);

  const { ipcRenderer } = window.require
    ? window.require("electron")
    : { ipcRenderer: null };

  const launch = (data, type, isTV = false) =>
    ipcRenderer?.send("launch", { data, type, isTV });
  const sendCmd = (cmd) => ipcRenderer?.send("system-cmd", cmd);
  const updateMirror = () => ipcRenderer?.send("check-for-updates");

  const startWifiSetup = () => {
    setIsConfiguring(true);
    sendCmd("start-ap");
  };

  const fetchData = async () => {
    try {
      const [wRes, nRes, sRes] = await Promise.all([
        fetch(WEATHER_API).then((r) => r.json()),
        fetch(
          "https://api.rss2json.com/v1/api.json?rss_url=https://tengrinews.kz/news.rss",
        ).then((r) => r.json()),
        fetch(SENSORS_API)
          .then((r) => r.json())
          .catch(() => null),
      ]);
      setWeather({
        temp: Math.round(wRes.current_weather.temperature),
        code: wRes.current_weather.weathercode,
      });
      setNews(nRes.items.map((i) => i.title));
      if (sRes) setSensors({ temp: sRes.temp, hum: sRes.hum, co2: sRes.co2 });
      if (isConfiguring && nRes.items.length > 0) setIsConfiguring(false);
    } catch (e) {
      if (news.length === 0) setIsConfiguring(true);
    }
  };

  useEffect(() => {
    // 1. Навигация клавиатурой
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, 2));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handleKeyDown);

    // 2. Слушатели Electron (Update Status)
    // Используем .off перед .on, чтобы не плодить дубликаты
    ipcRenderer?.removeAllListeners("update_status");
    ipcRenderer?.removeAllListeners("update_progress");
    ipcRenderer?.removeAllListeners("app-version");

    ipcRenderer?.on("update_status", (event, message) => {
      setUpdStatus(message);
    });

    ipcRenderer?.on("update_progress", (event, progress) => {
      setUpdProgress(progress);
    });

    ipcRenderer?.on("app-version", (event, ver) => {
      setAppVersion(ver);
    });

    ipcRenderer?.send("get-app-version");

    // 3. Часы (работают всегда)
    const clockTimer = setInterval(() => setTime(new Date()), 1000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(clockTimer);
      ipcRenderer?.removeAllListeners("update_status");
      ipcRenderer?.removeAllListeners("update_progress");
      ipcRenderer?.removeAllListeners("app-version");
    };
  }, []); // ПУСТОЙ массив — вешаем один раз при старте приложения

  // Отдельный эффект для загрузки данных (новости, погода, датчики)
  useEffect(() => {
    fetchData();
    const dataTimer = setInterval(fetchData, 30000);
    return () => clearInterval(dataTimer);
  }, [isConfiguring, news.length]); // Здесь зависимости уместны

  return (
    <Box
      style={{
        backgroundColor: "#000",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        color: "white",
      }}
    >
      {updStatus && (
        <Box
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            width: 400,
            background: "#111",
            padding: "15px",
            border: "1px solid #333",
            borderRadius: "8px",
          }}
        >
          <Progress value={updProgress} color="orange" size="sm" animated />
        </Box>
      )}

      {isConfiguring && (
        <SetupMode
          onCancel={() => setIsConfiguring(false)}
          canCancel={news.length > 0}
        />
      )}

      <Box
        style={{
          display: "flex",
          width: "300vw",
          height: "100vh",
          transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: `translateX(-${page * 100}vw)`,
        }}
      >
        <Dashboard
          time={time}
          weather={weather}
          sensors={sensors}
          news={news}
        />
        <Hub launch={launch} />
        <Settings
          brightness={brightness}
          setBrightness={setBrightness}
          onWifiSetup={startWifiSetup}
          onReboot={() => sendCmd("reboot")}
          onUpdate={updateMirror}
          appVersion={appVersion}
          ipcRenderer={ipcRenderer}
        />
      </Box>

      <Box
        style={{
          position: "fixed",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <Group gap="xs">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              style={{
                width: i === page ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === page ? "orange" : "#333",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </Group>
      </Box>
    </Box>
  );
}
