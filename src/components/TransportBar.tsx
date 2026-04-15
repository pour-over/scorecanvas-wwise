import { useState, useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useAudioStore } from '../stores/audio';
import { audioAssets } from '../data/audio-assets';
import type { MusicStateData, ParameterData } from '../types/canvas';

// Shadow — Siamese cat sprite (8x8, 2 frames)
const SPRITE_FRAMES = [
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
  c: '#f5e6d3',
  b: '#5c3d2e',
  B: '#60a5fa',
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

  // --- State/Switch selector ---
  const musicNodes = nodes.filter((n) => n.type === 'musicState');
  const paramNodes = nodes.filter((n) => n.type === 'parameter');

  // RTPC fader state: which parameter is selected + current fader value
  const [selectedRtpcId, setSelectedRtpcId] = useState<string | null>(null);
  const [rtpcValue, setRtpcValue] = useState(50);

  // When selecting a param, init the fader to its default
  useEffect(() => {
    if (selectedRtpcId) {
      const paramNode = paramNodes.find((n) => n.id === selectedRtpcId);
      if (paramNode) {
        const pd = paramNode.data as unknown as ParameterData;
        setRtpcValue(pd.defaultValue);
      }
    }
  }, [selectedRtpcId]);

  // Send RTPC value to Wwise when fader changes
  const handleRtpcChange = useCallback(
    async (value: number) => {
      setRtpcValue(value);
      if (!selectedRtpcId) return;
      const paramNode = paramNodes.find((n) => n.id === selectedRtpcId);
      if (!paramNode) return;
      const pd = paramNode.data as unknown as ParameterData;

      // Update node data visually
      useCanvasStore.getState().updateNodeData(selectedRtpcId, { currentValue: value });

      // Push to Wwise if connected
      if ((window as any).wwise) {
        try {
          await (window as any).wwise.call('ak.soundengine.setRTPCValue', {
            rtpc: pd.paramName,
            value,
          });
        } catch {
          // Not connected to runtime — that's ok
        }
      }
    },
    [selectedRtpcId, paramNodes]
  );

  // Find next connected MusicState node via edges
  const findNextMusicNode = useCallback(
    (currentId: string): string | null => {
      const outEdges = edges.filter((e) => e.source === currentId);
      for (const edge of outEdges) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode && targetNode.type === 'musicState') return targetNode.id;
        if (targetNode && targetNode.type === 'transition') {
          const transOutEdges = edges.filter((e2) => e2.source === targetNode.id);
          for (const te of transOutEdges) {
            const nextNode = nodes.find((n) => n.id === te.target);
            if (nextNode && nextNode.type === 'musicState') return nextNode.id;
          }
        }
      }
      if (playbackMode === 'full') {
        const idx = musicNodes.findIndex((n) => n.id === currentId);
        if (idx >= 0 && idx < musicNodes.length - 1) return musicNodes[idx + 1].id;
      }
      return null;
    },
    [edges, nodes, musicNodes, playbackMode]
  );

  // Animate sprite
  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => setSpriteFrame((f) => (f + 1) % 2), 220);
    return () => clearInterval(iv);
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused && audio.duration && isFinite(audio.duration)) {
      setProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  useEffect(() => {
    if (isPlaying) rafRef.current = requestAnimationFrame(updateProgress);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, updateProgress]);

  // Play audio when playingNodeId changes
  useEffect(() => {
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
      const nextId = findNextMusicNode(playingNodeId);
      if (nextId && playbackMode === 'full') {
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
      const nextId = findNextMusicNode(playingNodeId);
      if (nextId && playbackMode === 'full') {
        setPlayingNodeId(nextId);
      } else {
        setPlayingNodeId(null);
      }
    });

    audio.play().catch(() => setPlayingNodeId(null));

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

  const selectedRtpc = paramNodes.find((n) => n.id === selectedRtpcId);
  const selectedRtpcData = selectedRtpc ? (selectedRtpc.data as unknown as ParameterData) : null;

  if (minimized) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2.5 px-4 py-2 bg-transport/95 border border-white/[0.06] rounded-xl shadow-2xl backdrop-blur-md">
          <button onClick={handlePlayStop} className="text-[12px]">
            {isPlaying ? '⏹' : '▶'}
          </button>
          <span className="text-[10px] text-canvas-text font-mono">
            {isPlaying ? currentNodeLabel : 'Stopped'}
          </span>
          <button
            onClick={() => setMinimized(false)}
            className="text-canvas-muted hover:text-canvas-text text-[10px] transition-colors"
          >
            ▲
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50" style={{ minWidth: 640, maxWidth: 860 }}>
      <div className="bg-transport/95 border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-md">
        {/* Row 1: Main Controls */}
        <div className="flex items-center gap-3 px-5 py-2.5">
          {/* Play/Stop */}
          <button
            onClick={handlePlayStop}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
              isPlaying
                ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25 shadow-inner'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <span className="text-[14px]">{isPlaying ? '⏹' : '▶'}</span>
          </button>

          {/* Now Playing */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isPlaying && (
              <div className="relative shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
              </div>
            )}
            <span className="text-[11px] text-canvas-text font-medium truncate">
              {currentNodeLabel}
            </span>
            {isPlaying && duration > 0 && (
              <span className="text-[9px] text-canvas-muted font-mono shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          {/* State/Switch Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-mono uppercase tracking-widest text-canvas-muted/50">State</span>
            <select
              value={playingNodeId || ''}
              onChange={(e) => {
                if (e.target.value) setPlayingNodeId(e.target.value);
              }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[10px] text-canvas-text font-medium focus:outline-none focus:border-canvas-highlight/30 appearance-none cursor-pointer min-w-[100px]"
            >
              <option value="">Select...</option>
              {musicNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {(n.data as unknown as MusicStateData).label}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="w-px h-7 bg-white/[0.06]" />

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-canvas-muted/60" strokeLinecap="round">
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
              className="w-16 h-1 accent-canvas-highlight cursor-pointer"
            />
            <span className="text-[8px] font-mono text-canvas-muted/50 w-6 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-7 bg-white/[0.06]" />

          {/* Wwise Transport */}
          {(window as any).wwise && (
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  const node = nodes.find((n) => n.id === playingNodeId);
                  const wwisePath = node ? (node.data as any).wwisePath : null;
                  if (wwisePath && (window as any).wwise) {
                    await (window as any).wwise.call('ak.wwise.core.transport.executeAction', {
                      action: 'play', object: wwisePath,
                    });
                  }
                }}
                className="px-2 py-1 text-[9px] font-semibold rounded-lg border bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/15 transition-colors"
                title="Play in Wwise"
              >
                Wwise ▶
              </button>
              <button
                onClick={async () => {
                  if ((window as any).wwise) {
                    await (window as any).wwise.call('ak.wwise.core.transport.executeAction', { action: 'stop' });
                  }
                }}
                className="px-2 py-1 text-[9px] font-semibold rounded-lg border bg-white/[0.03] text-canvas-muted border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                title="Stop Wwise"
              >
                ⏹
              </button>
            </div>
          )}

          {/* Mode Toggle */}
          <button
            onClick={() => setPlaybackMode(playbackMode === 'full' ? 'transition' : 'full')}
            className={`px-2.5 py-1 text-[9px] font-semibold rounded-lg border transition-all duration-200 ${
              playbackMode === 'transition'
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {playbackMode === 'transition' ? 'Transition' : 'Full Score'}
          </button>

          {/* Sprite Toggle */}
          <button
            onClick={() => setShowSprite(!showSprite)}
            className="text-[12px] text-canvas-muted/50 hover:text-canvas-muted transition-colors"
          >
            🐱
          </button>

          {/* Minimize */}
          <button
            onClick={() => setMinimized(true)}
            className="text-canvas-muted/40 hover:text-canvas-muted transition-colors text-[10px]"
          >
            ▼
          </button>
        </div>

        {/* Row 2: RTPC Fader */}
        {paramNodes.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-1.5 border-t border-white/[0.04]">
            <span className="text-[8px] font-mono uppercase tracking-widest text-canvas-muted/40">RTPC</span>
            <select
              value={selectedRtpcId || ''}
              onChange={(e) => setSelectedRtpcId(e.target.value || null)}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-0.5 text-[10px] text-purple-400 font-mono focus:outline-none focus:border-purple-500/30 appearance-none cursor-pointer min-w-[100px]"
            >
              <option value="">None</option>
              {paramNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {(n.data as unknown as ParameterData).paramName || (n.data as unknown as ParameterData).label}
                </option>
              ))}
            </select>

            {selectedRtpcData && (
              <>
                <span className="text-[9px] font-mono text-canvas-muted/40">
                  {selectedRtpcData.minValue}
                </span>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={selectedRtpcData.minValue}
                    max={selectedRtpcData.maxValue}
                    step={1}
                    value={rtpcValue}
                    onChange={(e) => handleRtpcChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-purple-500 cursor-pointer"
                  />
                </div>
                <span className="text-[9px] font-mono text-canvas-muted/40">
                  {selectedRtpcData.maxValue}
                </span>
                <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
                  <span className="text-[10px] font-mono font-bold text-purple-400">
                    {rtpcValue}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Row 3: Sprite Runner */}
        {showSprite && (
          <div className="mx-5 h-8 rounded-lg overflow-hidden relative" style={{ background: '#080812' }}>
            <div className="absolute bottom-2 left-0 right-0 h-px bg-white/[0.06]" />
            <div
              className="absolute bottom-0 left-0 right-0 h-3"
              style={{ background: 'linear-gradient(to top, rgba(212,167,106,0.1), transparent)' }}
            />

            {musicNodes.map((node, i) => {
              const pct = musicNodes.length > 1 ? (i / (musicNodes.length - 1)) * 92 + 4 : 50;
              const isCurrent = node.id === playingNodeId;
              return (
                <div
                  key={node.id}
                  className="absolute bottom-2 rounded-full transition-all duration-300"
                  style={{
                    left: `${pct}%`,
                    width: isCurrent ? 6 : 3,
                    height: isCurrent ? 6 : 3,
                    background: isCurrent ? '#4ade80' : '#2a2a4a',
                    boxShadow: isCurrent ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
                    transform: 'translateX(-50%)',
                  }}
                />
              );
            })}

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

            {showSprite && (
              <div
                className="absolute text-canvas-muted/30 font-mono select-none"
                style={{ fontSize: 7, right: 6, top: 2 }}
              >
                Shadow
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mx-5 mb-2.5 mt-1.5 h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #e94560, #a855f7)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
