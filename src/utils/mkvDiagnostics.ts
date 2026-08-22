import { SubtitleTrack, SubtitleCue } from '../types';
import { generateId } from './fileHelpers';
import { parseASS, cleanAssText } from './assParser';

export interface MkvTrackDetails {
  trackNumber: number;
  trackUID?: number;
  trackType: number; // 1 = Video, 2 = Audio, 17 = Subtitle
  codecId: string;
  name?: string;
  language?: string;
  // Video-specific
  pixelWidth?: number;
  pixelHeight?: number;
  displayWidth?: number;
  displayHeight?: number;
  bitsPerChannel?: number;
  frameRate?: number;
  // Audio-specific
  channels?: number;
  samplingFrequency?: number;
  bitDepth?: number;
}

export interface MkvDiagnosis {
  isMkv: boolean;
  hasVideoTrack: boolean;
  hasAudioTrack: boolean;
  videoTrack: MkvTrackDetails | null;
  audioTrack: MkvTrackDetails | null;
  subtitleTracks: SubtitleTrack[];
  videoCodecName: string;
  audioCodecName: string;
  isBrowserCompatibleVideo: boolean;
  isAudioOnlyPlayable: boolean;
  issueDescription: string | null;
  solutionSummary: string | null;
  recommendedFfmpegCommand: string;
  losslessRemuxCommand: string;
}

// Friendly Codec Names
const VIDEO_CODEC_NAMES: Record<string, { name: string; compatible: boolean; notes: string }> = {
  'V_MPEG4/ISO/AVC': {
    name: 'H.264 / AVC (Advanced Video Coding)',
    compatible: true,
    notes: 'Universally supported by all modern browsers (8-bit profile).'
  },
  'V_VP8': {
    name: 'VP8',
    compatible: true,
    notes: 'Natively supported in Chrome, Firefox, and Edge.'
  },
  'V_VP9': {
    name: 'VP9',
    compatible: true,
    notes: 'Natively supported in Chrome, Firefox, and Edge.'
  },
  'V_AV1': {
    name: 'AV1 (AOMedia Video 1)',
    compatible: true,
    notes: 'Natively supported in modern browsers with AV1 decoders.'
  },
  'V_MPEGH/ISO/HEVC': {
    name: 'HEVC / H.265 (High Efficiency Video Coding)',
    compatible: false,
    notes: 'Frequently causes black video / audio-only playback in browsers without OS hardware HEVC codecs.'
  },
  'V_MPEG2': {
    name: 'MPEG-2 Video (DVD/Broadcast standard)',
    compatible: false,
    notes: 'Not supported by browser HTML5 video decoders. Audio plays while video remains blank.'
  },
  'V_MPEG1': {
    name: 'MPEG-1 Video',
    compatible: false,
    notes: 'Not supported in HTML5 browser engines.'
  },
  'V_MS/VFW/FOURCC': {
    name: 'MPEG-4 Part 2 / XviD / DivX / VC-1',
    compatible: false,
    notes: 'Legacy video codec not decoded by standard browser engines.'
  },
  'V_THEORA': {
    name: 'Ogg Theora',
    compatible: true,
    notes: 'Supported in Firefox / Chromium.'
  },
  'V_REAL/RV40': {
    name: 'RealVideo 4.0',
    compatible: false,
    notes: 'Proprietary format not supported by browser.'
  }
};

const AUDIO_CODEC_NAMES: Record<string, { name: string; compatible: boolean }> = {
  'A_AAC': { name: 'AAC (Advanced Audio Coding)', compatible: true },
  'A_AAC/MPEG2/LC': { name: 'AAC-LC', compatible: true },
  'A_AAC/MPEG4/LC': { name: 'AAC-LC', compatible: true },
  'A_MPEG/L3': { name: 'MP3 (MPEG Layer 3)', compatible: true },
  'A_OPUS': { name: 'Opus Interactive Audio', compatible: true },
  'A_VORBIS': { name: 'Ogg Vorbis', compatible: true },
  'A_FLAC': { name: 'FLAC (Free Lossless Audio Codec)', compatible: true },
  'A_AC3': { name: 'Dolby Digital AC-3', compatible: true },
  'A_EAC3': { name: 'Dolby Digital Plus (E-AC-3)', compatible: true },
  'A_PCM/INT/LIT': { name: 'PCM Uncompressed Audio', compatible: true },
  'A_DTS': { name: 'DTS Digital Surround', compatible: false }
};

const LANGUAGE_NAMES: Record<string, string> = {
  eng: 'English', en: 'English', jpn: 'Japanese', ja: 'Japanese',
  spa: 'Spanish', es: 'Spanish', fre: 'French', fra: 'French', fr: 'French',
  ger: 'German', deu: 'German', de: 'German', ita: 'Italian', it: 'Italian',
  por: 'Portuguese', pt: 'Portuguese', rus: 'Russian', ru: 'Russian',
  chi: 'Chinese', zho: 'Chinese', zh: 'Chinese', kor: 'Korean', ko: 'Korean',
  ara: 'Arabic', ar: 'Arabic', hin: 'Hindi', hi: 'Hindi', vie: 'Vietnamese',
  vi: 'Vietnamese', tha: 'Thai', th: 'Thai', pol: 'Polish', pl: 'Polish',
  dut: 'Dutch', nld: 'Dutch', nl: 'Dutch', swe: 'Swedish', sv: 'Swedish',
  und: 'Undetermined'
};

function readElementId(data: Uint8Array, offset: number): { id: number; length: number } | null {
  if (offset >= data.length) return null;
  const firstByte = data[offset];
  if (firstByte === 0) return null;

  let length = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && length <= 4) {
    mask >>= 1;
    length++;
  }

  if (offset + length > data.length) return null;

  let id = 0;
  for (let i = 0; i < length; i++) {
    id = (id << 8) | data[offset + i];
  }

  return { id: id >>> 0, length };
}

function readDataSize(data: Uint8Array, offset: number): { size: number; length: number } | null {
  if (offset >= data.length) return null;
  const firstByte = data[offset];
  if (firstByte === 0) return null;

  let length = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && length <= 8) {
    mask >>= 1;
    length++;
  }

  if (offset + length > data.length) return null;

  let size = firstByte & (mask - 1);
  for (let i = 1; i < length; i++) {
    size = size * 256 + data[offset + i];
  }

  return { size, length };
}

function readUint(data: Uint8Array, offset: number, length: number): number {
  let val = 0;
  for (let i = 0; i < length; i++) {
    val = (val * 256) + data[offset + i];
  }
  return val;
}

function readFloat(data: Uint8Array, offset: number, length: number): number {
  if (length === 4) {
    const view = new DataView(data.buffer, data.byteOffset + offset, 4);
    return view.getFloat32(0, false);
  }
  if (length === 8) {
    const view = new DataView(data.buffer, data.byteOffset + offset, 8);
    return view.getFloat64(0, false);
  }
  return 0;
}

function readUtf8(data: Uint8Array, offset: number, length: number): string {
  const slice = data.subarray(offset, offset + length);
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(slice).replace(/\0/g, '').trim();
}

/**
 * Parses and diagnoses an MKV file for video/audio codec compatibility and embedded subtitles.
 */
export async function inspectAndDiagnoseMkv(file: File | Blob, filename: string = 'media.mkv'): Promise<MkvDiagnosis> {
  const defaultDiagnosis: MkvDiagnosis = {
    isMkv: false,
    hasVideoTrack: true,
    hasAudioTrack: true,
    videoTrack: null,
    audioTrack: null,
    subtitleTracks: [],
    videoCodecName: 'Standard Video',
    audioCodecName: 'Standard Audio',
    isBrowserCompatibleVideo: true,
    isAudioOnlyPlayable: false,
    issueDescription: null,
    solutionSummary: null,
    recommendedFfmpegCommand: `ffmpeg -i "${filename}" -c:v libx264 -c:a copy "${filename.replace(/\.[^/.]+$/, '')}_h264.mp4"`,
    losslessRemuxCommand: `ffmpeg -i "${filename}" -c copy "${filename.replace(/\.[^/.]+$/, '')}.mp4"`
  };

  try {
    const MAX_HEADER_SIZE = Math.min(file.size, 16 * 1024 * 1024); // 16MB is enough for Tracks header
    const arrayBuffer = await file.slice(0, MAX_HEADER_SIZE).arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Check EBML signature 0x1A45DFA3
    if (data.length < 4 || data[0] !== 0x1A || data[1] !== 0x45 || data[2] !== 0xDF || data[3] !== 0xA3) {
      return defaultDiagnosis;
    }

    let offset = 0;
    const tracks: MkvTrackDetails[] = [];
    const subtitleTracksMap = new Map<number, { track: MkvTrackDetails; cues: SubtitleCue[]; codecPrivate?: Uint8Array }>();

    while (offset < data.length - 8) {
      const elemIdInfo = readElementId(data, offset);
      if (!elemIdInfo) {
        offset++;
        continue;
      }
      offset += elemIdInfo.length;

      const sizeInfo = readDataSize(data, offset);
      if (!sizeInfo) {
        offset++;
        continue;
      }
      offset += sizeInfo.length;

      const elemId = elemIdInfo.id;
      const elemSize = sizeInfo.size;
      const elemEnd = offset + elemSize;

      // 0x18538067 = Segment
      if (elemId === 0x18538067) {
        continue;
      }

      // 0x1654AE6B = Tracks
      if (elemId === 0x1654AE6B) {
        let tracksOffset = offset;
        while (tracksOffset < elemEnd && tracksOffset < data.length - 4) {
          const trackEntryId = readElementId(data, tracksOffset);
          if (!trackEntryId) break;
          tracksOffset += trackEntryId.length;
          const trackEntrySize = readDataSize(data, tracksOffset);
          if (!trackEntrySize) break;
          tracksOffset += trackEntrySize.length;

          // 0xAE = TrackEntry
          if (trackEntryId.id === 0xAE) {
            let entryOffset = tracksOffset;
            const entryEnd = tracksOffset + trackEntrySize.size;

            const currentTrack: MkvTrackDetails = {
              trackNumber: 0,
              trackType: 0,
              codecId: ''
            };
            let codecPrivate: Uint8Array | undefined;

            while (entryOffset < entryEnd && entryOffset < data.length - 4) {
              const fieldId = readElementId(data, entryOffset);
              if (!fieldId) break;
              entryOffset += fieldId.length;
              const fieldSize = readDataSize(data, entryOffset);
              if (!fieldSize) break;
              entryOffset += fieldSize.length;

              if (fieldId.id === 0xD7) {
                // TrackNumber
                currentTrack.trackNumber = readUint(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x73C5) {
                // TrackUID
                currentTrack.trackUID = readUint(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x83) {
                // TrackType (1=Video, 2=Audio, 17=Subtitle)
                currentTrack.trackType = readUint(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x86) {
                // CodecID
                currentTrack.codecId = readUtf8(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x536E) {
                // Track Name
                currentTrack.name = readUtf8(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x22B59C || fieldId.id === 0x22B59D) {
                // Language
                currentTrack.language = readUtf8(data, entryOffset, fieldSize.size).toLowerCase();
              } else if (fieldId.id === 0x63A2) {
                // CodecPrivate
                codecPrivate = data.slice(entryOffset, entryOffset + fieldSize.size);
              } else if (fieldId.id === 0xE0) {
                // Video Settings
                let vOffset = entryOffset;
                const vEnd = entryOffset + fieldSize.size;
                while (vOffset < vEnd && vOffset < data.length - 4) {
                  const vField = readElementId(data, vOffset);
                  if (!vField) break;
                  vOffset += vField.length;
                  const vSize = readDataSize(data, vOffset);
                  if (!vSize) break;
                  vOffset += vSize.length;

                  if (vField.id === 0xB0) {
                    currentTrack.pixelWidth = readUint(data, vOffset, vSize.size);
                  } else if (vField.id === 0xBA) {
                    currentTrack.pixelHeight = readUint(data, vOffset, vSize.size);
                  } else if (vField.id === 0x54B0) {
                    currentTrack.displayWidth = readUint(data, vOffset, vSize.size);
                  } else if (vField.id === 0x54BA) {
                    currentTrack.displayHeight = readUint(data, vOffset, vSize.size);
                  } else if (vField.id === 0x2383E3) {
                    currentTrack.frameRate = readFloat(data, vOffset, vSize.size);
                  } else if (vField.id === 0x55B0) {
                    // Colour element
                    let cOffset = vOffset;
                    const cEnd = vOffset + vSize.size;
                    while (cOffset < cEnd && cOffset < data.length - 2) {
                      const cField = readElementId(data, cOffset);
                      if (!cField) break;
                      cOffset += cField.length;
                      const cSize = readDataSize(data, cOffset);
                      if (!cSize) break;
                      cOffset += cSize.length;
                      if (cField.id === 0x55B7) {
                        currentTrack.bitsPerChannel = readUint(data, cOffset, cSize.size);
                      }
                      cOffset += cSize.size;
                    }
                  }
                  vOffset += vSize.size;
                }
              } else if (fieldId.id === 0xE1) {
                // Audio Settings
                let aOffset = entryOffset;
                const aEnd = entryOffset + fieldSize.size;
                while (aOffset < aEnd && aOffset < data.length - 4) {
                  const aField = readElementId(data, aOffset);
                  if (!aField) break;
                  aOffset += aField.length;
                  const aSize = readDataSize(data, aOffset);
                  if (!aSize) break;
                  aOffset += aSize.length;

                  if (aField.id === 0x9F) {
                    currentTrack.channels = readUint(data, aOffset, aSize.size);
                  } else if (aField.id === 0xB5) {
                    currentTrack.samplingFrequency = readFloat(data, aOffset, aSize.size);
                  } else if (aField.id === 0x6264) {
                    currentTrack.bitDepth = readUint(data, aOffset, aSize.size);
                  }
                  aOffset += aSize.size;
                }
              }

              entryOffset += fieldSize.size;
            }

            tracks.push(currentTrack);

            if (currentTrack.trackType === 17 || currentTrack.codecId.startsWith('S_TEXT') || currentTrack.codecId.startsWith('S_SSA') || currentTrack.codecId.startsWith('S_ASS')) {
              subtitleTracksMap.set(currentTrack.trackNumber, {
                track: currentTrack,
                cues: [],
                codecPrivate
              });
            }
          }

          tracksOffset += trackEntrySize.size;
        }

        // We found Tracks header, break out of element loop
        break;
      }

      offset = elemEnd;
    }

    // Classify tracks
    const videoTrack = tracks.find((t) => t.trackType === 1 || t.codecId.startsWith('V_')) || null;
    const audioTrack = tracks.find((t) => t.trackType === 2 || t.codecId.startsWith('A_')) || null;

    const vCodecEntry = videoTrack ? VIDEO_CODEC_NAMES[videoTrack.codecId] : null;
    const aCodecEntry = audioTrack ? AUDIO_CODEC_NAMES[audioTrack.codecId] : null;

    const videoCodecName = vCodecEntry?.name || videoTrack?.codecId || 'Unknown Video Codec';
    const audioCodecName = aCodecEntry?.name || audioTrack?.codecId || 'Unknown Audio Codec';

    // Determine browser video compatibility
    let isBrowserCompatibleVideo = true;
    let issueDescription: string | null = null;
    let solutionSummary: string | null = null;

    if (!videoTrack) {
      isBrowserCompatibleVideo = false;
      issueDescription = 'This MKV file is an audio-only container (no video stream found).';
      solutionSummary = 'Cine Media is running in High-Fidelity Audio Mode with real-time spectrum visualization.';
    } else if (vCodecEntry && !vCodecEntry.compatible) {
      isBrowserCompatibleVideo = false;
      issueDescription = `Video is encoded with ${videoCodecName}. HTML5 browser video engines cannot decode this format natively without hardware decoding, but the audio stream (${audioCodecName}) is fully decoded.`;
      solutionSummary = `You can convert the video stream to H.264 in under 10 seconds without re-encoding audio using FFmpeg, or enable HEVC decoding in your browser.`;
    } else if (videoTrack.bitsPerChannel && videoTrack.bitsPerChannel > 8 && videoTrack.codecId.includes('AVC')) {
      isBrowserCompatibleVideo = false;
      issueDescription = `Video is encoded in 10-bit Hi10P H.264 profile (${videoTrack.bitsPerChannel}-bit), which standard browser hardware pipelines cannot render directly.`;
      solutionSummary = `Remux or transcode to 8-bit H.264 or use Cine Media's audio visualizer playback.`;
    }

    const isAudioOnlyPlayable = !isBrowserCompatibleVideo && (audioTrack !== null || aCodecEntry?.compatible === true);

    // Build subtitle tracks list
    const subtitleTracks: SubtitleTrack[] = [];
    let subIdx = 1;
    for (const [, item] of subtitleTracksMap) {
      const lang = item.track.language || 'und';
      const langLabel = LANGUAGE_NAMES[lang] || lang.toUpperCase();
      const trackName = item.track.name
        ? `${item.track.name} [MKV Embedded]`
        : `${langLabel} (Track ${subIdx}) [MKV Embedded]`;

      subtitleTracks.push({
        id: `mkv-sub-${item.track.trackNumber}-${generateId()}`,
        label: trackName,
        language: lang,
        isCustom: false,
        cues: []
      });
      subIdx++;
    }

    const safeBaseName = filename.replace(/\.[^/.]+$/, '');
    const recommendedFfmpegCommand = `ffmpeg -i "${filename}" -c:v libx264 -crf 18 -preset fast -c:a copy "${safeBaseName}_converted.mp4"`;
    const losslessRemuxCommand = `ffmpeg -i "${filename}" -c copy "${safeBaseName}_remuxed.mp4"`;

    return {
      isMkv: true,
      hasVideoTrack: videoTrack !== null,
      hasAudioTrack: audioTrack !== null,
      videoTrack,
      audioTrack,
      subtitleTracks,
      videoCodecName,
      audioCodecName,
      isBrowserCompatibleVideo,
      isAudioOnlyPlayable,
      issueDescription,
      solutionSummary,
      recommendedFfmpegCommand,
      losslessRemuxCommand
    };
  } catch (err) {
    console.warn('Error inspecting MKV container:', err);
    return defaultDiagnosis;
  }
}
