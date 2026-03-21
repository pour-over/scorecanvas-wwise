import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ChatPanel from './components/ChatPanel';
import TransportBar from './components/TransportBar';
import VersionHistory from './components/VersionHistory';
import GuidedTour, { useShouldShowTour } from './components/GuidedTour';
import { useCanvasStore } from './stores/canvas';
import { useAutoSave } from './hooks/useAutoSave';

export default function App() {
  const nodeCount = useCanvasStore((s) => s.nodes.length);
  const loadStarterProject = useCanvasStore((s) => s.loadStarterProject);
  useAutoSave();

  const shouldShowTour = useShouldShowTour();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (nodeCount === 0) {
      loadStarterProject();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show tour after starter project loads
  useEffect(() => {
    if (nodeCount > 0 && shouldShowTour) {
      setShowTour(true);
    }
  }, [nodeCount, shouldShowTour]);

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

        {/* Version History */}
        <VersionHistory />
      </div>

      {/* Guided Tour Overlay */}
      {showTour && <GuidedTour onComplete={() => setShowTour(false)} />}
    </ReactFlowProvider>
  );
}
