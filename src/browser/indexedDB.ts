/**
 * IndexedDB Abstraction for Cine Media Player
 * Handles Watch History, Continue Watching, Library Folders, and Playlists.
 */

import { WatchHistoryItem, LibraryFolder, LibraryItem } from './types';

const DB_NAME = 'CineMediaPlayerDB';
const DB_VERSION = 1;

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private isConnecting: boolean = false;
  private initPromise: Promise<IDBDatabase | null> | null = null;

  private async getDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported in this environment');
      return null;
    }

    this.initPromise = new Promise((resolve) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. History Store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
          historyStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          historyStore.createIndex('completed', 'completed', { unique: false });
        }

        // 2. Library Folders Store
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }

        // 3. Library Files Store
        if (!db.objectStoreNames.contains('libraryItems')) {
          const itemsStore = db.createObjectStore('libraryItems', { keyPath: 'id' });
          itemsStore.createIndex('folderId', 'folderId', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB connection error:', e);
        resolve(null);
      };
    });

    return this.initPromise;
  }

  // ==================== WATCH HISTORY ====================

  async saveHistoryItem(item: WatchHistoryItem): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        console.warn('Error saving history item:', e);
        resolve();
      }
    });
  }

  async getHistory(): Promise<WatchHistoryItem[]> {
    const db = await this.getDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('history', 'readonly');
        const store = tx.objectStore('history');
        const index = store.index('lastPlayed');
        const request = index.openCursor(null, 'prev'); // Most recent first
        const items: WatchHistoryItem[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            items.push(cursor.value);
            cursor.continue();
          } else {
            resolve(items);
          }
        };

        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async getContinueWatching(): Promise<WatchHistoryItem[]> {
    const all = await this.getHistory();
    // Return items that have started, position > 5s, not completed, and less than 95% of duration
    return all.filter((item) => {
      if (item.completed) return false;
      if (item.position < 5) return false;
      if (item.duration > 0 && item.position / item.duration > 0.95) return false;
      return true;
    });
  }

  async getFavorites(): Promise<WatchHistoryItem[]> {
    const all = await this.getHistory();
    return all.filter((item) => item.isFavorite);
  }

  async removeHistoryItem(id: string): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async clearHistory(): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const db = await this.getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        const req = store.get(id);

        req.onsuccess = () => {
          const item: WatchHistoryItem | undefined = req.result;
          if (item) {
            item.isFavorite = !item.isFavorite;
            store.put(item);
            tx.oncomplete = () => resolve(!!item.isFavorite);
          } else {
            resolve(false);
          }
        };
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  // ==================== LIBRARY FOLDERS ====================

  async saveFolder(folder: LibraryFolder): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('folders', 'readwrite');
        const store = tx.objectStore('folders');
        store.put(folder);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getFolders(): Promise<LibraryFolder[]> {
    const db = await this.getDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('folders', 'readonly');
        const store = tx.objectStore('folders');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async removeFolder(folderId: string): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['folders', 'libraryItems'], 'readwrite');
        tx.objectStore('folders').delete(folderId);
        // Clean items in this folder
        const itemsStore = tx.objectStore('libraryItems');
        const index = itemsStore.index('folderId');
        const req = index.openCursor(IDBKeyRange.only(folderId));
        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async saveLibraryItems(items: LibraryItem[]): Promise<void> {
    const db = await this.getDB();
    if (!db || items.length === 0) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('libraryItems', 'readwrite');
        const store = tx.objectStore('libraryItems');
        for (const item of items) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getLibraryItems(folderId?: string): Promise<LibraryItem[]> {
    const db = await this.getDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('libraryItems', 'readonly');
        const store = tx.objectStore('libraryItems');
        if (folderId) {
          const index = store.index('folderId');
          const req = index.getAll(IDBKeyRange.only(folderId));
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } else {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        }
      } catch {
        resolve([]);
      }
    });
  }
}

export const indexedDBManager = new IndexedDBManager();
