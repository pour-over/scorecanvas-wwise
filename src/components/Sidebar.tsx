import { useState } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useWwiseStore } from '../stores/wwise';
import type { CanvasNodeType } from '../types/canvas';

const NODE_PALETTE: { type: CanvasNodeType; label: string; desc: string }[] = [
  { type: 'musicState', label: 'Music State', desc: 'Segment / loop' },
  { type: 'transition', label: 'Transition', desc: 'Crossfade / cut' },
  { type: 'parameter', label: 'Parameter', desc: 'RTPC control' },
  { type: 'stinger', label: 'Stinger', desc: 'Musical accent' },
  { type: 'event', label: 'Event', desc: 'Game trigger' },
];

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-canvas-accent/20 transition-colors"
      >
        <svg
          className={`w-2 h-2 transition-transform ${open ? 'rotate-90' : ''}`}
          viewBox="0 0 8 8"
          fill="currentColor"
        >
          <path d="M2 0L8 4L2 8Z" />
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-widest text-canvas-muted">
          {title}
        </span>
        {count !== undefined && (
          <span className="ml-auto text-[9px] font-mono text-canvas-muted/40">{count}</span>
        )}
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

export default function Sidebar() {
  const { addNode, nodes } = useCanvasStore();
  const { connected, connect, disconnect, connecting } = useWwiseStore();

  const handleDragStart = (e: React.DragEvent, type: CanvasNodeType) => {
    e.dataTransfer.setData('application/scorecanvas-node', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-60 bg-panel border-r border-canvas-accent flex flex-col shrink-0 overflow-hidden">
      {/* Project Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="text-[10px] font-bold text-canvas-text">ScoreCanvas Wwise</div>
        <div className="text-[8px] text-canvas-muted/60 italic">Adaptive Music Workstation</div>
      </div>

      <div className="mx-3 border-t border-canvas-accent" />

      {/* Wwise Connection */}
      <div className="px-3 py-2">
        <button
          onClick={() => (connected ? disconnect() : connect())}
          disabled={connecting}
          className={`w-full px-2.5 py-1.5 text-[10px] font-bold rounded border transition-colors ${
            connected
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/50'
              : connecting
                ? 'bg-amber-900/30 text-amber-400 border-amber-500/50 cursor-wait'
                : 'bg-canvas-accent/30 text-canvas-text border-canvas-accent hover:bg-canvas-accent/60'
          }`}
        >
          {connected ? 'Connected to Wwise' : connecting ? 'Connecting...' : 'Connect to Wwise'}
        </button>
      </div>

      <div className="mx-3 border-t border-canvas-accent" />

      {/* Add Nodes */}
      <div className="flex-1 overflow-y-auto">
        <CollapsibleSection title="Add Nodes" count={NODE_PALETTE.length}>
          <div className="grid grid-cols-2 gap-1.5">
            {NODE_PALETTE.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                onClick={() => addNode(item.type, { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 })}
                className="bg-canvas-bg border border-canvas-accent rounded px-2 py-1.5 cursor-grab hover:border-canvas-highlight/50 transition-colors active:cursor-grabbing"
              >
                <div className="text-[10px] font-medium text-canvas-text">{item.label}</div>
                <div className="text-[9px] text-canvas-muted">{item.desc}</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <div className="mx-3 border-t border-canvas-accent" />

        {/* Active Nodes */}
        <CollapsibleSection title="Active Nodes" count={nodes.length}>
          <div className="space-y-1">
            {nodes.length === 0 ? (
              <div className="text-[9px] text-canvas-muted/50 italic">
                Add nodes from above or use the chat
              </div>
            ) : (
              nodes.slice(0, 20).map((node) => (
                <div
                  key={node.id}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] hover:bg-canvas-accent/20 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      node.type === 'musicState'
                        ? 'bg-green-400'
                        : node.type === 'transition'
                          ? 'bg-canvas-highlight'
                          : node.type === 'parameter'
                            ? 'bg-purple-400'
                            : node.type === 'stinger'
                              ? 'bg-orange-400'
                              : 'bg-cyan-400'
                    }`}
                  />
                  <span className="text-canvas-text truncate">
                    {(node.data as any).label || node.id}
                  </span>
                  <span className="ml-auto text-canvas-muted/40 text-[8px] font-mono">
                    {node.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </CollapsibleSection>

        <div className="mx-3 border-t border-canvas-accent" />

        {/* Wwise Browser (placeholder) */}
        <CollapsibleSection title="Wwise Browser" defaultOpen={false}>
          <div className="text-[9px] text-canvas-muted/50 italic">
            {connected ? 'Loading project hierarchy...' : 'Connect to Wwise to browse objects'}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
