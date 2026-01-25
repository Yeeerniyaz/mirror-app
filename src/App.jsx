import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title, Container, Box, SimpleGrid, UnstyledButton, Center, Slider, ActionIcon, Progress } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { Sun, Youtube, Bookmark, Calendar as GoogleIcon, Music, Calculator, Clock, RefreshCw } from 'lucide-react';
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
  const [updStatus, setUpdStatus] = useState('');
  const [updProgress, setUpdProgress] = useState(0);
  const [appVersion, setAppVersion] = useState('N/A');

  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  const launch = (data, type, isTV = false) => ipcRenderer?.send('launch', { data, type, isTV });
  const sendCmd = (cmd) => ipcRenderer?.send('system-cmd', cmd);
  const updateMirror = () => ipcRenderer?.send('check-for-updates');

  const fetchData = async () => {
    try {
      const [wRes, nRes] = await Promise.all([
        fetch(WEATHER_API).then(r => r.json()),
        fetch('https://api.rss2json.com/v1/api.json?rss_url=https://tengrinews.kz/news.rss').then(r => r.json())
      ]);
      setWeather({ temp: Math.round(wRes.current_weather.temperature), code: wRes.current_weather.weathercode });
      setNews(nRes.items.map(i => i.title));
    } catch (e) { console.error("Sync error"); }
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 0) setPage(p => Math.min(p + 1, 2));
      else if (e.deltaY < 0) setPage(p => Math.max(p - 1, 0));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') setPage(p => Math.min(p + 1, 2));
      if (e.key === 'ArrowLeft') setPage(p => Math.max(p - 1, 0));
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);

    ipcRenderer?.on('update_status', (e, msg) => setUpdStatus(msg));
    ipcRenderer?.on('update_progress', (e, prg) => setUpdProgress(prg));
    ipcRenderer?.on('app-version', (e, ver) => setAppVersion(ver));
    
    // Запрашиваем версию
    ipcRenderer?.send('get-app-version');

    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    fetchData();
    const dataTimer = setInterval(fetchData, 3600000); // Обновление раз в час

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      ipcRenderer?.removeAllListeners('update_status');
      ipcRenderer?.removeAllListeners('update_progress');
      ipcRenderer?.removeAllListeners('app-version');
      clearInterval(clockTimer);
      clearInterval(dataTimer);
    };
  }, []);

  return (
    <Box style={{ backgroundColor: '#000', height: '100vh', width: '100vw', overflow: 'hidden', color: 'white' }}>
      
      {updStatus && (
        <Box style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, width: 400, background: '#111', padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
          <Text size="xs" fw={900} mb={5} c="orange" style={{ letterSpacing: '2px' }}>{updStatus.toUpperCase()}</Text>
          <Progress value={updProgress} color="orange" size="sm" animated />
        </Box>
      )}

      <Box style={{ 
        display: 'flex', 
        width: '300vw', 
        height: '100vh', 
        transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)', 
        transform: `translateX(-${page * 100}vw)` 
      }}>
        
        {/* PAGE 0: DASHBOARD */}
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
                  day: { color: '#fff', fontSize: '18px', fontWeight: 300, '&[data-today]': { color: '#000', backgroundColor: '#fff', borderRadius: '50%' } }
                }} />
              </Box>
            </Stack>
            <Stack align="flex-end" gap="60px">
              <Group gap="xl" align="center">
                <Text style={{ fontSize: '80px', fontWeight: 100 }}>{weather.temp}°</Text>
                <Sun size={50} strokeWidth={1} />
              </Group>
              <Stack align="flex-end" gap="35px" style={{ borderRight: '1px solid #333', paddingRight: '30px' }}>
                <Text size="35px" fw={200}>{sensors.temp}°C</Text>
                <Text size="35px" fw={200}>{sensors.hum}%</Text>
              </Stack>
            </Stack>
          </Group>
          <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #222' }}>
            <Group justify="space-between" wrap="nowrap">
              <Text fw={900} size="xs" style={{ letterSpacing: '3px' }}>TENGRI NEWS</Text>
              <marquee scrollamount="6" style={{ fontSize: '28px', fontWeight: 200, width: '100%', marginLeft: '40px' }}>{news.join('   //   ')}</marquee>
            </Group>
          </Box>
        </Container>

        {/* PAGE 1: HUB */}
        <Container fluid p="80px" style={{ width: '100vw', height: '100vh' }}>
          <Stack gap="100px" h="100%" align="center" justify="center">
            <Title order={2} style={{ fontSize: '40px', fontWeight: 100, letterSpacing: '20px', textTransform: 'uppercase' }}>Vector Hub</Title>
            <SimpleGrid cols={3} spacing="100px">
              {[
                { name: 'YOUTUBE TV', icon: <Youtube size={60} strokeWidth={1} />, action: () => launch('https://www.youtube.com/tv', 'web', true) },
                { name: 'CALENDAR', icon: <GoogleIcon size={60} strokeWidth={1} />, action: () => launch('https://calendar.google.com', 'web') },
                { name: 'KEEP', icon: <Bookmark size={60} strokeWidth={1} />, action: () => launch('https://keep.google.com', 'web') },
                { name: 'MUSIC', icon: <Music size={60} strokeWidth={1} />, action: () => launch('https://music.yandex.kz', 'web') },
                { name: 'CALCULATOR', icon: <Calculator size={60} strokeWidth={1} />, action: () => launch('gnome-calculator', 'sys') },
                { name: 'CLOCKS', icon: <Clock size={60} strokeWidth={1} />, action: () => launch('gnome-clocks', 'sys') },
              ].map((s) => (
                <UnstyledButton key={s.name} onClick={s.action} style={{ textAlign: 'center' }}>
                  <Stack align="center" gap="md">
                    <Box>{s.icon}</Box>
                    <Text size="xs" fw={700} style={{ letterSpacing: '3px', opacity: 0.5 }}>{s.name}</Text>
                  </Stack>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>

        {/* PAGE 2: SETTINGS */}
        <Container fluid p="100px" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <Stack gap="80px">
            <Title order={2} style={{ fontSize: '40px', fontWeight: 100, letterSpacing: '15px' }}>SETTINGS</Title>
            <SimpleGrid cols={2} spacing="150px">
              <Stack gap="xl">
                <Text fw={900} size="sm" style={{ letterSpacing: '4px' }}>BRIGHTNESS</Text>
                <Slider color="gray" size="lg" value={brightness} onChange={(v) => { setBrightness(v); ipcRenderer?.send('set-brightness', v); }} />
              </Stack>
              <Stack gap="xl">
                <Text fw={900} size="sm" style={{ letterSpacing: '4px' }}>SYSTEM REBOOT</Text>
                <ActionIcon size="100px" variant="outline" color="red" onClick={() => sendCmd('reboot')} style={{ border: '1px solid #ff0000' }}>
                   <RefreshCw size={40} />
                </ActionIcon>
              </Stack>
            </SimpleGrid>
            <Center mt="100px">
                <UnstyledButton onClick={updateMirror} style={{ borderBottom: '2px solid #ff0000', padding: '15px 50px' }}>
                   <Group gap="xl">
                      <RefreshCw size={25} color="#ff0000" />
                      <Text fw={900} c="red" size="md" style={{ letterSpacing: '6px' }}>FORCE UPDATE VECTOR MIRROR</Text>
                   </Group>
                </UnstyledButton>
            </Center>
          </Stack>
          <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '3px', opacity: 0.3, position: 'absolute', bottom: '40px', right: '70px' }}>
            VECTOR OS v{appVersion}
          </Text>
        </Container>

      </Box>
    </Box>
  );
}