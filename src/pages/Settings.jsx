import { useState } from "react";
import { Container, Stack, Title, Text, Group, Box, UnstyledButton, Center, Modal, PasswordInput, Button, Loader, ScrollArea } from "@mantine/core";
import { RefreshCw, LogIn, LogOut, Power, Cpu, Settings as SettingsIcon, ChevronRight, Wifi } from "lucide-react";

export const Settings = ({ 
  sendCmd, 
  updateMirror, 
  updatePython, 
  appVersion,
  user, 
  onLogin, 
  onLogout,
  // Пропсы для работы с Wi-Fi
  wifiList = [], 
  getWifiList, 
  connectToWifi 
}) => {
  const [wifiModalOpened, setWifiModalOpened] = useState(false);
  const [selectedNet, setSelectedNet] = useState(null);
  const [password, setPassword] = useState("");

  // Открытие окна Wi-Fi и запуск сканирования
  const handleOpenWifi = () => {
    setWifiModalOpened(true);
    getWifiList();
  };

  // Подключение к выбранной сети
  const handleConnect = async () => {
    if (selectedNet) {
      await connectToWifi(selectedNet.ssid, password);
      setWifiModalOpened(false);
      setSelectedNet(null);
      setPassword("");
    }
  };

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
      style={{ width: "100vw", height: "100vh", backgroundColor: "#000", color: "#fff", overflow: 'hidden' }}
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

        {/* PROFILE SECTION */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>PROFILE</Text>
          <Stack gap="xs">
            {user ? (
              <SettingRow 
                icon={LogOut} 
                label={user.name} 
                description="Управление сессией пользователя" 
                actionLabel="ВЫЙТИ" 
                onClick={onLogout}
                danger
              />
            ) : (
              <SettingRow 
                icon={LogIn} 
                label="Авторизация" 
                description="Синхронизация профиля" 
                actionLabel="AUTH" 
                onClick={onLogin}
              />
            )}
          </Stack>
        </Box>

        {/* NETWORK & SYSTEM SECTION */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>NETWORK & SYSTEM</Text>
          <Stack gap="xs">
            <SettingRow 
              icon={Wifi} 
              label="Параметры Wi-Fi" 
              description="Выбор сети и управление подключением" 
              onClick={handleOpenWifi}
            />
            <SettingRow 
              icon={Power} 
              label="Рестарт системы" 
              description="Полная перезагрузка Raspberry Pi" 
              onClick={() => window.confirm("REBOOT SYSTEM?") && sendCmd("reboot")}
            />
          </Stack>
        </Box>

        {/* MAINTENANCE SECTION */}
        <Box>
          <Text fw={900} size="xs" c="dimmed" mb="md" style={{ letterSpacing: '2px', opacity: 0.5 }}>MAINTENANCE</Text>
          <Stack gap="xs">
            <SettingRow 
              icon={Cpu} 
              label="Синхронизация датчиков" 
              description="Принудительный опрос Python-моста" 
              onClick={updatePython}
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
            REV_{appVersion.replace(/\./g, '_')} // YEEE.KZ
          </Text>
        </Center>
      </Stack>

      {/* МОДАЛЬНОЕ ОКНО WI-FI */}
      <Modal 
        opened={wifiModalOpened} 
        onClose={() => setWifiModalOpened(false)} 
        title="WI-FI NETWORKS" 
        centered 
        size="md"
        styles={{ 
          content: { backgroundColor: '#050505', border: '1px solid #222', color: 'white' },
          header: { backgroundColor: '#050505', color: 'white', borderBottom: '1px solid #111' },
          close: { color: 'white', '&:hover': { backgroundColor: '#111' } }
        }}
      >
        {selectedNet ? (
          <Stack gap="md">
            <Group justify="center" mb="sm">
              <Wifi size={30} color="white" />
              <Title order={4}>{selectedNet.ssid}</Title>
            </Group>
            <PasswordInput 
              placeholder="Введите пароль" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              styles={{ input: { backgroundColor: '#111', border: '1px solid #222', color: 'white' } }}
              autoFocus
            />
            <Group grow mt="xl">
              <Button variant="outline" color="gray" onClick={() => setSelectedNet(null)}>НАЗАД</Button>
              <Button color="white" variant="white" style={{ color: 'black' }} onClick={handleConnect}>
                ПОДКЛЮЧИТЬ
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="xs">
            <ScrollArea.Autosize mah={300} type="scroll">
              {wifiList.length > 0 ? (
                wifiList.map((net, i) => (
                  <UnstyledButton 
                    key={i} 
                    onClick={() => setSelectedNet(net)}
                    style={{ 
                      padding: '15px', 
                      width: '100%', 
                      borderBottom: '1px solid #111',
                      '&:hover': { backgroundColor: '#0a0a0a' } 
                    }}
                  >
                    <Group justify="space-between">
                      <Text size="sm" fw={600}>{net.ssid}</Text>
                      <Text size="xs" c="dimmed">{net.signal}%</Text>
                    </Group>
                  </UnstyledButton>
                ))
              ) : (
                <Center p="xl"><Loader color="white" size="sm" /></Center>
              )}
            </ScrollArea.Autosize>
            <Button 
              variant="subtle" 
              color="gray" 
              mt="md" 
              onClick={getWifiList} 
              leftSection={<RefreshCw size={14} />}
            >
              ОБНОВИТЬ СПИСОК
            </Button>
          </Stack>
        )}
      </Modal>

    </Container>
  );
};