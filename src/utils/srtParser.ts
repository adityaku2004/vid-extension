import { SubtitleCue } from '../types';

/**
 * Converts SRT timestamp string (00:00:20,000) to seconds
 */
function srtTimeToSeconds(timeString: string): number {
  const match = timeString.trim().match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const ms = parseInt(match[4].padEnd(3, '0').slice(0, 3), 10);

  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
}

/**
 * Strips or cleans unwanted tags from subtitles for safety
 */
function cleanSubtitleText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/\{[^}]*\}/g, '') // remove ASS style tags
    .trim();
}

/**
 * Parses raw SRT string into array of SubtitleCue
 */
export function parseSRT(srtContent: string): SubtitleCue[] {
  if (!srtContent) return [];

  // Normalize line breaks
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n');
    if (lines.length < 2) continue;

    let timeLineIndex = 0;
    // Check if line 0 is a number (sequence counter) or the timestamp directly
    if (!lines[0].includes('-->') && lines.length > 1 && lines[1].includes('-->')) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->');
    if (!startStr || !endStr) continue;

    const startTime = srtTimeToSeconds(startStr);
    const endTime = srtTimeToSeconds(endStr);
    const textLines = lines.slice(timeLineIndex + 1);
    const text = cleanSubtitleText(textLines.join('\n'));

    if (text && endTime > startTime) {
      cues.push({
        id: cues.length + 1,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues;
}

/**
 * Converts SubtitleCue[] into standard WebVTT string
 */
export function cuesToWebVTT(cues: SubtitleCue[]): string {
  let vtt = 'WEBVTT\n\n';

  const formatVTTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  };

  cues.forEach((cue, index) => {
    vtt += `${index + 1}\n`;
    vtt += `${formatVTTTime(cue.startTime)} --> ${formatVTTTime(cue.endTime)}\n`;
    vtt += `${cue.text}\n\n`;
  });

  return vtt;
}

/**
 * Creates an object URL for a WebVTT track from SubtitleCue[]
 */
export function createVttBlobUrl(cues: SubtitleCue[]): string {
  const vttText = cuesToWebVTT(cues);
  const blob = new Blob([vttText], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}
