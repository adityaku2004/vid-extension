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
    selectedSubtitleTrackId: 'sub-en-bunny'
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
    selectedSubtitleTrackId: 'sub-en-sintel'
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
  }
];
