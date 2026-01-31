import React from 'react';
import { Container, Stack, Title, Text, Group, Box, UnstyledButton, Center } from "@mantine/core";
import { RefreshCw, LogOut, Power, Cpu, Settings as SettingsIcon, ChevronRight, Wifi, Lightbulb } from "lucide-react";

// Импорт наших новых компонентов
import YandexAuth from '../components/YandexAuth';
import LedControl from '../components/LedControl';

export const Settings = ({ 
  sendCmd, 
  updateMirror, 
  updatePython, 
  appVersion,
  user, 
  onLogout,
  openWifiSettings 
}) => {

  const SettingRow = ({ icon: Icon, label, description, onClick, actionLabel, danger = false }) => (
    <UnstyledButton 
      onClick={onClick} 
      style={{ 
        padding: '16px 20px', 
        borderRadius: '4px', 
        backgroundColor: '#050505',
        border: '1px solid #111',
        transition: 'background 0.2s',
        width: '100%'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a0a0a'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#050505'}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xl">
          <Icon size={20} color={danger ? "#ff4444" : "white"} strokeWidth={1.5} />
          <Stack gap={0}>
            <Text fw={700} size="sm" c="white" style={{ letterSpacing: '1px' }}>
              {label.toUpperCase()}
            </Text>
            <Text size="xs" c="dimmed">{description}</Text>
          </Stack>
        </Group>
        <Group gap="xs">
          {actionLabel && (
            <Text size="xs" fw={800} c={danger ? "red" : "white"} style={{ letterSpacing: '1px' }}>
              {actionLabel}
            </Text>
          )}
          <ChevronRight size={16} color="#222" />
        </Group>
      </Group>
    </UnstyledButton>
  );

  return (
    <Container
      fluid
      p="60px"
      style={{ width: "100vw", height: "100vh", backgroundColor: "#000", color: "#fff", overflowY: 'auto', overflowX: 'hidden' }}
    >
      <Stack gap="xl" style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '100px' }}>
        
        {/* Хедер терминала */}
        <Group justify="space-between" mb="30px">
          <Stack gap={0}>
            <Title order={2} style={{ fontSize: '24px', fontWeight: 200, letterSpacing: '10px', textTransform: 'uppercase' }}>
              Configuration
            </Title>
            <Text size="xs" c="dimmed" style={{ letterSpacing: '3px' }}>VECTOR OS TERMINAL</Text>
          </Stack>
          <SettingsIcon size={24} opacity={0.2} />
        </Group>

        {/* 1. LIGHTING CONTROL (НОВЫЙ БЛОК) */}
        <Box>
           <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>AMBIENT LIGHT</Text>
           <LedControl />
        </Box>

        {/* 2. PROFILE SECTION */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>PROFILE & CLOUD</Text>
          <Stack gap="xs">
             {/* Яндекс Авторизация */}
             <YandexAuth />

             {user && (
              <SettingRow 
                icon={LogOut} 
                label={user.name} 
                description="Управление сессией пользователя" 
                actionLabel="ВЫЙТИ" 
                onClick={onLogout}
                danger
              />
            )}
          </Stack>
        </Box>

        {/* 3. NETWORK & SYSTEM SECTION */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>NETWORK & SYSTEM</Text>
          <Stack gap="xs">
            <SettingRow 
              icon={Wifi} 
              label="Параметры Wi-Fi" 
              description="Настройка беспроводной сети через систему" 
              onClick={openWifiSettings}
              actionLabel="SYSTEM"
            />
            <SettingRow 
              icon={Power} 
              label="Рестарт системы" 
              description="Полная перезагрузка Raspberry Pi" 
              onClick={() => window.confirm("REBOOT SYSTEM?") && sendCmd("reboot")}
            />
          </Stack>
        </Box>

        {/* 4. MAINTENANCE SECTION */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>MAINTENANCE</Text>
          <Stack gap="xs">
            <SettingRow 
              icon={Cpu} 
              label="Обновить ядро моста"
              description="Перезагрузка Python-скриптов и Git pull" 
              onClick={updatePython}
              actionLabel="REBUILD"
            />
            <SettingRow 
              icon={RefreshCw} 
              label="Обновление системы" 
              description={`Текущая ревизия: ${appVersion}`} 
              onClick={updateMirror}
            />
          </Stack>
        </Box>

        {/* Копирайт */}
        <Center mt="xl">
          <Text size="xs" style={{ letterSpacing: '4px', color: '#222', fontWeight: 700 }}>
            REV_{appVersion ? appVersion.replace(/\./g, '_') : 'DEV'} // YEEE.KZ
          </Text>
        </Center>
      </Stack>
    </Container>
  );
};

export default Settings;