import { useState, useEffect } from "react";

// RSS Новости
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useMirrorData() {
  const [time, setTime] = useState(new Date());

  // 1. ЛОКАЦИЯ (По умолчанию: Алматы)
  const [location, setLocation] = useState({
    lat: 43.2389,
    lon: 76.8897,
    city: "Алматы"
  });

  const [weather, setWeather] = useState({
    temp: "--",
    code: 0,
    wind: 0,
    aqi: 0,
    city: "Поиск..." 
  });

  const [news, setNews] = useState([]);
  const [updStatus, setUpdStatus] = useState("");
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState("N/A");

  // --- А: GPS ОПРЕДЕЛЕНИЕ ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log("📍 GPS Found:", latitude, longitude);

          try {
            // 👇 ЯЗЫК РУССКИЙ (localityLanguage=ru)
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ru`
            );
            const geoData = await geoRes.json();
            const detectedCity = geoData.city || geoData.locality || "Мой город";

            setLocation({
              lat: latitude,
              lon: longitude,
              city: detectedCity
            });
          } catch (e) {
            console.error("City detect error:", e);
            setLocation((prev) => ({ ...prev, lat: latitude, lon: longitude }));
          }
        },
        (error) => {
          console.warn("⚠️ GPS Error:", error.message);
          setWeather((prev) => ({ ...prev, city: "Алматы" }));
        }
      );
    }
  }, []);

  // --- Б: ЗАГРУЗКА ДАННЫХ ---
  const fetchExternalData = async () => {
    const { lat, lon, city } = location;

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&windspeed_unit=ms`;
      const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;

      const results = await Promise.allSettled([
        fetch(weatherUrl).then((r) => r.json()),
        fetch(airUrl).then((r) => r.json()),
        fetch(`${RSS_API}https://tengrinews.kz/news.rss`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.zakon.kz/rss/news.xml`).then((r) => r.json()),
        fetch(`${RSS_API}https://www.nur.kz/rss/all.xml`).then((r) => r.json()),
      ]);

      // 1. Погода & Экология
      let temp = "--";
      let code = 0;
      let wind = 0;
      let aqi = 0;

      if (results[0].status === "fulfilled" && results[0].value?.current_weather) {
        const w = results[0].value.current_weather;
        temp = Math.round(w.temperature);
        code = w.weathercode;
        wind = Math.round(w.windspeed);
      }

      if (results[1].status === "fulfilled" && results[1].value?.current) {
        aqi = results[1].value.current.european_aqi || 0;
      }

      setWeather({
        temp,
        code,
        wind,
        aqi,
        city: city 
      });

      // 2. Новости
      let combinedNews = [];
      const sources = [
        { name: "TENGRI", idx: 2 },
        { name: "ZAKON", idx: 3 },
        { name: "NUR", idx: 4 }
      ];

      sources.forEach((src) => {
        const res = results[src.idx];
        if (res.status === "fulfilled" && res.value?.items) {
          res.value.items.forEach((item) => {
            combinedNews.push({
              title: item.title,
              date: item.pubDate,
              source: src.name,
            });
          });
        }
      });

      if (combinedNews.length > 0) {
        const sorted = combinedNews.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        setNews(sorted);
      }

    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    fetchExternalData(); 
    const dataTimer = setInterval(fetchExternalData, 600000);

    if (ipc) {
      ipc.on("update_status", (e, m) => setUpdStatus(m));
      ipc.on("update_progress", (e, p) => setUpdProgress(p));
      ipc.on("app-version", (e, v) => setAppVersion(v));
      ipc.send("get-app-version");
    }

    return () => {
      clearInterval(clockTimer);
      clearInterval(dataTimer);
      if (ipc) {
        ipc.removeAllListeners("update_status");
        ipc.removeAllListeners("update_progress");
        ipc.removeAllListeners("app-version");
      }
    };
  }, [location]);

  return { time, weather, news, updStatus, updProgress, appVersion, setUpdStatus, fetchData: fetchExternalData };
}