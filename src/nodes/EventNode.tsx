import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import type { EventData } from '../types/canvas';

const EVENT_COLORS: Record<string, string> = {
  cinematic: '#e94560',
  igc: '#f59e0b',
  button_press: '#22d3ee',
  checkpoint: '#4ade80',
  scripted_sequence: '#c084fc',
  qte: '#fb923c',
};

export default function EventNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as EventData;
  const { viewMode, playingNodeId } = useCanvasStore();
  const isPlaying = playingNodeId === id;
  const isDetailed = viewMode === 'detailed';
  const color = EVENT_COLORS[d.eventType] || EVENT_COLORS.cinematic;

  return (
    <div
      className={`rounded-lg shadow-lg transition-all ${
        isPlaying
          ? 'border-2 border-cyan-400 shadow-xl shadow-cyan-500/30 animate-pulse-glow'
          : selected
            ? 'border-2 border-cyan-400'
            : 'border-2'
      }`}
      style={{
        background: '#1a1520',
        borderColor: isPlaying || selected ? undefined : color,
        minWidth: isDetailed ? 180 : 120,
        ['--glow-color' as any]: 'rgba(34, 211, 238, 0.4)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color }} className="!w-[6px] !h-[6px]" />

      <div className={`${isDetailed ? 'px-4 py-3' : 'px-3 py-2'}`}>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span className="text-sm font-semibold text-canvas-text truncate">{d.label}</span>
        </div>

        <div className="mt-1">
          <span
            className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border"
            style={{
              background: `${color}20`,
              color: color,
              borderColor: `${color}50`,
            }}
          >
            {d.eventType.replace('_', ' ')}
          </span>
        </div>

        {isDetailed && (
          <div className="mt-2 space-y-1 text-[10px] font-mono">
            {d.blueprintRef && (
              <div className="text-canvas-muted truncate">
                Blueprint: <span className="text-canvas-text">{d.blueprintRef}</span>
              </div>
            )}
            {d.description && (
              <div className="text-[9px] text-canvas-muted/50 italic">{d.description}</div>
            )}
            {d.wwisePath && (
              <div className="text-[9px] text-emerald-400/60 truncate font-mono">{d.wwisePath}</div>
            )}
          </div>
        )}

        {d.directorNote && isDetailed && (
          <div className="mt-1.5 px-1.5 py-1 rounded bg-amber-400/10 border border-amber-400/20">
            <span className="text-[9px] text-amber-200/80 italic">{d.directorNote}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: color }} className="!w-[6px] !h-[6px]" />
    </div>
  );
}
