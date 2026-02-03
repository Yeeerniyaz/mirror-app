import React, { useState } from 'react';
import { useLed } from '../hooks/useLed';
import { 
  Container, Text, SimpleGrid, Button, Group, Slider, Stack, 
  Title, ColorPicker, rem, Box, Paper, Loader, Divider 
} from '@mantine/core';
import { 
  IconBrightness, IconGauge, IconPower, 
  IconLayoutGrid, IconColorPicker, IconTerminal 
} from '@tabler/icons-react';

const LedControl = () => {
  // 1. HOOK
  const { setMode, setColor, setBrightness, setSpeed, turnOff, loading } = useLed();
   
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [activeMode, setActiveMode] = useState('');

  const mySwatches = [
    '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#fd7e14', 
    '#862e9c', '#be4bdb', '#228be6', '#fab005'
  ];

  const modes = [
    { id: 'GEMINI', label: 'GEMINI AI', type: 'pro' },
    { id: 'SCANNER', label: 'СКАНЕР', type: 'pro', needsColor: true },
    { id: 'BREATHING', label: 'ДЫХАНИЕ', type: 'pro', needsColor: true },
    { id: 'STROBE', label: 'СТРОБО', type: 'pro' },
    { id: 'FIRE', label: 'ОГОНЬ', type: 'classic' },
    { id: 'STARS', label: 'ЗВЕЗДЫ', type: 'classic' },
    { id: 'METEOR', label: 'МЕТЕОР', type: 'classic' },
    { id: 'RAINBOW', label: 'РАДУГА', type: 'classic' },
    { id: 'POLICE', label: 'ПОЛИЦИЯ', type: 'classic' },
    { id: 'STATIC', label: 'СТАТИКА', type: 'basic', needsColor: true },
  ];

  // --- ЛОГИКА ---
  const handleColorChange = (val) => {
    setActiveColor(val);
  };

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

  // --- ДИЗАЙН (Center + 750px Width) ---
  return (
    <Container 
      fluid 
      h="100vh" 
      bg="black" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden' 
      }}
    >
      <Stack 
        w="100%" 
        maw={750} // Settings-пен бірдей өлшем
        gap="md" 
        p="md"
        style={{ maxHeight: '100vh', overflowY: 'auto' }} // Егер экран кіші болса скролл шығады
      >

        {/* 1. HEADER (Settings стилінде) */}
        <Group justify="space-between" mb="xs">
             <Stack gap={4}>
                <Title 
                  order={2} 
                  c="white" 
                  fw={300} 
                  style={{ fontSize: '28px', letterSpacing: '8px', textTransform: 'uppercase' }}
                >
                  LED CONTROL
                </Title>
                <Group gap="xs">
                  <IconTerminal size={14} color="#666" />
                  <Text c="dimmed" size="xs" fw={700} style={{ letterSpacing: '3px', fontSize: '10px' }}>
                    VECTOR LIGHT SYSTEM
                  </Text>
                </Group>
             </Stack>

             <Button 
                color="gray" 
                variant="outline" 
                size="xs"
                onClick={turnOff} 
                leftSection={<IconPower size={16} />}
                styles={{ 
                    root: { 
                        borderColor: '#333', 
                        color: '#666',
                        '&:hover': { color: 'white', borderColor: 'white', backgroundColor: 'transparent' } 
                    } 
                }}
            >
                OFF
            </Button>
        </Group>

        {/* 2. COLOR PICKER CONTAINER */}
        <Box 
            p="lg"
            style={{ 
                border: '1px solid #222', 
                borderRadius: '8px',
                backgroundColor: '#050505'
            }}
        >
             <Group gap="xs" mb="sm">
                <IconColorPicker size={18} color="#666"/>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" ls={1}>Палитра</Text>
             </Group>

             <ColorPicker
                format="hex"
                value={activeColor}
                onChange={handleColorChange}
                onChangeEnd={sendColorToServer}
                swatches={mySwatches}
                swatchesPerRow={12}
                size="md"
                fullWidth
                styles={{
                    saturation: { borderRadius: rem(6), marginBottom: rem(15), border: '1px solid #222' },
                    body: { width: '100%' },
                    swatch: { width: 24, height: 24, borderRadius: '4px', border: '1px solid #333', cursor: 'pointer' }
                }}
            />
        </Box>

        {/* 3. SLIDERS (2 Columns) */}
        <SimpleGrid cols={1} spacing="md">
            {/* Brightness */}
      

            {/* Speed */}
            <Box p="md" style={{ border: '1px solid #222', borderRadius: '8px', backgroundColor: '#050505' }}>
                <Group justify="space-between" mb={10}>
                        <Group gap={6}>
                        <IconGauge size={18} color="white"/>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Скорость</Text>
                    </Group>
                </Group>
                <Slider 
                    min={0} max={100} defaultValue={50} 
                    onChangeEnd={setSpeed} 
                    color="gray" 
                    size="sm"
                    thumbSize={14}
                    styles={{ 
                        thumb: { borderColor: '#fff', backgroundColor: 'black', borderWidth: 2 },
                        track: { backgroundColor: '#222' },
                        bar: { backgroundColor: 'white' }
                    }}
                />
            </Box>
        </SimpleGrid>

        {/* 4. MODES GRID */}
        <Box 
            p="md"
            style={{ 
                border: '1px solid #222', 
                borderRadius: '8px',
                backgroundColor: '#050505'
            }}
        >
            <Group gap={6} mb="sm">
                <IconLayoutGrid size={16} color="#666"/>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700} ls={1}>Анимации</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 3, sm: 5 }} spacing="sm">
                {modes.map((mode) => (
                    <Button 
                        key={mode.id}
                        h={40}
                        variant={activeMode === mode.id ? "filled" : "outline"}
                        color="dark"
                        onClick={() => handleMode(mode.id, mode.needsColor)}
                        radius="md"
                        fullWidth
                        styles={{
                            root: { 
                                borderColor: activeMode === mode.id ? 'white' : '#333',
                                backgroundColor: activeMode === mode.id ? 'white' : 'transparent',
                                color: activeMode === mode.id ? 'black' : '#666',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: 'white',
                                    color: activeMode === mode.id ? 'black' : 'white'
                                }
                            },
                            label: { fontWeight: 700, fontSize: '10px', letterSpacing: '0.5px' }
                        }}
                    >
                        {mode.label}
                    </Button>
                ))}
            </SimpleGrid>
        </Box>

      </Stack>
    </Container>
  );
};

export default LedControl;