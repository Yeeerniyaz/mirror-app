import { Stack, Title, Text } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

export const Clock = ({ time }) => (
  <Stack gap={0}>
    <Title order={1} style={{ fontSize: '150px', fontWeight: 100, letterSpacing: '-8px', lineHeight: 0.8 }}>
      {dayjs(time).format('HH:mm')}
    </Title>
    <Text size="35px" fw={200} c="dimmed" mt="md" style={{ letterSpacing: '5px' }}>
      {dayjs(time).locale('ru').format('dddd, D MMMM')}
    </Text>
  </Stack>
);