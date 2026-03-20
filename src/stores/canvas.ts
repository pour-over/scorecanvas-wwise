import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { CanvasNode, CanvasEdge, CanvasNodeType, CanvasNodeData, GameProject, GameLevel, DEFAULT_NODE_DATA } from '../types/canvas';
import { DEFAULT_NODE_DATA as defaults } from '../types/canvas';
import { starterProject, starterNodes, starterEdges } from '../data/starter-project';

type ViewMode = 'detailed' | 'simple';

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
  selectedProjectId: string | null;
  selectedLevelId: string | null;
  selectProject: (id: string) => void;
  selectLevel: (id: string) => void;

  // Starter project
  loadStarterProject: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) => {
    // Apply React Flow node changes
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
  selectedProjectId: null,
  selectedLevelId: null,
  selectProject: (id) => set({ selectedProjectId: id, selectedLevelId: null }),
  selectLevel: (id) => set({ selectedLevelId: id }),

  loadStarterProject: () => {
    const level = starterProject.levels[0];
    set({
      nodes: starterNodes,
      edges: starterEdges,
      projects: [starterProject],
      selectedProjectId: starterProject.id,
      selectedLevelId: level?.id ?? null,
    });
  },
}));
