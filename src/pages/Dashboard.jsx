import { Container, Group, Stack, Title, Text, Box, Transition } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { Sun, Wind, Leaf, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru"; // 👇 РУССКИЙ ЯЗЫК

// Подключаем русский
dayjs.extend(relativeTime);
dayjs.locale("ru");

export const Dashboard = ({ time, weather, news }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Текст AQI (Русский)
  const getAqiColor = (aqi) => {
    if (aqi <= 20) return "teal";
    if (aqi <= 40) return "yellow";
    return "red";
  };

  const getAqiText = (aqi) => {
    if (aqi <= 20) return "Чистый";
    if (aqi <= 40) return "Средний";
    return "Грязный";
  };

  useEffect(() => {
    if (!news || news.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
        setVisible(true);
      }, 600);
    }, 10000);
    return () => clearInterval(interval);
  }, [news]);

  const hasNews = news && news.length > 0;
  const currentItem = hasNews 
    ? news[currentIndex] 
    : { title: "Загрузка VECTOR OS...", date: new Date(), source: "СИСТЕМА" };

  return (
    <Container fluid p="70px" style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <Group align="flex-start" justify="space-between" wrap="nowrap">
        
        {/* ЛЕВАЯ ЧАСТЬ: Часы и Календарь */}
        <Stack gap="xl">
          <Stack gap={0}>
            <Title order={1} style={{ fontSize: "150px", fontWeight: 100, letterSpacing: "-8px", lineHeight: 0.8 }}>
              {dayjs(time).format("HH:mm")}
            </Title>
            <Text size="35px" fw={200} c="dimmed" mt="md" style={{ letterSpacing: "5px", textTransform: "capitalize" }}>
              {dayjs(time).locale("ru").format("dddd, D MMMM")}
            </Text>
          </Stack>
          
          <Box mt="xl" style={{ opacity: 0.8, marginLeft: "-15px", width: "280px" }}>
            <Calendar
              locale="ru"
              size="sm"
              withControls={false}
              styles={{
                calendar: { backgroundColor: "transparent", border: "none" },
                day: { 
                  color: "#fff", 
                  fontSize: "14px", 
                  width: "35px", 
                  height: "35px", 
                  "&[data-today]": { color: "#000", backgroundColor: "#fff", borderRadius: "50%" } 
                },
                calendarHeader: { display: 'none' }, 
              }}
            />
          </Box>
        </Stack>

        {/* ПРАВАЯ ЧАСТЬ: Данные (Погода + AQI) */}
        <Stack align="flex-end" gap="60px">
          <Group gap="xl" align="center">
            <Text style={{ fontSize: "100px", fontWeight: 100 }}>
              {weather?.temp !== undefined ? `${weather.temp}°` : "--°"}
            </Text>
            <Sun size={60} strokeWidth={1} />
          </Group>
          
          <Stack align="flex-end" gap="20px" style={{ borderRight: "1px solid #333", paddingRight: "30px" }}>
            
            {/* 1. Город */}
            <Group gap="sm">
               <Text size="32px" fw={100} style={{ letterSpacing: "1px" }}>
                 {weather?.city || "Алматы"}
               </Text>
               <MapPin size={28} strokeWidth={1.5} />
            </Group>

            {/* 2. Качество воздуха (AQI) */}
            <Group gap="sm">
               <Stack gap={0} align="flex-end">
                 <Text size="32px" fw={100} c={getAqiColor(weather?.aqi)}>
                   {weather?.aqi || "--"}
                 </Text>
                 <Text size="xs" c="dimmed" tt="uppercase">{getAqiText(weather?.aqi)}</Text>
               </Stack>
               <Leaf size={28} color={getAqiColor(weather?.aqi)} strokeWidth={1.5} />
            </Group>

            {/* 3. Ветер */}
            <Group gap="sm">
               <Text size="32px" fw={100}>
                 {weather?.wind || "--"} м/с
               </Text>
               <Wind size={28} strokeWidth={1.5} />
            </Group>

          </Stack>
        </Stack>
      </Group>

      {/* НИЖНЯЯ ПАНЕЛЬ НОВОСТЕЙ */}
      <Box mt="xl" pt="xl" style={{ borderTop: "1px solid #222", textAlign: "center", minHeight: "160px" }}>
        <Transition mounted={visible} transition="fade" duration={600} timingFunction="ease">
          {(styles) => (
            <div style={styles}>
              <Text 
                size="36px" 
                fw={200} 
                style={{ lineHeight: 1.3, maxWidth: "85%", margin: "0 auto", letterSpacing: "0.5px" }}
              >
                {currentItem?.title || "Поиск актуальных новостей..."}
              </Text>
              
              <Group justify="center" gap="xl" mt="md">
                <Text fw={900} size="xs" c="white" style={{ letterSpacing: "3px" }}>
                  {currentItem?.source || "VECTOR"}
                </Text>
                <Text size="xs" c="dimmed" style={{ letterSpacing: "1px" }}>
                  {hasNews ? dayjs(currentItem.date).fromNow() : "СЕЙЧАС"}
                </Text>
              </Group>
            </div>
          )}
        </Transition>
      </Box>
    </Container>
  );
};