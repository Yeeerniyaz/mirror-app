import React, { useState } from 'react';
import { useLed } from '../hooks/useLed';
import { Card, Text, SimpleGrid, Button, Group, ColorInput, Slider, Stack, Title, ActionIcon, Grid } from '@mantine/core';
import { IconBrightness, IconGauge, IconPalette, IconPower } from '@tabler/icons-react';

const LedControl = () => {
  const { setMode, setColor, setBrightness, setSpeed, turnOff, loading } = useLed();
  const [colorValue, setColorValue] = useState('#ffffff');

  const handleColorChange = (hex) => {
    setColorValue(hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setColor(r, g, b);
  };

  const handleMode = (mode, needsColor = false) => {
    if (needsColor) {
      const r = parseInt(colorValue.slice(1, 3), 16);
      const g = parseInt(colorValue.slice(3, 5), 16);
      const b = parseInt(colorValue.slice(5, 7), 16);
      setColor(r, g, b);
      setTimeout(() => setMode(mode), 100);
    } else {
      setMode(mode);
    }
  };

  return (
    <Card shadow="none" padding="sm" radius="md" withBorder bg="black" style={{ borderColor: '#333', height: '100%', overflow: 'hidden' }}>
      
      {/* HEADER: Title & Power */}
      <Group justify="space-between" mb="xs">
        <Group gap={8}>
           <Title order={5} c="white" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
             LED CONTROL
           </Title>
        </Group>
        <ActionIcon 
            size="lg" color="gray" variant="outline" radius="md"
            onClick={turnOff} 
            loading={loading}
            style={{ borderColor: '#555', color: '#fff' }}
        >
            <IconPower size={18} />
        </ActionIcon>
      </Group>

      {/* TOP SECTION: Color (Left) + Sliders (Right) */}
      <Grid gutter="xs" mb="xs">
        
        {/* Left: Color */}
        <Grid.Col span={5}>
          <Card bg="#111" radius="sm" p="xs" withBorder style={{ borderColor: '#222', height: '100%' }}>
            <Group mb={5} gap={5}>
               <IconPalette size={14} color="white" />
               <Text fw={500} size="xs" c="white">COLOR</Text>
            </Group>
            <ColorInput
              value={colorValue}
              onChange={handleColorChange}
              format="hex"
              swatches={['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#00eaff', '#ffae00']}
              size="xs"
              styles={{ input: { backgroundColor: '#000', color: '#fff', borderColor: '#333' } }}
            />
          </Card>
        </Grid.Col>

        {/* Right: Settings */}
        <Grid.Col span={7}>
          <Card bg="#111" radius="sm" p="xs" withBorder style={{ borderColor: '#222', height: '100%' }}>
            <Stack gap={8}>
              {/* Brightness */}
              <Group justify="space-between" gap={0}>
                 <Group gap={4}>
                    <IconBrightness size={12} color="gray" />
                    <Text size="xs" c="dimmed">BRIGHT</Text>
                 </Group>
                 <Slider
                    w={90} min={0} max={255} defaultValue={128}
                    onChangeEnd={(val) => setBrightness(val)}
                    color="gray" size="xs" label={null}
                    styles={{ thumb: { borderColor: '#fff' } }}
                 />
              </Group>
              {/* Speed */}
              <Group justify="space-between" gap={0}>
                 <Group gap={4}>
                    <IconGauge size={12} color="gray" />
                    <Text size="xs" c="dimmed">SPEED</Text>
                 </Group>
                 <Slider
                    w={90} min={0} max={100} defaultValue={50}
                    onChangeEnd={(val) => setSpeed(val)}
                    color="gray" size="xs" label={null}
                    styles={{ thumb: { borderColor: '#fff' } }}
                 />
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* MODES GRID (Compact) */}
      <Text fw={500} size="xs" c="dimmed" mb={5} tt="uppercase">Select Mode</Text>
      
      <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('GEMINI')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            GEMINI
         </Button>
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('SCANNER', true)} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            SCANNER
         </Button>
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('BREATHING', true)} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            BREATH
         </Button>
         
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('FIRE')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            FIRE
         </Button>
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('STARS')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            STARS
         </Button>
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('METEOR')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            METEOR
         </Button>
         
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('RAINBOW')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            RAINBOW
         </Button>
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('POLICE')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            POLICE
         </Button>
         <Button size="xs" color="gray" variant="outline" onClick={() => handleMode('STROBE')} styles={{ root: { borderColor: '#444', color: '#fff' } }}>
            STROBE
         </Button>
      </SimpleGrid>

    </Card>
  );
};

export default LedControl;