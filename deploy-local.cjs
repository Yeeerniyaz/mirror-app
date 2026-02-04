const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- НАСТРОЙКИ RASPBERRY PI ---
const CONFIG = {
  ip: "192.168.8.43",          // ⚠️ ВПИШИ СЮДА РЕАЛЬНЫЙ IP МАЛИНКИ
  user: "yerniyaz",            // Твой юзер на малинке
  targetDir: "/home/yerniyaz/Desktop/vector/", // Куда кидать файлы
  distDir: "./dist-electron",
  serviceName: "vector.service" // Имя службы systemd
};

// Логгер
const log = (emoji, msg) => console.log(`\n${emoji}  [${new Date().toLocaleTimeString()}] ${msg}`);

try {
  // 1. ПОВЫШЕНИЕ ВЕРСИИ (Чтобы зеркало поняло, что это новая версия)
  // Если не хочешь каждый раз поднимать версию для тестов, закомментируй этот блок
  const pkgPath = "./package.json";
  const pkg = JSON.parse(fs.readFileSync(pkgPath));
  const parts = pkg.version.split(".");
  parts[2] = parseInt(parts[2]) + 1;
  pkg.version = parts.join(".");
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  log("📈", `Версия поднята для локального теста: -> ${pkg.version}`);

  // 2. СБОРКА
  log("🏗️", "Сборка проекта под ARM64...");
  // --linux --arm64 обязательно, чтобы не собрать под винду
  execSync("npm run electron:build -- --linux --arm64", { stdio: "inherit" });

  // 3. ПОИСК ФАЙЛА
  log("🔍", "Поиск AppImage...");
  if (!fs.existsSync(CONFIG.distDir)) throw new Error("Папка dist-electron пуста!");
  
  const files = fs.readdirSync(CONFIG.distDir);
  // Нам нужен только AppImage для локального запуска
  const appImage = files.find(f => f.endsWith(".AppImage") && !f.includes("blockmap"));

  if (!appImage) throw new Error("❌ AppImage не найден!");

  const appImagePath = path.join(CONFIG.distDir, appImage);

  // 4. ОТПРАВКА (SCP)
  log("🚀", `Отправка на RPi (${CONFIG.ip})...`);
  
  // Создаем папку на всякий случай
  execSync(`ssh ${CONFIG.user}@${CONFIG.ip} "mkdir -p ${CONFIG.targetDir}"`, { stdio: "inherit" });
  
  // Копируем файл
  execSync(`scp -C "${appImagePath}" ${CONFIG.user}@${CONFIG.ip}:${CONFIG.targetDir}`, { stdio: "inherit" });

  // 5. ПЕРЕЗАПУСК СЕРВИСА
  log("🔄", "Перезапуск службы на малинке...");
  execSync(`ssh ${CONFIG.user}@${CONFIG.ip} "sudo systemctl restart ${CONFIG.serviceName}"`, { stdio: "inherit" });

  log("✅", `Готово! Версия ${pkg.version} должна запуститься на зеркале.`);

} catch (e) {
  console.error("\n❌ ОШИБКА:", e.message);
  console.log("💡 Совет: Проверь IP малинки и подключен ли ты к одной сети.");
  process.exit(1);
}