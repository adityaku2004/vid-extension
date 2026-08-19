/**
 * Formats time in seconds to HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number, forceHours: boolean = false): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
    return forceHours ? '00:00:00' : '00:00';
  }

  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0 || forceHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Formats remaining time as -HH:MM:SS or -MM:SS
 */
export function formatRemainingTime(currentTime: number, duration: number): string {
  if (isNaN(duration) || duration <= 0 || !isFinite(duration)) {
    return '-00:00';
  }
  const remaining = Math.max(0, duration - currentTime);
  return `-${formatTime(remaining, duration >= 3600)}`;
}

/**
 * Parses time string like "01:23:45" or "12:34" to seconds
 */
export function parseTimeString(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(timeStr) || 0;
}
