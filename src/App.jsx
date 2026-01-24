import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title, Container, Box, SimpleGrid, UnstyledButton, Center, Slider, ActionIcon } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { Sun, Youtube, Bookmark, Calendar as GoogleIcon, Music, Calculator, Clock, RefreshCw, Settings, Power, Zap } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import '@mantine/dates/styles.css';

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast?latitude=43.2389&longitude=76.8897&current_weather=true';

export default function App() {
  const [page, setPage] = useState(0); 
  const [brightness, setBrightness] = useState(100);
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: '--', hum: '--', co2: '--' });
  const [weather, setWeather] = useState({ temp: '--', code: 0 });
  const [news, setNews] = useState(['Загрузка VECTOR OS...']);

  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  const launch = (data, type, isTV = false) => ipcRenderer?.send('launch', { data, type, isTV });
  const sendCmd = (cmd) => ipcRenderer?.send('system-cmd', cmd);
  const updateMirror = () => ipcRenderer?.send('update-software');

  // --- КАРУСЕЛЬ БАСҚАРУ (Mouse Wheel + Arrows) ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 0) setPage(p => Math.min(p + 1, 2));
      else if (e.deltaY < 0) setPage(p => Math.max(p - 1, 0));
    };
    const handleKeys = (e) => {
      if (e.key === 'ArrowRight') setPage(p => Math.min(p + 1, 2));
      if (e.key === 'ArrowLeft') setPage(p => Math.max(p - 1, 0));
    };
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeys);
    
    const timer = setInterval(() => setTime(new Date()), 1000);
    const fetchData = async () => {
      try {
        const [w, n] = await Promise.all([
          fetch(WEATHER_API).then(r => r.json()),
          fetch('https://api.rss2json.com/v1/api.json?rss_url=https://tengrinews.kz/news.rss').then(r => r.json())
        ]);
        setWeather({ temp: Math.round(w.current_weather.temperature), code: w.current_weather.weathercode });
        setNews(n.items.map(i => i.title));
      } catch (e) { console.log("Sync error"); }
    };
    fetchData();
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeys);
      clearInterval(timer);
    };
  }, []);

  return (
    <Box style={{ backgroundColor: '#000', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* 300vw - Үш бетке арналған контейнер */}
      <Box style={{ 
        display: 'flex', 
        width: '300vw', 
        height: '100vh', 
        transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', 
        transform: `translateX(-${page * 100}vw)` 
      }}>
        
        {/* --- PAGE 0: DASHBOARD (СЕНІҢ ДИЗАЙНЫҢ) --- */}
        <Container fluid p="70px" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Group align="flex-start" justify="space-between" wrap="nowrap">
            <Stack gap="xl">
              <Stack gap={0}>
                <Title order={1} style={{ fontSize: '150px', fontWeight: 100, letterSpacing: '-8px', lineHeight: 0.8 }}>{dayjs(time).format('HH:mm')}</Title>
                <Text size="35px" fw={200} c="dimmed" mt="md" style={{ letterSpacing: '5px' }}>{dayjs(time).locale('ru').format('dddd, D MMMM')}</Text>
              </Stack>
              <Box mt="xl" style={{ opacity: 0.8, marginLeft: '-15px' }}>
                <Calendar locale="ru" size="md" styles={{
                  calendar: { backgroundColor: 'transparent', border: 'none' },
                  day: { color: '#fff', fontSize: '18px', fontWeight: 300, '&[data-today]': { color: '#000', backgroundColor: '#fff', borderRadius: '50%' } },
                  monthThead: { color: '#444' }, calendarHeader: { color: '#fff' }
                }} />
              </Box>
            </Stack>
            <Stack align="flex-end" gap="60px">
              <Group gap="xl" align="center"><Text style={{ fontSize: '80px', fontWeight: 100 }}>{weather.temp}°</Text><Sun size={50} strokeWidth={1} /></Group>
              <Stack align="flex-end" gap="35px" style={{ borderRight: '1px solid #333', paddingRight: '30px' }}>
                <Text size="35px" fw={200}>{sensors.temp}°C</Text>
                <Text size="35px" fw={200}>{sensors.hum}%</Text>
                <Text size="35px" fw={200} c={sensors.co2 > 1000 ? 'red' : 'white'}>{sensors.co2} ppm</Text>
              </Stack>
            </Stack>
          </Group>
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #222' }}>
            <Group justify="space-between" wrap="nowrap">
              <Text fw={900} size="xs" style={{ letterSpacing: '3px', whiteSpace: 'nowrap', color: '#ffffff' }}>TENGRI NEWS</Text>
              <marquee scrollamount="6" style={{ fontSize: '28px', fontWeight: 300, color: '#fff', width: '100%', marginLeft: '40px' }}>{news.join('   //   ')}</marquee>
            </Group>
          </Box>
        </Container>

        {/* --- PAGE 1: VECTOR HUB (ОРТАЛАНҒАН) --- */}
        <Container fluid style={{ width: '100vw', height: '100vh' }}>
          <Center h="100%">
            <Stack gap="100px" align="center" style={{ width: '100%' }}>
              <Title order={2} style={{ fontSize: '40px', fontWeight: 100, letterSpacing: '20px', textTransform: 'uppercase' }}>Hub</Title>
              <SimpleGrid cols={3} spacing="120px">
                {[
                  { name: 'YOUTUBE', icon: <Youtube size={50} />, action: () => launch('https://www.youtube.com/tv', 'web', true) },
                  { name: 'CALENDAR', icon: <GoogleIcon size={50} />, action: () => launch('https://calendar.google.com', 'web') },
                  { name: 'KEEP', icon: <Bookmark size={50} />, action: () => launch('https://keep.google.com', 'web') },
                  { name: 'MUSIC', icon: <Music size={50} />, action: () => launch('https://music.yandex.kz', 'web') },
                  { name: 'CALC', icon: <Calculator size={50} />, action: () => launch('gnome-calculator', 'sys') },
                  { name: 'CLOCKS', icon: <Clock size={50} />, action: () => launch('gnome-clocks', 'sys') },
                ].map((s) => (
                  <UnstyledButton key={s.name} onClick={s.action}>
                    <Stack align="center" gap="md"><Box>{s.icon}</Box><Text size="xs" fw={700} style={{ letterSpacing: '3px', opacity: 0.5 }}>{s.name}</Text></Stack>
                  </UnstyledButton>
                ))}
              </SimpleGrid>
            </Stack>
          </Center>
        </Container>

        {/* --- PAGE 2: SETTINGS (РЕАЛЬНЫЕ НАСТРОЙКИ) --- */}
        <Container fluid p="100px" style={{ width: '100vw', height: '100vh' }}>
          <Stack gap="80px">
            <Title order={2} style={{ fontSize: '40px', fontWeight: 100, letterSpacing: '15px' }}>SETTINGS</Title>
            <SimpleGrid cols={2} spacing="100px">
              <Stack gap="xl">
                <Text fw={900} size="sm" style={{ letterSpacing: '4px' }}>BRIGHTNESS</Text>
                <Slider color="gray" value={brightness} onChange={(v) => { setBrightness(v); ipcRenderer?.send('set-brightness', v); }} />
                <Text size="xs" c="dimmed">Adjust Raspberry Pi screen intensity</Text>
              </Stack>
              <Stack gap="xl">
                <Text fw={900} size="sm" style={{ letterSpacing: '4px' }}>POWER UNIT</Text>
                <Group gap="xl">
                  <ActionIcon size="80px" variant="outline" color="red" onClick={() => sendCmd('reboot')}><RefreshCw /></ActionIcon>
                  <ActionIcon size="80px" variant="outline" color="red" onClick={() => sendCmd('shutdown')}><Power /></ActionIcon>
                </Group>
              </Stack>
            </SimpleGrid>
            <Center mt="50px">
                <UnstyledButton onClick={updateMirror} style={{ borderBottom: '1px solid #ff0000', padding: '10px 40px' }}>
                   <Group gap="xl"><RefreshCw size={20} color="#ff0000" /><Text fw={900} c="red" size="sm" style={{ letterSpacing: '5px' }}>FORCE UPDATE VECTOR MIRROR</Text></Group>
                </UnstyledButton>
            </Center>
          </Stack>
        </Container>

      </Box>
    </Box>
  );
}