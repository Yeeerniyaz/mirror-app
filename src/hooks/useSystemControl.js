import { useEffect, useCallback } from 'react';

export const useSystemControl = (pageCount, setPage, ipc) => {
  
  // Бетті ауыстыру логикасы
  const navigate = useCallback((direction) => {
    setPage((curr) => {
      if (direction === 'next') return Math.min(curr + 1, pageCount - 1);
      if (direction === 'prev') return Math.max(curr - 1, 0);
      if (direction === 'loop') return (curr + 1) % pageCount;
      return typeof direction === 'number' ? direction : curr;
    });
  }, [pageCount, setPage]);

  // Пернетақта тыңдаушысы
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case "ArrowRight": navigate('next'); break;
        case "ArrowLeft":  navigate('prev'); break;
        case " ":          navigate('loop'); break; // Spacebar
        default: break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Electron командалары
  const system = {
    openWifi: () => ipc?.send("open-wifi-settings"),
    launchApp: (data, type, isTV = false) => ipc?.send("launch", { data, type, isTV }),
    checkUpdate: () => ipc?.send("check-for-updates"),
    exec: (cmd, setStatus) => {
      setStatus(`ВЫПОЛНЕНИЕ: ${cmd.toUpperCase()}...`);
      ipc?.send("system-cmd", cmd);
      setTimeout(() => setStatus(""), 2000);
    }
  };

  return { navigate, system };
};