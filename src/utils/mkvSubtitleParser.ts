import { SubtitleCue, SubtitleTrack } from '../types';
import { generateId } from './fileHelpers';
import { parseASS, cleanAssText } from './assParser';

// Language code to human friendly language name
const LANGUAGE_NAMES: Record<string, string> = {
  eng: 'English',
  en: 'English',
  jpn: 'Japanese',
  ja: 'Japanese',
  spa: 'Spanish',
  es: 'Spanish',
  fre: 'French',
  fra: 'French',
  fr: 'French',
  ger: 'German',
  deu: 'German',
  de: 'German',
  ita: 'Italian',
  it: 'Italian',
  por: 'Portuguese',
  pt: 'Portuguese',
  rus: 'Russian',
  ru: 'Russian',
  chi: 'Chinese',
  zho: 'Chinese',
  zh: 'Chinese',
  kor: 'Korean',
  ko: 'Korean',
  ara: 'Arabic',
  ar: 'Arabic',
  hin: 'Hindi',
  hi: 'Hindi',
  vie: 'Vietnamese',
  vi: 'Vietnamese',
  tha: 'Thai',
  th: 'Thai',
  pol: 'Polish',
  pl: 'Polish',
  dut: 'Dutch',
  nld: 'Dutch',
  nl: 'Dutch',
  swe: 'Swedish',
  sv: 'Swedish',
  nor: 'Norwegian',
  no: 'Norwegian',
  dan: 'Danish',
  da: 'Danish',
  fin: 'Finnish',
  fi: 'Finnish',
  tur: 'Turkish',
  tr: 'Turkish',
  und: 'Undetermined'
};

interface MkvInternalTrack {
  trackNumber: number;
  trackUID?: number;
  trackType: number;
  codecId: string;
  name?: string;
  language?: string;
  codecPrivate?: Uint8Array;
  cues: SubtitleCue[];
}

/**
 * Reads variable length integer (VINT) for EBML Element ID
 */
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

/**
 * Reads variable length integer (VINT) for Data Size
 */
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

/**
 * Reads Big Endian unsigned integer from bytes
 */
function readUint(data: Uint8Array, offset: number, length: number): number {
  let val = 0;
  for (let i = 0; i < length; i++) {
    val = (val * 256) + data[offset + i];
  }
  return val;
}

/**
 * Reads UTF-8 string from bytes
 */
function readUtf8(data: Uint8Array, offset: number, length: number): string {
  const slice = data.subarray(offset, offset + length);
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(slice).replace(/\0/g, '').trim();
}

/**
 * Checks if a file is an MKV (Matroska) container by inspecting its EBML header
 */
export async function isMkvContainer(file: File | Blob): Promise<boolean> {
  if ('name' in file && typeof file.name === 'string' && file.name.toLowerCase().endsWith('.mkv')) {
    return true;
  }
  try {
    const headerSlice = await file.slice(0, 32).arrayBuffer();
    const data = new Uint8Array(headerSlice);
    // Matroska EBML header starts with 0x1A 0x45 0xDF 0xA3
    if (data.length >= 4 && data[0] === 0x1A && data[1] === 0x45 && data[2] === 0xDF && data[3] === 0xA3) {
      return true;
    }
  } catch (e) {
    console.warn('Error testing MKV header:', e);
  }
  return false;
}

/**
 * Extracts all embedded subtitle tracks from an MKV file directly in the browser
 */
export async function extractMkvSubtitles(file: File | Blob): Promise<SubtitleTrack[]> {
  try {
    // Read up to first 64MB or entire file if smaller to discover tracks and initial subtitles
    const MAX_PARSE_SIZE = Math.min(file.size, 128 * 1024 * 1024);
    const arrayBuffer = await file.slice(0, MAX_PARSE_SIZE).arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    let offset = 0;
    let timecodeScale = 1000000; // default 1,000,000 ns = 1 ms
    const subtitleTracksMap = new Map<number, MkvInternalTrack>();

    // Scan EBML Elements
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

      // 0x18538067 = Segment (Container)
      if (elemId === 0x18538067) {
        continue;
      }

      // 0x1549A966 = Info (Container)
      if (elemId === 0x1549A966) {
        let infoOffset = offset;
        while (infoOffset < elemEnd && infoOffset < data.length - 4) {
          const childId = readElementId(data, infoOffset);
          if (!childId) break;
          infoOffset += childId.length;
          const childSize = readDataSize(data, infoOffset);
          if (!childSize) break;
          infoOffset += childSize.length;

          // 0x2AD7B1 = TimecodeScale
          if (childId.id === 0x2AD7B1) {
            timecodeScale = readUint(data, infoOffset, childSize.size);
          }
          infoOffset += childSize.size;
        }
        offset = elemEnd;
        continue;
      }

      // 0x1654AE6B = Tracks (Container)
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

            let trackNumber = 0;
            let trackUID: number | undefined;
            let trackType = 0;
            let codecId = '';
            let trackName: string | undefined;
            let language: string | undefined;
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
                trackNumber = readUint(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x73C5) {
                // TrackUID
                trackUID = readUint(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x83) {
                // TrackType (0x11 = 17 is Subtitle)
                trackType = readUint(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x86) {
                // CodecID
                codecId = readUtf8(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x536E) {
                // Track Name
                trackName = readUtf8(data, entryOffset, fieldSize.size);
              } else if (fieldId.id === 0x22B59C || fieldId.id === 0x22B59D) {
                // Language or LanguageIETF
                const lang = readUtf8(data, entryOffset, fieldSize.size).toLowerCase();
                if (lang) language = lang;
              } else if (fieldId.id === 0x63A2) {
                // CodecPrivate
                codecPrivate = data.slice(entryOffset, entryOffset + fieldSize.size);
              }

              entryOffset += fieldSize.size;
            }

            // If this is a subtitle track (17 or 0x11)
            if (trackType === 17 || trackType === 0x11 || codecId.startsWith('S_TEXT') || codecId.startsWith('S_SSA') || codecId.startsWith('S_ASS')) {
              subtitleTracksMap.set(trackNumber, {
                trackNumber,
                trackUID,
                trackType,
                codecId: codecId || 'S_TEXT/UTF8',
                name: trackName,
                language: language || 'und',
                codecPrivate,
                cues: []
              });
            }
          }

          tracksOffset += trackEntrySize.size;
        }
        offset = elemEnd;
        continue;
      }

      // 0x1F43B675 = Cluster (Container)
      if (elemId === 0x1F43B675 && subtitleTracksMap.size > 0) {
        let clusterOffset = offset;
        let clusterTimecode = 0;

        while (clusterOffset < elemEnd && clusterOffset < data.length - 4) {
          const clusterChildId = readElementId(data, clusterOffset);
          if (!clusterChildId) break;
          clusterOffset += clusterChildId.length;
          const clusterChildSize = readDataSize(data, clusterOffset);
          if (!clusterChildSize) break;
          clusterOffset += clusterChildSize.length;

          const blockEnd = clusterOffset + clusterChildSize.size;

          // 0xE7 = Cluster Timecode
          if (clusterChildId.id === 0xE7) {
            clusterTimecode = readUint(data, clusterOffset, clusterChildSize.size);
          }
          // 0xA0 = BlockGroup
          else if (clusterChildId.id === 0xA0) {
            let bgOffset = clusterOffset;
            let blockTrackNum = 0;
            let blockRelTimecode = 0;
            let blockDataOffset = 0;
            let blockDataLength = 0;
            let blockDuration: number | undefined;

            while (bgOffset < blockEnd && bgOffset < data.length - 4) {
              const bgChildId = readElementId(data, bgOffset);
              if (!bgChildId) break;
              bgOffset += bgChildId.length;
              const bgChildSize = readDataSize(data, bgOffset);
              if (!bgChildSize) break;
              bgOffset += bgChildSize.length;

              // 0x9B = BlockDuration
              if (bgChildId.id === 0x9B) {
                blockDuration = readUint(data, bgOffset, bgChildSize.size);
              }
              // 0xA1 = Block
              else if (bgChildId.id === 0xA1) {
                const trackNumVint = readDataSize(data, bgOffset);
                if (trackNumVint) {
                  blockTrackNum = trackNumVint.size;
                  const timecodeOffset = bgOffset + trackNumVint.length;
                  // 16-bit signed integer for relative timecode
                  const rawTime = (data[timecodeOffset] << 8) | data[timecodeOffset + 1];
                  blockRelTimecode = rawTime > 0x7fff ? rawTime - 0x10000 : rawTime;

                  // 1 byte flags
                  const headerLen = trackNumVint.length + 2 + 1;
                  blockDataOffset = bgOffset + headerLen;
                  blockDataLength = bgChildSize.size - headerLen;
                }
              }

              bgOffset += bgChildSize.size;
            }

            const targetTrack = subtitleTracksMap.get(blockTrackNum);
            if (targetTrack && blockDataLength > 0) {
              const rawText = readUtf8(data, blockDataOffset, blockDataLength);
              const startSec = ((clusterTimecode + blockRelTimecode) * timecodeScale) / 1e9;
              const durationSec = blockDuration !== undefined
                ? (blockDuration * timecodeScale) / 1e9
                : 3.5;
              const endSec = startSec + Math.max(0.5, durationSec);

              const cleanText = targetTrack.codecId.includes('ASS') || targetTrack.codecId.includes('SSA')
                ? cleanAssText(rawText)
                : rawText.replace(/<[^>]*>/g, '').trim();

              if (cleanText) {
                targetTrack.cues.push({
                  id: targetTrack.cues.length + 1,
                  startTime: Math.max(0, startSec),
                  endTime: Math.max(startSec + 0.5, endSec),
                  text: cleanText
                });
              }
            }
          }
          // 0xA3 = SimpleBlock
          else if (clusterChildId.id === 0xA3) {
            const trackNumVint = readDataSize(data, clusterOffset);
            if (trackNumVint) {
              const blockTrackNum = trackNumVint.size;
              const targetTrack = subtitleTracksMap.get(blockTrackNum);

              if (targetTrack) {
                const timecodeOffset = clusterOffset + trackNumVint.length;
                const rawTime = (data[timecodeOffset] << 8) | data[timecodeOffset + 1];
                const blockRelTimecode = rawTime > 0x7fff ? rawTime - 0x10000 : rawTime;
                const headerLen = trackNumVint.length + 2 + 1;
                const blockDataOffset = clusterOffset + headerLen;
                const blockDataLength = clusterChildSize.size - headerLen;

                if (blockDataLength > 0) {
                  const rawText = readUtf8(data, blockDataOffset, blockDataLength);
                  const startSec = ((clusterTimecode + blockRelTimecode) * timecodeScale) / 1e9;
                  const endSec = startSec + 4.0;

                  const cleanText = targetTrack.codecId.includes('ASS') || targetTrack.codecId.includes('SSA')
                    ? cleanAssText(rawText)
                    : rawText.replace(/<[^>]*>/g, '').trim();

                  if (cleanText) {
                    targetTrack.cues.push({
                      id: targetTrack.cues.length + 1,
                      startTime: Math.max(0, startSec),
                      endTime: endSec,
                      text: cleanText
                    });
                  }
                }
              }
            }
          }

          clusterOffset = blockEnd;
        }

        offset = elemEnd;
        continue;
      }

      // Skip other elements
      offset = elemEnd;
    }

    // Convert internal tracks to final SubtitleTrack[]
    const results: SubtitleTrack[] = [];
    let trackIndex = 1;

    for (const [, track] of subtitleTracksMap) {
      // If the track is ASS/SSA and has CodecPrivate headers, we can also extract any cues from header if defined
      if (track.codecPrivate && (track.codecId.includes('ASS') || track.codecId.includes('SSA'))) {
        try {
          const headerText = new TextDecoder('utf-8').decode(track.codecPrivate);
          const parsedHeaderCues = parseASS(headerText);
          if (parsedHeaderCues.length > 0 && track.cues.length === 0) {
            track.cues = parsedHeaderCues;
          }
        } catch (e) {
          console.warn('Error reading ASS codec private header:', e);
        }
      }

      const langCode = track.language || 'und';
      const langName = LANGUAGE_NAMES[langCode] || langCode.toUpperCase();
      const title = track.name
        ? `${track.name} [MKV Embedded]`
        : `${langName} (Track ${trackIndex}) [MKV Embedded]`;

      results.push({
        id: `mkv-sub-${track.trackNumber}-${generateId()}`,
        label: title,
        language: langCode,
        isCustom: false,
        cues: track.cues.sort((a, b) => a.startTime - b.startTime)
      });

      trackIndex++;
    }

    return results;
  } catch (error) {
    console.warn('MKV subtitle extraction error:', error);
    return [];
  }
}
