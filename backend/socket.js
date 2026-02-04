import { io } from "socket.io-client";
import { getDeviceId } from "./identity.js";
import { BrowserWindow } from "electron"; // 👈 Міндетті түрде қосу

const SERVER_URL = "https://vector.yeee.kz";
const deviceId = getDeviceId(); 

console.log("🔌 Connecting to Socket.IO:", SERVER_URL, "ID:", deviceId);

export const socket = io(SERVER_URL, {
    query: { 
        deviceId: deviceId, 
        type: 'mirror' 
    },
    reconnection: true, 
    transports: ['websocket'] 
});

socket.on("connect", () => {
    console.log("✅ Socket Connected! ID:", socket.id);
    // Серверге өзімізді тіркейміз
    socket.emit('register', { 
        deviceId: deviceId, 
        type: 'mirror' 
    });
});

// Бұлттан команда келгенде оны React-ке (Renderer) жіберу
socket.on("command", (data) => {
    console.log("🤖 Socket command from Cloud:", data);
    
    // Ашық терезелерді тауып, команданы React-ке бағыттаймыз
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        // Бірінші терезеге (main window) жіберу
        windows[0].webContents.send("command", data);
        console.log("📡 Sent to React UI via IPC");
    } else {
        console.error("❌ No active window found to receive command");
    }
});

socket.on("connect_error", (err) => {
    console.error("❌ Socket Connection Error:", err.message);
});

socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket Disconnected:", reason);
});