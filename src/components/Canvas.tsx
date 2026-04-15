import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  BackgroundVariant,
  Connection,
  useReactFlow,
} from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import { useUndoStore } from '../stores/undo';
import { nodeTypes } from '../nodes';
import type { CanvasNodeType } from '../types/canvas';
import PropertyInspector from './PropertyInspector';

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, addNode, removeNode, connectNodes } = useCanvasStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlow = useReactFlow();

  // Fit view when nodes change significantly (project load)
  const nodeCountRef = { current: 0 };
  useEffect(() => {
    if (nodes.length > 0 && nodes.length !== nodeCountRef.current) {
      nodeCountRef.current = nodes.length;
      // Small delay to let React Flow render the nodes first
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.3, maxZoom: 1.2, duration: 300 });
      }, 100);
    }
  }, [nodes.length, reactFlow]);

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => onNodesChange(changes),
    [onNodesChange]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => onEdgesChange(changes),
    [onEdgesChange]
  );

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        connectNodes(connection.source, connection.target);
      }
    },
    [connectNodes]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/scorecanvas-node') as CanvasNodeType;
      if (!type) return;

      const bounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      addNode(type, position);
    },
    [addNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Track selection
  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: any[] }) => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  // Delete key handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Don't delete if typing in an input
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          event.preventDefault();
          for (const node of selectedNodes) {
            removeNode(node.id);
          }
          setSelectedNodeId(null);
        }
      }
    },
    [nodes, removeNode]
  );

  return (
    <div className="w-full h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          style: { stroke: '#0f3460', strokeWidth: 2 },
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#0f3460"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'musicState': return '#4ade80';
              case 'transition': return '#e94560';
              case 'parameter': return '#a855f7';
              case 'stinger': return '#f97316';
              case 'event': return '#22d3ee';
              default: return '#8892a4';
            }
          }}
          maskColor="rgba(13, 13, 26, 0.8)"
        />
      </ReactFlow>

      {/* Reset View Button */}
      <button
        onClick={() => reactFlow.fitView({ padding: 0.3, maxZoom: 1.2, duration: 400 })}
        className="absolute top-3 right-3 z-10 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-white/[0.08] bg-panel/80 backdrop-blur-sm text-canvas-muted hover:text-canvas-text hover:border-white/[0.15] transition-all duration-200"
        title="Fit all nodes in view"
      >
        Reset View
      </button>

      {/* Property Inspector */}
      <PropertyInspector />
    </div>
  );
}
