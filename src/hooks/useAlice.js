import { useState, useEffect } from "react";

// Безопасное подключение к Electron (чтобы не падало в браузере)
const ipc = window.require ? window.require("electron").ipcRenderer : null;

export function useAlice() {
  const [status, setStatus] = useState("disconnected");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ipc) {
      // 1. При загрузке проверяем текущий статус
      ipc.invoke('alice:status')
        .then((res) => setStatus(res?.status || "disconnected"))
        .catch((e) => console.error("Alice status err:", e));

      // 2. 👇 СЛУШАЕМ СОБЫТИЯ (SOCKET.IO)
      // Серверден "pairing_success" келгенде, Electron осы оқиғаны жібереді
      const handleStatusChange = (_event, newStatus) => {
        console.log("⚡ Alice Status Updated via IPC:", newStatus);
        setStatus(newStatus);
      };

      ipc.on('alice-status-changed', handleStatusChange);

      // Чистим слушатель при размонтировании
      return () => {
        ipc.removeListener('alice-status-changed', handleStatusChange);
      };
    }
  }, []);

  // Функция получения кода (Pairing)
  const connectAlice = async () => {
    setLoading(true);
    let result = null;

    if (ipc) {
      try {
        // Запрашиваем код у сервера через Electron (HTTP request to /pair)
        result = await ipc.invoke('alice:pair');
        console.log("Hooks: Pair result", result);
      } catch (e) {
        console.error("Alice pair failed", e);
      }
    } else {
      // 🚧 Заглушка для браузера
      console.log("🚧 Browser Mode: Fake Pairing Code");
      await new Promise(r => setTimeout(r, 1000));
      result = { success: true, code: "123 456" };
    }
    
    setLoading(false);
    return result; // Возвращаем { success, code } в компонент
  };

  // Функция выхода (Logout)
  const disconnectAlice = async () => {
    setLoading(true);
    if (ipc) await ipc.invoke('alice:logout');
    setStatus("disconnected");
    setLoading(false);
  };

  return { status, connectAlice, disconnectAlice, loading };
}