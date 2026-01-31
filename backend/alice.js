// backend/alice.js
// 🚧 ЗАГЛУШКА: Контроллер для Яндекс.Алисы

let aliceToken = null;
let aliceStatus = "disconnected"; // disconnected, connecting, online

// 1. Имитация входа через Яндекс
export const loginYandex = async () => {
  console.log("🚧 ALICE: Попытка входа (Stub)...");
  // В будущем здесь будет OAuth2 запрос к Яндексу
  // Пока просто имитируем задержку и успех
  return new Promise((resolve) => {
    setTimeout(() => {
      aliceToken = "stub_token_12345";
      aliceStatus = "online";
      console.log("🚧 ALICE: Вход выполнен (Fake)");
      resolve({ success: true, token: aliceToken });
    }, 1500);
  });
};

// 2. Получение статуса
export const getAliceStatus = () => {
  return { status: aliceStatus, token: aliceToken ? "***" : null };
};

// 3. Обработка команд от Алисы (пришедших по HTTP или MQTT)
export const handleAliceCommand = (command) => {
  console.log(`🚧 ALICE CMD: Получена команда "${command.intent}"`);
  
  // Пример будущей логики:
  // if (command.intent === 'turn_on_light') ...
  // if (command.intent === 'weather') ...
  
  return { status: "ignored", reason: "not_implemented_yet" };
};