import React from 'react';
import { Box, Text, Progress } from "@mantine/core";

export const UpdateOverlay = ({ status, progress }) => {
  if (!status) return null;

  return (
    <Box
      style={{
        position: "fixed",
        top: 40,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: 340,
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(10px)", // Blur эффектісі
        padding: "24px",
        border: "1px solid #333",
        borderRadius: "8px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
      }}
    >
      <Text size="xs" fw={900} mb={progress > 0 ? 12 : 0} ta="center" c="white" style={{ letterSpacing: "3px" }}>
        {status.toUpperCase()}
      </Text>
      {progress > 0 && (
        <Progress value={progress} color="white" size="sm" radius="xl" animated />
      )}
    </Box>
  );
};