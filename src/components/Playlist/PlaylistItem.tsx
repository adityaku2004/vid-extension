import React, { useState } from 'react';
import { Play, Trash2, Edit2, Check, X, ArrowUp, ArrowDown, FileVideo } from 'lucide-react';
import { PlaylistItem as PlaylistItemType } from '../../types';
import { formatTime } from '../../utils/formatTime';
import { formatFileSize } from '../../utils/fileHelpers';

interface PlaylistItemProps {
  item: PlaylistItemType;
  index: number;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onRename: (newTitle: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const PlaylistItem: React.FC<PlaylistItemProps> = ({
  item,
  index,
  isCurrent,
  onPlay,
  onRemove,
  onRename,
  onMoveUp,
  onMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(item.title);

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      onRename(titleValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 border ${
        isCurrent
          ? 'bg-cyan-500/15 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
          : 'bg-[#14161c] hover:bg-[#1a1d24] border-white/5 hover:border-white/10'
      }`}
    >
      {/* Left side: Track number / Playing indicator / Thumbnail & Title */}
      <div
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        onClick={() => !isEditing && onPlay()}
      >
        {/* Track Number / Play Indicator */}
        <div className="w-6 flex items-center justify-center flex-shrink-0">
          {isCurrent ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="w-1 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
              <span className="w-1 h-4 rounded-full bg-cyan-400 animate-pulse delay-150" />
            </div>
          ) : (
            <span className="text-xs font-mono-time text-gray-500 group-hover:hidden">
              {(index + 1).toString().padStart(2, '0')}
            </span>
          )}
          <Play
            className={`w-3.5 h-3.5 text-cyan-400 fill-cyan-400 ${
              isCurrent ? 'hidden' : 'hidden group-hover:block'
            }`}
          />
        </div>

        {/* Thumbnail Preview or Icon */}
        <div className="w-12 h-8 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center relative">
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <FileVideo className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form onSubmit={handleSaveRename} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                autoFocus
                className="w-full px-2 py-0.5 rounded bg-black/50 text-xs text-white border border-cyan-500/50 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 text-cyan-400 hover:text-cyan-300"
                title="Save title"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-gray-400 hover:text-white"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold truncate ${
                    isCurrent ? 'text-cyan-300' : 'text-gray-200 group-hover:text-white'
                  }`}
                >
                  {item.title}
                </span>
                {item.isSample && (
                  <span className="text-[9px] px-1 rounded bg-white/10 text-gray-400 font-mono-time">
                    Sample
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono-time text-gray-400 mt-0.5">
                {item.duration ? <span>{formatTime(item.duration, item.duration >= 3600)}</span> : <span>--:--</span>}
                {item.metadata?.fileSize && <span>• {formatFileSize(item.metadata.fileSize)}</span>}
                {item.subtitleTracks?.length > 0 && (
                  <span className="text-cyan-400 font-bold">CC</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side: Reorder & action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
        {onMoveUp && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
            title="Move up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
            title="Move down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
          title="Rename video"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/10"
          title="Remove from playlist"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
