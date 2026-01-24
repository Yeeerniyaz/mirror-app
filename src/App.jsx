import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title, SimpleGrid, Paper, Container } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import '@mantine/dates/styles.css';

export default function App() {
  const [time, setTime] = useState(new Date());
  const [sensors, setSensors] = useState({ temp: 0, hum: 0, co2: 0 });
  const [news, setNews] = useState([]);

  useEffect(() => {
    // Уақыт
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Датчиктер (Python Bridge)
    const fetchSensors = () => {
      fetch('http://127.0.0.1:5005/api/sensors')
        .then(res => res.json())
        .then(data => setSensors(data))
        .catch(e => console.log("Sensor error"));
    };

    // Жаңалықтар (Placeholder - Tengri RSS әдетте сервер арқылы алынады)
    const fetchNews = () => {
      setNews(["Tengri News: Қазақстандағы басты оқиғалар...", "Алматыда жаңа технологиялық орталық ашылды"]);
    };

    fetchSensors();
    fetchNews();
    const sensorInterval = setInterval(fetchSensors, 10000);
    return () => { clearInterval(timer); clearInterval(sensorInterval); };
  }, []);

  return (
    <Container fluid p="xl" style={{ backgroundColor: '#000', color: '#fff', height: '100vh', position: 'relative' }}>
      
      {/* СЛЕВА СВЕРХУ: Часы */}
      <div style={{ position: 'absolute', top: 40, left: 40 }}>
        <Title order={1} style={{ fontSize: '100px', color: '#FF5700', lineHeight: 1 }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Title>
        <Text size="xl" fw={500} c="dimmed">
          {time.toLocaleDateString('kk-KZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </div>

      {/* СПРАВА СВЕРХУ: Погода и Датчики */}
      <div style={{ position: 'absolute', top: 40, right: 40, textAlign: 'right' }}>
        <Stack align="flex-end" spacing="xs">
          <Group>
            <Text size="30px" fw={700} c="orange">Алматы: -5°C</Text>
          </Group>
          <Paper bg="transparent" p={0}>
            <Text size="xl">Үйде: <span style={{color: '#FF5700'}}>{sensors.temp}°C</span></Text>
            <Text size="xl">Ылғалдылық: <span style={{color: '#FF5700'}}>{sensors.hum}%</span></Text>
            <Text size="xl">Ауа сапасы: <span style={{color: sensors.co2 > 1000 ? 'red' : '#FF5700'}}>{sensors.co2} ppm</span></Text>
          </Paper>
        </Stack>
      </div>

      {/* СЛЕВА СНИЗУ: Календарь */}
      <div style={{ position: 'absolute', bottom: 150, left: 40 }}>
        <Calendar 
          size="md"
          styles={{
            calendar: { backgroundColor: 'transparent', border: 'none' },
            day: { color: '#fff', '&[data-today]': { color: '#FF5700', border: '1px solid #FF5700' } },
            monthThead: { color: '#FF5700' }
          }}
        />
      </div>

      {/* СНИЗУ: Новости */}
      <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: '1px solid #333', paddingTop: '10px' }}>
        <Group position="apart">
          <Text fw={700} c="orange" size="sm">TENGRI NEWS:</Text>
          <marquee style={{ width: '85%', color: '#ccc', fontSize: '20px' }}>
            {news.join(' | ')}
          </marquee>
        </Group>
      </div>

    </Container>
  );
}