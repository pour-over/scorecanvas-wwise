import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ChatPanel from './components/ChatPanel';
import TransportBar from './components/TransportBar';
import { useCanvasStore } from './stores/canvas';

export default function App() {
  const nodeCount = useCanvasStore((s) => s.nodes.length);
  const loadStarterProject = useCanvasStore((s) => s.loadStarterProject);

  useEffect(() => {
    if (nodeCount === 0) {
      loadStarterProject();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-canvas-bg overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas />
            <TransportBar />
          </div>

          {/* Right Chat Panel */}
          <ChatPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
