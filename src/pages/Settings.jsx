import React from 'react';
import { Container, Stack, Title, Text, Group, Box, UnstyledButton } from "@mantine/core";
import { Wifi, RefreshCw, Power, ChevronRight, Terminal } from "lucide-react";
import YandexAuth from '../components/YandexAuth';

// БАТЫРМА КОМПОНЕНТІ (Өзгеріссіз)
const SettingItem = ({ icon: Icon, title, desc, onClick, danger = false }) => {
  return (
    <UnstyledButton 
      onClick={onClick}
      style={{
        width: '100%',
        padding: '20px 24px',
        backgroundColor: '#000',
        border: '1px solid #222',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
      }}
      // Hover
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? 'white' : 'white';
        e.currentTarget.style.backgroundColor = danger ? '#300' : '#111';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#222';
        e.currentTarget.style.backgroundColor = '#000';
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="lg">
          <Icon size={24} color={danger ? "#666" : "white"} strokeWidth={1.5} />
          <Stack gap={2}>
            <Text c="white" fw={700} tt="uppercase" size="sm" style={{ letterSpacing: '2px' }}>
              {title}
            </Text>
            {desc && (
              <Text c="dimmed" size="xs" style={{ fontSize: '12px' }}>
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
  openWifiSettings 
}) => {

  return (
    <Container 
      fluid 
      h="100vh" 
      bg="black" 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {/* maw={750} - Ені 750px.
         Блок экран ортасында, бірақ ішіндегі мәтін СОЛ ЖАҚТА.
      */}
      <Stack w="100%" maw={750} gap="xl" p="md">

        {/* 1. HEADER (LEFT ALIGNED) */}
        {/* align="center" дегенді алып тастадым */}
        <Stack gap={4} mb="md">
            <Title 
              order={2} 
              c="white" 
              fw={300} 
              style={{ fontSize: '28px', letterSpacing: '10px', textTransform: 'uppercase' }}
            >
              КОНФИГУРАЦИЯ
            </Title>
            <Group gap="xs">
              <Terminal size={14} color="#444" />
              <Text c="dimmed" size="xs" fw={700} style={{ letterSpacing: '4px', fontSize: '11px' }}>
                VECTOR OS v{appVersion || "DEV"}
              </Text>
            </Group>
        </Stack>

        {/* 2. YANDEX БЛОГЫ */}
        <Box>
            {/* ta="center" дегенді алып тастадым (default: left) */}
            <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={2} mb="xs">
                Голосовой Ассистент
            </Text>
            <YandexAuth />
        </Box>

        {/* 3. СИСТЕМНЫЕ НАСТРОЙКИ */}
        <Box>
            {/* Мәтін сол жақта */}
            <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={2} mb="xs">
                Система
            </Text>
            <Stack gap="sm">
                
                <SettingItem 
                    icon={Wifi}
                    title="WI-FI Подключение"
                    desc="Управление беспроводной сетью"
                    onClick={openWifiSettings}
                />

                <SettingItem 
                    icon={RefreshCw}
                    title="Обновить Интерфейс"
                    desc="Загрузка последней версии (Git Pull)"
                    onClick={updateMirror}
                />

                <SettingItem 
                    icon={Power}
                    title="Перезагрузка"
                    desc="Полный рестарт системы"
                    danger={true}
                    onClick={() => window.confirm("Перезагрузить систему?") && sendCmd("reboot")}
                />

            </Stack>
        </Box>

      </Stack>
    </Container>
  );
};

export default Settings;