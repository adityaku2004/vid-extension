# Cine Media Player 🎬
> High-performance, VLC-grade media player and cross-browser extension for Chrome, Edge, and Firefox. Built with React 19, TypeScript, Tailwind CSS, Motion, Web Audio API, and the File System Access API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Manifest V3](https://img.shields.io/badge/Chrome_MV3-Compatible-success?logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Firefox WebExtension](https://img.shields.io/badge/Firefox_MV2-Compatible-orange?logo=firefox)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

---

## 📑 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Design](#-architecture--design)
- [Browser Extension Integration](#-browser-extension-integration)
- [Keyboard Shortcuts (VLC-Style)](#-keyboard-shortcuts-vlc-style)
- [MKV & Subtitle Engine](#-mkv--subtitle-engine)
- [Audio Booster & Equalizer](#-audio-booster--equalizer)
- [Getting Started & Development](#-getting-started--development)
- [Building the Browser Extension](#-building-the-browser-extension)
- [Installing in Chrome / Edge / Brave](#-installing-in-chrome--edge--brave)
- [Installing in Firefox](#-installing-in-firefox)
- [Security & Privacy](#-security--privacy)
- [License](#-license)

---

## 🌟 Overview

**Cine Media Player** combines the flexibility of a desktop media player (like VLC or IINA) with the accessibility of modern web applications and browser extensions. It runs seamlessly as a standalone web application and compiles into production-ready browser extensions for Google Chrome (Manifest V3) and Mozilla Firefox (Manifest V2).

Play local videos (MP4, MKV, WebM, MOV, AVI), stream remote video URLs, inspect MKV container metadata in real time, extract embedded subtitle tracks, boost quiet audio by up to 200%, and organize media with bookmarks and local folder indexing.

---

## 🚀 Key Features

### 🎞️ Advanced Video Playback
- **Universal Container Support**: Plays MP4, WebM, MOV, and MKV (Matroska) containers directly in the browser.
- **Embedded MKV Subtitle Extraction**: Parses EBML headers and Matroska clusters client-side to extract embedded SubRip (SRT), WebVTT, and SubStation Alpha (SSA/ASS) tracks without external servers.
- **MKV Codec Diagnostics & Lossless Remux Suggestions**: Detects unsupported codecs (e.g., HEVC/H.265 or AC-3 audio) and displays lossless, copy-stream `ffmpeg` commands.
- **Aspect Ratio Controls**: Switch between `Original`, `Fill`, `16:9`, `4:3`, and `2.35:1 Cinematic Anamorphic`.
- **Variable Playback Speed**: Granular speed control from `0.25x` up to `4.0x` with audio pitch preservation.
- **Picture-in-Picture & Fullscreen**: Native PiP mode and distraction-free fullscreen playback.

### 🔊 200% Audio Boost & 5-Band Equalizer
- **Web Audio API Graph**: Custom audio pipeline utilizing `AudioContext`, `GainNode`, and `BiquadFilterNode` equalizer filters.
- **High-Gain Preamp**: Boost quiet videos up to 200% (+6dB) with a soft dynamic range compressor to prevent harsh digital clipping.
- **Preset & Custom EQ**: Flat, Bass Boost, Vocal Boost, Treble Boost, Movie Dialogue, and Rock presets.

### 💬 Multi-Track Subtitles & Custom Styling
- **External Subtitle Loading**: Drag & drop or browse `.srt`, `.vtt`, and `.ass` files.
- **Live Sync Offset Tuning**: Adjust subtitle delay/advance in ±50ms intervals (`[` and `]` hotkeys).
- **Customizable Appearance**: Modify subtitle font size, text color, background opacity, font family, and vertical positioning.

### 🔖 Interactive Video Bookmarks
- **Timestamped Markers**: Add bookmarks with one click or hotkey (`B`).
- **Color-Coded Labels**: Categorize moments with custom colors and descriptive notes.
- **Visual Timeline Highlights**: Colored indicators displayed directly on the seek bar for instant navigation.

### 📚 Media Library & Persistent History
- **Continue Watching**: Automatically remembers playback progress for local files and remote streams using IndexedDB.
- **Directory Indexing**: Index local media folders with the File System Access API without uploading files.
- **Favorites & Search**: Star favorite videos and filter playlists with instant search.

---

## 🏗️ Architecture & Design

```
cine-media-player/
├── public/                     # Static assets & extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/                    # Extension bundle & packaging scripts
│   ├── build-extension.js      # Multi-target builder (Chrome MV3 / Firefox MV2)
│   └── generate-icons.js       # Fallback icon generator
├── src/
│   ├── browser/                # Universal Extension & Storage Abstraction Layer
│   │   ├── browserAPI.ts       # Unified API interface
│   │   ├── fileSystem.ts       # File System Access API & fallback directory picker
│   │   ├── indexedDB.ts        # IndexedDB store for watch history and folder indices
│   │   ├── runtime.ts          # Cross-browser runtime messaging wrapper
│   │   ├── storage.ts          # chrome.storage.local / browser.storage / localStorage
│   │   ├── tabs.ts             # Dedicated player tab management
│   │   └── types.ts            # Type definitions
│   ├── components/
│   │   ├── AudioEffects/       # Audio equalizer & boost modal
│   │   ├── Bookmarks/          # Video bookmark manager & timeline markers
│   │   ├── Common/             # Tooltips, toasts, dialogs, sliders
│   │   ├── EmptyState/         # Drag & drop upload zone and sample video loader
│   │   ├── KeyboardShortcuts/  # Hotkey cheat sheet modal
│   │   ├── Playlist/           # Queue, Bookmarks, History & Folder Library tabs
│   │   ├── Settings/           # Video & subtitle preference modals
│   │   └── VideoPlayer/        # Core video stage, custom controls, subtitle overlay
│   ├── extension/
│   │   ├── background/         # Extension Background Service Worker
│   │   ├── content/            # Web page HTML5 video detector & modal picker
│   │   ├── popup/              # Toolbar popup UI (Continue Watching, Quick Actions)
│   │   ├── manifest.chrome.json   # Chrome MV3 manifest
│   │   └── manifest.firefox.json  # Firefox MV2 manifest
│   ├── hooks/                  # Custom React hooks (useLocalStorage, useHotkeys, useAudioBoost)
│   ├── utils/                  # Parsers (MKV, EBML, SRT, VTT, ASS, formatting)
│   ├── App.tsx                 # Root React application
│   └── main.tsx                # Client entry point
├── index.html                  # Standalone Web Player entry point
├── player.html                 # Dedicated Extension Player Tab entry point
├── popup.html                  # Extension Popup entry point
└── vite.config.ts              # Multi-entry Vite bundler configuration
```

---

## 🔌 Browser Extension Integration

The project includes an extension integration layer that operates seamlessly across browsers:

1. **Background Service Worker (`src/extension/background/background.ts`)**:
   - Manages context menus (`Open Video in Cine Media Player` when right-clicking `<video>`, `<audio>`, or links).
   - Handles global keyboard shortcuts (`Ctrl+Shift+P`, `Ctrl+Shift+Space`, etc.).
   - Orchestrates opening and focusing single-instance player tabs (`player.html`).

2. **Content Script (`src/extension/content/content.ts`)**:
   - Scans web pages for HTML5 `<video>` streams on demand.
   - Displays an overlay picker allowing users to launch any detected video into Cine Media Player.
   - Enforces strict security (no DRM circumvention or unauthorized script injections).

3. **Extension Toolbar Popup (`src/extension/popup/Popup.tsx`)**:
   - Quick launcher with instant resume for continue-watching items.
   - Real-time video detection button for active browser tabs.
   - Direct link to settings and full player view.

---

## ⌨️ Keyboard Shortcuts (VLC-Style)

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> or <kbd>K</kbd> | Toggle Play / Pause |
| <kbd>Left Arrow</kbd> / <kbd>Right Arrow</kbd> | Jump backward / forward by 10s (configurable) |
| <kbd>J</kbd> / <kbd>L</kbd> | Jump backward / forward by 10s |
| <kbd>Up Arrow</kbd> / <kbd>Down Arrow</kbd> | Increase / Decrease volume by 5% |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>P</kbd> | Toggle Picture-in-Picture (PiP) |
| <kbd>[</kbd> / <kbd>]</kbd> | Adjust Subtitle Sync Offset (-50ms / +50ms) |
| <kbd>Z</kbd> | Cycle Subtitle Track |
| <kbd>C</kbd> | Cycle Subtitle Visibility (On / Off) |
| <kbd>A</kbd> | Cycle Aspect Ratio (Original, Fill, 16:9, 4:3, 2.35:1) |
| <kbd>B</kbd> | Add Bookmark at current playback time |
| <kbd>&lt;</kbd> / <kbd>&gt;</kbd> | Decrease / Increase Playback Speed (0.25x - 4.0x) |
| <kbd>N</kbd> / <kbd>Shift+P</kbd> | Next / Previous video in playlist |
| <kbd>?</kbd> | Open Keyboard Shortcuts Reference |

---

## 📦 MKV & Subtitle Engine

Matroska (`.mkv`) files often contain audio/video streams or subtitles not natively parsed by standard `<video>` tags. Cine Media Player implements a client-side engine:

1. **EBML & Matroska Parser**:
   - Reads the Matroska header, Track Entries, CodecID, and cluster blocks.
   - Extracts embedded SubRip (`S_TEXT/UTF8`), WebVTT (`S_TEXT/WEBVTT`), and ASS/SSA (`S_TEXT/ASS`) subtitle tracks into timed cues.
2. **Codec Inspection**:
   - Identifies video streams (AVC/H.264, HEVC/H.265, VP9, AV1) and audio streams (AAC, MP3, Opus, AC-3, E-AC-3, DTS).
   - If a codec cannot be rendered natively by browser hardware, the player presents codec information and a single-click lossless remux command:
     ```bash
     ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4
     ```

---

## 🔊 Audio Booster & Equalizer

Browsers typically cap HTML5 audio at 100% (gain of 1.0). Cine Media Player routes media element audio through the Web Audio API:

```
[<video> Element] 
       │
   [MediaElementAudioSourceNode]
       │
   [5-Band BiquadFilter Equalizer] (60Hz, 250Hz, 1kHz, 4kHz, 12kHz)
       │
   [GainNode (Preamp / Audio Boost up to 200%)]
       │
   [DynamicsCompressorNode (Peak Limiter)]
       │
[AudioDestinationNode (Speakers/Headphones)]
```

---

## 🛠️ Getting Started & Development

### Prerequisites
- Node.js 18+ or Bun
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/your-username/cine-media-player.git
cd cine-media-player

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the standalone web player.

### Typecheck & Lint
```bash
npm run lint
```

---

## 📦 Building the Browser Extension

Cine Media Player includes dedicated automated build scripts that produce distribution-ready extension packages:

### Build for Google Chrome & Chromium (Brave, Edge, Opera)
```bash
npm run build:chrome
```
*Output: `dist-chrome/` containing Manifest V3, bundled background worker, content script, and Vite HTML entry points.*

### Build for Mozilla Firefox
```bash
npm run build:firefox
```
*Output: `dist-firefox/` containing Manifest V2 with Firefox WebExtension background script definitions.*

### Build All Targets
```bash
npm run build:all
```

---

## 📥 Installing in Chrome / Edge / Brave

1. Run `npm run build:chrome`.
2. Open your browser and navigate to the Extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer mode** (toggle located in the top-right corner).
4. Click **Load unpacked** (or *Load unpacked extension*).
5. Select the **`dist-chrome`** directory from this project.
6. The **Cine Media Player** extension icon will now appear in your browser toolbar!

---

## 🦊 Installing in Firefox

1. Run `npm run build:firefox`.
2. Open Firefox and navigate to:
   ```
   about:debugging#/runtime/this-firefox
   ```
3. Click **Load Temporary Add-on...**
4. Browse to the **`dist-firefox`** folder and select `manifest.json`.
5. The extension will be loaded and active for testing.

---

## 🔒 Security & Privacy

- **100% Client-Side Processing**: All video decoding, EBML/MKV extraction, subtitle parsing, and audio filtering run locally in your browser.
- **Zero Tracking / No Telemetry**: No external analytics, tracking pixels, or data collection scripts.
- **Private Storage**: Watch history, custom bookmarks, and user preferences remain securely in your browser's IndexedDB and extension storage.
- **No DRM Circumvention**: Complies with web standards and security policies; does not bypass encrypted media extensions (EME) or DRM.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
