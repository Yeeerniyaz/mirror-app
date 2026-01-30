import { useEffect, useState } from "react";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

// 👇 ГЛАВНОЕ ИЗМЕНЕНИЕ: Адрес твоего Python-моста
const SENSORS_API = "http://localhost:5005/api/sensors";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useMirrorData() {
  const [time, setTime] = useState(new Date());
  // Инициализируем прочерками, пока данные не придут
  const [sensors, setSensors] = useState({ temp: "--", hum: "--", co2: "--" });
  const [weather, setWeather] = useState({ temp: "--", code: 0 });
  const [news, setNews] = useState([]);
  const [updStatus, setUpdStatus] = useState("");
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState("N/A");

  // --- 1. ЗАГРУЗКА ИНТЕРНЕТ-ДАННЫХ (Погода, Новости) ---
  const fetchExternalData = async () => {
    try {
      const results = await Promise.allSettled([
        fetch(`${RSS_API}https://tengrinews.kz/news.rss`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.zakon.kz/rss/news.xml`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.nur.kz/rss/all.xml`).then((r) => r.json()),
        fetch(WEATHER_API).then((r) => r.json()),
      ]);

      // Новости
      let combinedNews = [];
      const sources = ["TENGRI NEWS", "ZAKON.KZ", "NUR.KZ"];
      [0, 1, 2].forEach((index) => {
        if (results[index].status === "fulfilled" && results[index].value?.items) {
          results[index].value.items.forEach((item) => {
            combinedNews.push({
              title: item.title,
              date: item.pubDate,
              source: sources[index],
            });
          });
        }
      });
      if (combinedNews.length > 0) {
        setNews(combinedNews.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

      // Погода
      if (results[3].status === "fulfilled" && results[3].value?.current_weather) {
        setWeather({
          temp: Math.round(results[3].value.current_weather.temperature),
          code: results[3].value.current_weather.weathercode,
        });
      }

    } catch (e) {
      console.error("Data fetch failed", e);
    }
  };

  // --- 2. ОПРОС ДАТЧИКОВ (Локальный Python) ---
  const fetchSensors = async () => {
    try {
      // Стучимся к bridge.py на порт 5005
      const res = await fetch(SENSORS_API);
      if (res.ok) {
        const data = await res.json();
        // Python возвращает { temp, hum, co2 }, обновляем React
        setSensors(data);
      }
    } catch (e) {
      // Если сервер еще не запустился, просто молчим (или пишем в консоль)
      console.warn("Python Bridge offline");
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    const internetTimer = setInterval(fetchExternalData, 60000); // Новости: раз в минуту
    const sensorsTimer = setInterval(fetchSensors, 3000); // Датчики: каждые 3 секунды

    // Запускаем сразу
    fetchExternalData();
    fetchSensors();

    if (ipc) {
      ipc.on("update_status", (e, m) => setUpdStatus(m));
      ipc.on("update_progress", (e, p) => setUpdProgress(p));
      ipc.on("app-version", (e, v) => setAppVersion(v));
      
      // ❌ УДАЛИЛ: ipc.on("sensors-data") — больше не нужно, берем по HTTP

      ipc.send("get-app-version");
    }

    return () => {
      clearInterval(clockTimer);
      clearInterval(internetTimer);
      clearInterval(sensorsTimer);
      if (ipc) {
        ipc.removeAllListeners("update_status");
        ipc.removeAllListeners("update_progress");
        ipc.removeAllListeners("app-version");
      }
    };
  }, []);

  return { 
    time, 
    sensors, 
    weather, 
    news, 
    updStatus, 
    updProgress, 
    appVersion, 
    setUpdStatus, 
    fetchData: fetchExternalData 
  };
}