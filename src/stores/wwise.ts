import { create } from 'zustand';
import type { WwiseProjectInfo, WwiseObject } from '../types/wwise';

interface WwiseStore {
  // Connection
  connected: boolean;
  connecting: boolean;
  projectInfo: WwiseProjectInfo | null;
  error: string | null;

  // Actions
  connect: (url?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  checkStatus: () => Promise<void>;

  // Wwise browser
  hierarchy: WwiseObject[];
  setHierarchy: (objects: WwiseObject[]) => void;

  // Sync state
  syncingCount: number;
  setSyncingCount: (n: number) => void;
}

// Type-safe window.wwise access
declare global {
  interface Window {
    wwise?: {
      connect: (url?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      disconnect: () => Promise<{ success: boolean; error?: string }>;
      call: (uri: string, args?: object, options?: object) => Promise<{ success: boolean; data?: any; error?: string }>;
      status: () => Promise<{ connected: boolean; projectInfo: any }>;
    };
    claude?: {
      stream: (messages: Array<{ role: string; content: string }>) => Promise<{ success: boolean; error?: string }>;
      onChunk: (callback: (chunk: string) => void) => void;
      onDone: (callback: (fullText: string) => void) => void;
      onError: (callback: (error: string) => void) => void;
      removeAllListeners: () => void;
    };
    kie?: {
      cover: (req: any) => Promise<{ success: boolean; taskId?: string; error?: string }>;
      status: (taskId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      generate: (req: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      onProgress: (callback: (status: string) => void) => void;
    };
    audioAnalysis?: {
      analyze: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    };
    wwiseImport?: {
      fromXml: (projectPath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      fromWaapi: () => Promise<{ success: boolean; data?: any; error?: string }>;
      getManifest: (projectPath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    };
    projectFS?: {
      save: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      saveAs: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      open: () => Promise<{ success: boolean; data?: any; filePath?: string; error?: string }>;
      newProject: (name: string) => Promise<{ success: boolean; data?: any }>;
      getRecent: () => Promise<{ success: boolean; data?: any[] }>;
      scanWwiseOriginals: (path: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
    };
    electronAPI?: {
      platform: string;
    };
  }
}

export const useWwiseStore = create<WwiseStore>((set) => ({
  connected: false,
  connecting: false,
  projectInfo: null,
  error: null,

  connect: async (url) => {
    set({ connecting: true, error: null });
    try {
      // Read saved URL from settings
      const savedSettings = localStorage.getItem('scorecanvas-settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      const connectUrl = url || settings.waapiUrl || undefined;

      if (window.wwise) {
        const result = await window.wwise.connect(connectUrl);
        if (result.success) {
          set({ connected: true, projectInfo: result.data, connecting: false });
        } else {
          const errorMsg = result.error || 'Connection failed';
          set({ error: errorMsg, connecting: false });
          console.warn('[Wwise] Connection failed:', errorMsg);
        }
      } else {
        // Browser dev mode — simulate connection
        set({
          connected: true,
          connecting: false,
          projectInfo: {
            name: 'Demo Project (Browser Mode)',
            version: '2024.1.0',
            platform: 'Web',
            directories: {},
          },
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown connection error';
      set({ error: errorMsg, connecting: false });
      console.error('[Wwise] Connection error:', errorMsg);
    }
  },

  disconnect: async () => {
    if (window.wwise) {
      await window.wwise.disconnect();
    }
    set({ connected: false, projectInfo: null, error: null });
  },

  checkStatus: async () => {
    if (window.wwise) {
      const status = await window.wwise.status();
      set({ connected: status.connected, projectInfo: status.projectInfo });
    }
  },

  hierarchy: [],
  setHierarchy: (objects) => set({ hierarchy: objects }),

  syncingCount: 0,
  setSyncingCount: (n) => set({ syncingCount: n }),
}));
