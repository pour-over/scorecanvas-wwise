import { useEffect } from 'react';
import { useUndoStore } from '../stores/undo';
import { useCanvasStore } from '../stores/canvas';

/**
 * Global keyboard shortcuts for ScoreCanvas.
 * Ctrl+Z / Cmd+Z = Undo
 * Ctrl+Shift+Z / Cmd+Shift+Z = Redo
 * Ctrl+Y / Cmd+Y = Redo (Windows convention)
 * Ctrl+S / Cmd+S = Save project
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useUndoStore.getState().undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        useUndoStore.getState().redo();
      } else if (e.key === 's') {
        e.preventDefault();
        const pfs = (window as any).projectFS;
        if (pfs?.save) {
          const state = useCanvasStore.getState();
          pfs.save({
            nodes: state.nodes,
            edges: state.edges,
            projectId: state.currentProjectId,
            levelId: state.currentLevelId,
          });
        } else {
          useCanvasStore.getState().saveSnapshot('Manual save');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
