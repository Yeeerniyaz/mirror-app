import React, { useState } from 'react';
import { useLed } from '../hooks/useLed';
import { Card, Text, SimpleGrid, Button, Group, ColorInput, Slider, NumberInput, Stack, Title, ActionIcon } from '@mantine/core';

const LedControl = () => {
  const { setMode, setColor, setBrightness, setSpeed, setLedsCount, turnOff } = useLed();
  const [ledCount, setLocalLedCount] = useState(300);
  const [colorValue, setColorValue] = useState('#ffa500'); // Оранжевый дефолт

  // Обработчик цвета Mantine (возвращает hex)
  const handleColorChange = (hex) => {
    setColorValue(hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setColor(r, g, b);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder bg="dark.8">
      <Group justify="space-between" mb="md">
        <Title order={3} c="white">🎨 Управление светом</Title>
      </Group>

      {/* 1. РЕЖИМЫ */}
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm" mb="xl">
         <Button variant="gradient" gradient={{ from: 'red', to: 'blue' }} onClick={() => setMode('RAINBOW')}>🌈 Радуга</Button>
         <Button color="cyan" onClick={() => setMode('METEOR')}>☄️ Метеор</Button>
         <Button color="orange" onClick={() => setMode('FIRE')}>🔥 Огонь</Button>
         <Button color="red" onClick={() => setMode('POLICE')}>🚔 Полиция</Button>
         <Button color="gray" onClick={() => setMode('STATIC')}>💡 Статик</Button>
         <Button variant="outline" color="red" onClick={turnOff}>❌ ВЫКЛ</Button>
      </SimpleGrid>

      {/* 2. НАСТРОЙКИ */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        
        {/* Цвет */}
        <Stack gap="xs">
            <Text c="dimmed" size="sm">Цвет (для Static/Meteor)</Text>
            <ColorInput
              value={colorValue}
              onChange={handleColorChange}
              format="hex"
              swatches={['#ffa500', '#ff0000', '#00ff00', '#0000ff', '#ffffff', '#ff00ff']}
              placeholder="Выберите цвет"
            />
        </Stack>

        {/* Длина ленты */}
        <Stack gap="xs">
            <Text c="dimmed" size="sm">Длина ленты (LEDs)</Text>
            <Group gap={5} wrap="nowrap">
                <NumberInput
                    value={ledCount}
                    onChange={setLocalLedCount}
                    min={1} max={1000}
                    style={{ flex: 1 }}
                />
                <Button onClick={() => setLedsCount(ledCount)} variant="light" color="gray">
                    Сохранить
                </Button>
            </Group>
        </Stack>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="lg">
         {/* Яркость */}
         <Stack gap="xs">
            <Text c="dimmed" size="sm">Яркость</Text>
            <Slider
                min={0.1} max={1.0} step={0.1} defaultValue={0.8}
                onChangeEnd={setBrightness}
                color="orange"
                marks={[
                    { value: 0.2, label: '20%' },
                    { value: 0.5, label: '50%' },
                    { value: 0.8, label: '80%' },
                ]}
            />
         </Stack>

         {/* Скорость */}
         <Stack gap="xs">
            <Text c="dimmed" size="sm">Скорость эффектов</Text>
             <Slider
                min={10} max={100} step={10} defaultValue={50}
                onChangeEnd={setSpeed}
                color="blue"
                 marks={[
                    { value: 20, label: 'Slow' },
                    { value: 50, label: 'Norm' },
                    { value: 90, label: 'Fast' },
                ]}
            />
         </Stack>
      </SimpleGrid>
    </Card>
  );
};

export default LedControl;