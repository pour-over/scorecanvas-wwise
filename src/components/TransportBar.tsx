import { useState, useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useAudioStore } from '../stores/audio';
import { audioAssets } from '../data/audio-assets';
import type { MusicStateData } from '../types/canvas';

// Shadow — Siamese cat sprite (8x8, 2 frames)
const SPRITE_FRAMES = [
  // run1
  [
    ['', '', 'b', '', '', 'b', '', ''],
    ['', 'b', 'c', 'c', 'c', 'b', '', ''],
    ['', 'b', 'B', 'c', 'B', 'b', '', ''],
    ['', '', 'b', 'b', 'b', '', '', ''],
    ['', 'c', 'c', 'c', 'c', 'c', '', ''],
    ['', 'c', 'c', 'c', 'c', 'c', 'b', ''],
    ['', 'b', '', '', '', 'b', '', 'b'],
    ['b', '', '', '', 'b', '', '', ''],
  ],
  // run2 (stride)
  [
    ['', '', 'b', '', '', 'b', '', ''],
    ['', 'b', 'c', 'c', 'c', 'b', '', ''],
    ['', 'b', 'B', 'c', 'B', 'b', '', ''],
    ['', '', 'b', 'b', 'b', '', '', ''],
    ['', 'c', 'c', 'c', 'c', 'c', '', ''],
    ['', 'c', 'c', 'c', 'c', 'c', '', 'b'],
    ['', '', 'b', '', 'b', '', 'b', ''],
    ['', 'b', '', '', '', 'b', '', ''],
  ],
];

const COLOR_MAP: Record<string, string> = {
  c: '#f5e6d3', // cream body
  b: '#5c3d2e', // dark chocolate points
  B: '#60a5fa', // blue eyes
};

function PixelSprite({ frame }: { frame: string[][] }) {
  const px = 3;
  return (
    <div style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.7))' }}>
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

/** Look up an audio asset by name (the node's `asset` field matches audioAssets `name`) */
function findAudioFile(assetName: string | undefined): string | undefined {
  if (!assetName) return undefined;
  const match = audioAssets.find(
    (a) => a.name?.toLowerCase() === assetName.toLowerCase()
  );
  return match?.audioFile;
}

export default function TransportBar() {
  const { nodes, edges, playingNodeId, setPlayingNodeId } = useCanvasStore();
  const { volume, setVolume, playbackMode, setPlaybackMode } = useAudioStore();
  const [minimized, setMinimized] = useState(false);
  const [spriteFrame, setSpriteFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showSprite, setShowSprite] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const isPlaying = playingNodeId !== null;

  // Get all MusicState nodes in order
  const musicNodes = nodes.filter((n) => n.type === 'musicState');

  // Find next connected MusicState node via edges
  const findNextMusicNode = useCallback(
    (currentId: string): string | null => {
      // Find edges from the current node
      const outEdges = edges.filter((e) => e.source === currentId);
      for (const edge of outEdges) {
        // Check if the target is a MusicState node
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode && targetNode.type === 'musicState') {
          return targetNode.id;
        }
        // If target is a transition node, follow its outgoing edges
        if (targetNode && targetNode.type === 'transition') {
          const transOutEdges = edges.filter((e2) => e2.source === targetNode.id);
          for (const te of transOutEdges) {
            const nextNode = nodes.find((n) => n.id === te.target);
            if (nextNode && nextNode.type === 'musicState') {
              return nextNode.id;
            }
          }
        }
      }
      // Fallback in Full Score mode: go to next musicState node in order
      if (playbackMode === 'full') {
        const idx = musicNodes.findIndex((n) => n.id === currentId);
        if (idx >= 0 && idx < musicNodes.length - 1) {
          return musicNodes[idx + 1].id;
        }
      }
      return null;
    },
    [edges, nodes, musicNodes, playbackMode]
  );

  // Animate sprite frames
  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => setSpriteFrame((f) => (f + 1) % 2), 220);
    return () => clearInterval(iv);
  }, [isPlaying]);

  // Update audio volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Track real audio progress via requestAnimationFrame
  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused && audio.duration && isFinite(audio.duration)) {
      const pct = (audio.currentTime / audio.duration) * 100;
      setProgress(pct);
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  // Start/stop progress tracking
  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, updateProgress]);

  // Play audio when playingNodeId changes
  useEffect(() => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }

    if (!playingNodeId) {
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const node = nodes.find((n) => n.id === playingNodeId);
    if (!node) return;

    const nodeData = node.data as unknown as MusicStateData;
    const audioFile = findAudioFile(nodeData.asset);
    if (!audioFile) {
      // No audio file found, skip to next or stop
      const nextId = findNextMusicNode(playingNodeId);
      if (nextId && playbackMode === 'full') {
        // Small delay to avoid infinite loops for nodes with no audio
        const timeout = setTimeout(() => setPlayingNodeId(nextId), 200);
        return () => clearTimeout(timeout);
      } else {
        setPlayingNodeId(null);
      }
      return;
    }

    const audio = new Audio(audioFile);
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      const nextId = findNextMusicNode(playingNodeId);
      if (nextId && playbackMode === 'full') {
        setPlayingNodeId(nextId);
      } else {
        setPlayingNodeId(null);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
      }
    });

    audio.addEventListener('error', () => {
      // Audio failed to load, advance or stop
      const nextId = findNextMusicNode(playingNodeId);
      if (nextId && playbackMode === 'full') {
        setPlayingNodeId(nextId);
      } else {
        setPlayingNodeId(null);
      }
    });

    audio.play().catch(() => {
      // Autoplay blocked or file not found
      setPlayingNodeId(null);
    });

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingNodeId]);

  const handlePlayStop = () => {
    if (isPlaying) {
      setPlayingNodeId(null);
    } else if (musicNodes.length > 0) {
      setPlayingNodeId(musicNodes[0].id);
    }
  };

  const formatTime = (secs: number): string => {
    if (!isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentNodeLabel = isPlaying
    ? (nodes.find((n) => n.id === playingNodeId)?.data as unknown as MusicStateData)?.label || 'Playing'
    : 'Stopped';

  if (minimized) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-transport/95 border border-canvas-accent/60 rounded-lg shadow-xl backdrop-blur-md">
          <button onClick={handlePlayStop} className="text-[10px]">
            {isPlaying ? '⏹' : '▶'}
          </button>
          <span className="text-[10px] text-canvas-text font-mono">
            {isPlaying ? currentNodeLabel : 'Stopped'}
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
              {currentNodeLabel}
            </span>
            {isPlaying && duration > 0 && (
              <span className="text-[9px] text-canvas-muted font-mono shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
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
            🐱
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
            {musicNodes.map((node, i) => {
              const pct = musicNodes.length > 1 ? (i / (musicNodes.length - 1)) * 92 + 4 : 50;
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

            {/* Sprite character — Shadow */}
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

            {/* Shadow label */}
            {showSprite && (
              <div
                className="absolute text-canvas-muted/50 font-mono select-none"
                style={{ fontSize: 7, right: 6, top: 2 }}
              >
                Shadow
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
