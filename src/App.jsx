import { useEffect, useState } from "react";
import { Box, Progress, Text } from "@mantine/core";

// Импорт страниц
import { Dashboard } from "./pages/Dashboard";
import { Hub } from "./pages/Hub";
import { Settings } from "./pages/Settings";

// Константы API
const WEATHER_API = "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
const SENSORS_API = "http://127.0.0.1:5005/api/sensors";
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

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

  // Методы управления
  const launch = (data, type, isTV = false) => ipc?.send("launch", { data, type, isTV });
  const sendCmd = (cmd) => ipc?.send("system-cmd", cmd);
  const updateMirror = () => ipc?.send("check-for-updates");

  // Обновление Python-сервиса датчиков
  const updatePython = async () => {
    setUpdStatus("ОБНОВЛЕНИЕ ДАТЧИКОВ...");
    try {
      const res = await fetch("http://127.0.0.1:5005/api/system/update-python", { method: 'POST' });
      if (res.ok) setUpdStatus("PYTHON ОБНОВЛЕН!");
      else setUpdStatus("ОШИБКА СЕРВЕРА");
    } catch (e) {
      setUpdStatus("PYTHON НЕ ОТВЕЧАЕТ");
    }
    setTimeout(() => setUpdStatus(""), 4000);
  };

  const fetchData = async () => {
    try {
      // Загружаем новости Казахстана (3 источника), Погоду и Датчики через Promise.allSettled
      // Это гарантирует, что если Zakon упадет, Tengri и Nur все равно покажут новости
      const results = await Promise.allSettled([
        fetch(`${RSS_API}https://tengrinews.kz/news.rss`).then(r => r.json()),
        fetch(`${RSS_API}https://www.zakon.kz/rss/news.xml`).then(r => r.json()),
        fetch(`${RSS_API}https://www.nur.kz/rss/all.xml`).then(r => r.json()),
        fetch(WEATHER_API).then(r => r.json()),
        fetch(SENSORS_API).then(r => r.json())
      ]);

      // 1. Сбор новостей
      let combinedNews = [];
      const sources = ["TENGRI NEWS", "ZAKON.KZ", "NUR.KZ"];
      
      [0, 1, 2].forEach(index => {
        if (results[index].status === 'fulfilled' && results[index].value?.items) {
          results[index].value.items.forEach(item => {
            combinedNews.push({
              title: item.title,
              date: item.pubDate,
              source: sources[index]
            });
          });
        }
      });

      // Сортировка по времени публикации
      if (combinedNews.length > 0) {
        setNews(combinedNews.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

      // 2. Обработка погоды (результат №3)
      if (results[3].status === 'fulfilled' && results[3].value?.current_weather) {
        setWeather({ 
          temp: Math.round(results[3].value.current_weather.temperature), 
          code: results[3].value.current_weather.weathercode 
        });
      }

      // 3. Обработка датчиков CO2/Temp/Hum (результат №4)
      if (results[4].status === 'fulfilled' && results[4].value) {
        setSensors({ 
          temp: results[4].value.temp || "--", 
          hum: results[4].value.hum || "--", 
          co2: results[4].value.co2 || "--" 
        });
      }
    } catch (e) {
      console.error("Critical fetch failed", e);
    }
  };

  // Эффект при монтировании (клавиатура, IPC, часы)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, 2));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handleKeyDown);

    if (ipc) {
      ipc.on("update_status", (e, m) => setUpdStatus(m));
      ipc.on("update_progress", (e, p) => setUpdProgress(p));
      ipc.on("app-version", (e, v) => setAppVersion(v));
      ipc.send("get-app-version");
    }

    const clockTimer = setInterval(() => setTime(new Date()), 1000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(clockTimer);
      ipc?.removeAllListeners("update_status");
      ipc?.removeAllListeners("update_progress");
      ipc?.removeAllListeners("app-version");
    };
  }, []);

  // Интервал обновления данных (60 сек)
  useEffect(() => {
    fetchData();
    const dataTimer = setInterval(fetchData, 60000);
    return () => clearInterval(dataTimer);
  }, []);

  return (
    <Box style={{ backgroundColor: "#000", height: "100vh", width: "100vw", overflow: "hidden", color: "white" }}>
      
      {/* Уведомление об обновлениях */}
      {updStatus && (
        <Box style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: 350, background: "#111", padding: "15px", border: "1px solid #333", borderRadius: "8px" }}>
          <Text size="xs" fw={900} mb={5} c="orange" ta="center" style={{ letterSpacing: "2px" }}>
            {updStatus.toUpperCase()}
          </Text>
          <Progress value={updProgress} color="orange" size="sm" animated />
        </Box>
      )}

      {/* Основной контейнер страниц */}
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
          updatePython={updatePython}
          appVersion={appVersion} 
        />
      </Box>

      {/* Индикаторы страниц (точки внизу) */}
      <Box style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} style={{ 
              width: i === page ? 20 : 8, 
              height: 8, 
              borderRadius: 4, 
              backgroundColor: i === page ? 'white' : '#333',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </Box>
    </Box>
  );
}