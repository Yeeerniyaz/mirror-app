import { Box, Stack, Title, Text, UnstyledButton } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';

export const SetupMode = ({ onCancel, canCancel }) => (
  <Box style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Stack align="center" gap="50px">
      <Title order={2} style={{ color: 'orange', letterSpacing: '10px', fontSize: '40px' }}>VECTOR SETUP</Title>
      <Box p="30px" style={{ backgroundColor: '#fff', borderRadius: '30px' }}>
        <QRCodeSVG value="WIFI:S:VECTOR_MIRROR;T:WPA;P:vector123;;" size={350} />
      </Box>
      <Stack align="center" gap="xs">
        <Text size="30px" fw={200}>Подключитесь к <b style={{color: 'orange'}}>VECTOR_MIRROR</b></Text>
        <Text size="xl" c="dimmed">Пароль: <b>vector123</b></Text>
      </Stack>
      {canCancel && (
        <UnstyledButton onClick={onCancel} style={{ borderBottom: '1px solid #555' }}>
          <Text c="dimmed">ОТМЕНА</Text>
        </UnstyledButton>
      )}
    </Stack>
  </Box>
);