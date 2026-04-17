const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Instala jimp localmente de forma silenciosa
try { require('jimp'); } catch(e) {
  execSync('npm install jimp --no-save --legacy-peer-deps', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}

const { Jimp } = require('jimp');

const ICON_SIZES = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const SRC = path.resolve(__dirname, '../assets/icon.png');
const RES = path.resolve(__dirname, '../android/app/src/main/res');

async function main() {
  const img = await Jimp.read(SRC);
  for (const { dir, size } of ICON_SIZES) {
    const destDir = path.join(RES, dir);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const resized = img.clone().resize({ w: size, h: size });
    await resized.write(path.join(destDir, 'ic_launcher.png'));
    await resized.write(path.join(destDir, 'ic_launcher_round.png'));
    console.log(`✓ ${dir}: ${size}x${size}`);
  }
  console.log('Ícones gerados com sucesso!');
}

main().catch(console.error);
