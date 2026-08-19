import { SubtitleCue } from '../types';

/**
 * Parses VTT timestamp (00:01:20.500 or 01:20.500) to seconds
 */
function vttTimeToSeconds(timeString: string): number {
  const clean = timeString.trim().split(' ')[0]; // remove positioning metadata like align:center
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2].replace(',', '.'));
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1].replace(',', '.'));
    return minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Parses raw WebVTT string into array of SubtitleCue
 */
export function parseVTT(vttContent: string): SubtitleCue[] {
  if (!vttContent) return [];

  const normalized = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const cues: SubtitleCue[] = [];

  let i = 0;
  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->');
      const startTime = vttTimeToSeconds(startStr);
      const endTime = vttTimeToSeconds(endStr);

      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip tags
        const cleaned = lines[i].replace(/<[^>]*>/g, '').trim();
        if (cleaned) textLines.push(cleaned);
        i++;
      }

      if (textLines.length > 0 && endTime > startTime) {
        cues.push({
          id: cues.length + 1,
          startTime,
          endTime,
          text: textLines.join('\n'),
        });
      }
    } else {
      i++;
    }
  }

  return cues;
}
