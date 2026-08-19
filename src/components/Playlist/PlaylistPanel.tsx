import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ListVideo, X, Plus, Trash2, Sparkles, FolderPlus } from 'lucide-react';
import { PlaylistItem as PlaylistItemType } from '../../types';
import { PlaylistItem } from './PlaylistItem';
import { SAMPLE_VIDEOS } from '../../utils/sampleMedia';

interface PlaylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistItemType[];
  currentVideoId?: string;
  onSelectVideo: (video: PlaylistItemType) => void;
  onRemoveVideo: (id: string) => void;
  onRenameVideo: (id: string, newTitle: string) => void;
  onReorderPlaylist: (fromIndex: number, toIndex: number) => void;
  onAddLocalFiles: (files: FileList) => void;
  onAddSampleVideos: () => void;
  onClearPlaylist: () => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  isOpen,
  onClose,
  playlist,
  currentVideoId,
  onSelectVideo,
  onRemoveVideo,
  onRenameVideo,
  onReorderPlaylist,
  onAddLocalFiles,
  onAddSampleVideos,
  onClearPlaylist
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentIndex = playlist.findIndex((v) => v.id === currentVideoId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddLocalFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#101114]/95 border-l border-white/10 shadow-2xl z-50 flex flex-col backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#14161c]">
              <div className="flex items-center gap-2.5">
                <ListVideo className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Playlist
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono-time">
                    {playlist.length} {playlist.length === 1 ? 'item' : 'items'}
                    {currentIndex !== -1 ? ` • Playing #${currentIndex + 1}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {playlist.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearPlaylist}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                    title="Clear playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close playlist"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Bar: Add File / Load Samples */}
            <div className="p-3 bg-[#181a20]/60 border-b border-white/5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Add Video Files</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,.mkv,.mp4,.webm,.mov"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={onAddSampleVideos}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white text-xs font-medium transition-colors active:scale-98"
                title="Load open-source sample movies"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Samples</span>
              </button>
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {playlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <ListVideo className="w-7 h-7 text-gray-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Playlist is Empty</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                    Add local movie files or load sample open movies to start watching.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Browse Local Videos
                    </button>
                    <button
                      type="button"
                      onClick={onAddSampleVideos}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Load 4 Sample Movies
                    </button>
                  </div>
                </div>
              ) : (
                playlist.map((item, idx) => (
                  <PlaylistItem
                    key={item.id}
                    item={item}
                    index={idx}
                    isCurrent={item.id === currentVideoId}
                    onPlay={() => onSelectVideo(item)}
                    onRemove={() => onRemoveVideo(item.id)}
                    onRename={(newTitle) => onRenameVideo(item.id, newTitle)}
                    onMoveUp={idx > 0 ? () => onReorderPlaylist(idx, idx - 1) : undefined}
                    onMoveDown={idx < playlist.length - 1 ? () => onReorderPlaylist(idx, idx + 1) : undefined}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
