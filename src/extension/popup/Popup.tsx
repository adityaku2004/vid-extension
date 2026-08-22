import React, { useState, useEffect } from 'react';
import {
  Play,
  Film,
  Clock,
  Settings,
  ExternalLink,
  FolderOpen,
  Eye,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import { browserAPI } from '../../browser/browserAPI';
import { WatchHistoryItem } from '../../browser/types';
import { formatTime } from '../../utils/formatTime';

export const Popup: React.FC = () => {
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
  const [recentHistory, setRecentHistory] = useState<WatchHistoryItem[]>([]);
  const [activeTabVideosCount, setActiveTabVideosCount] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const continueItems = await browserAPI.indexedDB.getContinueWatching();
      const allHistory = await browserAPI.indexedDB.getHistory();
      setContinueWatching(continueItems.slice(0, 3));
      setRecentHistory(allHistory.slice(0, 5));
    } catch (e) {
      console.warn('Error loading popup history:', e);
    }
  };

  const handleOpenPlayer = (params?: { videoUrl?: string; title?: string }) => {
    browserAPI.tabs.openPlayer(params);
  };

  const handleResume = (item: WatchHistoryItem) => {
    if (item.sourceUrl) {
      handleOpenPlayer({ videoUrl: item.sourceUrl, title: item.name });
    } else {
      // Local file cannot be restored automatically with raw File across restart
      setStorageNotice(`"${item.name}" was a local file. Please select the file in the player to continue.`);
      setTimeout(() => {
        handleOpenPlayer();
      }, 1200);
    }
  };

  const handleScanPageVideos = async () => {
    setIsScanning(true);
    try {
      const activeTab = await browserAPI.tabs.getActiveTab();
      if (activeTab?.id) {
        // Send message to active tab content script
        browserAPI.runtime.sendMessage({
          type: 'DETECT_VIDEOS',
          payload: { tabId: activeTab.id }
        });
        setStorageNotice('Scanning current page for HTML5 videos...');
      } else {
        setStorageNotice('No active web page detected.');
      }
    } catch (e) {
      setStorageNotice('Unable to scan current tab.');
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  return (
    <div className="w-[360px] bg-[#0b0d13] text-white font-sans p-4 border border-white/10 shadow-2xl flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0b0d13] rounded-[10px] flex items-center justify-center">
              <Film className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white flex items-center gap-1.5">
              CINE MEDIA <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">EXT</span>
            </h1>
            <p className="text-[10px] text-gray-400">Desktop VLC-grade media player</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenPlayer()}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Open Player in Full Tab"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Notice Banner */}
      {storageNotice && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{storageNotice}</span>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={() => handleOpenPlayer()}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mb-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Play className="w-4 h-4 fill-black" />
        <span>Open Player</span>
      </button>

      {/* Scan Web Page Videos Button */}
      <button
        type="button"
        onClick={handleScanPageVideos}
        disabled={isScanning}
        className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 hover:text-white flex items-center justify-center gap-2 mb-3.5 transition-colors"
      >
        <Search className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
        <span>{isScanning ? 'Detecting Web Videos...' : 'Detect Videos on Current Page'}</span>
      </button>

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <div className="mb-3.5">
          <div className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Continue Watching</span>
          </div>

          <div className="space-y-2">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-[#141820] border border-white/5 hover:border-cyan-500/40 transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-semibold text-gray-200 truncate group-hover:text-cyan-300">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{formatTime(item.position)}</span>
                    <span>/</span>
                    <span>{formatTime(item.duration)}</span>
                    {item.isLocalFile && (
                      <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Local
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleResume(item)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Resume</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History Section */}
      {recentHistory.length > 0 && (
        <div className="mb-3.5">
          <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 flex items-center justify-between">
            <span>Recently Played</span>
            <span className="text-[10px] text-gray-500">{recentHistory.length} items</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleResume(item)}
                className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] cursor-pointer transition-colors flex items-center justify-between text-xs text-gray-300 hover:text-white"
              >
                <span className="truncate pr-2">{item.name}</span>
                <span className="text-[10px] text-gray-500 font-mono shrink-0">
                  {formatTime(item.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1 text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Local Storage Ready</span>
        </div>

        <button
          type="button"
          onClick={() => handleOpenPlayer()}
          className="hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
