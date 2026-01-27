import { Container, Stack, Title, Text, Group, Divider, UnstyledButton, Center, Box } from "@mantine/core";
import { RefreshCw, LogIn, LogOut, WifiOff, Power, Cpu, Settings as SettingsIcon, ChevronRight } from "lucide-react";

export const Settings = ({ 
  sendCmd, 
  updateMirror, 
  updatePython, 
  resetWifi, 
  appVersion,
  user, 
  onLogin, 
  onLogout 
}) => {

  // Компонент для компактной строки настройки
  const SettingRow = ({ icon: Icon, label, description, onClick, actionLabel, danger = false }) => (
    <UnstyledButton 
      onClick={onClick} 
      style={{ 
        padding: '16px 20px', 
        borderRadius: '4px', 
        backgroundColor: '#050505',
        border: '1px solid #111',
        transition: 'background 0.2s'
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
          <ChevronRight size={16} color="#333" />
        </Group>
      </Group>
    </UnstyledButton>
  );

  return (
    <Container
      fluid
      p="60px"
      style={{ 
        width: "100vw", 
        height: "100vh", 
        backgroundColor: "#000", 
        color: "#fff", 
        overflow: 'hidden' 
      }}
    >
      <Stack gap="xl" style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Заголовок */}
        <Group justify="space-between" mb="30px">
          <Stack gap={0}>
            <Title order={2} style={{ fontSize: '24px', fontWeight: 200, letterSpacing: '10px', textTransform: 'uppercase' }}>
              Configuration
            </Title>
            <Text size="xs" c="dimmed" style={{ letterSpacing: '3px' }}>VECTOR OS TERMINAL</Text>
          </Stack>
          <SettingsIcon size={24} opacity={0.2} />
        </Group>

        {/* Секция: Аккаунт */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>PROFILE</Text>
          <Stack gap="xs">
            {user ? (
              <SettingRow 
                icon={LogOut} 
                label={user.name} 
                description="Управление текущей сессией" 
                actionLabel="ВЫЙТИ" 
                onClick={onLogout}
                danger
              />
            ) : (
              <SettingRow 
                icon={LogIn} 
                label="Войти в аккаунт" 
                description="Синхронизация данных зеркала" 
                actionLabel="AUTH" 
                onClick={onLogin}
              />
            )}
          </Stack>
        </Box>

        {/* Секция: Система */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>SYSTEM & POWER</Text>
          <Stack gap="xs">
            <SettingRow 
              icon={RefreshCw} 
              label="Перезапуск приложения" 
              description="Только интерфейс (быстро)" 
              onClick={() => sendCmd("restart-app")}
            />
            <SettingRow 
              icon={Power} 
              label="Перезагрузка системы" 
              description="Полный рестарт Raspberry Pi" 
              onClick={() => window.confirm("REBOOT SYSTEM?") && sendCmd("reboot")}
            />
            <SettingRow 
              icon={WifiOff} 
              label="Сброс Wi-Fi" 
              description="Удалить сеть и вернуться в Setup" 
              onClick={() => window.confirm("RESET WI-FI?") && resetWifi()}
            />
          </Stack>
        </Box>

        {/* Секция: Обновления */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>MAINTENANCE</Text>
          <Stack gap="xs">
            <SettingRow 
              icon={Cpu} 
              label="Обновить датчики" 
              description="Перезапуск Python-моста" 
              onClick={updatePython}
            />
            <SettingRow 
              icon={RefreshCw} 
              label="Проверить обновления" 
              description={`Версия: ${appVersion}`} 
              onClick={updateMirror}
            />
          </Stack>
        </Box>

        {/* Футер */}
        <Center mt="xl">
          <Text size="xs" style={{ letterSpacing: '4px', color: '#222', fontWeight: 700 }}>
            REV_{appVersion.replace(/\./g, '_')} // YEEE.KZ
          </Text>
        </Center>

      </Stack>
    </Container>
  );
};