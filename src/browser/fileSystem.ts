/**
 * Browser File System Access API Abstraction
 * Handles showOpenFilePicker(), showDirectoryPicker() with graceful fallbacks
 * for Firefox and environments without File System Access API.
 */

import { generateId, isVideoFile } from '../utils/fileHelpers';
import { LibraryFolder, LibraryItem } from './types';

// Supported file picker types
const VIDEO_FILE_TYPES = [
  {
    description: 'Video Files',
    accept: {
      'video/*': [
        '.mp4',
        '.mkv',
        '.webm',
        '.mov',
        '.avi',
        '.m4v',
        '.ogv',
        '.flv',
        '.wmv',
        '.ts'
      ]
    }
  }
];

export const fileSystem = {
  /**
   * Check if File System Access API is supported
   */
  isFSSupported: (): boolean => {
    return (
      typeof window !== 'undefined' &&
      typeof (window as any).showOpenFilePicker === 'function' &&
      typeof (window as any).showDirectoryPicker === 'function'
    );
  },

  /**
   * Open video file(s) using File System Access API or standard fallback
   */
  openVideoFiles: async (): Promise<File[]> => {
    // 1. If showOpenFilePicker is supported
    if (typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const fileHandles = await (window as any).showOpenFilePicker({
          multiple: true,
          types: VIDEO_FILE_TYPES,
          excludeAcceptAllOption: false
        });

        const files: File[] = [];
        for (const handle of fileHandles) {
          const file = await handle.getFile();
          files.push(file);
        }
        return files;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return []; // User cancelled
        }
        console.warn('showOpenFilePicker failed, falling back to input element:', err);
      }
    }

    // 2. Standard HTML file input fallback
    return new Promise<File[]>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'video/*,.mkv,.mp4,.webm,.mov,.avi,.m4v,.ogv,.flv,.wmv,.ts';

      input.onchange = (e: any) => {
        const files = Array.from((e.target?.files || []) as File[]);
        resolve(files);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  },

  /**
   * Pick and index a folder using showDirectoryPicker or folder input
   */
  pickFolder: async (): Promise<{ folder: LibraryFolder; items: LibraryItem[] } | null> => {
    // 1. Modern File System Access API
    if (typeof (window as any).showDirectoryPicker === 'function') {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'read'
        });

        const folderId = generateId();
        const items: LibraryItem[] = [];

        // Recursively or flat scan files
        const scanDirectory = async (handle: any, pathPrefix = '') => {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              if (isVideoFile(file)) {
                items.push({
                  id: generateId(),
                  folderId,
                  name: entry.name,
                  path: pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name,
                  fileSize: file.size,
                  lastModified: file.lastModified,
                  handle: entry
                });
              }
            } else if (entry.kind === 'directory') {
              // Scan nested subdirectory (1 level deep to avoid hanging on massive trees)
              try {
                await scanDirectory(entry, pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name);
              } catch (e) {
                console.warn('Error reading subdirectory:', e);
              }
            }
          }
        };

        await scanDirectory(dirHandle);

        const folder: LibraryFolder = {
          id: folderId,
          name: dirHandle.name,
          dateAdded: Date.now(),
          fileCount: items.length,
          handle: dirHandle
        };

        return { folder, items };
      } catch (err: any) {
        if (err?.name === 'AbortError') return null;
        console.warn('showDirectoryPicker error:', err);
      }
    }

    // 2. Fallback using webkitdirectory input
    return new Promise<{ folder: LibraryFolder; items: LibraryItem[] } | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      (input as any).webkitdirectory = true;
      (input as any).directory = true;
      input.multiple = true;

      input.onchange = (e: any) => {
        const fileList = Array.from((e.target?.files || []) as File[]);
        if (fileList.length === 0) {
          resolve(null);
          return;
        }

        const folderId = generateId();
        const firstFile = fileList[0];
        const folderName = (firstFile as any).webkitRelativePath
          ? (firstFile as any).webkitRelativePath.split('/')[0]
          : 'Local Media Folder';

        const items: LibraryItem[] = [];
        for (const file of fileList) {
          if (isVideoFile(file)) {
            items.push({
              id: generateId(),
              folderId,
              name: file.name,
              path: (file as any).webkitRelativePath || file.name,
              fileSize: file.size,
              lastModified: file.lastModified
            });
          }
        }

        const folder: LibraryFolder = {
          id: folderId,
          name: folderName,
          dateAdded: Date.now(),
          fileCount: items.length
        };

        resolve({ folder, items });
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  },

  /**
   * Verify permissions for a stored directory/file handle
   */
  verifyPermission: async (fileHandle: any, readWrite = false): Promise<boolean> => {
    if (!fileHandle || typeof fileHandle.queryPermission !== 'function') {
      return false;
    }
    const options: any = {};
    if (readWrite) options.mode = 'readwrite';

    // Check if permission was already granted
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }

    // Request permission from user
    if ((await fileHandle.requestPermission(options)) === 'granted') {
      return true;
    }

    return false;
  }
};
