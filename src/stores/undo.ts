import { create } from 'zustand';
import { useCanvasStore } from './canvas';
import type { CanvasNode, CanvasEdge } from '../types/canvas';

/**
 * Undo/Redo system for ScoreCanvas.
 *
 * Records snapshots of canvas state on every meaningful mutation.
 * Also records WAAPI commands so they can be conceptually "undone"
 * (we can't truly undo in Wwise, but we can reverse the canvas change
 * and queue a compensating WAAPI call).
 */

interface UndoEntry {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  label: string;
  timestamp: number;
  // If this action involved WAAPI, store the reverse operation
  waapiUndo?: {
    type: 'delete' | 'create' | 'setProperty';
    objectPath?: string;
    objectId?: string;
    property?: string;
    previousValue?: unknown;
  };
}

interface UndoStore {
  past: UndoEntry[];
  future: UndoEntry[];
  /** Call before a mutation to snapshot current state */
  pushUndo: (label: string, waapiUndo?: UndoEntry['waapiUndo']) => void;
  /** Undo: restore previous state, push current to future */
  undo: () => void;
  /** Redo: restore next state, push current to past */
  redo: () => void;
  /** Check availability */
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Clear history (e.g., on project switch) */
  clearHistory: () => void;
}

const MAX_UNDO = 100;

function captureState(): Pick<UndoEntry, 'nodes' | 'edges'> {
  const { nodes, edges } = useCanvasStore.getState();
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

function restoreState(entry: UndoEntry) {
  const store = useCanvasStore.getState();
  store.setNodes(entry.nodes);
  store.setEdges(entry.edges);
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  past: [],
  future: [],

  pushUndo: (label, waapiUndo) => {
    const current = captureState();
    const entry: UndoEntry = {
      ...current,
      label,
      timestamp: Date.now(),
      waapiUndo,
    };
    set((s) => ({
      past: [...s.past.slice(-(MAX_UNDO - 1)), entry],
      future: [], // new action clears redo stack
    }));
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    // Save current state to future
    const current = captureState();
    const futureEntry: UndoEntry = {
      ...current,
      label: 'redo point',
      timestamp: Date.now(),
    };

    // Pop the most recent past entry
    const entry = past[past.length - 1];
    const newPast = past.slice(0, -1);

    // Restore the past state
    restoreState(entry);

    // If there's a WAAPI undo, execute it
    if (entry.waapiUndo && (window as any).wwise) {
      executeWaapiUndo(entry.waapiUndo);
    }

    set({ past: newPast, future: [...get().future, futureEntry] });
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    // Save current to past
    const current = captureState();
    const pastEntry: UndoEntry = {
      ...current,
      label: 'undo point',
      timestamp: Date.now(),
    };

    // Pop from future
    const entry = future[future.length - 1];
    const newFuture = future.slice(0, -1);

    restoreState(entry);
    set({ past: [...get().past, pastEntry], future: newFuture });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clearHistory: () => set({ past: [], future: [] }),
}));

/**
 * Execute a compensating WAAPI call to undo a Wwise change.
 * Best-effort — Wwise doesn't have native undo via WAAPI.
 */
async function executeWaapiUndo(op: NonNullable<UndoEntry['waapiUndo']>) {
  const wwise = (window as any).wwise;
  if (!wwise) return;

  try {
    switch (op.type) {
      case 'delete':
        // To undo a create, delete the object
        if (op.objectPath) {
          await wwise.call('ak.wwise.core.object.delete', { object: op.objectPath });
          console.log('[Undo] Deleted Wwise object:', op.objectPath);
        }
        break;
      case 'create':
        // To undo a delete, we'd need to recreate — complex, skip for now
        console.log('[Undo] Cannot recreate deleted Wwise object (not yet implemented)');
        break;
      case 'setProperty':
        // To undo a property change, set back to previous value
        if (op.objectPath && op.property && op.previousValue !== undefined) {
          await wwise.call('ak.wwise.core.object.setProperty', {
            object: op.objectPath,
            property: op.property,
            value: op.previousValue,
          });
          console.log('[Undo] Restored property:', op.property, '=', op.previousValue);
        }
        break;
    }
  } catch (err) {
    console.warn('[Undo] WAAPI undo failed:', err);
  }
}
