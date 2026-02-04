import React, { useState } from 'react';
import { useLed } from '../hooks/useLed';
import { 
  Text, SimpleGrid, Button, Group, Slider, Stack, 
  ColorPicker, rem, Box 
} from '@mantine/core';
import { 
  IconGauge, IconPower, IconLayoutGrid, IconColorPicker 
} from '@tabler/icons-react';

const LedControl = () => {
  const { setMode, setColor, setBrightness, setSpeed, turnOff, loading } = useLed();
  
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [activeMode, setActiveMode] = useState('');

  const mySwatches = [
    '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#fd7e14', 
    '#862e9c', '#be4bdb', '#228be6', '#fab005'
  ];

  const modes = [
    { id: 'GEMINI', label: 'GEMINI' },
    { id: 'SCANNER', label: 'СКАНЕР', needsColor: true },
    { id: 'BREATHING', label: 'ДЫХАНИЕ', needsColor: true },
    { id: 'STROBE', label: 'СТРОБО' },
    { id: 'FIRE', label: 'ОГОНЬ' },
    { id: 'STARS', label: 'ЗВЕЗДЫ' },
    { id: 'METEOR', label: 'МЕТЕОР' },
    { id: 'RAINBOW', label: 'РАДУГА' },
    { id: 'POLICE', label: 'ПОЛИЦИЯ' },
    { id: 'STATIC', label: 'СТАТИКА', needsColor: true },
  ];

  const sendColorToServer = (color) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    setColor(r, g, b);
  };

  const handleMode = (modeId, needsColor) => {
    setActiveMode(modeId);
    if (needsColor) {
      const r = parseInt(activeColor.slice(1, 3), 16);
      const g = parseInt(activeColor.slice(3, 5), 16);
      const b = parseInt(activeColor.slice(5, 7), 16);
      setColor(r, g, b);
      setTimeout(() => setMode(modeId), 50);
    } else {
      setMode(modeId);
    }
  };

  return (
    <Stack gap="md" w="100%">
      {/* 1. ЦВЕТ И ВЫКЛЮЧАТЕЛЬ */}
      <Box>
        <Group justify="space-between" mb="xs">
          <Group gap={6}>
            <IconColorPicker size={16} color="white"/>
            <Text size="sm" c="white" fw={700} tt="uppercase" ls={1}>Палитра цветов</Text>
          </Group>
          <Button 
            variant="outline" 
            color="red" 
            size="xs" 
            onClick={turnOff}
            leftSection={<IconPower size={14} />}
            styles={{ root: { borderColor: '#400', '&:hover': { backgroundColor: '#300' }}}}
          >
            ВЫКЛЮЧИТЬ
          </Button>
        </Group>
        
        <ColorPicker
          format="hex"
          value={activeColor}
          onChange={setActiveColor}
          onChangeEnd={sendColorToServer}
          swatches={mySwatches}
          swatchesPerRow={6}
          size="md"
          fullWidth
          styles={{
            saturation: { height: rem(120), borderRadius: rem(8), marginBottom: rem(12), border: '1px solid #222' },
            swatch: { width: 25, height: 25, borderRadius: '6px', border: '1px solid #333' }
          }}
        />
      </Box>

      {/* 2. СКОРОСТЬ АНИМАЦИИ */}
      <Box p="md" style={{ border: '1px solid #222', borderRadius: '8px', backgroundColor: '#000' }}>
        <Group gap={6} mb="sm">
          <IconGauge size={16} color="white"/>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" ls={1}>Скорость эффектов</Text>
        </Group>
        <Slider 
          min={0} max={100} defaultValue={50} 
          onChangeEnd={setSpeed} 
          color="white" 
          size="sm"
          thumbSize={16}
          styles={{ 
            track: { backgroundColor: '#222' },
            thumb: { backgroundColor: '#000', borderColor: '#fff', borderWidth: 2 }
          }}
        />
      </Box>

      {/* 3. РЕЖИМЫ (Сетка 5 колонок) */}
      <Box>
        <Group gap={6} mb="xs">
          <IconLayoutGrid size={16} color="white"/>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} ls={1}>Режимы анимации</Text>
        </Group>
        <SimpleGrid cols={5} spacing="xs">
          {modes.map((mode) => (
            <Button 
              key={mode.id}
              variant={activeMode === mode.id ? "white" : "outline"}
              onClick={() => handleMode(mode.id, mode.needsColor)}
              size="sm"
              styles={{
                root: { 
                  height: 36,
                  borderColor: activeMode === mode.id ? 'white' : '#222',
                  backgroundColor: activeMode === mode.id ? 'white' : 'transparent',
                  color: activeMode === mode.id ? 'black' : '#666',
                  '&:hover': { borderColor: 'white', color: activeMode === mode.id ? 'black' : 'white' }
                },
                label: { fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }
              }}
            >
              {mode.label}
            </Button>
          ))}
        </SimpleGrid>
      </Box>
    </Stack>
  );
};

export default LedControl;