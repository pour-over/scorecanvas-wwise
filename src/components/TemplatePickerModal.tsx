import React from 'react';
import { TEMPLATES, type Template } from '../data/templates';
import { useCanvasStore } from '../stores/canvas';
import { useUndoStore } from '../stores/undo';

interface TemplatePickerModalProps {
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  Action: '#e94560',
  Platformer: '#a855f7',
  'UI / Linear': '#06b6d4',
  Horror: '#22c55e',
};

function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: (t: Template) => void;
}) {
  const badgeColor = categoryColors[template.category] ?? '#8892a4';

  return (
    <div
      className="flex flex-col justify-between rounded-lg border p-4"
      style={{
        backgroundColor: '#16213e',
        borderColor: '#0f3460',
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3
            className="font-semibold tracking-wide"
            style={{ color: '#eaeaea', fontSize: 13 }}
          >
            {template.name}
          </h3>
          <span
            className="rounded-full px-2 py-0.5 font-mono uppercase"
            style={{
              fontSize: 9,
              letterSpacing: '0.08em',
              color: '#0d0d1a',
              backgroundColor: badgeColor,
            }}
          >
            {template.category}
          </span>
        </div>

        <p
          className="mb-3 leading-relaxed"
          style={{ color: '#8892a4', fontSize: 11 }}
        >
          {template.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono"
          style={{ color: '#8892a4', fontSize: 10 }}
        >
          {template.nodeCount} nodes
        </span>

        <button
          type="button"
          onClick={() => onSelect(template)}
          className="rounded px-3 py-1 font-mono uppercase transition-colors"
          style={{
            fontSize: 10,
            letterSpacing: '0.06em',
            color: '#eaeaea',
            backgroundColor: '#e94560',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d6364f';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e94560';
          }}
        >
          Use Template
        </button>
      </div>
    </div>
  );
}

export default function TemplatePickerModal({
  onClose,
}: TemplatePickerModalProps) {
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const clearHistory = useUndoStore((s) => s.clearHistory);

  const handleSelect = React.useCallback(
    (template: Template) => {
      // Deep-clone so templates remain immutable
      const nodes = JSON.parse(JSON.stringify(template.nodes));
      const edges = JSON.parse(JSON.stringify(template.edges));

      setNodes(nodes);
      setEdges(edges);
      clearHistory();
      onClose();
    },
    [setNodes, setEdges, clearHistory, onClose],
  );


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl border p-6"
        style={{
          backgroundColor: '#0d0d1a',
          borderColor: '#0f3460',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4"
          style={{
            color: '#8892a4',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          x
        </button>

        {/* Title */}
        <h2
          className="mb-1 font-mono uppercase tracking-widest"
          style={{ color: '#eaeaea', fontSize: 12 }}
        >
          Project Templates
        </h2>
        <p className="mb-5" style={{ color: '#8892a4', fontSize: 11 }}>
          Start from a pre-built adaptive music system. Your canvas will be
          replaced with the template contents.
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
