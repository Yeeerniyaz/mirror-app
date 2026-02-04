import React, { useState, useEffect } from 'react';
import { useAlice } from '../hooks/useAlice';
import { Card, Group, Title, Badge, Text, Button, Stack, Loader, Paper, rem } from '@mantine/core';
import { IconUnlink, IconLink, IconDeviceMobile, IconPlus, IconUserCheck, IconAccessPoint } from '@tabler/icons-react';

const YandexAuth = ({ lang, T }) => {
  const { status, connectAlice, disconnectAlice, loading } = useAlice();
  const [code, setCode] = useState(null); 
  const isOnline = status === 'online';

  useEffect(() => {
    // Егер сәтті қосылса кодты автоматты түрде жабуға болады
    if (isOnline) setCode(null);
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
            borderColor: '#222', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}
    >
      
      {/* 1. HEADER - Брендингті өзгерттік */}
      <Stack gap="xs">
        <Group justify="space-between">
            <Group gap="xs">
                <IconAccessPoint size={24} color="#ffffff" /> {/* Оранжевый түс */}
                <Title order={4} c="white" tt="uppercase" ls={2} fw={800} style={{ fontSize: '14px' }}>
                    {lang === 'en' ? 'Remote Control' : 'ДОСТУП К ЗЕРКАЛУ'}
                </Title>
            </Group>
            
            
        </Group>
        <Paper h={1} bg="#222" w="100%" />
      </Stack>

      {/* 2. MAIN CONTENT */}
      <Stack align="center" justify="center" style={{ flex: 1 }} py="xl">
        
        {/* A. OFFLINE HINT */}
        {!isOnline && !code && (
            <>
              <Text c="dimmed" size="xs" ta="center" px="md" tt="uppercase" ls={1}>
                {lang === 'en' ? 'Scan to control via phone' : 'Для управления через телефон заходите в сайт vector.yeee.kz/dashboard'}
              </Text>
            </>
        )}

        {/* B. SHOWING PAIRING CODE */}
        {code && (
            <Stack gap="xs" align="center" w="100%">
                <Text c="#ff9900" size="xs" tt="uppercase" fw={900} ls={2}>
                    {lang === 'en' ? 'PAIRING CODE' : 'КОД СОПРЯЖЕНИЯ'}
                </Text>
                
                <Paper p="md" bg="white" radius="md" w="100%" style={{ textAlign: 'center', border: '2px solid #ff9900' }}>
                    <Title order={1} c="black" style={{ fontSize: rem(42), fontFamily: 'monospace', letterSpacing: '6px', fontWeight: 900 }}>
                        {formatCode(code)}
                    </Title>
                </Paper>
                
                <Group gap={5} mt={5}>
                    <Loader color="orange" type="dots" size="xs" />
                    <Text c="dimmed" size="xs">{T.waiting}</Text>
                </Group>
            </Stack>
        )}

        {/* C. ONLINE SUCCESS */}
        {isOnline && !code && (
            <Stack gap="sm" align="center">
                <IconUserCheck size={60} color="#ff9900" stroke={1.5} />
                <Stack gap={0} align="center">
                    <Text c="white" size="lg" fw={900} ls={1}>{lang === 'en' ? 'CONNECTED' : 'БАЙЛАНЫСТА'}</Text>
                    <Text c="dimmed" size="xs" ta="center" tt="uppercase">
                        {lang === 'en' ? 'Phone remote active' : 'Телефон қосылып тұр'}
                    </Text>
                </Stack>
            </Stack>
        )}

      </Stack>

      {/* 3. FOOTER ACTIONS */}
      <Stack gap="sm">
        
        {!code && (
          <Button
            fullWidth
            onClick={handleGetCode}
            loading={loading}
            variant="white"
            c="black"
            h={50}
            radius="md"
            styles={{ root: { fontWeight: 900, letterSpacing: '1px' } }}
            leftSection={isOnline ? <IconPlus size={20} /> : <IconLink size={20} />}
          >
            {isOnline ? (lang === 'en' ? "ADD ANOTHER" : "ҚОСУ +") : (lang === 'en' ? "LINK DEVICE" : "ПОДКЛЮЧИТЬ")}
          </Button>
        )}

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

        {isOnline && !code && (
            <Button
              fullWidth
              onClick={disconnectAlice}
              loading={loading}
              variant="subtle"
              color="red"
              h={35}
              size="xs"
              leftSection={<IconUnlink size={16} />}
            >
              {lang === 'en' ? "UNLINK ALL" : "ҮЗУ"}
            </Button>
        )}
      </Stack>

    </Card>
  );
};

export default YandexAuth;