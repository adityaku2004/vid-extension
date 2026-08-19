/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Extracts a clean title from a filename by stripping extension and cleaning dots/underscores
 */
export function cleanTitleFromFilename(filename: string): string {
  if (!filename) return 'Untitled Media';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return nameWithoutExt.replace(/[_.]+/g, ' ').trim();
}

/**
 * Checks if a file is a supported video type
 */
export function isVideoFile(file: File): boolean {
  if (file.type && (file.type.startsWith('video/') || file.type.includes('matroska') || file.type.includes('mkv'))) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['mp4', 'mkv', 'webm', 'mov', 'm4v', 'ogv', 'avi'].includes(ext || '');
}

/**
 * Checks if a file is a subtitle file
 */
export function isSubtitleFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['srt', 'vtt', 'ass', 'ssa', 'sub', 'sbv'].includes(ext || '');
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
