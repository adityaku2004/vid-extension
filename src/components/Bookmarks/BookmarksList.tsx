import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  BookmarkPlus,
  Play,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Search,
  Copy,
  Tag,
  Film,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { VideoBookmark, PlaylistItem } from '../../types';
import { formatTime } from '../../utils/formatTime';

interface BookmarksListProps {
  currentVideo: PlaylistItem | null;
  currentTime: number;
  duration: number;
  bookmarks: VideoBookmark[];
  allVideos?: PlaylistItem[];
  onSeek: (time: number) => void;
  onAddBookmark: (label?: string, color?: string, time?: number) => void;
  onUpdateBookmark: (id: string, newLabel: string, newColor?: string) => void;
  onDeleteBookmark: (id: string) => void;
  onClearBookmarks: (videoId: string) => void;
  onSelectVideo?: (video: PlaylistItem) => void;
  onShowToast?: (message: string) => void;
}

const PRESET_COLORS = [
  '#00F0FF', // Cyan
  '#FFD700', // Gold
  '#FF5252', // Coral / Red
  '#69F0AE', // Mint Green
  '#E040FB', // Neon Purple
  '#FF9100'  // Amber
];

// Helper to parse string timestamp (MM:SS or HH:MM:SS or pure seconds) to number
function parseTimeString(timeStr: string): number | null {
  const clean = timeStr.trim();
  if (!clean) return null;
  if (!isNaN(Number(clean))) {
    return Math.max(0, Number(clean));
  }
  const parts = clean.split(':').map((p) => Number(p));
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

export const BookmarksList: React.FC<BookmarksListProps> = ({
  currentVideo,
  currentTime = 0,
  duration = 0,
  bookmarks,
  allVideos = [],
  onSeek,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onClearBookmarks,
  onSelectVideo,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [customTimeStr, setCustomTimeStr] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [filterMode, setFilterMode] = useState<'current' | 'all'>('current');

  // Sync custom time string with current time whenever custom modal opens or current time updates if useCurrentTime is true
  useEffect(() => {
    if (useCurrentTime) {
      setCustomTimeStr(formatTime(currentTime, duration >= 3600));
    }
  }, [currentTime, duration, useCurrentTime]);

  const currentVideoBookmarks = bookmarks.filter(
    (bm) => !currentVideo || bm.videoId === currentVideo.id
  );

  const displayedBookmarks = (filterMode === 'current' ? currentVideoBookmarks : bookmarks)
    .filter((bm) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        bm.label.toLowerCase().includes(q) ||
        (bm.videoTitle && bm.videoTitle.toLowerCase().includes(q)) ||
        formatTime(bm.timestamp, duration >= 3600).includes(q)
      );
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const formattedCurrentTime = formatTime(currentTime, duration >= 3600);

  const handleQuickAddCurrent = () => {
    const label = newLabelInput.trim() || `Bookmark at ${formattedCurrentTime}`;
    onAddBookmark(label, selectedColor, currentTime);
    setNewLabelInput('');
    setIsAddingCustom(false);
    onShowToast?.(`Saved bookmark at ${formattedCurrentTime}`);
  };

  const handleCustomAdd = () => {
    let targetTimestamp = currentTime;
    if (!useCurrentTime && customTimeStr.trim()) {
      const parsed = parseTimeString(customTimeStr);
      if (parsed !== null) {
        targetTimestamp = duration > 0 ? Math.min(duration, Math.max(0, parsed)) : parsed;
      }
    }
    const formatted = formatTime(targetTimestamp, duration >= 3600);
    const label = newLabelInput.trim() || `Bookmark at ${formatted}`;
    onAddBookmark(label, selectedColor, targetTimestamp);
    setNewLabelInput('');
    setIsAddingCustom(false);
    onShowToast?.(`Saved bookmark "${label}" at ${formatted}`);
  };

  const handleStartEdit = (bm: VideoBookmark) => {
    setEditingId(bm.id);
    setEditLabel(bm.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      onUpdateBookmark(id, editLabel.trim());
    }
    setEditingId(null);
  };

  const handleCopyLink = (bm: VideoBookmark) => {
    const formatted = formatTime(bm.timestamp, duration >= 3600);
    const text = `${bm.videoTitle || currentVideo?.title || 'Video'} - ${bm.label} (${formatted})`;
    navigator.clipboard?.writeText(text);
    onShowToast?.(`Copied bookmark info: "${text}"`);
  };

  const handleJumpToBookmark = (bm: VideoBookmark) => {
    if (currentVideo && bm.videoId !== currentVideo.id && onSelectVideo) {
      const targetVideo = allVideos.find((v) => v.id === bm.videoId);
      if (targetVideo) {
        onSelectVideo(targetVideo);
      }
    }
    onSeek(bm.timestamp);
    onShowToast?.(`Jumped to ${formatTime(bm.timestamp, duration >= 3600)} • ${bm.label}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 text-xs">
      {/* Quick Add Form / Bar */}
      <div className="p-3 bg-[#181a20]/80 border-b border-white/10 space-y-2.5">
        {!isAddingCustom ? (
          <div className="space-y-2">
            {/* Primary Action Button: Bookmark at Current Time */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickAddCurrent}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-98 group"
              >
                <BookmarkPlus className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                <span>Bookmark at Current Time ({formattedCurrentTime})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomTimeStr(formattedCurrentTime);
                  setUseCurrentTime(true);
                  setIsAddingCustom(true);
                }}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5"
                title="Add bookmark with custom title, color, or specific timestamp"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Custom</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/40 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
              <span className="flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4 text-cyan-400" />
                New Bookmark
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-gray-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bookmark Title */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Bookmark Title
              </label>
              <input
                type="text"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                placeholder={`e.g. Favorite Scene (${useCurrentTime ? formattedCurrentTime : customTimeStr || formattedCurrentTime})`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Timestamp Selector: At Current Time vs Custom Timestamp */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400">
                <span>Timestamp</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCurrentTime(true);
                      setCustomTimeStr(formattedCurrentTime);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      useCurrentTime
                        ? 'bg-cyan-500 text-black'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    Current ({formattedCurrentTime})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCurrentTime(false)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      !useCurrentTime
                        ? 'bg-cyan-500 text-black'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {!useCurrentTime ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={customTimeStr}
                      onChange={(e) => setCustomTimeStr(e.target.value)}
                      placeholder="MM:SS or HH:MM:SS (e.g. 02:45)"
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-black/70 border border-white/15 font-mono-time text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTimeStr(formattedCurrentTime);
                      setUseCurrentTime(true);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 text-[11px] font-medium whitespace-nowrap"
                    title="Reset to current video timestamp"
                  >
                    Use Live
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10 text-xs">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Current Playback Time
                  </span>
                  <span className="font-mono-time font-bold text-cyan-300">
                    {formattedCurrentTime}
                  </span>
                </div>
              )}
            </div>

            {/* Color Accent Picker & Save */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">Color:</span>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      selectedColor === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110 opacity-70'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-2.5 py-1 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomAdd}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  Save Bookmark
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {allVideos.length > 1 && (
            <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setFilterMode('current')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  filterMode === 'current'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Current
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  filterMode === 'all'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({bookmarks.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {displayedBookmarks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Bookmark className="w-6 h-6 text-gray-500" />
            </div>
            <h4 className="text-sm font-semibold text-white">No Bookmarks Saved</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
              Save memorable scenes, timestamps, or dialog cues while watching by clicking the Bookmark button or pressing <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono-time">B</kbd>.
            </p>
          </div>
        ) : (
          displayedBookmarks.map((bm) => {
            const isThisVideo = !currentVideo || bm.videoId === currentVideo.id;
            const isEditing = editingId === bm.id;
            const bookmarkColor = bm.color || '#00F0FF';

            return (
              <div
                key={bm.id}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 border ${
                  isThisVideo
                    ? 'bg-[#14161c] hover:bg-[#1a1d24] border-white/5 hover:border-white/15'
                    : 'bg-black/30 hover:bg-[#14161c] border-white/5 opacity-85'
                }`}
              >
                {/* Left: Color Pin & Timestamp Badge & Title */}
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => !isEditing && handleJumpToBookmark(bm)}
                >
                  {/* Color Accent Pill */}
                  <div
                    className="w-1.5 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: bookmarkColor }}
                  />

                  {/* Timestamp Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJumpToBookmark(bm);
                    }}
                    className="px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-cyan-300 font-mono-time text-xs font-bold hover:bg-cyan-500 hover:text-black transition-colors flex items-center gap-1 flex-shrink-0"
                    title="Seek to this timestamp"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{formatTime(bm.timestamp, duration >= 3600)}</span>
                  </button>

                  {/* Title / Label */}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEdit(bm.id);
                        }}
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          autoFocus
                          className="w-full px-2 py-0.5 rounded bg-black/60 text-xs text-white border border-cyan-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                          {bm.label}
                        </p>
                        {filterMode === 'all' && bm.videoTitle && (
                          <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <Film className="w-3 h-3 text-gray-500" />
                            <span>{bm.videoTitle}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(bm);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Copy timestamp info"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(bm);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Rename bookmark"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBookmark(bm.id);
                      onShowToast?.(`Deleted bookmark "${bm.label}"`);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear Bar */}
      {displayedBookmarks.length > 0 && currentVideo && (
        <div className="p-3 border-t border-white/10 bg-[#14161c] flex items-center justify-between text-[11px] text-gray-400">
          <span>{displayedBookmarks.length} saved bookmarks</span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all bookmarks for this video?')) {
                onClearBookmarks(currentVideo.id);
                onShowToast?.('Cleared all bookmarks for this video');
              }
            }}
            className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Video Bookmarks</span>
          </button>
        </div>
      )}
    </div>
  );
};
