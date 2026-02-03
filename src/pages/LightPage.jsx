import React from 'react';
import { Box } from '@mantine/core';
import LedControl from '../components/LedControl';

const LightPage = () => {
  return (
    <Box w="100vw" h="100vh" p="xs" bg="black">
       <LedControl />
    </Box>
  );
};

export default LightPage;