import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Star,
  Trash2,
  AlertCircle,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import { WatchHistoryItem } from '../../browser/types';
import { browserAPI } from '../../browser/browserAPI';
import { formatTime } from '../../utils/formatTime';

interface HistoryListProps {
  onPlayUrl?: (url: string, title: string) => void;
  onRequireFileSelect?: (item: WatchHistoryItem) => void;
  onShowToast?: (text: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  onPlayUrl,
  onRequireFileSelect,
  onShowToast
}) => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'continue' | 'favorites'>('all');
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await browserAPI.indexedDB.getHistory();
      setHistory(items);
    } catch (e) {
      console.warn('Error loading history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = await browserAPI.indexedDB.toggleFavorite(id);
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: isFav } : item))
    );
    onShowToast?.(isFav ? 'Added to Favorites' : 'Removed from Favorites');
  };

  const handleRemoveItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await browserAPI.indexedDB.removeHistoryItem(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
    onShowToast?.('Item removed from history');
  };

  const handleClearAll = async () => {
    await browserAPI.indexedDB.clearHistory();
    setHistory([]);
    onShowToast?.('Watch history cleared');
  };

  const handleItemClick = (item: WatchHistoryItem) => {
    if (item.sourceUrl && !item.isLocalFile) {
      onPlayUrl?.(item.sourceUrl, item.name);
    } else {
      // Local file requires re-selection
      onShowToast?.(`"${item.name}" is a local file. File needs to be selected again.`);
      onRequireFileSelect?.(item);
    }
  };

  const filteredItems = history.filter((item) => {
    if (filter === 'favorites') return item.isFavorite;
    if (filter === 'continue') {
      return (
        !item.completed &&
        item.position > 5 &&
        (item.duration === 0 || item.position / item.duration < 0.95)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sub-filter bar */}
      <div className="p-3 bg-[#181a20]/60 border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('continue')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'continue'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setFilter('favorites')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'favorites'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Favorites
          </button>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            title="Clear all watch history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-xs">Loading history...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-400">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-300">No watch history yet</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Videos you watch will be automatically recorded locally here.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const progress =
              item.duration > 0 ? Math.min(100, (item.position / item.duration) * 100) : 0;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative p-3 rounded-2xl bg-[#141820] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-200 group-hover:text-cyan-300 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>{formatTime(item.position)}</span>
                      <span>/</span>
                      <span>{formatTime(item.duration)}</span>
                      {item.completed && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/20 text-green-300">
                          Completed
                        </span>
                      )}
                      {item.isLocalFile && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Local File
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.isFavorite
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-gray-500 hover:text-amber-400 hover:bg-white/5'
                      }`}
                      title={item.isFavorite ? 'Remove favorite' : 'Add favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveItem(item.id, e)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {item.isLocalFile && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-amber-400/80">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      File needs to be selected again on resume
                    </span>
                    <span className="text-cyan-400 font-semibold group-hover:underline">
                      Browse
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
