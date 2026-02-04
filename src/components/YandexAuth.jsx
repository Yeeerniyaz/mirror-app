import React, { useState, useEffect } from 'react';
import { useAlice } from '../hooks/useAlice';
import { Card, Group, Title, Badge, Text, Button, Stack, Loader, Paper, rem } from '@mantine/core';
import { IconBrandYandex, IconUnlink, IconLink, IconDeviceMobile, IconPlus } from '@tabler/icons-react';

const YandexAuth = ({ lang, T }) => {
  const { status, connectAlice, disconnectAlice, loading } = useAlice();
  const [code, setCode] = useState(null); 
  const isOnline = status === 'online';

  // Егер статус өзгерсе, бірақ біз код күтіп тұрсақ — кодты жасырмаймыз. 
  // Тек код жоқ болса ғана статусқа қараймыз.
  useEffect(() => {
    // Егер Online болып кетсе, бірақ қолмен код сұрап тұрсақ, оны өшірмейміз.
    // Бірақ егер сырттан "success" келсе, кодты алып тастауға болады (қалауыңша).
    // Қазірше бос қалдырдым, қолмен жапқанша тұра берсін.
  }, [isOnline]);

  const handleGetCode = async () => {
    const result = await connectAlice();
    if (result && result.success && result.code) {
      setCode(result.code);
    }
  };

  const formatCode = (c) => {
    return c ? c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  };

  if (!T) return null;

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
                <IconBrandYandex size={24} color="white" />
                <Title order={4} c="white" tt="uppercase" ls={1} fw={800}>
                    {T.yandex_title}
                </Title>
            </Group>
            
            <Badge 
                color={isOnline ? "green" : "dark"} 
                variant={isOnline ? "filled" : "outline"} 
                size="sm" 
                radius="sm"
            >
                {isOnline ? T.connected : T.offline}
            </Badge>
        </Group>
        <Paper h={1} bg="#222" w="100%" />
      </Stack>

      {/* 2. MAIN CONTENT */}
      <Stack align="center" justify="center" style={{ flex: 1 }} py="xl">
        
        {/* A. OFFLINE HINT (Егер код жоқ және оффлайн болса) */}
        {!isOnline && !code && (
           <>
             <IconDeviceMobile size={48} color="#333" stroke={1.5} />
             <Text c="dimmed" size="sm" ta="center" px="md">
               {T.connect_hint}
             </Text>
           </>
        )}

        {/* B. SHOWING CODE (Ең бастысы осы: Код бар болса, статусқа қарамай көрсетеміз) */}
        {code && (
            <Stack gap="xs" align="center" w="100%">
                <Text c="dimmed" size="xs" tt="uppercase" fw={700} ls={1}>
                    {T.connect_code}
                </Text>
                
                <Paper p="sm" bg="white" radius="md" w="100%" style={{ textAlign: 'center' }}>
                    <Title order={1} c="black" style={{ fontSize: rem(36), fontFamily: 'monospace', letterSpacing: '4px', fontWeight: 900 }}>
                        {formatCode(code)}
                    </Title>
                </Paper>
                
                <Group gap={5} mt={5}>
                    <Loader color="gray" type="dots" size="xs" />
                    <Text c="dimmed" size="xs">{T.waiting}</Text>
                </Group>
            </Stack>
        )}

        {/* C. ONLINE SUCCESS (Егер код жоқ және онлайн болса) */}
        {isOnline && !code && (
            <Stack gap="sm" align="center">
                <IconLink size={48} color="#2b8a3e" stroke={1} />
                <Stack gap={0} align="center">
                    <Text c="white" size="lg" fw={700}>{T.success_title}</Text>
                    <Text c="dimmed" size="sm" ta="center">
                        {T.success_desc}
                    </Text>
                </Stack>
            </Stack>
        )}

      </Stack>

      {/* 3. FOOTER ACTIONS */}
      <Stack gap="sm">
        
        {/* Кнопка 1: ПОДКЛЮЧИТЬ (Егер код жоқ болса — Offline да, Online да шыға береді) */}
        {!code && (
          <Button
            fullWidth
            onClick={handleGetCode}
            loading={loading}
            variant="white"
            c="black"
            h={45}
            radius="md"
            styles={{ root: { fontWeight: 700 } }}
            leftSection={isOnline ? <IconPlus size={18} /> : <IconLink size={18} />}
          >
            {/* Егер Online болса "Добавить еще", болмаса "Подключить" */}
            {isOnline ? (lang === 'en' ? "ADD DEVICE" : "ДОБАВИТЬ ЕЩЕ") : T.btn_connect}
          </Button>
        )}

        {/* Кнопка 2: ОТМЕНА (Тек код көрініп тұрса) */}
        {code && (
            <Button
              fullWidth
              onClick={() => setCode(null)}
              variant="outline"
              color="gray"
              size="sm"
              h={40}
            >
              {T.btn_cancel}
            </Button>
        )}

        {/* Кнопка 3: ОТКЛЮЧИТЬ (Тек Online болғанда және код жоқ кезде) */}
        {isOnline && !code && (
            <Button
              fullWidth
              onClick={disconnectAlice}
              loading={loading}
              variant="subtle"
              color="red"
              h={30}
              size="xs"
              leftSection={<IconUnlink size={14} />}
            >
              {T.btn_disconnect}
            </Button>
        )}
      </Stack>

    </Card>
  );
};

export default YandexAuth;