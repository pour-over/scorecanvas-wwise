import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { CanvasNode, CanvasEdge, CanvasNodeType, CanvasNodeData, GameProject, GameLevel } from '../types/canvas';
import { DEFAULT_NODE_DATA as defaults } from '../types/canvas';
import {
  PROJECTS,
  PROJECT_LEVELS,
  LEVEL_NODES,
  LEVEL_EDGES,
  DEFAULT_PROJECT_ID,
  DEFAULT_LEVEL_ID,
} from '../data/starter-project';

type ViewMode = 'detailed' | 'simple';

interface VersionSnapshot {
  timestamp: number;
  label: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  projectId: string | null;
  levelId: string | null;
}

interface CanvasStore {
  // Graph state
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: CanvasEdge[]) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;

  // Node operations
  addNode: (type: CanvasNodeType, position: { x: number; y: number }, data?: Partial<CanvasNodeData>) => string;
  updateNodeData: (nodeId: string, data: Partial<CanvasNodeData>) => void;
  removeNode: (nodeId: string) => void;
  connectNodes: (sourceId: string, targetId: string) => void;

  // View
  viewMode: ViewMode;
  toggleViewMode: () => void;

  // Playing
  playingNodeId: string | null;
  setPlayingNodeId: (id: string | null) => void;

  // Project
  projects: GameProject[];
  currentProjectId: string | null;
  currentLevelId: string | null;
  selectedProjectId: string | null;
  selectedLevelId: string | null;
  selectProject: (id: string) => void;
  selectLevel: (id: string) => void;
  loadProject: (projectId: string) => void;
  loadLevel: (levelId: string) => void;

  // Import / dynamic projects
  addProject: (project: GameProject) => void;
  addLevelToProject: (projectId: string, level: GameLevel) => void;

  // Version history
  versionHistory: VersionSnapshot[];
  saveSnapshot: (label?: string) => void;
  restoreSnapshot: (index: number) => void;
  autoSaveEnabled: boolean;
  setAutoSave: (enabled: boolean) => void;

  // Starter project
  loadStarterProject: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) => {
    set((state) => {
      const updated = [...state.nodes];
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          const idx = updated.findIndex((n) => n.id === change.id);
          if (idx >= 0) updated[idx] = { ...updated[idx], position: change.position };
        } else if (change.type === 'remove') {
          const idx = updated.findIndex((n) => n.id === change.id);
          if (idx >= 0) updated.splice(idx, 1);
        } else if (change.type === 'select') {
          const idx = updated.findIndex((n) => n.id === change.id);
          if (idx >= 0) updated[idx] = { ...updated[idx], selected: change.selected };
        }
      }
      return { nodes: updated };
    });
  },
  onEdgesChange: (changes) => {
    set((state) => {
      const updated = [...state.edges];
      for (const change of changes) {
        if (change.type === 'remove') {
          const idx = updated.findIndex((e) => e.id === change.id);
          if (idx >= 0) updated.splice(idx, 1);
        }
      }
      return { edges: updated };
    });
  },

  addNode: (type, position, data) => {
    const id = uuid();
    const nodeData = { ...defaults[type], ...data };
    const node: CanvasNode = {
      id,
      type,
      position,
      data: nodeData,
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
    return id;
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
  },

  connectNodes: (sourceId, targetId) => {
    const edgeId = `e-${sourceId}-${targetId}`;
    set((state) => ({
      edges: [...state.edges, { id: edgeId, source: sourceId, target: targetId }],
    }));
  },

  viewMode: 'detailed',
  toggleViewMode: () =>
    set((state) => ({ viewMode: state.viewMode === 'detailed' ? 'simple' : 'detailed' })),

  playingNodeId: null,
  setPlayingNodeId: (id) => set({ playingNodeId: id }),

  projects: [],
  currentProjectId: null,
  currentLevelId: null,
  selectedProjectId: null,
  selectedLevelId: null,

  selectProject: (id) => set({ selectedProjectId: id, selectedLevelId: null }),
  selectLevel: (id) => set({ selectedLevelId: id }),

  loadProject: (projectId: string) => {
    const levels = PROJECT_LEVELS[projectId];
    if (!levels || levels.length === 0) return;
    const firstLevel = levels[0];
    const nodes = LEVEL_NODES[firstLevel.id] || [];
    const edges = LEVEL_EDGES[firstLevel.id] || [];
    set({
      nodes,
      edges,
      currentProjectId: projectId,
      currentLevelId: firstLevel.id,
      selectedProjectId: projectId,
      selectedLevelId: firstLevel.id,
    });
  },

  loadLevel: (levelId: string) => {
    const nodes = LEVEL_NODES[levelId] || [];
    const edges = LEVEL_EDGES[levelId] || [];
    set({
      nodes,
      edges,
      currentLevelId: levelId,
      selectedLevelId: levelId,
    });
  },

  addProject: (project) => {
    set((state) => ({
      projects: [...state.projects.filter((p) => p.id !== project.id), project],
    }));
  },

  addLevelToProject: (projectId, level) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, levels: [...p.levels.filter((l) => l.id !== level.id), level] }
          : p
      ),
    }));
  },

  versionHistory: [],
  autoSaveEnabled: true,
  setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),

  saveSnapshot: (label) => {
    const state = get();
    const snapshot: VersionSnapshot = {
      timestamp: Date.now(),
      label: label || new Date().toLocaleTimeString(),
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      projectId: state.currentProjectId,
      levelId: state.currentLevelId,
    };
    set((s) => ({
      versionHistory: [...s.versionHistory.slice(-49), snapshot], // keep last 50
    }));
    // Persist to localStorage
    try {
      const history = [...get().versionHistory];
      localStorage.setItem('scorecanvas-version-history', JSON.stringify(history.slice(-20)));
    } catch { /* quota exceeded — silently drop oldest */ }
  },

  restoreSnapshot: (index) => {
    const { versionHistory } = get();
    const snapshot = versionHistory[index];
    if (!snapshot) return;
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      currentProjectId: snapshot.projectId,
      currentLevelId: snapshot.levelId,
    });
  },

  loadStarterProject: () => {
    const nodes = LEVEL_NODES[DEFAULT_LEVEL_ID] || [];
    const edges = LEVEL_EDGES[DEFAULT_LEVEL_ID] || [];
    set({
      nodes,
      edges,
      projects: PROJECTS,
      currentProjectId: DEFAULT_PROJECT_ID,
      currentLevelId: DEFAULT_LEVEL_ID,
      selectedProjectId: DEFAULT_PROJECT_ID,
      selectedLevelId: DEFAULT_LEVEL_ID,
    });
  },
}));
