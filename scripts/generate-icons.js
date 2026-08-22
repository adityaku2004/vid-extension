import fs from 'fs';
import path from 'path';

// Minimal 1x1 or base64 PNG data for clean fallback icons if not present
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1x1 cyan pixel transparent PNG buffer
const cyanPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

['icon16.png', 'icon48.png', 'icon128.png'].forEach((file) => {
  const target = path.join(publicDir, file);
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, cyanPngBuffer);
  }
});
console.log('Extension icons created in public/');
