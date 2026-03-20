import { useState } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useWwiseStore } from '../stores/wwise';
import ImportModal from './ImportModal';

export default function TopBar() {
  const { nodes, edges, viewMode, toggleViewMode } = useCanvasStore();
  const { connected, projectInfo } = useWwiseStore();
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="h-11 bg-panel border-b border-canvas-accent flex items-center px-4 gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-canvas-highlight flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" fill="white" />
            <circle cx="18" cy="16" r="3" fill="white" />
          </svg>
        </div>
        <span className="text-sm font-bold text-canvas-text tracking-tight">ScoreCanvas Wwise</span>
      </div>

      <div className="w-px h-5 bg-canvas-accent" />

      {/* Wwise Connection */}
      <div className="flex items-center gap-2">
        {connected ? (
          <>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-orange-600/20 text-orange-400 border-orange-500/30">
              Wwise
            </span>
            <span className="text-[11px] text-canvas-muted font-mono">
              {projectInfo?.name || 'Connected'}
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-slate-600/20 text-slate-400 border-slate-500/30">
            Wwise Offline
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-canvas-accent" />

      {/* View Mode Toggle */}
      <div className="flex items-center rounded-md border border-canvas-accent overflow-hidden">
        <button
          onClick={() => { if (viewMode !== 'detailed') toggleViewMode(); }}
          className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            viewMode === 'detailed'
              ? 'bg-canvas-highlight/20 text-canvas-highlight border-r border-canvas-accent'
              : 'bg-canvas-accent/30 text-canvas-muted border-r border-canvas-accent hover:bg-canvas-accent/50'
          }`}
        >
          Detailed
        </button>
        <button
          onClick={() => { if (viewMode !== 'simple') toggleViewMode(); }}
          className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            viewMode === 'simple'
              ? 'bg-canvas-highlight/20 text-canvas-highlight'
              : 'bg-canvas-accent/30 text-canvas-muted hover:bg-canvas-accent/50'
          }`}
        >
          Simple
        </button>
      </div>

      {/* Import Button */}
      <button
        onClick={() => setShowImport(true)}
        className="px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors bg-orange-600/20 text-orange-400 border-orange-500/30 hover:bg-orange-600/30"
      >
        Import Wwise
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] font-mono text-canvas-muted">
        <span>{nodes.length} nodes</span>
        <span>{edges.length} edges</span>
      </div>

      {/* Integration Badges */}
      <div className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-slate-600/20 text-slate-300 border-slate-500/30">
          Unreal
        </span>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-teal-600/20 text-teal-400 border-teal-500/30">
          Perforce
        </span>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-blue-600/20 text-blue-400 border-blue-500/30">
          Jira
        </span>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
