import { useState, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useWwiseStore } from '../stores/wwise';
import ImportModal from './ImportModal';
import SettingsModal from './SettingsModal';
import TemplatePickerModal from './TemplatePickerModal';

declare global {
  interface Window {
    wwiseSync?: {
      pushAll: (nodes: any[], edges: any[]) => Promise<any>;
      pushNode: (node: any) => Promise<any>;
      onProgress: (cb: (p: { current: number; total: number; label: string }) => void) => void;
      removeProgressListeners: () => void;
    };
  }
}

export default function TopBar() {
  const { nodes, edges, viewMode, toggleViewMode } = useCanvasStore();
  const { connected, projectInfo } = useWwiseStore();
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushProgress, setPushProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [pushResult, setPushResult] = useState<{ pushed: number; failed: number } | null>(null);

  const handlePushToWwise = useCallback(async () => {
    if (!connected || !window.wwiseSync || nodes.length === 0) return;
    setPushing(true);
    setPushResult(null);
    setPushProgress(null);

    window.wwiseSync.removeProgressListeners();
    window.wwiseSync.onProgress((p) => setPushProgress(p));

    try {
      const res = await window.wwiseSync.pushAll(
        nodes.map((n) => ({ id: n.id, type: n.type, data: n.data, position: n.position })),
        edges
      );
      if (res.success && res.data) {
        setPushResult({ pushed: res.data.totalPushed, failed: res.data.totalFailed });
        const store = useCanvasStore.getState();
        for (const r of res.data.results) {
          if (r.success && r.wwisePath) {
            store.updateNodeData(r.nodeId, { wwisePath: r.wwisePath, wwiseId: r.wwiseId });
          }
        }
      } else {
        setPushResult({ pushed: 0, failed: nodes.length });
      }
    } catch (err: any) {
      console.error('[Push] Error:', err);
      setPushResult({ pushed: 0, failed: nodes.length });
    } finally {
      setPushing(false);
      setPushProgress(null);
      setTimeout(() => setPushResult(null), 5000);
    }
  }, [connected, nodes, edges]);

  return (
    <>
    <div className="h-12 bg-panel/95 backdrop-blur-sm border-b border-white/[0.06] flex items-center px-5 gap-3 shrink-0 shadow-lg shadow-black/20 relative z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-canvas-highlight to-pink-600 flex items-center justify-center shadow-glow-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" fill="white" />
            <circle cx="18" cy="16" r="3" fill="white" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-canvas-text tracking-tight leading-none">ScoreCanvas</span>
          <span className="text-[9px] font-medium text-canvas-highlight/70 tracking-wide leading-none mt-0.5">WWISE</span>
        </div>
      </div>

      <div className="w-px h-6 bg-white/[0.06]" />

      {/* Wwise Connection */}
      <div className="flex items-center gap-2">
        {connected ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-400">
              {projectInfo?.name || 'Wwise'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="w-2 h-2 rounded-full bg-canvas-muted/40" />
            <span className="text-[10px] font-medium text-canvas-muted/60">Offline</span>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-white/[0.06]" />

      {/* View Toggle */}
      <div className="flex items-center rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
        {(['detailed', 'simple'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => { if (viewMode !== mode) toggleViewMode(); }}
            className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all duration-200 ${
              viewMode === mode
                ? 'bg-canvas-highlight/20 text-canvas-highlight shadow-sm shadow-canvas-highlight/10'
                : 'text-canvas-muted hover:text-canvas-text'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        <ToolbarButton
          label="Import"
          onClick={() => setShowImport(true)}
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
          color="orange"
        />
        {connected && (
          <ToolbarButton
            label={pushing
              ? pushProgress ? `${pushProgress.current}/${pushProgress.total}` : 'Pushing...'
              : 'Push'}
            onClick={handlePushToWwise}
            disabled={pushing || nodes.length === 0}
            icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /></svg>}
            color="emerald"
          />
        )}
        <ToolbarButton
          label="Templates"
          onClick={() => setShowTemplates(true)}
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>}
          color="purple"
        />
      </div>

      {/* Push Result Toast */}
      {pushResult && (
        <div className={`px-3 py-1 text-[10px] font-semibold rounded-lg border animate-fade-in ${
          pushResult.failed === 0
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {pushResult.pushed} synced{pushResult.failed > 0 ? ` · ${pushResult.failed} failed` : ''}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight/40" />
          <span className="text-[10px] font-mono text-canvas-muted/70">{nodes.length} nodes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-canvas-accent" />
          <span className="text-[10px] font-mono text-canvas-muted/70">{edges.length} edges</span>
        </div>
      </div>

      {/* Settings Gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] text-canvas-muted/60 hover:text-canvas-text hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
        title="Settings"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

    </div>
    {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    {showTemplates && <TemplatePickerModal onClose={() => setShowTemplates(false)} />}
    </>
  );
}

/** Reusable toolbar button with icon + label */
function ToolbarButton({
  label,
  onClick,
  icon,
  color,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  color: 'orange' | 'emerald' | 'purple' | 'cyan';
  disabled?: boolean;
}) {
  const colorClasses = {
    orange: 'text-orange-400 hover:bg-orange-500/15 border-orange-500/20 hover:border-orange-500/30',
    emerald: 'text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/30',
    purple: 'text-purple-400 hover:bg-purple-500/15 border-purple-500/20 hover:border-purple-500/30',
    cyan: 'text-cyan-400 hover:bg-cyan-500/15 border-cyan-500/20 hover:border-cyan-500/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border bg-white/[0.02] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${colorClasses[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
