import { Container, Stack, Title, SimpleGrid, UnstyledButton, Box, Text } from "@mantine/core";
import { Youtube, Bookmark, Calendar as GoogleIcon, Music, Calculator, Clock } from "lucide-react";

export const Hub = ({ launch }) => {
  const services = [
    {
      name: "YOUTUBE TV",
      icon: <Youtube size={60} strokeWidth={1} />,
      action: () => launch("https://www.youtube.com/tv", "web", true),
    },
    {
      name: "CALENDAR",
      icon: <GoogleIcon size={60} strokeWidth={1} />,
      action: () => launch("https://calendar.google.com", "web"),
    },
    {
      name: "KEEP",
      icon: <Bookmark size={60} strokeWidth={1} />,
      action: () => launch("https://keep.google.com", "web"),
    },
    {
      name: "MUSIC",
      icon: <Music size={60} strokeWidth={1} />,
      action: () => launch("https://music.yandex.kz", "web"),
    },
    {
      name: "CALCULATOR",
      icon: <Calculator size={60} strokeWidth={1} />,
      action: () => launch("gnome-calculator", "sys"),
    },
    {
      name: "CLOCKS",
      icon: <Clock size={60} strokeWidth={1} />,
      action: () => launch("gnome-clocks", "sys"),
    },
  ];

  return (
    <Container fluid p="80px" style={{ width: "100vw", height: "100vh" }}>
      <Stack gap="100px" h="100%" align="center" justify="center">
        <Title
          order={2}
          style={{
            fontSize: "40px",
            fontWeight: 100,
            letterSpacing: "20px",
            textTransform: "uppercase",
          }}
        >
          Vector Hub
        </Title>
        <SimpleGrid cols={3} spacing="100px">
          {services.map((s) => (
            <UnstyledButton
              key={s.name}
              onClick={s.action}
              style={{ textAlign: "center" }}
            >
              <Stack align="center" gap="md">
                <Box>{s.icon}</Box>
                <Text
                  size="xs"
                  fw={700}
                  style={{ letterSpacing: "3px", opacity: 0.5 }}
                >
                  {s.name}
                </Text>
              </Stack>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};