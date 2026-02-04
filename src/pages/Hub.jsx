import React from 'react';
import { Container, Stack, Title, SimpleGrid, UnstyledButton, Text, Group } from "@mantine/core";
import { Youtube, Bookmark, Calendar as GoogleIcon, Music, Calculator, Clock, Terminal, ArrowUpRight } from "lucide-react";

const ipc = window.require ? window.require("electron").ipcRenderer : null;

// 1. APP CARD (ҚОСЫМША КАРТОЧКАСЫ)
const AppCard = ({ icon: Icon, name, onClick }) => {
  return (
    <UnstyledButton 
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        padding: '24px',
        backgroundColor: '#000',
        border: '1px solid #222',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      // Hover эффектісі
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'white';
        e.currentTarget.style.backgroundColor = '#111';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#222';
        e.currentTarget.style.backgroundColor = '#000';
      }}
    >
      <Group justify="space-between" align="start" mb="md">
        <Icon size={32} color="white" strokeWidth={1} />
        <ArrowUpRight size={18} color="#444" />
      </Group>
      
      <Text c="white" fw={700} tt="uppercase" size="sm" style={{ letterSpacing: '2px' }}>
        {name}
      </Text>
    </UnstyledButton>
  );
};

export const Hub = () => { // Props арқылы launch алудың қажеті жоқ, ішінде жасаймыз
  
  // ҚОСЫМШАНЫ ІСКЕ ҚОСУ ФУНКЦИЯСЫ
  const launch = (url, type = "web") => {
    if (ipc) {
      ipc.send("launch", { data: url, type });
    } else {
      console.log("Launch (Browser Mode):", url);
      window.open(url, "_blank");
    }
  };

  const services = [
    {
      name: "YOUTUBE TV",
      icon: Youtube,
      action: () => launch("https://www.youtube.com/tv", "web"),
    },
    {
      name: "GOOGLE CALENDAR",
      icon: GoogleIcon,
      action: () => launch("https://calendar.google.com", "web"),
    },
    {
      name: "GOOGLE KEEP",
      icon: Bookmark,
      action: () => launch("https://keep.google.com", "web"),
    },
    {
      name: "YANDEX MUSIC",
      icon: Music,
      action: () => launch("https://music.yandex.kz", "web"),
    },
    {
      name: "CALCULATOR",
      icon: Calculator,
      action: () => launch("gnome-calculator", "sys"),
    },
    {
      name: "CLOCKS",
      icon: Clock,
      action: () => launch("gnome-clocks", "sys"),
    },
  ];

  return (
    <Container 
      fluid 
      h="100vh" 
      bg="black" 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {/* Settings-пен бірдей ені: 750px */}
      <Stack w="100%" maw={750} gap="xl" p="md">
        
        {/* 1. HEADER (LEFT ALIGNED) */}
        <Stack gap={4} mb="sm">
            <Title 
              order={2} 
              c="white" 
              fw={300} 
              style={{ fontSize: '28px', letterSpacing: '10px', textTransform: 'uppercase' }}
            >
              VECTOR HUB
            </Title>
            <Group gap="xs">
              <Terminal size={14} color="#444" />
              <Text c="dimmed" size="xs" fw={700} style={{ letterSpacing: '4px', fontSize: '11px' }}>
                APPLICATIONS
              </Text>
            </Group>
        </Stack>

        {/* 2. GRID LAYOUT */}
        <SimpleGrid cols={2} spacing="md" verticalSpacing="md">
          {services.map((s) => (
            <AppCard 
                key={s.name} 
                name={s.name} 
                icon={s.icon} 
                onClick={s.action} 
            />
          ))}
        </SimpleGrid>

      </Stack>
    </Container>
  );
};