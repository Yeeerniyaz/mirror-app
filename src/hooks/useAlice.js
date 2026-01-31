import { useState, useEffect } from "react";

// Безопасное подключение к Electron (чтобы не падало в браузере)
const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useAlice() {
  const [status, setStatus] = useState("disconnected");
  const [loading, setLoading] = useState(false);

  // Проверка статуса при загрузке страницы
  useEffect(() => {
    if (ipc) {
      ipc.invoke('alice:status')
        .then((res) => setStatus(res?.status || "disconnected"))
        .catch((e) => console.error("Alice status err:", e));
    }
  }, []);

  // Функция входа (Login)
  const connectAlice = async () => {
    setLoading(true);
    if (ipc) {
      try {
        const res = await ipc.invoke('alice:login');
        if (res && res.success) setStatus("online");
      } catch (e) {
        console.error("Alice login failed", e);
      }
    } else {
      // Заглушка для браузера (без Electron)
      console.log("🚧 Browser Mode: Alice login simulation");
      setTimeout(() => setStatus("online"), 1000);
    }
    setLoading(false);
  };

  // Функция выхода (Logout)
  const disconnectAlice = async () => {
    if (ipc) await ipc.invoke('alice:logout');
    setStatus("disconnected");
  };

  return { status, connectAlice, disconnectAlice, loading };
}