const { execSync } = require('child_process');
const fs = require('fs');

const SERVER = '82.115.43.240';
const USER = 'ubuntu';
const REMOTE_PATH = '/var/www/html/updater/';

try {
  const pkg = JSON.parse(fs.readFileSync('./package.json'));
  const parts = pkg.version.split('.');
  parts[2] = parseInt(parts[2]) + 1;
  pkg.version = parts.join('.');
  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));

  console.log(`🚀 Деплой версии ${pkg.version}...`);
  execSync('npm run electron:build', { stdio: 'inherit' });

  console.log("☁️ Заливка файлов на сервер...");
  // Забираем все файлы, которые создал сборщик
  execSync(`scp ./dist-electron/*.AppImage ${USER}@${SERVER}:${REMOTE_PATH}`);
  execSync(`scp ./dist-electron/*.yml ${USER}@${SERVER}:${REMOTE_PATH}`);

  console.log(`✅ Версия ${pkg.version} готова!`);
} catch (e) {
  console.error('❌ Ошибка:', e.message);
}