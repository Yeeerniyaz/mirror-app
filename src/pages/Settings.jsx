import React from "react";
import {
  Container,
  Stack,
  Title,
  Text,
  Group,
  Box,
  UnstyledButton,
  SimpleGrid,
} from "@mantine/core";
import { Wifi, RefreshCw, Power, ChevronRight, Terminal, Palette } from "lucide-react";
import YandexAuth from "../components/YandexAuth";

// Сөздік және компоненттер
import { translations } from "../utils/translations";
import LedControl from "../components/LedControl";

// БАТЫРМА КОМПОНЕНТІ (Өзгеріссіз)
const SettingItem = ({ icon: Icon, title, desc, onClick, danger = false }) => {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px 24px",
        backgroundColor: "#000",
        border: "1px solid #222",
        borderRadius: "8px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "white";
        e.currentTarget.style.backgroundColor = danger ? "#300" : "#111";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#222";
        e.currentTarget.style.backgroundColor = "#000";
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="lg">
          <Icon size={24} color={danger ? "#666" : "white"} strokeWidth={1.5} />
          <Stack gap={2}>
            <Text
              c="white"
              fw={700}
              tt="uppercase"
              size="sm"
              style={{ letterSpacing: "2px" }}
            >
              {title}
            </Text>
            {desc && (
              <Text c="dimmed" size="xs" style={{ fontSize: "12px" }}>
                {desc}
              </Text>
            )}
          </Stack>
        </Group>
        <ChevronRight size={20} color="#333" />
      </Group>
    </UnstyledButton>
  );
};

export const Settings = ({
  sendCmd,
  updateMirror,
  appVersion,
  openWifiSettings,
  config,
}) => {
  const lang = config?.language || "ru";
  const T = translations[lang] || translations.ru;

  return (
    <Container
      fluid
      h="100vh"
      bg="black"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // Контентті ортаға жинаймыз
        overflowY: "auto", 
        padding: "60px 20px",
      }}
    >
      {/* 1. HEADER - Орталықтандырылған тақырып */}
      <Stack gap={4} mb={60} align="center" w="100%" maw={1000}>
        <Title
          order={2}
          c="white"
          fw={300}
          style={{
            fontSize: "28px",
            letterSpacing: "10px",
            textTransform: "uppercase",
            textAlign: "center"
          }}
        >
          {T.config_title}
        </Title>
        <Group gap="xs">
          <Terminal size={14} color="#444" />
          <Text
            c="dimmed"
            size="xs"
            fw={700}
            style={{ letterSpacing: "4px", fontSize: "11px" }}
          >
            VECTOR OS v{appVersion || "DEV"}
          </Text>
        </Group>
      </Stack>

      {/* 2. АДАПТИВТІ ТОР (MAW ограничивает ширину, чтобы не растягивалось) */}
      <SimpleGrid 
        cols={{ base: 1, lg: 2 }} 
        spacing={50} 
        w="100%" 
        maw={1000} // Оң жақ пен сол жақтың жалпы енін шектеу
        style={{ margin: "0 auto" }}
      >
        
        {/* LEFT COLUMN: SETTINGS */}
        <Stack gap="xl">
          <Box>
            <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={2} mb="md">
              {T.system_settings}
            </Text>
            <Stack gap="sm">
              <SettingItem
                icon={Wifi}
                title={T.wifi}
                desc={T.wifi_desc}
                onClick={openWifiSettings}
              />
              <SettingItem
                icon={RefreshCw}
                title={T.update}
                desc={T.update_desc}
                onClick={updateMirror}
              />
              <SettingItem
                icon={Power}
                title={T.reboot}
                desc={T.reboot_desc}
                danger={true}
                onClick={() => {
                  if (window.confirm(`${T.reboot}?`)) sendCmd("reboot");
                }}
              />
            </Stack>
          </Box>

          <Box>
            <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={2} mb="md">
              {T.voice_assistant}
            </Text>
            <YandexAuth lang={lang} T={T} />
          </Box>
        </Stack>

        {/* RIGHT COLUMN: LED CONTROL */}
        <Box>
          <Group gap="xs" mb="md">
            <Palette size={14} color="#444" />
            <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={2}>
              {lang === "ru" ? "Управление светом" : "Жарықты басқару"}
            </Text>
          </Group>
          <Box 
            style={{ 
              border: "1px solid #222", 
              borderRadius: "8px", 
              padding: "24px", 
              backgroundColor: "#050505",
              height: "fit-content"
            }}
          >
            <LedControl />
          </Box>
        </Box>

      </SimpleGrid>
    </Container>
  );
};

export default Settings;