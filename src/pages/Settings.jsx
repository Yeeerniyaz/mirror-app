import { Container, Stack, Title, SimpleGrid, Text, Slider, ActionIcon, Center, UnstyledButton, Group } from "@mantine/core";
import { RefreshCw } from "lucide-react";

export const Settings = ({ brightness, setBrightness, sendCmd, updateMirror, appVersion, ipcRenderer }) => (
  <Container
    fluid
    p="100px"
    style={{ width: "100vw", height: "100vh", position: "relative" }}
  >
    <Stack gap="80px">
      <Title
        order={2}
        style={{
          fontSize: "40px",
          fontWeight: 100,
          letterSpacing: "15px",
        }}
      >
        SETTINGS
      </Title>
      <SimpleGrid cols={2} spacing="150px">
        <Stack gap="xl">
          <Text fw={900} size="sm" style={{ letterSpacing: "4px" }}>
            BRIGHTNESS
          </Text>
          <Slider
            color="gray"
            size="lg"
            value={brightness}
            onChange={(v) => {
              setBrightness(v);
              ipcRenderer?.send("set-brightness", v);
            }}
          />
        </Stack>
        <Stack gap="xl">
          <Text fw={900} size="sm" style={{ letterSpacing: "4px" }}>
            SYSTEM REBOOT
          </Text>
          <ActionIcon
            size="100px"
            variant="outline"
            color="red"
            onClick={() => sendCmd("reboot")}
            style={{ border: "1px solid #ff0000" }}
          >
            <RefreshCw size={40} />
          </ActionIcon>
        </Stack>
      </SimpleGrid>
      <Center mt="100px">
        <UnstyledButton
          onClick={updateMirror}
          style={{
            borderBottom: "2px solid #ff0000",
            padding: "15px 50px",
          }}
        >
          <Group gap="xl">
            <RefreshCw size={25} color="#ff0000" />
            <Text
              fw={900}
              c="red"
              size="md"
              style={{ letterSpacing: "6px" }}
            >
              FORCE UPDATE VECTOR MIRROR
            </Text>
          </Group>
        </UnstyledButton>
      </Center>
    </Stack>
    <Text
      size="xs"
      fw={700}
      c="dimmed"
      style={{
        letterSpacing: "3px",
        opacity: 0.3,
        position: "absolute",
        bottom: "40px",
        right: "70px",
      }}
    >
      VECTOR OS v{appVersion}
    </Text>
  </Container>
);