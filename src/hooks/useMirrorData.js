import { useEffect, useState } from "react";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true";
const SENSORS_API = "http://127.0.0.1:5005/api/sensors";
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

// Проверка наличия Electron
const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useMirrorData() {
  // --- СОСТОЯНИЕ (STATE) ---
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: "--", hum: "--", co2: "--" });
  const [weather, setWeather] = useState({ temp: "--", code: 0 });
  const [news, setNews] = useState([]);
  const [updStatus, setUpdStatus] = useState("");
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState("N/A");
  
  // Хранилище для списка Wi-Fi сетей
  const [wifiList, setWifiList] = useState([]);

  // --- ЛОГИКА ЗАГРУЗКИ ДАННЫХ ---
  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        fetch(`${RSS_API}https://tengrinews.kz/news.rss`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.zakon.kz/rss/news.xml`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.nur.kz/rss/all.xml`).then((r) => r.json()),
        fetch(WEATHER_API).then((r) => r.json()),
        fetch(SENSORS_API).then((r) => r.json()),
      ]);

      // Обработка новостей
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

      // Обработка погоды
      if (results[3].status === "fulfilled" && results[3].value?.current_weather) {
        setWeather({
          temp: Math.round(results[3].value.current_weather.temperature),
          code: results[3].value.current_weather.weathercode,
        });
      }

      // Обработка датчиков
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

  // --- ПАРАМЕТРЫ WIFI ---

  const getWifiList = async () => {
    setUpdStatus("СКАНИРОВАНИЕ WI-FI...");
    try {
      const res = await fetch("http://127.0.0.1:5005/api/wifi/list");
      const data = await res.json();
      if (res.ok) {
        setWifiList(data);
        setUpdStatus("СПИСОК ОБНОВЛЕН");
      } else {
        setUpdStatus("ОШИБКА СКАНЕРА");
      }
    } catch (e) {
      setUpdStatus("БРИДЖ НЕ ОТВЕЧАЕТ");
    }
    setTimeout(() => setUpdStatus(""), 3000);
  };

  const connectToWifi = async (ssid, password) => {
    setUpdStatus(`ПОДКЛЮЧЕНИЕ К ${ssid}...`);
    try {
      const res = await fetch("http://127.0.0.1:5005/api/wifi/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password })
      });
      if (res.ok) {
        setUpdStatus("УСПЕШНО ПОДКЛЮЧЕНО");
        fetchData(); // Пробуем обновить данные через новый инет
      } else {
        setUpdStatus("ОШИБКА ПАРОЛЯ");
      }
    } catch (e) {
      setUpdStatus("СЕРВЕР НЕ ОТВЕЧАЕТ");
    }
    setTimeout(() => setUpdStatus(""), 4000);
  };

  // --- СИСТЕМНЫЕ ФУНКЦИИ ---

  const sendCmd = async (cmd) => {
    setUpdStatus(`ВЫПОЛНЕНИЕ: ${cmd.toUpperCase()}...`);
    try {
      const res = await fetch(`http://127.0.0.1:5005/api/system/${cmd}`, { method: "POST" });
      if (res.ok) setUpdStatus("КОМАНДА ОТПРАВЛЕНА");
      else setUpdStatus("ОШИБКА СЕРВЕРА");
    } catch (e) {
      setUpdStatus("БРИДЖ НЕ ОТВЕЧАЕТ");
    }
    setTimeout(() => setUpdStatus(""), 3000);
  };

  const updatePython = async () => {
    setUpdStatus("ОБНОВЛЕНИЕ PYTHON...");
    try {
      const res = await fetch("http://127.0.0.1:5005/api/system/update-python", { method: "POST" });
      if (res.ok) {
        setUpdStatus("PYTHON ОБНОВЛЕН");
        fetchData();
      } else {
        setUpdStatus("ОШИБКА ОБНОВЛЕНИЯ");
      }
    } catch (e) {
      setUpdStatus("БРИДЖ НЕ ОТВЕЧАЕТ");
    }
    setTimeout(() => setUpdStatus(""), 4000);
  };

  // --- ЭФФЕКТЫ ---
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    const dataTimer = setInterval(fetchData, 60000); 

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

  // --- ФИНАЛЬНЫЙ ВОЗВРАТ ---
  return {
    time,
    sensors,
    weather,
    news,
    updStatus,
    updProgress,
    appVersion,
    wifiList,        // Список сетей для UI
    getWifiList,     // Функция сканирования
    connectToWifi,   // Функция подключения
    setUpdStatus,
    sendCmd,
    updatePython,
    fetchData
  };
}