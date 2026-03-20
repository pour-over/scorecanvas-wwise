import { useCallback } from 'react';
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
} from '@xyflow/react';
import { useCanvasStore } from '../stores/canvas';
import { nodeTypes } from '../nodes';
import type { CanvasNodeType } from '../types/canvas';

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, addNode } = useCanvasStore();

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
        const edge = {
          id: `e-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
        };
        setEdges([...edges, edge]);
      }
    },
    [edges, setEdges]
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
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
    </div>
  );
}
