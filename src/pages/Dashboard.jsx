import { Container, Group, Stack, Title, Text, Box, Transition } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { Sun, Wind, Leaf, MapPin } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import "dayjs/locale/ru";
import "dayjs/locale/kk";
import "dayjs/locale/en";

import { translations } from "../utils/translations";

dayjs.extend(relativeTime);

export const Dashboard = ({ time, weather, news, config }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const lang = useMemo(() => config?.language || "ru", [config?.language]);
  const T = useMemo(() => translations[lang] || translations.ru, [lang]);

  useEffect(() => {
    dayjs.locale(lang);
  }, [lang]);

  const getAqiColor = (aqi) => {
    if (aqi <= 20) return "teal";
    if (aqi <= 40) return "yellow";
    return "red";
  };

  const getAqiText = (aqi) => {
    if (aqi <= 20) return T.clean;
    if (aqi <= 40) return T.moderate;
    return T.polluted;
  };

  useEffect(() => {
    if (!news?.length) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
        setVisible(true);
      }, 600);
    }, 10000); 
    return () => clearInterval(interval);
  }, [news]);

  const currentItem = news?.[currentIndex] || { title: T.news_search, date: new Date(), source: T.system };

  return (
    <Container fluid p="70px" style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "black" }}>
      
      {/* ВЕРХНЯЯ БЛОК */}
      <Group align="flex-start" justify="space-between" wrap="nowrap">
        
        {/* ЛЕВО: ЧАСЫ */}
        <Stack gap="xl">
          <Stack gap={0}>
            <Title order={1} style={{ 
              fontSize: "150px", // Твой старый размер
              fontWeight: 100, 
              letterSpacing: "-8px", 
              lineHeight: 0.8, 
              color: "white",
              fontVariantNumeric: "tabular-nums" 
            }}>
              {dayjs(time).format("HH:mm")}
            </Title>
            <Text size="35px" fw={200} c="dimmed" mt="md" style={{ letterSpacing: "5px", textTransform: "capitalize" }}>
              {dayjs(time).format("dddd, D MMMM")}
            </Text>
          </Stack>
          
          <Box mt="xl" style={{ opacity: 0.8, marginLeft: "-15px", width: "280px" }}>
            <Calendar
              locale={lang}
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

        {/* ПРАВО: ПОГОДА */}
        <Stack align="flex-end" gap="60px">
          <Group gap="xl" align="center">
            <Text style={{ fontSize: "100px", fontWeight: 100, color: "white" }}>
              {weather?.temp !== undefined ? `${weather.temp}°` : "--°"}
            </Text>
            <Sun size={60} strokeWidth={1} color="white" />
          </Group>
          
          <Stack align="flex-end" gap="20px" style={{ borderRight: "1px solid #333", paddingRight: "30px" }}>
            <Group gap="sm">
               <Text size="32px" fw={100} style={{ color: "white" }}>{config?.city || weather?.city}</Text>
               <MapPin size={28} strokeWidth={1.5} color="white" />
            </Group>

            <Group gap="sm">
               <Stack gap={0} align="flex-end">
                 <Text size="32px" fw={100} c={getAqiColor(weather?.aqi)}>{weather?.aqi || "--"}</Text>
                 <Text size="xs" c="dimmed" tt="uppercase">{getAqiText(weather?.aqi)}</Text>
               </Stack>
               <Leaf size={28} color={getAqiColor(weather?.aqi)} strokeWidth={1.5} />
            </Group>

            <Group gap="sm">
               <Text size="32px" fw={100} color="white">{weather?.wind || "--"} {T.wind_speed}</Text>
               <Wind size={28} strokeWidth={1.5} color="white" />
            </Group>
          </Stack>
        </Stack>
      </Group>

      {/* НИЗ: НОВОСТИ */}
      <Box mt="xl" pt="xl" style={{ borderTop: "1px solid #222", textAlign: "center", minHeight: "160px" }}>
        <Transition mounted={visible} transition="fade" duration={600}>
          {(styles) => (
            <div style={styles}>
              <Text size="36px" fw={200} c="white" style={{ lineHeight: 1.3, maxWidth: "85%", margin: "0 auto" }}>
                {currentItem?.title}
              </Text>
              <Group justify="center" gap="xl" mt="md">
                <Text fw={900} size="xs" c="white" style={{ letterSpacing: "3px" }}>
                  {currentItem?.source}
                </Text>
                <Text size="xs" c="dimmed">
                  {news?.length ? dayjs(currentItem.date).fromNow() : T.now}
                </Text>
              </Group>
            </div>
          )}
        </Transition>
      </Box>
    </Container>
  );
};