const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  const sizes = [
    { size: 16, source: 'icon-16.svg' },
    { size: 32, source: 'icon-48.svg' },
    { size: 48, source: 'icon-48.svg' },
    { size: 128, source: 'icon-128.svg' },
  ];

  for (const { size, source } of sizes) {
    const svgPath = path.join(iconsDir, source);
    const pngPath = path.join(iconsDir, `icon-${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.log(`SVG not found: ${svgPath}, creating from inline SVG`);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
        <rect width="128" height="128" rx="28" fill="#7C3AED"/>
        <circle cx="64" cy="64" r="32" fill="none" stroke="white" stroke-width="8"/>
        <circle cx="64" cy="64" r="10" fill="white"/>
      </svg>`;
      await sharp(Buffer.from(svg)).resize(size, size).png().toFile(pngPath);
    } else {
      await sharp(svgPath).resize(size, size).png().toFile(pngPath);
    }

    console.log(`Generated: icon-${size}.png`);
  }

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
