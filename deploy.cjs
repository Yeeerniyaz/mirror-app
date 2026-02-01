const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- НАСТРОЙКИ (КОНФИГ) ---
const CONFIG = {
  server: "82.115.43.240",
  user: "ubuntu",
  remotePath: "/var/www/html/updater/",
  distDir: "./dist-electron", 
};

// Функция для красивого вывода
const log = (emoji, msg) => console.log(`\n${emoji}  [${new Date().toLocaleTimeString()}] ${msg}`);

try {
  // 1. ОЧИСТКА
  log("🧹", "Чистим старые билды...");
  if (fs.existsSync(CONFIG.distDir)) {
    fs.rmSync(CONFIG.distDir, { recursive: true, force: true });
  }

  // 2. ПОВЫШЕНИЕ ВЕРСИИ
  const pkgPath = "./package.json";
  const pkg = JSON.parse(fs.readFileSync(pkgPath));
  const oldVersion = pkg.version;
  
  const parts = pkg.version.split(".");
  parts[2] = parseInt(parts[2]) + 1;
  pkg.version = parts.join(".");
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  log("📈", `Версия поднята: ${oldVersion} -> ${pkg.version}`);

  // 3. СБОРКА
  log("🏗️", "Сборка проекта под ARM64 (Raspberry Pi)...");
  execSync("npm run electron:build", { stdio: "inherit" });

  // 4. УМНЫЙ ПОИСК ФАЙЛОВ
  log("🔍", `Поиск артефактов в ${CONFIG.distDir}...`);
  
  if (!fs.existsSync(CONFIG.distDir)) throw new Error("Папка dist-electron пуста!");

  const files = fs.readdirSync(CONFIG.distDir);
  console.log("   📂 Файлы в папке:", files.join(", ")); // Для проверки

  // Ищем AppImage (исключая blockmap)
  const appImage = files.find(f => f.endsWith(".AppImage") && !f.includes("blockmap"));
  
  // Ищем YML: берем любой файл, который начинается на latest-linux и заканчивается на .yml
  // Это подхватит и latest-linux.yml, и latest-linux-arm64.yml
  const ymlFile = files.find(f => f.startsWith("latest-linux") && f.endsWith(".yml"));

  if (!appImage) throw new Error("❌ Не найден .AppImage!");
  if (!ymlFile) throw new Error("❌ Не найден .yml файл манифеста!");

  const appImagePath = path.join(CONFIG.distDir, appImage);
  const ymlPath = path.join(CONFIG.distDir, ymlFile);

  // 5. ЗАЛИВКА
  log("🚀", `Отправка на сервер (${CONFIG.server})...`);
  log("📦", `Файлы: ${appImage} + ${ymlFile}`);

  // Отправляем оба файла
  execSync(`scp -C "${appImagePath}" "${ymlPath}" ${CONFIG.user}@${CONFIG.server}:${CONFIG.remotePath}`, { stdio: "inherit" });

  log("✅", `Деплой версии ${pkg.version} успешно завершен!`);
  console.log(`🔗 Ссылка для проверки: http://${CONFIG.server}/updater/${ymlFile}`);

} catch (e) {
  console.error("\n❌ ОШИБКА:", e.message);
  process.exit(1);
}