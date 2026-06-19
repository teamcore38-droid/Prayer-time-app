const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const input = path.join(__dirname, '..', 'public', 'icon.svg');
const outDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generate() {
  if (!fs.existsSync(input)) {
    console.error('Source SVG not found:', input);
    process.exit(1);
  }

  for (const size of sizes) {
    const out = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(input)
      .resize(size, size)
      .png({ quality: 90 })
      .toFile(out);
    console.log('Written', out);
  }
  console.log('All icons generated.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
