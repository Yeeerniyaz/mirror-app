import { useState } from 'react';
import { Button, Modal, Center, Loader, Text } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react'; // 👈 Используем твою библиотеку

export const YandexAuth = () => {
  const [opened, setOpened] = useState(false);
  const [authLink, setAuthLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQrCode = async () => {
    setOpened(true);
    setLoading(true);
    setError(null);
    setAuthLink(null);

    try {
      // Запрашиваем только ссылку у Node-RED
      const res = await fetch('http://localhost:1880/auth/yandex/qr');
      
      if (!res.ok) throw new Error('Ошибка связи с Node-RED');

      const link = await res.text();
      setAuthLink(link);

    } catch (e) {
      console.error(e);
      setError("Не удалось получить ссылку 🔌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={fetchQrCode} 
        color="red" 
        variant="light"
        fullWidth
        style={{ marginTop: 10, border: '1px solid rgba(255, 0, 0, 0.2)' }}
      >
        ПРИВЯЗАТЬ АЛИСУ (YANDEX) 🎙
      </Button>

      <Modal 
        opened={opened} 
        onClose={() => setOpened(false)} 
        title="Вход через Яндекс"
        centered
        styles={{ 
            content: { backgroundColor: '#1A1B1E', color: 'white' }, 
            header: { backgroundColor: '#1A1B1E', color: 'white' } 
        }}
      >
        <Center style={{ flexDirection: 'column', gap: 20, padding: 20 }}>
          {loading && <Loader color="red" />}
          
          {error && <Text color="red" size="sm">{error}</Text>}

          {/* Генерируем QR через qrcode.react */}
          {authLink && !loading && (
            <div style={{ background: 'white', padding: '16px', borderRadius: '10px' }}>
              <QRCodeSVG 
                value={authLink} 
                size={200}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          )}

          <Text size="xs" c="dimmed" align="center">
            Наведи камеру телефона на код,<br/>чтобы войти в аккаунт.
          </Text>
        </Center>
      </Modal>
    </>
  );
};