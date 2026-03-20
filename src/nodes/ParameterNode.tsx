import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import type { ParameterData } from '../types/canvas';

export default function ParameterNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as ParameterData;
  const { viewMode, playingNodeId } = useCanvasStore();
  const isPlaying = playingNodeId === id;
  const isDetailed = viewMode === 'detailed';

  const valuePercent = ((d.defaultValue - d.minValue) / (d.maxValue - d.minValue)) * 100;

  return (
    <div
      className={`rounded-lg shadow-lg transition-all ${
        isPlaying
          ? 'border-2 border-purple-400 shadow-xl shadow-purple-500/30 animate-pulse-glow'
          : selected
            ? 'border-2 border-purple-400'
            : 'border-2 border-purple-500/60'
      }`}
      style={{
        background: '#1a1a3e',
        minWidth: isDetailed ? 180 : 120,
        ['--glow-color' as any]: 'rgba(168, 85, 247, 0.4)',
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-purple-400 !w-[6px] !h-[6px]" />

      <div className={`${isDetailed ? 'px-4 py-3' : 'px-3 py-2'}`}>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-sm font-semibold text-canvas-text truncate">{d.label}</span>
        </div>

        <div className="mt-1 text-[9px] font-mono text-purple-400/80">RTPC</div>

        {/* Value Bar */}
        <div className="mt-1.5 h-[2px] bg-canvas-accent/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-400 transition-all"
            style={{ width: `${valuePercent}%` }}
          />
        </div>

        {isDetailed && (
          <div className="mt-2 space-y-1 text-[10px] font-mono">
            <div className="flex justify-between text-canvas-muted">
              <span>{d.minValue}</span>
              <span className="text-purple-300">{d.defaultValue}</span>
              <span>{d.maxValue}</span>
            </div>
            <div className="text-[9px] text-canvas-muted/60">{d.paramName}</div>
            {d.description && (
              <div className="text-[9px] text-canvas-muted/50 italic">{d.description}</div>
            )}
            {d.wwisePath && (
              <div className="text-[9px] text-emerald-400/60 truncate font-mono">{d.wwisePath}</div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-[6px] !h-[6px]" />
    </div>
  );
}
