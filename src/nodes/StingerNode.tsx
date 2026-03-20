import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import type { StingerData } from '../types/canvas';

const PRIORITY_COLORS: Record<string, { border: string; icon: string }> = {
  low: { border: 'border-gray-500/60', icon: '#6b7280' },
  medium: { border: 'border-yellow-500/60', icon: '#eab308' },
  high: { border: 'border-orange-500/60', icon: '#f97316' },
  critical: { border: 'border-red-500/60', icon: '#ef4444' },
};

export default function StingerNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as StingerData;
  const { viewMode, playingNodeId } = useCanvasStore();
  const isPlaying = playingNodeId === id;
  const isDetailed = viewMode === 'detailed';
  const prio = PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.medium;

  return (
    <div
      className={`rounded-lg shadow-lg transition-all border-2 ${
        isPlaying
          ? 'border-orange-400 shadow-xl shadow-orange-500/30 animate-pulse-glow'
          : selected
            ? 'border-orange-400'
            : prio.border
      }`}
      style={{
        background: '#2a1a1e',
        minWidth: isDetailed ? 160 : 120,
        ['--glow-color' as any]: 'rgba(249, 115, 22, 0.4)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: prio.icon }} className="!w-[6px] !h-[6px]" />

      <div className={`${isDetailed ? 'px-4 py-3' : 'px-3 py-2'}`}>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={prio.icon} strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-sm font-semibold text-canvas-text truncate">{d.label}</span>
        </div>

        {isDetailed && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
            <span className="text-canvas-muted">Trigger</span>
            <span className="text-canvas-text">{d.trigger}</span>
            <span className="text-canvas-muted">Priority</span>
            <span style={{ color: prio.icon }}>{d.priority}</span>
            {d.asset && (
              <>
                <span className="text-canvas-muted">Asset</span>
                <span className="text-canvas-text truncate">{d.asset}</span>
              </>
            )}
          </div>
        )}

        {d.directorNote && isDetailed && (
          <div className="mt-1.5 px-1.5 py-1 rounded bg-amber-400/10 border border-amber-400/20">
            <span className="text-[9px] text-amber-200/80 italic">{d.directorNote}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: prio.icon }} className="!w-[6px] !h-[6px]" />
    </div>
  );
}
