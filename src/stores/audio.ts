import { create } from 'zustand';

interface AudioStore {
  volume: number;
  isPlaying: boolean;
  currentAsset: string | null;
  playbackMode: 'full' | 'transition';

  setVolume: (v: number) => void;
  setPlaying: (playing: boolean, asset?: string) => void;
  setPlaybackMode: (mode: 'full' | 'transition') => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  volume: 0.6,
  isPlaying: false,
  currentAsset: null,
  playbackMode: 'full',

  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setPlaying: (playing, asset) =>
    set({ isPlaying: playing, currentAsset: asset || null }),
  setPlaybackMode: (mode) => set({ playbackMode: mode }),
}));
