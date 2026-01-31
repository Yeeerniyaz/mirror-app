import React from 'react';
import { useAlice } from '../hooks/useAlice';
import { Card, Group, Title, Badge, Text, Button, Alert, Code } from '@mantine/core';

const YandexAuth = () => {
  const { status, connectAlice, disconnectAlice, loading } = useAlice();
  const isOnline = status === 'online';

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder bg="dark.8">
      <Group justify="space-between" mb="md">
        <Title order={3} c="white">
            <Text span c="red" inherit>Я</Text>ндекс Алиса
        </Title>
        <Badge color={isOnline ? 'green' : 'red'} variant="light" size="lg">
          {isOnline ? 'ПОДКЛЮЧЕНО' : 'ОТКЛЮЧЕНО'}
        </Badge>
      </Group>

      <Text c="dimmed" size="sm" mb="lg">
        {isOnline
          ? "Голосовое управление активно. Вы можете управлять зеркалом через умную колонку или приложение Яндекс."
          : "Подключите Яндекс ID, чтобы управлять зеркалом голосом и видеть свой календарь."}
      </Text>

      <Button
        fullWidth
        onClick={isOnline ? disconnectAlice : connectAlice}
        loading={loading}
        color={isOnline ? 'gray' : 'yellow'}
        variant={isOnline ? 'outline' : 'filled'}
        c={isOnline ? 'white' : 'black'}
      >
        {isOnline ? 'Отключить аккаунт' : 'Войти через Яндекс'}
      </Button>

      {isOnline && (
        <Alert title="Debug Mode" color="dark" mt="md" variant="light">
           <Code block bg="transparent">STUB: Real OAuth is pending...</Code>
        </Alert>
      )}
    </Card>
  );
};

export default YandexAuth;