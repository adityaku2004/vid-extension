import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as esbuild from 'esbuild';

const targetBrowser = process.argv[2] || 'chrome'; // 'chrome' or 'firefox'
const outDir = targetBrowser === 'firefox' ? 'dist-firefox' : 'dist-chrome';

console.log(`\n📦 Building Cine Media Player Extension for: ${targetBrowser.toUpperCase()} -> ${outDir}/\n`);

// 1. Clean output directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// 2. Run Vite build to generate web assets into dist
console.log('⚡ Compiling React UI and HTML entry points with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

// 3. Copy Vite dist files to outDir
console.log(`📋 Copying dist assets to ${outDir}...`);
fs.cpSync('dist', outDir, { recursive: true });

// 4. Build background service worker with esbuild
console.log('⚙️ Bundling background service worker...');
esbuild.buildSync({
  entryPoints: ['src/extension/background/background.ts'],
  bundle: true,
  outfile: path.join(outDir, 'background.js'),
  format: 'iife',
  target: 'es2020',
  minify: false,
  sourcemap: false
});

// 5. Build content script with esbuild
console.log('⚙️ Bundling content script...');
esbuild.buildSync({
  entryPoints: ['src/extension/content/content.ts'],
  bundle: true,
  outfile: path.join(outDir, 'content.js'),
  format: 'iife',
  target: 'es2020',
  minify: false,
  sourcemap: false
});

// 6. Copy Manifest file
const manifestSource =
  targetBrowser === 'firefox'
    ? 'src/extension/manifest.firefox.json'
    : 'src/extension/manifest.chrome.json';

console.log(`📄 Writing manifest.json from ${manifestSource}...`);
const manifestContent = fs.readFileSync(manifestSource, 'utf-8');
fs.writeFileSync(path.join(outDir, 'manifest.json'), manifestContent);

// 7. Ensure icons exist in outDir
['icon16.png', 'icon48.png', 'icon128.png'].forEach((iconName) => {
  const publicIcon = path.join('public', iconName);
  const targetIcon = path.join(outDir, iconName);
  if (fs.existsSync(publicIcon) && !fs.existsSync(targetIcon)) {
    fs.copyFileSync(publicIcon, targetIcon);
  }
});

console.log(`\n🎉 Successfully built ${targetBrowser.toUpperCase()} extension in "${outDir}/"!\n`);
