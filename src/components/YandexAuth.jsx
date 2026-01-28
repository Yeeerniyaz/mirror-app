import { useState, useEffect } from 'react';
import { Button, Modal, Center, Text, Stack } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';

// Подключаем Electron (чтобы спросить Device ID)
const { ipcRenderer } = window.require('electron');

export const YandexAuth = () => {
  const [opened, setOpened] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Спрашиваем ID у нашего нового main.js
    ipcRenderer.invoke('get-device-id')
      .then((id) => setDeviceId(id))
      .catch((err) => console.error("Ошибка получения ID:", err));
  }, []);

  // Ссылка ведет на твой сервер (страница активации)
  // Мы используем IP сервера, пока нет домена yeee.kz, или сам домен, если он настроен
  const activateUrl = `http://alice.yeee.kz/activate?id=${deviceId}`;

  return (
    <>
      <Button 
        onClick={() => setOpened(true)} 
        color="red" 
        variant="light"
        fullWidth
        style={{ marginTop: 10, border: '1px solid rgba(255, 0, 0, 0.2)' }}
      >
        ПОДКЛЮЧИТЬ К АЛИСЕ 🎙
      </Button>

      <Modal 
        opened={opened} 
        onClose={() => setOpened(false)} 
        title="Активация устройства"
        centered
        styles={{ 
            content: { backgroundColor: '#1A1B1E', color: 'white' }, 
            header: { backgroundColor: '#1A1B1E', color: 'white' } 
        }}
      >
        <Center style={{ flexDirection: 'column', gap: 20, padding: 20 }}>
          
          <div style={{ background: 'white', padding: '16px', borderRadius: '10px' }}>
            {deviceId ? (
              <QRCodeSVG 
                value={activateUrl} 
                size={200}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            ) : (
              <Text c="dimmed">Загрузка ID...</Text>
            )}
          </div>

          <Stack gap={5} align="center">
            <Text size="sm" fw={700}>ID: {deviceId}</Text>
            <Text size="xs" c="dimmed" align="center">
              Сканируйте код, чтобы<br/>
              добавить зеркало в Умный Дом.
            </Text>
          </Stack>

        </Center>
      </Modal>
    </>
  );
};