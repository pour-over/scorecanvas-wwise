import { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useAudioStore } from '../stores/audio';

// Journey cat sprite (8x8, 2 frames)
const SPRITE_FRAMES = [
  // run1
  [
    ['', 'w', '', '', 'w', '', '', ''],
    ['', 'w', 'w', 'w', 'w', '', '', ''],
    ['', 'w', 'g', 'w', 'g', '', '', ''],
    ['', '', 'w', 'w', 'w', '', '', ''],
    ['', 'r', 'w', 'w', 'r', 'r', 'r', ''],
    ['', '', 'w', 'w', '', '', '', 'r'],
    ['', '', 'w', '', '', '', '', ''],
    ['', 'w', '', 'w', '', '', '', ''],
  ],
  // run2
  [
    ['', 'w', '', '', 'w', '', '', ''],
    ['', 'w', 'w', 'w', 'w', '', '', ''],
    ['', 'w', 'g', 'w', 'g', '', '', ''],
    ['', '', 'w', 'w', 'w', '', '', ''],
    ['', 'r', 'w', 'w', 'r', 'r', '', ''],
    ['', '', 'w', 'w', '', '', 'r', ''],
    ['', '', 'w', '', '', '', '', 'r'],
    ['', '', 'w', 'w', '', '', '', ''],
  ],
];

const COLOR_MAP: Record<string, string> = {
  r: '#e94560',
  w: '#e0d6c8',
  g: '#4ade80',
};

function PixelSprite({ frame }: { frame: string[][] }) {
  const px = 3;
  return (
    <div style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 4px rgba(233,69,96,0.88))' }}>
      {frame.map((row, y) => (
        <div key={y} style={{ display: 'flex', height: px }}>
          {row.map((cell, x) => (
            <div
              key={x}
              style={{
                width: px,
                height: px,
                background: cell ? COLOR_MAP[cell] || 'transparent' : 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TransportBar() {
  const { nodes, playingNodeId, setPlayingNodeId } = useCanvasStore();
  const { volume, setVolume, playbackMode, setPlaybackMode } = useAudioStore();
  const [minimized, setMinimized] = useState(false);
  const [spriteFrame, setSpriteFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showSprite, setShowSprite] = useState(true);
  const isPlaying = playingNodeId !== null;

  // Animate sprite
  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => setSpriteFrame((f) => (f + 1) % 2), 220);
    return () => clearInterval(iv);
  }, [isPlaying]);

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) { setProgress(0); return; }
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setPlayingNodeId(null); return 0; }
        return p + 0.5;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [isPlaying, setPlayingNodeId]);

  const handlePlayStop = () => {
    if (isPlaying) {
      setPlayingNodeId(null);
    } else if (nodes.length > 0) {
      setPlayingNodeId(nodes[0].id);
    }
  };

  if (minimized) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-transport/95 border border-canvas-accent/60 rounded-lg shadow-xl backdrop-blur-md">
          <button onClick={handlePlayStop} className="text-[10px]">
            {isPlaying ? '⏹' : '▶'}
          </button>
          <span className="text-[10px] text-canvas-text font-mono">
            {isPlaying ? 'Playing...' : 'Stopped'}
          </span>
          <button
            onClick={() => setMinimized(false)}
            className="text-canvas-muted hover:text-canvas-text text-[10px]"
          >
            ▲
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50" style={{ minWidth: 580, maxWidth: 780 }}>
      <div className="bg-transport/95 border border-canvas-accent/60 rounded-xl shadow-2xl backdrop-blur-md">
        {/* Row 1: Controls */}
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Play/Stop */}
          <button
            onClick={handlePlayStop}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
              isPlaying
                ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30'
                : 'bg-green-900/30 text-green-400 border-green-500/50 hover:bg-green-900/50'
            }`}
          >
            {isPlaying ? '⏹' : '▶'}
          </button>

          {/* Now Playing */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isPlaying && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
            <span className="text-[11px] text-canvas-text font-mono truncate">
              {isPlaying
                ? (nodes.find((n) => n.id === playingNodeId)?.data as any)?.label || 'Playing'
                : 'Stopped'}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5 ml-auto">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-canvas-muted">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-canvas-highlight"
            />
            <span className="text-[8px] font-mono text-canvas-muted w-6 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Mode Toggle */}
          <button
            onClick={() => setPlaybackMode(playbackMode === 'full' ? 'transition' : 'full')}
            className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
              playbackMode === 'transition'
                ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30'
                : 'bg-amber-900/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {playbackMode === 'transition' ? 'Transition Check' : 'Full Score'}
          </button>

          {/* Sprite Toggle */}
          <button
            onClick={() => setShowSprite(!showSprite)}
            className="text-[11px] text-canvas-muted hover:text-canvas-text transition-colors"
          >
            🎮
          </button>

          {/* Minimize */}
          <button
            onClick={() => setMinimized(true)}
            className="text-canvas-muted hover:text-canvas-text transition-colors text-[10px]"
          >
            ▼
          </button>
        </div>

        {/* Row 2: Sprite Runner */}
        {showSprite && (
          <div className="mx-4 h-8 rounded-md overflow-hidden relative" style={{ background: '#080814' }}>
            {/* Ground line */}
            <div className="absolute bottom-2 left-0 right-0 h-px bg-canvas-accent/30" />

            {/* Terrain gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 h-3"
              style={{ background: 'linear-gradient(to top, rgba(212,167,106,0.15), transparent)' }}
            />

            {/* Node markers */}
            {nodes.map((node, i) => {
              const pct = nodes.length > 1 ? (i / (nodes.length - 1)) * 92 + 4 : 50;
              const isCurrent = node.id === playingNodeId;
              return (
                <div
                  key={node.id}
                  className="absolute bottom-2 rounded-full"
                  style={{
                    left: `${pct}%`,
                    width: isCurrent ? 6 : 4,
                    height: isCurrent ? 6 : 4,
                    background: isCurrent ? '#4ade80' : '#3a3a5c',
                    boxShadow: isCurrent ? '0 0 6px rgba(74,222,128,0.6)' : 'none',
                    transform: 'translateX(-50%)',
                  }}
                />
              );
            })}

            {/* Sprite character */}
            {isPlaying && (
              <div
                className="absolute transition-all duration-200"
                style={{
                  left: `${4 + progress * 0.92}%`,
                  bottom: 6,
                  transform: 'translateX(-50%)',
                }}
              >
                <PixelSprite frame={SPRITE_FRAMES[spriteFrame]} />
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mx-4 mb-2 mt-1 h-0.5 bg-canvas-accent/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #e94560, #fbbf24)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
