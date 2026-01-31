import React, { useState, useEffect } from 'react';
import { useAlice } from '../hooks/useAlice';
import { Card, Group, Title, Badge, Text, Button, Stack, Loader } from '@mantine/core';

const YandexAuth = () => {
  const { status, connectAlice, disconnectAlice, loading } = useAlice();
  const [code, setCode] = useState(null); // Здесь храним цифры (123 456)
  const isOnline = status === 'online';

  // Если вдруг статус стал online (через MQTT), убираем код
  useEffect(() => {
    if (isOnline) setCode(null);
  }, [isOnline]);

  const handleGetCode = async () => {
    // Вызываем connectAlice, который теперь стучится в alice:pair
    // И ждем от него объект { success: true, code: "..." }
    const result = await connectAlice();
    
    if (result && result.success && result.code) {
      setCode(result.code);
    }
  };

  // Красивое форматирование: 123456 -> 123 456
  const formatCode = (c) => {
    return c ? c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder bg="dark.8">
      {/* Шапка карточки */}
      <Group justify="space-between" mb="md">
        <Title order={3} c="white">
            <Text span c="red" inherit>Я</Text>ндекс Алиса
        </Title>
        <Badge color={isOnline ? 'green' : 'red'} variant="light" size="lg">
          {isOnline ? 'ПОДКЛЮЧЕНО' : 'ОТКЛЮЧЕНО'}
        </Badge>
      </Group>

      {/* Основной контент */}
      <Stack align="center" gap="xs" mb="lg">
        
        {/* 1. Если не подключено и кода нет */}
        {!isOnline && !code && (
           <Text c="dimmed" size="sm" ta="center">
             Чтобы управлять зеркалом голосом, добавьте его в Умный Дом Яндекса.
           </Text>
        )}

        {/* 2. Если код есть — ПОКАЗЫВАЕМ ЕГО */}
        {!isOnline && code && (
            <>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    Введите код в приложении Яндекс:
                </Text>
                
                <Title order={1} c="yellow" style={{ fontSize: 42, letterSpacing: 2 }}>
                    {formatCode(code)}
                </Title>
                
                <Text c="dimmed" size="xs" ta="center">
                    (Дом с Алисой → + → Устройство умного дома → Vector)
                </Text>
                
                {/* Анимация ожидания */}
                <Loader color="yellow" type="dots" size="sm" mt="xs" />
            </>
        )}

        {/* 3. Если подключено */}
        {isOnline && (
            <Text c="green.4" size="sm" ta="center">
                Зеркало успешно привязано к вашему аккаунту. 
                Попробуйте сказать: "Алиса, включи подсветку".
            </Text>
        )}
      </Stack>

      {/* Кнопки действий */}
      
      {/* Кнопка получения кода */}
      {!code && !isOnline && (
          <Button
            fullWidth
            onClick={handleGetCode}
            loading={loading}
            color="yellow"
            variant="filled"
            c="black"
          >
            Подключить
          </Button>
      )}

      {/* Кнопка отмены (если передумал вводить код) */}
      {code && !isOnline && (
           <Button
             fullWidth
             onClick={() => setCode(null)}
             variant="subtle"
             color="gray"
             size="xs"
           >
             Отмена
           </Button>
      )}

      {/* Кнопка выхода */}
      {isOnline && (
        <Button
          fullWidth
          onClick={disconnectAlice}
          loading={loading}
          color="gray"
          variant="outline"
          c="white"
        >
          Отвязать устройство
        </Button>
      )}
    </Card>
  );
};

export default YandexAuth;