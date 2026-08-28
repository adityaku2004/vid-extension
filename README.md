# Cine Media Player 🎬

<p align="center">
  <strong>A high-performance, VLC-grade media player and cross-browser extension for Chrome, Edge, Brave, and Firefox.</strong>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#-key-features"><img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.8" /></a>
  <a href="#-key-features"><img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="#-browser-extension-integration"><img src="https://img.shields.io/badge/Chrome_MV3-Compatible-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome MV3" /></a>
  <a href="#-browser-extension-integration"><img src="https://img.shields.io/badge/Firefox_MV2-Compatible-FF7139?style=for-the-badge&logo=firefox&logoColor=white" alt="Firefox MV2" /></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## 📑 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Feature Matrix](#-feature-matrix)
- [🏗️ System Architecture](#️-system-architecture)
  - [Audio Processing Pipeline (Web Audio API)](#audio-processing-pipeline-web-audio-api)
  - [MKV Container & EBML Parsing Flow](#mkv-container--ebml-parsing-flow)
  - [Cross-Browser Extension Messaging](#cross-browser-extension-messaging)
- [🔌 Browser Extension Setup](#-browser-extension-setup)
  - [Building from Source](#building-from-source)
  - [Installing on Chromium (Chrome / Edge / Brave / Opera / Arc)](#installing-on-chromium-chrome--edge--brave--opera--arc)
  - [Installing on Mozilla Firefox](#installing-on-mozilla-firefox)
- [⌨️ Keyboard Shortcuts Reference](#️-keyboard-shortcuts-reference)
- [🎛️ Audio Booster & 5-Band Equalizer](#️-audio-booster--5-band-equalizer)
- [💬 Subtitles & Synchronization Engine](#-subtitles--synchronization-engine)
- [🔖 Timeline Bookmarks & Chapters](#-timeline-bookmarks--chapters)
- [📂 Media Library & Persistent History](#-media-library--persistent-history)
- [🛠️ Developer Guide](#️-developer-guide)
  - [Project Directory Structure](#project-directory-structure)
  - [Available NPM Scripts](#available-npm-scripts)
- [❓ Troubleshooting & FAQ](#-troubleshooting--faq)
- [🔒 Security & Privacy Policy](#-security--privacy-policy)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Overview

**Cine Media Player** bridges the gap between powerful desktop media players (such as VLC and IINA) and modern web applications. It operates both as a **standalone, zero-install web player** and as a **browser extension** providing system-wide video integration across active browser tabs.

Built from the ground up with **React 19**, **TypeScript**, and modern browser APIs, Cine Media Player executes 100% client-side—delivering fast container parsing, audio enhancement, and media management without sending your personal media or data to any external server.

---

## 🎯 Feature Matrix

| Feature | Cine Media Player | Standard Browser Player | Typical Web Players |
| :--- | :---: | :---: | :---: |
| **Local File Playback** | ✅ (Drag & drop or directory scan) | ⚠️ (Basic file open) | ❌ (Upload required) |
| **200% Audio Gain & EQ** | ✅ (Web Audio API + Compressor) | ❌ (Capped at 100%) | ❌ |
| **Embedded MKV Subtitles** | ✅ (Client-side EBML extractor) | ❌ | ❌ |
| **Subtitle Sync Offset** | ✅ (±50ms live adjustments) | ❌ | ⚠️ (Rare) |
| **Timeline Bookmarks** | ✅ (With color tags & jump points) | ❌ | ❌ |
| **Local Folder Indexing** | ✅ (File System Access API) | ❌ | ❌ |
| **Resume Playback History** | ✅ (IndexedDB persistent state) | ❌ | ⚠️ (Session only) |
| **Web Page Video Sniffer** | ✅ (Extension content script) | ❌ | ❌ |
| **VLC Keyboard Hotkeys** | ✅ (Complete VLC mapping) | ⚠️ (Minimal) | ⚠️ (Partial) |
| **Privacy First** | ✅ (100% Local / Zero telemetry) | ✅ | ❌ (Cloud logging) |

---

## 🏗️ System Architecture

### Audio Processing Pipeline (Web Audio API)

To break through the standard 100% volume ceiling without introducing digital distortion or clipping, Cine Media Player routes all audio through an integrated Web Audio graph:

```
┌────────────────────────┐
│  <video> Media Element │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ MediaElementAudioSource│
└───────────┬────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│  5-Band BiquadFilter Equalizer                         │
│  ├─ 60 Hz   (Low Shelf - Sub-bass)                     │
│  ├─ 250 Hz  (Peaking - Bass & Low Mid)                │
│  ├─ 1 kHz   (Peaking - Midrange / Vocals)              │
│  ├─ 4 kHz   (Peaking - High Mid / Dialogue clarity)   │
│  └─ 12 kHz  (High Shelf - Treble & Air)                │
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│  GainNode (Preamp & Booster)                           │
│  • Normal Range: 0% to 100% (1.0x Gain)                │
│  • Boost Range:  100% to 200% (Up to 2.0x / +6dB)      │
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│  DynamicsCompressorNode (Peak Limiter)                 │
│  • Threshold: -12 dB   • Knee: 30 dB                   │
│  • Ratio: 12:1         • Attack: 3 ms  • Release: 0.25s│
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────┐
│ AudioDestinationNode   │  ──►  Speakers / Headphones
└────────────────────────┘
```

---

### MKV Container & EBML Parsing Flow

Matroska (`.mkv`) files encapsulate complex video, audio, and subtitle streams. When an MKV is loaded:

```
[Local .mkv File / Stream]
            │
            ▼
   [EBML Header Reader] ──► Validates DocType ("matroska" / "webm")
            │
            ▼
   [Segment Parser]
   ├─► Track 1: Video Stream (H.264 / HEVC / VP9 / AV1) ──► Codec Health Check
   ├─► Track 2: Audio Stream (AAC / MP3 / Opus / AC-3)   ──► Browser Compatibility Diagnostic
   └─► Track 3: Embedded Subtitles (SRT / VTT / ASS)
            │
            ▼
   [Cue Extractor] ──► Decodes Timestamps, Text Strings, & Styling
            │
            ▼
   [Synchronized Overlay Engine] ──► Real-time Canvas/HTML Subtitle Rendering
```

---

### Cross-Browser Extension Messaging

```
 ┌─────────────────────────┐         ┌─────────────────────────┐
 │   Active Browser Tab    │         │  Extension Toolbar UI   │
 │   (Webpage with Video)  │         │       (Popup.tsx)       │
 └────────────┬────────────┘         └────────────┬────────────┘
              │                                   │
              │ Content Script                    │ Action Click
              ▼                                   ▼
    [DOM Video Detector]                [Continue Watching List]
    [Extract src & dimensions]          [Page Video Sniffer]
              │                                   │
              └───────────────┬───────────────────┘
                              │ Runtime Messaging
                              ▼
                ┌───────────────────────────┐
                │ Background Service Worker │
                │ (background.ts)           │
                └─────────────┬─────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    [Context Menus Handler]       [Open / Focus Player Tab]
    ("Play in Cine Media")        (player.html / index.html)
```

---

## 🔌 Browser Extension Setup

Cine Media Player is engineered to build natively into both **Manifest V3** (for Chrome, Edge, Brave, Arc, Opera) and **Manifest V2** (for Firefox).

### Building from Source

Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cine-media-player.git
cd cine-media-player

# 2. Install dependencies
npm install

# 3. Build extension bundles
npm run build:chrome     # Generates dist-chrome/ (Manifest V3)
npm run build:firefox    # Generates dist-firefox/ (Manifest V2)
# OR build both:
npm run build:all
```

---

### Installing on Chromium (Chrome / Edge / Brave / Opera / Arc)

1. Open your browser and visit the extensions manager:
   - **Google Chrome**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
   - **Brave Browser**: `brave://extensions`
   - **Opera**: `opera://extensions`
2. Toggle on **Developer mode** (usually in the upper-right corner).
3. Click the **Load unpacked** button.
4. Select the **`dist-chrome`** directory from the project root.
5. The **Cine Media Player** icon will appear in your extensions bar!

> **Tip**: Pin the extension to your toolbar for one-click access to the video sniffer and resume cards.

---

### Installing on Mozilla Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Open the **`dist-firefox`** folder in the file picker and select `manifest.json`.
4. The extension is immediately loaded and active.

---

## ⌨️ Keyboard Shortcuts Reference

Cine Media Player adopts industry-standard VLC and YouTube shortcuts for instant muscle-memory familiarity:

| Key Binding | Action | Description |
| :--- | :--- | :--- |
| <kbd>Space</kbd> or <kbd>K</kbd> | **Play / Pause** | Toggle media playback |
| <kbd>→</kbd> / <kbd>←</kbd> | **Seek ±10s** | Skip forward or backward by 10 seconds |
| <kbd>J</kbd> / <kbd>L</kbd> | **Seek ±10s** | Secondary skip hotkeys |
| <kbd>Shift</kbd> + <kbd>→</kbd> / <kbd>←</kbd> | **Seek ±5s** | Fine-grained short jumps |
| <kbd>↑</kbd> / <kbd>↓</kbd> | **Volume ±5%** | Increment or decrement audio volume |
| <kbd>M</kbd> | **Mute / Unmute** | Toggle audio output |
| <kbd>F</kbd> | **Fullscreen** | Enter or exit native fullscreen mode |
| <kbd>P</kbd> | **Picture-in-Picture** | Detach video to floating mini-player |
| <kbd>[</kbd> / <kbd>]</kbd> | **Subtitle Sync** | Adjust subtitle delay (-50ms / +50ms) |
| <kbd>Z</kbd> | **Cycle Subtitles** | Switch between available subtitle tracks |
| <kbd>C</kbd> | **Toggle Subtitles** | Turn subtitles ON / OFF |
| <kbd>A</kbd> | **Aspect Ratio** | Cycle: Original → Fill → 16:9 → 4:3 → 2.35:1 |
| <kbd>B</kbd> | **Add Bookmark** | Stamp a timestamped marker at current position |
| <kbd>&lt;</kbd> / <kbd>&gt;</kbd> | **Playback Speed** | Decrease / Increase speed (0.25x to 4.0x) |
| <kbd>0</kbd> – <kbd>9</kbd> | **Percentage Jump** | Jump to 0%, 10%, 20% ... 90% of duration |
| <kbd>N</kbd> | **Next Track** | Skip to next playlist item |
| <kbd>Shift</kbd> + <kbd>P</kbd> | **Previous Track** | Return to previous playlist item |
| <kbd>?</kbd> | **Keyboard Help** | Open interactive keyboard cheat sheet |

---

## 🎛️ Audio Booster & 5-Band Equalizer

### How to use Audio Effects:
1. Click the **Equalizer / Audio Effects** button in the player control bar (or open Settings).
2. Toggle **Volume Booster** to access up to **200% (+6 dB)** audio amplification.
3. Choose from curated audio presets or manually adjust the 5-band EQ sliders:
   - **Flat**: Neutral frequency response.
   - **Bass Boost**: Enriched low-end frequencies (60Hz & 250Hz) for music and action films.
   - **Vocal / Dialogue**: Boosted 1kHz and 4kHz bands to make soft speech crisp and legible.
   - **Treble Boost**: Elevated 4kHz and 12kHz for heightened clarity and detail.
   - **Rock / Cinematic**: Dynamic V-curve shaping for impactful audio.

---

## 💬 Subtitles & Synchronization Engine

### Supported Subtitle Formats:
- **SubRip (`.srt`)**: Full timestamp and basic formatting support.
- **WebVTT (`.vtt`)**: Native cue alignment, line positioning, and styling.
- **SubStation Alpha (`.ass` / `.ssa`)**: Strips styling tags for clean, synchronized cue rendering.
- **Embedded MKV Tracks**: Extracted on-the-fly during file loading.

### Subtitle Customization:
- **Live Sync Calibration**: Easily fix out-of-sync audio/subtitles by tapping <kbd>[</kbd> or <kbd>]</kbd>.
- **Font & Sizing**: Choose from small (14px) up to extra large (28px).
- **Background Contrast**: Choose between transparent, translucent dark box, or solid high-contrast backgrounds.
- **Custom Color Palettes**: White, Yellow, Green, Cyan, and Amber text styling.

---

## 🔖 Timeline Bookmarks & Chapters

- Press <kbd>B</kbd> while watching to immediately mark a scene.
- Assign **color badges** (Blue, Emerald, Purple, Amber, Rose) to categorize quotes, highlights, or study notes.
- Markers appear directly on the playback seekbar—hovering over a bookmark previews its label and time.
- All bookmarks persist automatically in **IndexedDB** keyed to the video file name or URL.

---

## 📂 Media Library & Persistent History

- **Local Folder Indexing**: Use the **Folder Library** tab to select an entire folder of movies or episodes. The player indexes video metadata (file name, size, last modified) using the **File System Access API** without uploading or copying files.
- **Continue Watching Cards**: Return to any video anytime—the player saves your precise second and completion state.
- **Smart Queueing**: Drag and drop multiple files to create instant playlists with continuous playback and repeat modes.

---

## 🛠️ Developer Guide

### Project Directory Structure

```
cine-media-player/
├── public/                       # Extension icons and static assets
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/                      # Build automation
│   └── build-extension.js        # Multi-target bundler (Chrome & Firefox)
├── src/
│   ├── browser/                  # Universal Browser API Abstraction
│   │   ├── browserAPI.ts         # Unified interface for Chrome/Firefox/Web
│   │   ├── fileSystem.ts         # File System Access API integration
│   │   ├── indexedDB.ts          # History & bookmarks database layer
│   │   ├── runtime.ts            # Messaging bus
│   │   ├── storage.ts            # Cross-platform persistent key-value store
│   │   ├── tabs.ts               # Tab creation & focusing
│   │   └── types.ts              # Global type definitions
│   ├── components/               # Modular UI Components
│   │   ├── AudioEffects/         # EQ modal & audio nodes
│   │   ├── Bookmarks/            # Bookmark list & timeline pins
│   │   ├── Common/               # Modal, Tooltip, Toast, Slider primitives
│   │   ├── EmptyState/           # Landing dropzone & sample loader
│   │   ├── KeyboardShortcuts/    # Shortcut cheat sheet
│   │   ├── Playlist/             # Queue, History, Bookmarks, and Library views
│   │   ├── Settings/             # Subtitle & player preferences
│   │   └── VideoPlayer/          # Video viewport, custom overlay controls
│   ├── extension/                # Browser Extension Specifics
│   │   ├── background/           # Background Service Worker
│   │   ├── content/              # Content Script (Page video detector)
│   │   ├── popup/                # Popup React UI
│   │   ├── manifest.chrome.json  # Chrome MV3 manifest
│   │   └── manifest.firefox.json # Firefox MV2 manifest
│   ├── hooks/                    # React Custom Hooks
│   ├── utils/                    # Parsers (MKV, EBML, Subtitles, Formatters)
│   ├── App.tsx                   # Main Web App
│   └── main.tsx                  # Web Entry Point
├── index.html                    # Web Application HTML Entry
├── player.html                   # Extension Player HTML Entry
├── popup.html                    # Extension Toolbar Popup Entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Available NPM Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on port 3000 |
| `npm run build` | Builds standard web application bundle into `dist/` |
| `npm run build:chrome` | Compiles Chrome MV3 extension into `dist-chrome/` |
| `npm run build:firefox` | Compiles Firefox MV2 extension into `dist-firefox/` |
| `npm run build:all` | Compiles both Chrome and Firefox distributions |
| `npm run lint` | Runs TypeScript compiler (`tsc --noEmit`) to verify types |
| `npm run clean` | Removes all compiled output directories |

---

## ❓ Troubleshooting & FAQ

#### Q: Why doesn't audio play on certain MKV files?
> **Answer**: Some MKV files contain **AC-3**, **E-AC-3 (Dolby Digital Plus)**, or **DTS** audio tracks which browsers cannot decode due to commercial codec licensing. Cine Media Player detects this and displays a one-click lossless `ffmpeg` remux command to convert the audio to AAC in seconds without re-encoding video:
> ```bash
> ffmpeg -i your_movie.mkv -c:v copy -c:a aac output.mp4
> ```

#### Q: How do I load external subtitles?
> **Answer**: Simply drag and drop any `.srt`, `.vtt`, or `.ass` file directly over the playing video, or click the **Subtitles (CC)** button and choose **Upload Subtitle File**.

#### Q: Is my data sent to any servers?
> **Answer**: **No.** Cine Media Player is strictly client-side. Your videos, subtitles, watch history, and bookmarks never leave your computer.

---

## 🔒 Security & Privacy Policy

- **Zero External Telemetry**: No third-party tracking scripts, cookies, or remote analytics are present.
- **Client-Side Sandbox**: All video decoding, Web Audio manipulation, and subtitle parsing occur locally within your browser sandbox.
- **Local Persistence**: Data stored in IndexedDB or `chrome.storage.local` is private to your browser profile.
- **Content Security**: Extension manifests follow strict Content Security Policies (`script-src 'self'`) to protect against cross-site scripting (XSS).

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the repository.
2. Create a descriptive feature branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes (`git commit -m 'Add awesome feature'`).
4. Push to your branch (`git push origin feature/awesome-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.

---

<p align="center">
  Built with ❤️ for cinephiles and developers everywhere.
</p>
