import { Box, Title, Text, Stack } from "@mantine/core";
import { QRCodeSVG } from "qrcode.react";

export const SetupMode = ({ portalInfo }) => {
  // Получаем данные от Python через App.jsx
  const ip = portalInfo?.ip || "10.42.0.1";
  const port = portalInfo?.port || 8081;
  const ssid = portalInfo?.ssid || "VECTOR_SETUP";
  
  const setupUrl = `http://${ip}:${port}`;

  return (
    <Box style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 9999, 
      backgroundColor: '#000', // Чисто черный фон
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Stack align="center" gap="xl">
        <Title order={1} style={{ 
          color: '#fff', // Белый заголовок
          fontSize: '80px', 
          letterSpacing: '15px', 
          fontWeight: 900,
          textTransform: 'uppercase'
        }}>
          VECTOR
        </Title>
        
        <Box style={{ 
          padding: '20px', 
          backgroundColor: '#fff', // Белая подложка для QR (чтобы сканировался)
          borderRadius: '15px' 
        }}>
          <QRCodeSVG 
            value={setupUrl} 
            size={280} 
            bgColor="#ffffff" 
            fgColor="#000000" 
          />
        </Box>

        <Stack align="center" gap={5}>
          <Text size="32px" fw={700} style={{ color: '#fff' }}>
            НАСТРОЙКА WI-FI
          </Text>
          <Text size="xl" style={{ color: '#aaa' }}>
            1. Подключитесь к сети: <b style={{ color: '#fff' }}>{ssid}</b>
          </Text>
          <Text size="xl" style={{ color: '#aaa' }}>
            2. Перейдите на: <b style={{ color: '#fff' }}>{ip}:{port}</b>
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};