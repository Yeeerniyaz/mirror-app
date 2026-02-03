import React from 'react';
import { Box, Group } from "@mantine/core";

export const NavigationDots = ({ total, current, onChange }) => {
  return (
    <Box 
      style={{ 
        position: "fixed", 
        bottom: 50, 
        left: "50%", 
        transform: "translateX(-50%)", 
        zIndex: 100 
      }}
    >
      <Group gap="md">
        {Array.from({ length: total }).map((_, i) => (
          <Box
            key={i}
            onClick={() => onChange(i)}
            style={{
              width: i === current ? 32 : 8, // Active күйі ұзын болады
              height: 8,
              borderRadius: 4,
              backgroundColor: i === current ? "white" : "rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
              cursor: "pointer",
            }}
          />
        ))}
      </Group>
    </Box>
  );
};