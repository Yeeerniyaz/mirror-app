import { io } from "socket.io-client";
import { getDeviceId } from "./identity.js"; // getOrCreateDeviceId емес, getDeviceId болуы мүмкін, тексеріп ал

// Сенің серверің
const SERVER_URL = "https://vector.yeee.kz";
const deviceId = getDeviceId(); 

console.log("🔌 Connecting to Socket.IO:", SERVER_URL, "ID:", deviceId);

// Серверге қосылу
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
    
    // --- ОСЫ ЖОЛДАР ЖЕТІСПЕЙ ТҰР ЕДІ 👇 ---
    // Серверге өзімізді тіркейміз, сонда ол бізді "online" деп таниды
    socket.emit('register', { 
        deviceId: deviceId, 
        type: 'mirror' 
    });
});

socket.on("connect_error", (err) => {
    console.error("❌ Socket Connection Error:", err.message);
});

socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket Disconnected:", reason);
});