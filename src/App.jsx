import { useEffect, useState } from 'react';
import { Box, Progress } from '@mantine/core';

import { Dashboard } from './pages/Dashboard';
import { Hub } from './pages/Hub';
import { Settings } from './pages/Settings';
import { SetupMode } from './pages/SetupMode';

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true';
const SENSORS_API = 'http://127.0.0.1:5005/api/sensors';

export default function App() {
  const [page, setPage] = useState(0); 
  const [brightness, setBrightness] = useState(100);
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: '--', hum: '--', co2: '--' });
  const [weather, setWeather] = useState({ temp: '--', code: 0 });
  const [news, setNews] = useState([]);
  
  const [appVersion, setAppVersion] = useState('N/A');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  const launch = (data, type, isTV = false) => ipcRenderer?.send('launch', { data, type, isTV });
  const sendCmd = (cmd) => ipcRenderer?.send('system-cmd', cmd);
  
  const startWifiSetup = () => {
    setIsConfiguring(true);
    sendCmd('start-ap');
  };

  const fetchData = async () => {
    try {
      const [wRes, nRes, sRes] = await Promise.all([
        fetch(WEATHER_API).then(r => r.json()),
        fetch('https://api.rss2json.com/v1/api.json?rss_url=https://tengrinews.kz/news.rss').then(r => r.json()),
        fetch(SENSORS_API).then(r => r.json()).catch(() => null)
      ]);
      setWeather({ temp: Math.round(wRes.current_weather.temperature), code: wRes.current_weather.weathercode });
      setNews(nRes.items.map(i => i.title));
      if (sRes) setSensors({ temp: sRes.temp, hum: sRes.hum, co2: sRes.co2 });
      if (isConfiguring && nRes.items.length > 0) setIsConfiguring(false);
    } catch (e) { 
      if (news.length === 0) setIsConfiguring(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, 2));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    
    ipcRenderer?.send('get-app-version');
    ipcRenderer?.on('app-version', (e, ver) => setAppVersion(ver));

    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    fetchData();
    const dataTimer = setInterval(fetchData, 30000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(clockTimer);
      clearInterval(dataTimer);
    };
  }, [news.length]);

  return (
    <Box style={{ backgroundColor: '#000', height: '100vh', width: '100vw', overflow: 'hidden', color: 'white' }}>
      {isConfiguring && (
        <SetupMode onCancel={() => setIsConfiguring(false)} canCancel={news.length > 0} />
      )}

      <Box style={{ 
        display: 'flex', width: '300vw', height: '100vh', 
        transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', 
        transform: `translateX(-${page * 100}vw)` 
      }}>
        <Dashboard time={time} weather={weather} sensors={sensors} news={news} />
        <Hub launch={launch} />
        <Settings brightness={brightness} setBrightness={setBrightness} onWifiSetup={startWifiSetup} onReboot={() => sendCmd('reboot')} appVersion={appVersion} ipcRenderer={ipcRenderer} />
      </Box>
    </Box>
  );
}