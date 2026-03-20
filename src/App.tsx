import { ReactFlowProvider } from '@xyflow/react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ChatPanel from './components/ChatPanel';
import TransportBar from './components/TransportBar';

export default function App() {
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
