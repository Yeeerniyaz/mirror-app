import { useEffect, useState } from "react";

const WEATHER_API =
  "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
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
  const [portalInfo, setPortalInfo] = useState({
    ip: "10.42.0.1",
    port: 8081,
    needs_setup: false,
  });

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        fetch(`${RSS_API}https://tengrinews.kz/news.rss`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.zakon.kz/rss/news.xml`).then((r) =>
          r.json(),
        ),
        fetch(`${RSS_API}https://www.nur.kz/rss/all.xml`).then((r) => r.json()),
        fetch(WEATHER_API).then((r) => r.json()),
        fetch(SENSORS_API).then((r) => r.json()),
      ]);

      let combinedNews = [];
      const sources = ["TENGRI NEWS", "ZAKON.KZ", "NUR.KZ"];
      [0, 1, 2].forEach((index) => {
        if (
          results[index].status === "fulfilled" &&
          results[index].value?.items
        ) {
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
        setNews(
          combinedNews.sort((a, b) => new Date(b.date) - new Date(a.date)),
        );
      }
      if (
        results[3].status === "fulfilled" &&
        results[3].value?.current_weather
      ) {
        setWeather({
          temp: Math.round(results[3].value.current_weather.temperature),
          code: results[3].value.current_weather.weathercode,
        });
      }
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

  const checkPortalStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8081/status");
      const data = await res.json();
      if (JSON.stringify(data) !== JSON.stringify(portalInfo))
        setPortalInfo(data);
      if (!data.needs_setup && news.length === 0) fetchData();
    } catch (e) {
      /* Portal offline */
    }
  };

  const resetWifi = async () => {
    if (!window.confirm("СБРОСИТЬ НАСТРОЙКИ СЕТИ?")) return;

    setUpdStatus("СБРОС WI-FI...");
    try {
      const res = await fetch("http://127.0.0.1:5005/api/system/reset-wifi", {
        method: "POST",
      });
      if (res.ok) {
        setUpdStatus("ГОТОВО! ПЕРЕХОД К НАСТРОЙКЕ...");

        // Самый важный момент для "обратного контакта":
        // Через 2 секунды перезагружаем страницу.
        // При загрузке App.jsx проверит портал (порт 8081),
        // увидит, что файла флага нет, и сам откроет SetupMode.
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUpdStatus("ОШИБКА СБРОСА");
      }
    } catch (e) {
      setUpdStatus("PYTHON НЕ ОТВЕЧАЕТ");
    }
  };

  const restartApplication = async () => {
  if (!window.confirm("ПЕРЕЗАПУСТИТЬ ПРИЛОЖЕНИЕ?")) return;

  setUpdStatus("РЕСТАРТ ПРИЛОЖЕНИЯ...");
  try {
    const res = await fetch("http://127.0.0.1:5005/api/system/restart-app", { 
      method: "POST" 
    });
    if (res.ok) {
      setUpdStatus("ПЕРЕЗАПУСК...");
    } else {
      setUpdStatus("ОШИБКА СЕРВЕРА");
    }
  } catch (e) {
    setUpdStatus("БРИДЖ НЕ ОТВЕЧАЕТ");
  }
};

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    const dataTimer = setInterval(fetchData, 60000);
    const portalTimer = setInterval(checkPortalStatus, 3000);

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
      clearInterval(portalTimer);
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
    portalInfo,
    setUpdStatus,
    resetWifi,
  };
}
