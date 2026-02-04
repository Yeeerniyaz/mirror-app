import { io } from "socket.io-client";
import { getOrCreateDeviceId } from "./identity.js"; 

// Сенің серверің
const SERVER_URL = "https://vector.yeee.kz";
const deviceId = getOrCreateDeviceId(); 

console.log("🔌 Connecting to Socket.IO:", SERVER_URL, "ID:", deviceId);

// Серверге қосылу
export const socket = io(SERVER_URL, {
    query: { 
        deviceId: deviceId,
        type: 'mirror' // Серверге "Мен айнамын" деп айтамыз
    },
    reconnection: true, // Интернет үзілсе, қайта қосылу
    transports: ['websocket'] // Ең жылдам протокол
});

socket.on("connect", () => {
    console.log("✅ Socket Connected! ID:", socket.id);
});

socket.on("connect_error", (err) => {
    console.error("❌ Socket Connection Error:", err.message);
});

socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket Disconnected:", reason);
});