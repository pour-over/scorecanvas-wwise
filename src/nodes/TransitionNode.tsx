import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import type { TransitionData } from '../types/canvas';

export default function TransitionNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as TransitionData;
  const { viewMode, playingNodeId } = useCanvasStore();
  const isPlaying = playingNodeId === id;
  const isDetailed = viewMode === 'detailed';

  return (
    <div
      className={`rounded-md shadow-lg transition-all ${
        isPlaying
          ? 'border-2 border-red-400 shadow-xl shadow-red-500/30 animate-pulse-glow'
          : selected
            ? 'border-2 border-canvas-highlight'
            : 'border-2 border-canvas-highlight/60'
      }`}
      style={{
        background: '#0f3460',
        minWidth: isDetailed ? 140 : 100,
        ['--glow-color' as any]: 'rgba(248, 113, 113, 0.4)',
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-canvas-text !w-[5px] !h-[5px]" />

      <div className={`${isDetailed ? 'px-3 py-2.5' : 'px-2 py-1.5'}`}>
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2.5">
            <path d="M5 12h14m-6-6l6 6-6 6" />
          </svg>
          <span className="text-sm font-semibold text-canvas-text truncate">{d.label}</span>
        </div>

        {isDetailed && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
            <span className="text-canvas-muted">Sync</span>
            <span className="text-canvas-text">{d.syncPoint}</span>
            <span className="text-canvas-muted">Fade</span>
            <span className="text-canvas-text">{d.fadeType}</span>
            <span className="text-canvas-muted">Duration</span>
            <span className="text-canvas-text">{d.duration}ms</span>
            {d.fadeInCurve && (
              <>
                <span className="text-canvas-muted">In</span>
                <span className="text-canvas-text">{d.fadeInCurve}</span>
              </>
            )}
            {d.fadeOutCurve && (
              <>
                <span className="text-canvas-muted">Out</span>
                <span className="text-canvas-text">{d.fadeOutCurve}</span>
              </>
            )}
          </div>
        )}

        {d.wwiseSynced !== undefined && isDetailed && (
          <div className="mt-1.5 flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${d.wwiseSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[8px] text-canvas-muted/60">
              {d.wwiseSynced ? 'Synced' : 'Pending sync'}
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-canvas-text !w-[5px] !h-[5px]" />
    </div>
  );
}
