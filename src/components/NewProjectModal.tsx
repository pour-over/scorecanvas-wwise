import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCanvasStore } from '../stores/canvas';
import { useUndoStore } from '../stores/undo';
import type { GameProject, GameLevel } from '../types/canvas';

interface Props {
  onClose: () => void;
}

export default function NewProjectModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [levelName, setLevelName] = useState('Main');
  const { addProject, setNodes, setEdges } = useCanvasStore();

  const handleCreate = () => {
    if (!name.trim()) return;

    const projectId = `proj-${uuid().slice(0, 8)}`;
    const levelId = `lvl-${uuid().slice(0, 8)}`;

    const level: GameLevel = {
      id: levelId,
      name: levelName || 'Main',
      subtitle: '',
      region: '',
      nodes: [],
      edges: [],
      assets: [],
    };

    const project: GameProject = {
      id: projectId,
      name: name.trim(),
      subtitle: subtitle.trim(),
      levels: [level],
    };

    // Clear undo history for new project
    useUndoStore.getState().clearHistory();

    // Add project and switch to it
    addProject(project);
    setNodes([]);
    setEdges([]);
    useCanvasStore.setState({
      currentProjectId: projectId,
      currentLevelId: levelId,
      selectedProjectId: projectId,
      selectedLevelId: levelId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-panel border border-canvas-accent rounded-lg w-[400px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-canvas-accent">
          <h2 className="text-sm font-bold text-canvas-text">New Project</h2>
          <p className="text-[10px] text-canvas-muted mt-0.5">Create a new adaptive music project</p>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-canvas-muted block mb-1">
              Project Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g., Dark Souls III"
              className="w-full bg-canvas-bg border border-canvas-accent rounded px-3 py-2 text-[12px] text-canvas-text placeholder:text-canvas-muted/40 focus:outline-none focus:border-canvas-highlight/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-canvas-muted block mb-1">
              Subtitle
            </label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., Adaptive Combat Music System"
              className="w-full bg-canvas-bg border border-canvas-accent rounded px-3 py-2 text-[12px] text-canvas-text placeholder:text-canvas-muted/40 focus:outline-none focus:border-canvas-highlight/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-canvas-muted block mb-1">
              First Level / Scene
            </label>
            <input
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              placeholder="e.g., Main Menu"
              className="w-full bg-canvas-bg border border-canvas-accent rounded px-3 py-2 text-[12px] text-canvas-text placeholder:text-canvas-muted/40 focus:outline-none focus:border-canvas-highlight/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-canvas-accent flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[11px] font-semibold text-canvas-muted hover:text-canvas-text rounded border border-canvas-accent hover:bg-canvas-accent/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-[11px] font-bold rounded border transition-colors bg-canvas-highlight/80 text-white border-canvas-highlight hover:bg-canvas-highlight disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
