import { SubtitleCue } from '../types';

/**
 * Converts ASS/SSA timestamp string (e.g., "0:01:23.45" or "00:01:23.450") to seconds
 */
export function assTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d+):(\d{2}):(\d{2})[.:](\d{2,3})/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  let ms = parseInt(match[4], 10);
  // If centiseconds (2 digits), multiply by 10
  if (match[4].length === 2) {
    ms = ms * 10;
  }

  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
}

/**
 * Strips ASS/SSA override tags like {\b1}, {\pos(x,y)}, {\fad(100,100)} while preserving line breaks
 */
export function cleanAssText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\\N/g, '\n') // ASS hard line breaks
    .replace(/\\n/g, ' ') // ASS soft line breaks
    .replace(/\\h/g, ' ') // ASS non-breaking spaces
    .replace(/\{[^}]*\}/g, '') // remove style tags {\...}
    .replace(/<[^>]*>/g, '') // remove html tags
    .trim();
}

/**
 * Parses raw ASS/SSA text content into SubtitleCue[]
 */
export function parseASS(assContent: string): SubtitleCue[] {
  if (!assContent) return [];

  const lines = assContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues: SubtitleCue[] = [];
  let inEvents = false;
  let formatHeaders: string[] = [];

  let startIndex = 1;
  let endIndex = 2;
  let textIndex = 9;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(';')) continue;

    if (line.toLowerCase() === '[events]') {
      inEvents = true;
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']') && line.toLowerCase() !== '[events]') {
      inEvents = false;
      continue;
    }

    if (inEvents) {
      if (line.startsWith('Format:')) {
        const headerStr = line.substring(7).trim();
        formatHeaders = headerStr.split(',').map((h) => h.trim().toLowerCase());
        startIndex = formatHeaders.indexOf('start');
        endIndex = formatHeaders.indexOf('end');
        textIndex = formatHeaders.indexOf('text');

        if (startIndex === -1) startIndex = 1;
        if (endIndex === -1) endIndex = 2;
        if (textIndex === -1) textIndex = formatHeaders.length - 1;
        continue;
      }

      if (line.startsWith('Dialogue:') || line.startsWith('Comment:')) {
        if (line.startsWith('Comment:')) continue; // Skip comments

        const colonPos = line.indexOf(':');
        const content = line.substring(colonPos + 1).trim();

        // Split by comma up to textIndex parts
        const parts = splitAssFields(content, textIndex);
        if (parts.length <= Math.max(startIndex, endIndex)) continue;

        const startStr = parts[startIndex];
        const endStr = parts[endIndex];
        const rawText = parts[textIndex] || '';

        const startTime = assTimeToSeconds(startStr);
        const endTime = assTimeToSeconds(endStr);
        const text = cleanAssText(rawText);

        if (text && endTime > startTime) {
          cues.push({
            id: cues.length + 1,
            startTime,
            endTime,
            text
          });
        }
      }
    }
  }

  // Sort by startTime
  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Splits comma-separated ASS field values, allowing the last field (Text) to contain commas
 */
function splitAssFields(line: string, textFieldIndex: number): string[] {
  const parts: string[] = [];
  let current = '';
  let inBrackets = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '{') inBrackets = true;
    if (char === '}') inBrackets = false;

    if (char === ',' && !inBrackets && parts.length < textFieldIndex) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  parts.push(current.trim());
  return parts;
}
