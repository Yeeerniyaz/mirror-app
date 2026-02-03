import React, { useState, useEffect } from 'react';
import { useAlice } from '../hooks/useAlice';
import { Card, Group, Title, Badge, Text, Button, Stack, Loader, Center, Paper, rem } from '@mantine/core';
import { IconBrandYandex, IconUnlink, IconLink, IconDeviceMobile } from '@tabler/icons-react';

const YandexAuth = () => {
  const { status, connectAlice, disconnectAlice, loading } = useAlice();
  const [code, setCode] = useState(null); 
  const isOnline = status === 'online';

  // Егер статус "online" болып өзгерсе, кодты алып тастаймыз
  useEffect(() => {
    if (isOnline) setCode(null);
  }, [isOnline]);

  const handleGetCode = async () => {
    const result = await connectAlice();
    if (result && result.success && result.code) {
      setCode(result.code);
    }
  };

  // Кодты әдемілеу (Мысалы: 123 456)
  const formatCode = (c) => {
    return c ? c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  };

  return (
    <Card 
        shadow="none" 
        padding="lg" 
        radius="lg" 
        bg="black" 
        withBorder 
        style={{ 
            borderColor: '#333', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}
    >
      
      {/* 1. HEADER */}
      <Stack gap="xs">
        <Group justify="space-between">
            <Group gap="xs">
                {/* Ақ түсті Яндекс логотипі */}
                <IconBrandYandex size={24} color="white" />
                <Title order={4} c="white" tt="uppercase" ls={1} fw={800}>
                    YANDEX
                </Title>
            </Group>
            
            {/* Статус индикаторы (Ақ/Сұр) */}
            <Badge 
                color={isOnline ? "white" : "dark"} 
                variant={isOnline ? "white" : "outline"} 
                size="sm" 
                radius="sm"
                styles={{ root: { color: isOnline ? 'black' : '#666', borderColor: '#333' } }}
            >
                {isOnline ? 'ПОДКЛЮЧЕНО' : 'НЕ В СЕТИ'}
            </Badge>
        </Group>
        
        {/* Астыңғы сызық */}
        <Paper h={1} bg="#222" w="100%" />
      </Stack>

      {/* 2. MAIN CONTENT AREA */}
      <Stack align="center" justify="center" style={{ flex: 1 }} py="xl">
        
        {/* A. OFFLINE & NO CODE */}
        {!isOnline && !code && (
           <>
             <IconDeviceMobile size={48} color="#333" stroke={1.5} />
             <Text c="dimmed" size="sm" ta="center" px="md">
               Для голосового управления<br/>требуется привязка аккаунта
             </Text>
           </>
        )}

        {/* B. SHOWING CODE */}
        {!isOnline && code && (
            <Stack gap="xs" align="center" w="100%">
                <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={1}>
                    КОД ПОДКЛЮЧЕНИЯ
                </Text>
                
                {/* Кодты үлкен, контрасты қылып көрсету */}
                <Paper 
                    p="sm" 
                    bg="white" 
                    radius="md" 
                    w="100%" 
                    style={{ textAlign: 'center' }}
                >
                    <Title 
                        order={1} 
                        c="black" 
                        style={{ 
                            fontSize: rem(36), 
                            fontFamily: 'monospace', 
                            letterSpacing: '4px',
                            fontWeight: 900
                        }}
                    >
                        {formatCode(code)}
                    </Title>
                </Paper>
                
                <Group gap={5} mt={5}>
                    <Loader color="gray" type="dots" size="xs" />
                    <Text c="dimmed" size="xs">Ожидание подтверждения...</Text>
                </Group>
            </Stack>
        )}

        {/* C. ONLINE (SUCCESS) */}
        {isOnline && (
            <Stack gap="sm" align="center">
                <IconLink size={48} color="white" stroke={1} />
                <Stack gap={0} align="center">
                    <Text c="white" size="lg" fw={700}>СВЯЗЬ УСТАНОВЛЕНА</Text>
                    <Text c="dimmed" size="sm" ta="center">
                        Теперь вы можете управлять<br/>зеркалом через Алису
                    </Text>
                </Stack>
            </Stack>
        )}

      </Stack>

      {/* 3. FOOTER ACTIONS */}
      <Stack gap="sm">
        
        {/* Кнопка: ПОДКЛЮЧИТЬ (Get Code) */}
        {!code && !isOnline && (
          <Button
            fullWidth
            onClick={handleGetCode}
            loading={loading}
            variant="white" // Ақ түйме - назар аудару үшін
            c="black"
            h={45}
            radius="md"
            styles={{ root: { fontWeight: 700 } }}
            leftSection={<IconLink size={18} />}
          >
            СВЯЗАТЬ УСТРОЙСТВО
          </Button>
        )}

        {/* Кнопка: ОТМЕНА (Cancel Code) */}
        {code && !isOnline && (
            <Button
              fullWidth
              onClick={() => setCode(null)}
              variant="outline"
              color="gray"
              size="sm"
              h={40}
              styles={{ root: { borderColor: '#333', color: '#888', '&:hover': { color: 'white', borderColor: 'white' } } }}
            >
              ОТМЕНА
            </Button>
        )}

        {/* Кнопка: ОТКЛЮЧИТЬ (Disconnect) */}
        {isOnline && (
            <Button
              fullWidth
              onClick={disconnectAlice}
              loading={loading}
              variant="outline"
              color="gray" // Сұр, көзге қатты ұрмайды
              h={40}
              radius="md"
              styles={{ 
                  root: { 
                      borderColor: '#333', 
                      color: '#666',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'white', color: 'white', backgroundColor: '#111' }
                  } 
              }}
              leftSection={<IconUnlink size={16} />}
            >
              ОТКЛЮЧИТЬ
            </Button>
        )}
      </Stack>

    </Card>
  );
};

export default YandexAuth;