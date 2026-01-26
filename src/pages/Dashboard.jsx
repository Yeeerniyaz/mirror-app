import { Container, Group, Stack, Title, Text, Box } from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { Sun } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";

export const Dashboard = ({ time, weather, sensors, news }) => (
  <Container fluid p="70px" style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <Group align="flex-start" justify="space-between" wrap="nowrap">
      <Stack gap="xl">
        <Stack gap={0}>
          <Title order={1} style={{ fontSize: "150px", fontWeight: 100, letterSpacing: "-8px", lineHeight: 0.8 }}>
            {dayjs(time).format("HH:mm")}
          </Title>
          <Text size="35px" fw={200} c="dimmed" mt="md" style={{ letterSpacing: "5px" }}>
            {dayjs(time).locale("ru").format("dddd, D MMMM")}
          </Text>
        </Stack>
        
        {/* Контейнер для календаря */}
        <Box mt="xl" style={{ opacity: 0.8, marginLeft: "-15px", width: "280px" }}>
          <Calendar
            locale="ru"
            size="sm"
            withControls={false} // Убирает стрелки влево/вправо
            styles={{
              calendar: { backgroundColor: "transparent", border: "none" },
              day: {
                color: "#fff",
                fontSize: "14px", 
                width: "35px",
                height: "35px",
                "&[data-today]": { color: "#000", backgroundColor: "#fff", borderRadius: "50%" },
              },
              // Полностью скрываем заголовок (название месяца и года)
              calendarHeader: { display: 'none' }, 
            }}
          />
        </Box>
      </Stack>
      
      <Stack align="flex-end" gap="60px">
        <Group gap="xl" align="center">
          <Text style={{ fontSize: "80px", fontWeight: 100 }}>{weather.temp}°</Text>
          <Sun size={50} strokeWidth={1} />
        </Group>
        <Stack align="flex-end" gap="35px" style={{ borderRight: "1px solid #333", paddingRight: "30px" }}>
          <Text size="35px" fw={200}>{sensors.temp}°C</Text>
          <Text size="35px" fw={200}>{sensors.hum}%</Text>
        </Stack>
      </Stack>
    </Group>

    <Box mt="xl" pt="xl" style={{ borderTop: "1px solid #222" }}>
      <Group justify="space-between" wrap="nowrap">
        <Text fw={900} size="xs" style={{ letterSpacing: "3px" }}>TENGRI NEWS</Text>
        <marquee scrollamount="6" style={{ fontSize: "28px", fontWeight: 200, width: "100%", marginLeft: "40px" }}>
          {news.join("   //   ")}
        </marquee>
      </Group>
    </Box>
  </Container>
);