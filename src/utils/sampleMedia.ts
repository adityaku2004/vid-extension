import { PlaylistItem, SubtitleCue } from '../types';

const sampleSubtitlesBigBuckBunny: SubtitleCue[] = [
  { id: 1, startTime: 1, endTime: 4, text: "The forest wakes up to a bright sunny morning." },
  { id: 2, startTime: 4.5, endTime: 8, text: "Big Buck Bunny steps out into the meadow." },
  { id: 3, startTime: 8.5, endTime: 13, text: "Suddenly, three mischievous woodland critters appear!" },
  { id: 4, startTime: 13.5, endTime: 18, text: "Frank the flying squirrel plans a harmless prank." },
  { id: 5, startTime: 18.5, endTime: 24, text: "Bunny admires an apple hanging from the high branch." },
  { id: 6, startTime: 25, endTime: 30, text: "The mischief begins! Prepare for the ultimate forest showdown." },
  { id: 7, startTime: 31, endTime: 36, text: "VLC Extension Player - Crystal Clear 1080p Playback" },
];

const sampleSubtitlesSintel: SubtitleCue[] = [
  { id: 1, startTime: 1, endTime: 4, text: "The lonely girl walks through the treacherous winter snow." },
  { id: 2, startTime: 4.5, endTime: 9, text: "She searches relentlessly for Scales, her lost baby dragon." },
  { id: 3, startTime: 10, endTime: 15, text: "Memories of their time in the valley give her strength." },
  { id: 4, startTime: 16, endTime: 22, text: "A shadow looms over the ancient forgotten ruins." },
  { id: 5, startTime: 23, endTime: 30, text: "The dragon awakens from its centuries-long slumber." },
  { id: 6, startTime: 31, endTime: 38, text: "Will love conquer fear in the heart of the beast?" },
];

const sampleSubtitlesTearsOfSteel: SubtitleCue[] = [
  { id: 1, startTime: 1, endTime: 5, text: "Oude Kerk, Amsterdam - Year 2048." },
  { id: 2, startTime: 5.5, endTime: 10, text: "Thom and his team of rebel scientists set up the time-distortion beacon." },
  { id: 3, startTime: 11, endTime: 16, text: "Celia, half-cybernetic, approaches the perimeter defenses." },
  { id: 4, startTime: 17, endTime: 23, text: "Warning: High energy signatures detected across all sectors!" },
  { id: 5, startTime: 24, endTime: 32, text: "We only get one chance to rewrite history." },
];

export const SAMPLE_VIDEOS: PlaylistItem[] = [
  {
    id: 'sample-bunny',
    title: 'Big Buck Bunny (Blender Open Movie)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596,
    isSample: true,
    dateAdded: Date.now() - 3600000 * 3,
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    metadata: {
      filename: 'BigBuckBunny.mp4',
      resolution: '1920 × 1080',
      duration: 596,
      fileSize: 158334816,
      videoType: 'video/mp4 (H.264 / AAC)',
      framerate: 60,
      codec: 'avc1.640028',
      aspectRatio: '16:9'
    },
    subtitleTracks: [
      {
        id: 'sub-en-bunny',
        label: 'English [Original]',
        language: 'en',
        cues: sampleSubtitlesBigBuckBunny,
        isCustom: false
      },
      {
        id: 'sub-es-bunny',
        label: 'Español [Subtítulos]',
        language: 'es',
        cues: sampleSubtitlesBigBuckBunny.map(c => ({
          ...c,
          text: `[ES] ${c.text}`
        })),
        isCustom: false
      }
    ],
    selectedSubtitleTrackId: 'sub-en-bunny',
    bookmarks: [
      { id: 'bm-bunny-1', videoId: 'sample-bunny', timestamp: 14, label: 'Frank squirrel plans a prank', createdAt: Date.now() - 3600000, color: '#00F0FF' },
      { id: 'bm-bunny-2', videoId: 'sample-bunny', timestamp: 95, label: 'Bunny notices the butterflies', createdAt: Date.now() - 3500000, color: '#FFD700' },
      { id: 'bm-bunny-3', videoId: 'sample-bunny', timestamp: 240, label: 'Forest Showdown begins', createdAt: Date.now() - 3400000, color: '#FF5252' }
    ]
  },
  {
    id: 'sample-sintel',
    title: 'Sintel: The Dragon Quest (Animated Short)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: 888,
    isSample: true,
    dateAdded: Date.now() - 3600000 * 2,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    metadata: {
      filename: 'Sintel.mp4',
      resolution: '1920 × 818',
      duration: 888,
      fileSize: 243269632,
      videoType: 'video/mp4 (H.264 / AAC)',
      framerate: 24,
      codec: 'avc1.4d401f',
      aspectRatio: '2.35:1 (Cinematic)'
    },
    subtitleTracks: [
      {
        id: 'sub-en-sintel',
        label: 'English [Narrative]',
        language: 'en',
        cues: sampleSubtitlesSintel,
        isCustom: false
      }
    ],
    selectedSubtitleTrackId: 'sub-en-sintel',
    bookmarks: [
      { id: 'bm-sintel-1', videoId: 'sample-sintel', timestamp: 65, label: 'Finding the baby dragon', createdAt: Date.now() - 3600000 * 2, color: '#69F0AE' },
      { id: 'bm-sintel-2', videoId: 'sample-sintel', timestamp: 310, label: 'Dragon takes flight', createdAt: Date.now() - 3550000, color: '#00F0FF' }
    ]
  },
  {
    id: 'sample-tears',
    title: 'Tears of Steel (Sci-Fi VFX Short)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734,
    isSample: true,
    dateAdded: Date.now() - 3600000,
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    metadata: {
      filename: 'TearsOfSteel.mp4',
      resolution: '1920 × 800',
      duration: 734,
      fileSize: 198425600,
      videoType: 'video/mp4 (H.264 / AAC)',
      framerate: 24,
      codec: 'avc1.640028',
      aspectRatio: '2.40:1 (Anamorphic)'
    },
    subtitleTracks: [
      {
        id: 'sub-en-tears',
        label: 'English [Closed Captions]',
        language: 'en',
        cues: sampleSubtitlesTearsOfSteel,
        isCustom: false
      }
    ],
    selectedSubtitleTrackId: 'sub-en-tears'
  },
  {
    id: 'sample-elephants',
    title: 'Elephants Dream (4K CGI Film)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 653,
    isSample: true,
    dateAdded: Date.now(),
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    metadata: {
      filename: 'ElephantsDream.mp4',
      resolution: '1920 × 1080',
      duration: 653,
      fileSize: 174063616,
      videoType: 'video/mp4 (H.264 / AC3)',
      framerate: 30,
      codec: 'avc1.42E01E',
      aspectRatio: '16:9'
    },
    subtitleTracks: [
      {
        id: 'sub-en-elephants',
        label: 'English [Dialogue]',
        language: 'en',
        cues: [
          { id: 1, startTime: 1, endTime: 6, text: "Welcome to the machine of infinite possibilities." },
          { id: 2, startTime: 7, endTime: 13, text: "Proog: Watch your step, Emo. The wires have ears." },
          { id: 3, startTime: 14, endTime: 20, text: "Emo: Is any of this real, or just another projection?" },
          { id: 4, startTime: 21, endTime: 28, text: "The central core hums with electrical energy." }
        ],
        isCustom: false
      }
    ],
    selectedSubtitleTrackId: 'sub-en-elephants'
  },
  {
    id: 'sample-cosmos-mkv',
    title: 'Cosmos Laundromat (Matroska MKV Feature)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 720,
    isSample: true,
    dateAdded: Date.now(),
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    metadata: {
      filename: 'CosmosLaundromat.FirstCycle.1080p.mkv',
      resolution: '1920 × 1080',
      duration: 720,
      fileSize: 318767104,
      videoType: 'video/x-matroska (H.264 / FLAC / Embedded Subtitles)',
      framerate: 24,
      codec: 'V_MPEG4/ISO/AVC (MKV Container)',
      aspectRatio: '16:9'
    },
    subtitleTracks: [
      {
        id: 'sub-mkv-en',
        label: 'English [MKV Embedded Track 1]',
        language: 'en',
        cues: [
          { id: 1, startTime: 1, endTime: 5, text: "On a desolate, windswept island in the middle of nowhere..." },
          { id: 2, startTime: 5.5, endTime: 10, text: "Franck the sheep is on the brink of ending it all." },
          { id: 3, startTime: 10.5, endTime: 16, text: "Victor: Wait! Before you jump, would you like a second chance?" },
          { id: 4, startTime: 16.5, endTime: 22, text: "Victor offers Franck a mystical timer that resets reality." },
          { id: 5, startTime: 23, endTime: 30, text: "Enter the cosmic laundromat of infinite dimensions." }
        ],
        isCustom: false
      },
      {
        id: 'sub-mkv-jp',
        label: '日本語 Japanese [MKV Embedded Track 2 - ASS]',
        language: 'ja',
        cues: [
          { id: 1, startTime: 1, endTime: 5, text: "【日本語】荒涼とした孤島で、一頭の羊が佇んでいた..." },
          { id: 2, startTime: 5.5, endTime: 10, text: "フランクは全てを諦めようとしていた。" },
          { id: 3, startTime: 10.5, endTime: 16, text: "ビクター：待て！飛び降りる前に、もう一度チャンスを試さないか？" },
          { id: 4, startTime: 16.5, endTime: 22, text: "現実をリセットする神秘のタイマーが手渡される。" },
          { id: 5, startTime: 23, endTime: 30, text: "無限の次元へと繋がる宇宙のコインランドリーへようこそ。" }
        ],
        isCustom: false
      },
      {
        id: 'sub-mkv-es',
        label: 'Español [MKV Embedded Track 3]',
        language: 'es',
        cues: [
          { id: 1, startTime: 1, endTime: 5, text: "En una isla desolada y azotada por el viento..." },
          { id: 2, startTime: 5.5, endTime: 10, text: "Franck la oveja está al borde del abismo." },
          { id: 3, startTime: 10.5, endTime: 16, text: "Víctor: ¡Espera! ¿Te gustaría una segunda oportunidad?" },
          { id: 4, startTime: 16.5, endTime: 22, text: "Víctor le ofrece un cronómetro cósmico que reinicia la realidad." }
        ],
        isCustom: false
      }
    ],
    selectedSubtitleTrackId: 'sub-mkv-en'
  }
];
