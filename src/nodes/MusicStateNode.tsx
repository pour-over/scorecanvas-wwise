import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import type { MusicStateData } from '../types/canvas';
import AIVariationModal from '../components/AIVariationModal';

export default function MusicStateNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as MusicStateData;
  const { viewMode, playingNodeId, setPlayingNodeId } = useCanvasStore();
  const isPlaying = playingNodeId === id;
  const isDetailed = viewMode === 'detailed';
  const [showVariation, setShowVariation] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      setPlayingNodeId(null);
    } else {
      setPlayingNodeId(id);
    }
  };

  const intensityColor =
    d.intensity > 75 ? '#e94560' : d.intensity > 45 ? '#f59e0b' : '#4ecdc4';

  return (
    <div
      className={`rounded-lg shadow-lg transition-all ${
        isPlaying
          ? 'border-2 border-green-400 shadow-xl shadow-green-500/30 animate-pulse-glow'
          : selected
            ? 'border-2 border-canvas-highlight'
            : 'border-2 border-canvas-accent'
      }`}
      style={{
        background: '#16213e',
        minWidth: isDetailed ? 180 : 120,
        ['--glow-color' as any]: 'rgba(74, 222, 128, 0.4)',
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-canvas-highlight !w-[6px] !h-[6px]" />

      <div className={`${isDetailed ? 'px-4 py-3' : 'px-3 py-2'}`}>
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="text-sm font-semibold text-canvas-text truncate">{d.label}</span>
          {isDetailed && (
            <button
              onClick={handlePlay}
              className={`ml-auto w-5 h-5 rounded flex items-center justify-center text-[10px] transition-colors ${
                isPlaying
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
              }`}
              title={isPlaying ? 'Stop' : 'Play'}
            >
              {isPlaying ? '⏹' : '▶'}
            </button>
          )}
        </div>

        {/* Intensity Bar */}
        <div className="mt-1.5 h-[1.5px] bg-canvas-accent/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${d.intensity}%`, background: intensityColor }}
          />
        </div>

        {isDetailed && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono text-canvas-muted">
              <span>Intensity: {d.intensity}%</span>
              <span>{d.looping ? '🔁' : '→'}</span>
            </div>
            {d.stems.length > 0 && (
              <div className="text-[9px] text-canvas-muted/60">
                Stems: {d.stems.join(', ')}
              </div>
            )}
            {d.asset && (
              <div className="text-[9px] text-canvas-muted/60 truncate">
                Asset: {d.asset}
              </div>
            )}
            {d.wwisePath && (
              <div className="text-[9px] text-emerald-400/60 truncate font-mono">
                {d.wwisePath}
              </div>
            )}
          </div>
        )}

        {/* Director Note */}
        {d.directorNote && isDetailed && (
          <div className="mt-1.5 px-1.5 py-1 rounded bg-amber-400/10 border border-amber-400/20">
            <span className="text-[9px] text-amber-200/80 italic">{d.directorNote}</span>
          </div>
        )}

        {/* Status Badge */}
        {d.status && isDetailed && (
          <div className="mt-1.5">
            <StatusBadge status={d.status} />
          </div>
        )}

        {/* AI Variation Button */}
        {isDetailed && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowVariation(true); }}
            className="mt-2 w-full px-2 py-1 text-[9px] font-bold rounded border bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25 hover:text-purple-200 transition-colors"
          >
            Generate AI Variation
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-canvas-highlight !w-[6px] !h-[6px]" />

      {showVariation && (
        <AIVariationModal
          assetName={d.label}
          assetPath={d.asset}
          onClose={() => setShowVariation(false)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    temp: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    wip: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    final: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    needs_revision: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    placeholder: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${colors[status] || colors.temp}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
