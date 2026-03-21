import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../stores/canvas';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAutoSave() {
  const { nodes, edges, autoSaveEnabled, saveSnapshot } = useCanvasStore();
  const lastSaveRef = useRef<string>('');

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      // Only save if something changed
      const fingerprint = JSON.stringify({ n: nodes.length, e: edges.length, ids: nodes.map(n => n.id).sort().join(',') });
      if (fingerprint === lastSaveRef.current) return;
      if (nodes.length === 0) return;

      lastSaveRef.current = fingerprint;
      saveSnapshot(`Auto-save`);
      console.log('[AutoSave] Snapshot saved —', nodes.length, 'nodes,', edges.length, 'edges');
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [autoSaveEnabled, nodes, edges, saveSnapshot]);

  // Also restore version history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('scorecanvas-version-history');
      if (stored) {
        const history = JSON.parse(stored);
        if (Array.isArray(history) && history.length > 0) {
          useCanvasStore.setState({ versionHistory: history });
        }
      }
    } catch { /* ignore */ }
  }, []);
}
