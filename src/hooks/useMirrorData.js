import { useState, useEffect } from "react";

// RSS Proxy (CORS шешу үшін)
const RSS_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

// --- 1. ЖАҢАЛЫҚТАР КӨЗДЕРІ (Тек Қазақстан) ---
const getNewsSources = (lang) => {
  switch (lang) {
    case 'kk':
      return [
        { url: 'https://kaz.tengrinews.kz/news.rss', name: 'TENGRI (KZ)' },
        { url: 'https://kaz.zakon.kz/rss/news.xml', name: 'ZAKON (KZ)' },
        { url: 'https://kaz.nur.kz/rss/all.xml', name: 'NUR (KZ)' },
        { url: 'https://baribar.kz/feed/', name: 'BARIBAR' }
      ];
    case 'en':
      return [
        // Шетелдік сайттар жойылды, тек Қазақстандық ағылшын сайттары
        { url: 'https://en.tengrinews.kz/news.rss', name: 'TENGRI (EN)' },
        { url: 'https://www.inform.kz/rss/en.xml', name: 'KAZINFORM (EN)' },
        { url: 'https://astanatimes.com/feed/', name: 'ASTANA TIMES' }
      ];
    default: // 'ru'
      return [
        { url: 'https://tengrinews.kz/news.rss', name: 'TENGRI' },
        { url: 'https://www.zakon.kz/rss/news.xml', name: 'ZAKON' },
        { url: 'https://www.nur.kz/rss/all.xml', name: 'NUR' },
        { url: 'https://www.inform.kz/rss/ru.xml', name: 'KAZINFORM' }
      ];
  }
};

export function useMirrorData() {
  const [time, setTime] = useState(new Date());

  // Config State
  const [config, setConfig] = useState({
    city: "Алматы",
    language: "ru",
    timezone: "Asia/Almaty",
    showWeather: true
  });

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

  // --- A. CONFIG LISTENERS ---
  useEffect(() => {
    if (ipc) {
      const handleConfig = (_event, newConfig) => {
        console.log("⚡ Config Updated:", newConfig);
        if (newConfig) {
            setConfig(prev => ({ ...prev, ...newConfig }));
            if (newConfig.city) {
              setLocation(prev => ({ ...prev, city: newConfig.city }));
            }
        }
      };

      ipc.send('get-config'); 
      ipc.on('config-updated', handleConfig);

      return () => {
        ipc.removeListener('config-updated', handleConfig);
      };
    }
  }, []);

  // --- Б: GPS ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            let detectedCity = config.city;
            // Егер қала "default" болса, GPS-пен анықтаймыз
            if (detectedCity === "Алматы" || detectedCity === "Поиск...") {
                const geoRes = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${config.language || 'ru'}`
                );
                const geoData = await geoRes.json();
                detectedCity = geoData.city || geoData.locality || "Мой город";
            }

            setLocation({ lat: latitude, lon: longitude, city: detectedCity });
          } catch (e) {
            console.error("City error:", e);
            setLocation((prev) => ({ ...prev, lat: latitude, lon: longitude }));
          }
        },
        (error) => console.warn("GPS Error:", error.message)
      );
    }
  }, [config.language]); 

  // --- В: ДЕРЕКТЕРДІ ЖҮКТЕУ (Dynamic News) ---
  const fetchExternalData = async () => {
    const { lat, lon } = location;
    const currentLang = config.language || 'ru';
    
    // 1. Тілге сай жаңалық көздерін аламыз (ТЕК ҚАЗАҚСТАН)
    const newsSources = getNewsSources(currentLang);

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&windspeed_unit=ms`;
      const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;

      // API сұрауларын жинақтау
      const promises = [
        fetch(weatherUrl).then((r) => r.json()),
        fetch(airUrl).then((r) => r.json()),
        ...newsSources.map(src => fetch(`${RSS_API}${src.url}`).then(r => r.json()))
      ];

      const results = await Promise.allSettled(promises);

      // --- 1. Ауа райы ---
      let temp = "--", code = 0, wind = 0, aqi = 0;
      
      if (results[0].status === "fulfilled" && results[0].value?.current_weather) {
        const w = results[0].value.current_weather;
        temp = Math.round(w.temperature);
        code = w.weathercode;
        wind = Math.round(w.windspeed);
      }
      if (results[1].status === "fulfilled" && results[1].value?.current) {
        aqi = results[1].value.current.european_aqi || 0;
      }

      setWeather({ temp, code, wind, aqi, city: config.city || location.city });

      // --- 2. Жаңалықтар (Динамикалық) ---
      let combinedNews = [];
      
      // News results start from index 2
      newsSources.forEach((src, index) => {
        const res = results[index + 2]; // 0=weather, 1=air, 2...=news
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
        // Ең жаңасын жоғарыға шығарамыз
        const sorted = combinedNews.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
        setNews(sorted);
      } else {
        setNews([{ title: currentLang === 'kk' ? "Жаңалықтар жүктелуде..." : "News loading...", date: new Date(), source: "SYSTEM" }]);
      }

    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    
    // Алғашқы жүктеу
    fetchExternalData(); 

    // Әр 10 минут сайын жаңарту
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
  }, [location, config.city, config.language]); 

  return { time, weather, news, updStatus, updProgress, appVersion, setUpdStatus, config, fetchData: fetchExternalData };
}