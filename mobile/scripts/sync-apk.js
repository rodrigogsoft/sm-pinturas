const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const candidateApkPaths = [
  path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
];
const destinationDir = path.resolve(projectRoot, '..', 'frontend', 'public', 'downloads');
const destinationPath = path.join(destinationDir, 'app-jb-pinturas.apk');

const existingApks = candidateApkPaths
  .filter((filePath) => fs.existsSync(filePath))
  .map((filePath) => ({
    filePath,
    stats: fs.statSync(filePath),
  }))
  .sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs);

if (existingApks.length === 0) {
  console.error('Nenhum APK encontrado para sincronizar. Gere o build Android antes de executar este comando.');
  process.exit(1);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(existingApks[0].filePath, destinationPath);

const apkSizeMb = (existingApks[0].stats.size / (1024 * 1024)).toFixed(2);

console.log(`APK sincronizado com sucesso: ${existingApks[0].filePath}`);
console.log(`Destino: ${destinationPath}`);
console.log(`Tamanho: ${apkSizeMb} MB`);