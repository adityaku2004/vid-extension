import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  Film,
  Trash2,
  AlertCircle,
  Play,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { LibraryFolder, LibraryItem } from '../../browser/types';
import { browserAPI } from '../../browser/browserAPI';

interface LibraryFolderViewProps {
  onPlayFile?: (file: File) => void;
  onShowToast?: (text: string) => void;
}

export const LibraryFolderView: React.FC<LibraryFolderViewProps> = ({
  onPlayFile,
  onShowToast
}) => {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolderId) {
      loadItems(selectedFolderId);
    } else {
      setItems([]);
    }
  }, [selectedFolderId]);

  const loadFolders = async () => {
    const loaded = await browserAPI.indexedDB.getFolders();
    setFolders(loaded);
    if (loaded.length > 0 && !selectedFolderId) {
      setSelectedFolderId(loaded[0].id);
    }
  };

  const loadItems = async (folderId: string) => {
    const loaded = await browserAPI.indexedDB.getLibraryItems(folderId);
    setItems(loaded);
  };

  const handleAddFolder = async () => {
    setIsScanning(true);
    try {
      const res = await browserAPI.fileSystem.pickFolder();
      if (res) {
        await browserAPI.indexedDB.saveFolder(res.folder);
        await browserAPI.indexedDB.saveLibraryItems(res.items);
        setFolders((prev) => [...prev.filter((f) => f.id !== res.folder.id), res.folder]);
        setSelectedFolderId(res.folder.id);
        setItems(res.items);
        onShowToast?.(`Indexed folder "${res.folder.name}" (${res.items.length} videos)`);
      }
    } catch (e) {
      console.warn('Add folder error:', e);
      onShowToast?.('Failed to open or index folder');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await browserAPI.indexedDB.removeFolder(folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
      setItems([]);
    }
    onShowToast?.('Folder removed from library');
  };

  const handleItemClick = async (item: LibraryItem) => {
    if (item.handle && typeof item.handle.getFile === 'function') {
      try {
        const file = await item.handle.getFile();
        onPlayFile?.(file);
        return;
      } catch (err) {
        console.warn('Permission expired or file inaccessible:', err);
      }
    }
    onShowToast?.(`File "${item.name}" needs to be selected again (session permission expired).`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Action Bar */}
      <div className="p-3 bg-[#181a20]/60 border-b border-white/5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAddFolder}
          disabled={isScanning}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 active:scale-98"
        >
          <FolderPlus className="w-4 h-4" />
          <span>{isScanning ? 'Scanning Directory...' : 'Add Folder to Library'}</span>
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
          <HardDrive className="w-10 h-10 text-gray-600 mb-3" />
          <h3 className="text-sm font-bold text-gray-200">Local Folder Library</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
            Index local media folders on your computer using the File System Access API. All indexing stays 100% private in your browser.
          </p>
          <button
            type="button"
            onClick={handleAddFolder}
            className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-cyan-300 font-semibold transition-colors border border-white/10"
          >
            Select Folder
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Folders row */}
          <div className="p-2.5 bg-[#12141a] border-b border-white/5 flex items-center gap-2 overflow-x-auto">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-2 shrink-0 border ${
                  selectedFolderId === folder.id
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{folder.name}</span>
                <span className="text-[10px] text-gray-500">({folder.fileCount})</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveFolder(folder.id, e)}
                  className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {items.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No compatible video files found in this folder.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="p-2.5 rounded-xl bg-[#141820] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-medium text-gray-200 group-hover:text-cyan-300 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
