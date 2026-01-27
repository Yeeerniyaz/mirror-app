import { useEffect, useState } from "react";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
const SENSORS_API = "http://127.0.0.1:5005/api/sensors";
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useMirrorData() {
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: "--", hum: "--", co2: "--" });
  const [weather, setWeather] = useState({ temp: "--", code: 0 });
  const [news, setNews] = useState([]);
  const [updStatus, setUpdStatus] = useState("");
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState("N/A");

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        fetch(`${RSS_API}https://tengrinews.kz/news.rss`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.zakon.kz/rss/news.xml`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.nur.kz/rss/all.xml`).then((r) => r.json()),
        fetch(WEATHER_API).then((r) => r.json()),
        fetch(SENSORS_API).then((r) => r.json()),
      ]);

      // 1. Новости
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

      // 2. Погода
      if (results[3].status === "fulfilled" && results[3].value?.current_weather) {
        setWeather({
          temp: Math.round(results[3].value.current_weather.temperature),
          code: results[3].value.current_weather.weathercode,
        });
      }

      // 3. Датчики
      if (results[4].status === "fulfilled" && results[4].value) {
        setSensors({
          temp: results[4].value.temp || "--",
          hum: results[4].value.hum || "--",
          co2: results[4].value.co2 || "--",
        });
      }
    } catch (e) {
      console.error("Data fetch failed", e);
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    const dataTimer = setInterval(fetchData, 60000); // Раз в минуту

    fetchData();

    if (ipc) {
      ipc.on("update_status", (e, m) => setUpdStatus(m));
      ipc.on("update_progress", (e, p) => setUpdProgress(p));
      ipc.on("app-version", (e, v) => setAppVersion(v));
      ipc.send("get-app-version");
    }

    return () => {
      clearInterval(clockTimer);
      clearInterval(dataTimer);
      ipc?.removeAllListeners("update_status");
      ipc?.removeAllListeners("update_progress");
      ipc?.removeAllListeners("app-version");
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
    fetchData 
  };
}