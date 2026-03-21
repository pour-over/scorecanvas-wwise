import { useState } from 'react';
import { useCanvasStore } from '../stores/canvas';

export default function VersionHistory() {
  const { versionHistory, restoreSnapshot, saveSnapshot, autoSaveEnabled, setAutoSave } = useCanvasStore();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-14 right-[340px] z-50 px-2.5 py-1 bg-canvas-surface border border-canvas-accent rounded-lg text-[9px] font-mono text-canvas-muted hover:text-canvas-text hover:border-canvas-highlight/40 transition-colors shadow-lg flex items-center gap-1.5"
        title="Version History"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="5" cy="5" r="4" />
          <path d="M5 2.5V5L6.5 6.5" />
        </svg>
        <span>{versionHistory.length} snapshots</span>
        {autoSaveEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      </button>
    );
  }

  return (
    <div className="fixed bottom-14 right-[340px] z-50 w-64 bg-panel border border-canvas-accent rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-accent">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="5" cy="5" r="4" />
            <path d="M5 2.5V5L6.5 6.5" />
          </svg>
          <span className="text-[10px] font-bold text-canvas-text">Version History</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-canvas-muted hover:text-canvas-text text-sm">x</button>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 border-b border-canvas-accent flex items-center gap-2">
        <button
          onClick={() => saveSnapshot('Manual save')}
          className="flex-1 px-2 py-1 text-[9px] font-bold bg-canvas-highlight/20 text-canvas-highlight border border-canvas-highlight/40 rounded hover:bg-canvas-highlight/30 transition-colors"
        >
          Save Now
        </button>
        <label className="flex items-center gap-1 text-[9px] text-canvas-muted cursor-pointer">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSave(e.target.checked)}
            className="w-3 h-3 rounded accent-canvas-highlight"
          />
          Auto (5m)
        </label>
      </div>

      {/* Snapshot list */}
      <div className="max-h-60 overflow-y-auto">
        {versionHistory.length === 0 ? (
          <div className="px-3 py-4 text-center text-[9px] text-canvas-muted/50 italic">
            No snapshots yet. Changes are saved automatically every 5 minutes.
          </div>
        ) : (
          <div className="py-1">
            {[...versionHistory].reverse().map((snap, revIdx) => {
              const idx = versionHistory.length - 1 - revIdx;
              const time = new Date(snap.timestamp);
              const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <button
                  key={snap.timestamp}
                  onClick={() => restoreSnapshot(idx)}
                  className="w-full text-left px-3 py-1.5 hover:bg-canvas-accent/20 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight/60 group-hover:bg-canvas-highlight" />
                    <span className="text-[10px] text-canvas-text">{snap.label}</span>
                    <span className="ml-auto text-[8px] font-mono text-canvas-muted/50">
                      {dateStr} {timeStr}
                    </span>
                  </div>
                  <div className="ml-3.5 text-[8px] text-canvas-muted/40">
                    {snap.nodes.length} nodes, {snap.edges.length} edges
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
