import { useState } from 'react';
import { useCanvasStore } from '../stores/canvas';
import { useWwiseStore } from '../stores/wwise';

interface ImportResult {
  projectName: string;
  nodes: any[];
  edges: any[];
  requiredAssets: any[];
  hierarchy: any[];
  warnings: string[];
}

interface Props {
  onClose: () => void;
}

const COL_WIDTH = 340;
const ROW_HEIGHT = 220;

export default function ImportModal({ onClose }: Props) {
  const [mode, setMode] = useState<'xml' | 'waapi'>('xml');
  const [projectPath, setProjectPath] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [manifest, setManifest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connected } = useWwiseStore();
  const { addNode, connectNodes } = useCanvasStore();

  const handleImportXml = async () => {
    if (!projectPath.trim()) {
      setError('Enter a path to a .wproj or .wwu file');
      return;
    }
    setImporting(true);
    setError(null);

    try {
      if (window.wwiseImport) {
        const res = await window.wwiseImport.fromXml(projectPath);
        if (res.success && res.data) {
          setResult(res.data);
          // Also get the manifest
          const mRes = await window.wwiseImport.getManifest(projectPath);
          if (mRes.success && mRes.data?.manifest) {
            setManifest(mRes.data.manifest);
          }
        } else {
          setError(res.error || 'Import failed');
        }
      } else {
        // Browser demo mode
        setResult({
          projectName: 'Demo Import',
          nodes: [
            { id: 'd1', name: 'Combat_Switch', type: 'musicState', wwiseType: 'MusicSwitchContainer', wwisePath: '\\Interactive Music\\Combat_Switch', wwiseId: 'd1', properties: {}, children: ['d2', 'd3'] },
            { id: 'd2', name: 'Combat_Low', type: 'musicState', wwiseType: 'MusicSegment', wwisePath: '\\Interactive Music\\Combat_Switch\\Combat_Low', wwiseId: 'd2', parentId: 'd1', properties: { Tempo: '120' }, children: [] },
            { id: 'd3', name: 'Combat_High', type: 'musicState', wwiseType: 'MusicSegment', wwisePath: '\\Interactive Music\\Combat_Switch\\Combat_High', wwiseId: 'd3', parentId: 'd1', properties: { Tempo: '140' }, children: [] },
            { id: 'd4', name: 'ThreatLevel', type: 'parameter', wwiseType: 'GameParameter', wwisePath: '\\Game Parameters\\ThreatLevel', wwiseId: 'd4', properties: { Min: '0', Max: '100' }, children: [] },
          ],
          edges: [
            { source: 'd1', target: 'd2' },
            { source: 'd1', target: 'd3' },
          ],
          requiredAssets: [
            { name: 'combat_low_drums', originalPath: 'Originals/SFX/combat_low_drums.wav', wwiseObjectPath: '\\Combat_Low', category: 'wav', expectedLocation: 'Originals/SFX/combat_low_drums.wav', found: false },
            { name: 'combat_high_full', originalPath: 'Originals/SFX/combat_high_full.wav', wwiseObjectPath: '\\Combat_High', category: 'wav', expectedLocation: 'Originals/SFX/combat_high_full.wav', found: false },
          ],
          hierarchy: [],
          warnings: ['Demo mode — no actual files parsed'],
        });
        setManifest('# Demo Asset Manifest\n\n- combat_low_drums.wav — MISSING\n- combat_high_full.wav — MISSING');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleImportWaapi = async () => {
    setImporting(true);
    setError(null);

    try {
      if (window.wwiseImport) {
        const res = await window.wwiseImport.fromWaapi();
        if (res.success && res.data) {
          setResult(res.data);
        } else {
          setError(res.error || 'Import failed');
        }
      } else {
        // Browser demo mode
        setResult({
          projectName: 'CTRL+ALT+DEFEAT (WAAPI Demo)',
          nodes: [
            { id: 'w1', name: 'Interactive Music Hierarchy', type: 'musicState', wwiseType: 'MusicSwitchContainer', wwisePath: '\\Interactive Music Hierarchy\\Main', wwiseId: 'w1', properties: {}, children: ['w2', 'w3', 'w4'] },
            { id: 'w2', name: 'Exploration_Switch', type: 'musicState', wwiseType: 'MusicSwitchContainer', wwisePath: '\\Interactive Music Hierarchy\\Main\\Exploration', wwiseId: 'w2', parentId: 'w1', properties: {}, children: ['w5'] },
            { id: 'w3', name: 'Combat_Playlist', type: 'musicState', wwiseType: 'MusicPlaylistContainer', wwisePath: '\\Interactive Music Hierarchy\\Main\\Combat', wwiseId: 'w3', parentId: 'w1', properties: {}, children: ['w6', 'w7'] },
            { id: 'w4', name: 'Boss_Segment', type: 'musicState', wwiseType: 'MusicSegment', wwisePath: '\\Interactive Music Hierarchy\\Main\\Boss', wwiseId: 'w4', parentId: 'w1', properties: { Tempo: '160' }, children: [] },
            { id: 'w5', name: 'Explore_Calm', type: 'musicState', wwiseType: 'MusicSegment', wwisePath: '\\Interactive Music Hierarchy\\Main\\Exploration\\Calm', wwiseId: 'w5', parentId: 'w2', properties: { Tempo: '85' }, children: [] },
            { id: 'w6', name: 'Combat_Low', type: 'musicState', wwiseType: 'MusicSegment', wwisePath: '\\Interactive Music Hierarchy\\Main\\Combat\\Low', wwiseId: 'w6', parentId: 'w3', properties: { Tempo: '120' }, children: [] },
            { id: 'w7', name: 'Combat_High', type: 'musicState', wwiseType: 'MusicSegment', wwisePath: '\\Interactive Music Hierarchy\\Main\\Combat\\High', wwiseId: 'w7', parentId: 'w3', properties: { Tempo: '140' }, children: [] },
            { id: 'w8', name: 'ThreatLevel', type: 'parameter', wwiseType: 'GameParameter', wwisePath: '\\Game Parameters\\ThreatLevel', wwiseId: 'w8', properties: { Min: '0', Max: '100' }, children: [] },
            { id: 'w9', name: 'Play_Combat', type: 'event', wwiseType: 'Event', wwisePath: '\\Events\\Play_Combat', wwiseId: 'w9', properties: {}, children: [] },
          ],
          edges: [
            { source: 'w1', target: 'w2' },
            { source: 'w1', target: 'w3' },
            { source: 'w1', target: 'w4' },
            { source: 'w2', target: 'w5' },
            { source: 'w3', target: 'w6' },
            { source: 'w3', target: 'w7' },
          ],
          requiredAssets: [],
          hierarchy: [],
          warnings: ['Demo mode — simulating WAAPI pull from Wwise. Connect Wwise for real data.'],
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handlePlaceOnCanvas = () => {
    if (!result) return;

    // BFS layout — group by depth, spread across columns
    const idMap = new Map<string, string>(); // wwiseId -> canvasNodeId
    const roots = result.nodes.filter(
      (n) => !n.parentId || !result.nodes.find((p: any) => p.id === n.parentId)
    );

    let col = 0;
    let queue = roots.map((n: any, i: number) => ({ node: n, depth: 0, row: i }));

    while (queue.length > 0) {
      const batch = queue.filter((q) => q.depth === col);
      const rest = queue.filter((q) => q.depth !== col);

      for (let i = 0; i < batch.length; i++) {
        const { node } = batch[i];
        const x = 80 + col * COL_WIDTH;
        const y = 100 + i * ROW_HEIGHT;

        const canvasId = addNode(node.type, { x, y }, {
          label: node.name,
          wwisePath: node.wwisePath,
          wwiseId: node.wwiseId,
          ...(node.properties.Tempo ? { bpm: parseFloat(node.properties.Tempo) } : {}),
        });
        idMap.set(node.id, canvasId);

        // Enqueue children
        const children = result.nodes.filter((n: any) => n.parentId === node.id);
        for (let j = 0; j < children.length; j++) {
          rest.push({ node: children[j], depth: col + 1, row: j });
        }
      }

      queue = rest;
      col++;
      if (col > 20) break; // safety
    }

    // Create edges
    for (const edge of result.edges) {
      const srcId = idMap.get(edge.source);
      const tgtId = idMap.get(edge.target);
      if (srcId && tgtId) {
        connectNodes(srcId, tgtId);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-panel border border-canvas-accent rounded-xl shadow-2xl w-[560px] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-accent">
          <div>
            <h2 className="text-sm font-bold text-canvas-text">Import Wwise Project</h2>
            <p className="text-[10px] text-canvas-muted mt-0.5">
              Recreate structure on canvas from XML or live Wwise
            </p>
          </div>
          <button onClick={onClose} className="text-canvas-muted hover:text-canvas-text text-lg">x</button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('xml')}
              className={`flex-1 px-3 py-2 text-[10px] font-bold rounded border transition-colors ${
                mode === 'xml'
                  ? 'bg-canvas-highlight/20 text-canvas-highlight border-canvas-highlight/40'
                  : 'bg-canvas-bg text-canvas-muted border-canvas-accent hover:text-canvas-text'
              }`}
            >
              From .wproj / .wwu File
            </button>
            <button
              onClick={() => setMode('waapi')}
              className={`flex-1 px-3 py-2 text-[10px] font-bold rounded border transition-colors ${
                mode === 'waapi'
                  ? 'bg-canvas-highlight/20 text-canvas-highlight border-canvas-highlight/40'
                  : 'bg-canvas-bg text-canvas-muted border-canvas-accent hover:text-canvas-text'
              }`}
            >
              From Live Wwise (WAAPI)
            </button>
          </div>

          {/* XML Import */}
          {mode === 'xml' && (
            <div className="space-y-2">
              <label className="text-[10px] text-canvas-muted">Project file path (.wproj or .wwu)</label>
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/path/to/MyProject.wproj"
                className="w-full bg-canvas-bg border border-canvas-accent rounded px-2.5 py-1.5 text-[10px] text-canvas-text font-mono placeholder:text-canvas-muted/30 focus:outline-none focus:border-canvas-highlight/50"
              />
              <button
                onClick={handleImportXml}
                disabled={importing}
                className="w-full px-3 py-2 text-[10px] font-bold text-white bg-canvas-highlight/80 border border-canvas-highlight rounded hover:bg-canvas-highlight disabled:opacity-40 transition-colors"
              >
                {importing ? 'Parsing...' : 'Import from XML'}
              </button>
            </div>
          )}

          {/* WAAPI Import */}
          {mode === 'waapi' && (
            <div className="space-y-2">
              <div className={`px-3 py-2 rounded border text-[10px] ${
                connected
                  ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                  : !window.wwiseImport
                    ? 'bg-amber-900/20 border-amber-500/30 text-amber-400'
                    : 'bg-red-900/20 border-red-500/30 text-red-400'
              }`}>
                {connected
                  ? 'Wwise connected — ready to pull project hierarchy'
                  : !window.wwiseImport
                    ? 'Browser demo mode — will simulate a WAAPI pull'
                    : 'Not connected to Wwise. Connect first via the sidebar.'}
              </div>
              <button
                onClick={handleImportWaapi}
                disabled={importing || (!!window.wwiseImport && !connected)}
                className="w-full px-3 py-2 text-[10px] font-bold text-white bg-canvas-highlight/80 border border-canvas-highlight rounded hover:bg-canvas-highlight disabled:opacity-40 transition-colors"
              >
                {importing ? 'Querying Wwise...' : 'Pull from Live Wwise'}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
              <div className="text-[10px] text-red-400">{error}</div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="bg-canvas-bg rounded-lg border border-canvas-accent p-3">
                <div className="text-[11px] font-bold text-canvas-text mb-2">{result.projectName}</div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="text-center">
                    <div className="text-lg font-bold text-canvas-highlight">{result.nodes.length}</div>
                    <div className="text-canvas-muted">Objects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">
                      {result.requiredAssets.filter((a: any) => a.found).length}
                    </div>
                    <div className="text-canvas-muted">Assets Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">
                      {result.requiredAssets.filter((a: any) => !a.found).length}
                    </div>
                    <div className="text-canvas-muted">Missing</div>
                  </div>
                </div>
              </div>

              {/* Object list */}
              <div className="bg-canvas-bg rounded border border-canvas-accent p-2 max-h-40 overflow-y-auto">
                <div className="text-[9px] font-mono uppercase tracking-widest text-canvas-muted mb-1">Imported Objects</div>
                {result.nodes.slice(0, 30).map((n: any) => (
                  <div key={n.id} className="flex items-center gap-1.5 py-0.5 text-[9px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      n.type === 'musicState' ? 'bg-green-400' :
                      n.type === 'parameter' ? 'bg-purple-400' :
                      n.type === 'event' ? 'bg-cyan-400' :
                      n.type === 'stinger' ? 'bg-orange-400' : 'bg-canvas-muted'
                    }`} />
                    <span className="text-canvas-text">{n.name}</span>
                    <span className="text-canvas-muted/40 ml-auto">{n.wwiseType}</span>
                  </div>
                ))}
              </div>

              {/* Missing assets */}
              {result.requiredAssets.filter((a: any) => !a.found).length > 0 && (
                <div className="bg-amber-900/10 rounded border border-amber-500/20 p-2 max-h-32 overflow-y-auto">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400 mb-1">
                    Missing Assets — You Need These Files
                  </div>
                  {result.requiredAssets.filter((a: any) => !a.found).map((a: any, i: number) => (
                    <div key={i} className="py-0.5 text-[9px]">
                      <span className="text-amber-300 font-mono">{a.name}.{a.category}</span>
                      <span className="text-canvas-muted/40 ml-2">→ {a.expectedLocation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="text-[9px] text-canvas-muted/50 space-y-0.5">
                  {result.warnings.map((w: string, i: number) => (
                    <div key={i}>Warning: {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-canvas-accent flex justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[10px] text-canvas-muted border border-canvas-accent rounded hover:text-canvas-text transition-colors"
          >
            Cancel
          </button>
          {result && (
            <button
              onClick={handlePlaceOnCanvas}
              className="px-4 py-1.5 text-[10px] font-bold text-white bg-emerald-600/80 border border-emerald-500 rounded hover:bg-emerald-600 transition-colors"
            >
              Place {result.nodes.length} Objects on Canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
