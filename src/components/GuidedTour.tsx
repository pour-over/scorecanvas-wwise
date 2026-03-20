import { useState, useCallback, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'scorecanvas-tour-completed';

interface TourStep {
  title: string;
  description: string;
  position: 'center' | 'sidebar-top' | 'sidebar-nodes' | 'canvas' | 'sidebar-assets' | 'chat' | 'transport';
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to ScoreCanvas Wwise',
    description:
      'The adaptive music workstation where your nodes are alive, your transitions are smooth, and your boss fights have better soundtracks than most movies. Let us show you around.',
    position: 'center',
  },
  {
    title: 'Projects & Levels',
    description:
      'Pick a project and a level up here. We have a sci-fi shooter, a spreadsheet RPG, and a custodial arts simulator. Yes, that last one is real. We are sorry.',
    position: 'sidebar-top',
  },
  {
    title: 'Node Palette',
    description:
      'Drag these onto the canvas to build your adaptive music graph. Music States, Transitions, Parameters, Stingers, and Events. It is like LEGO but for sound and nobody steps on them barefoot.',
    position: 'sidebar-nodes',
  },
  {
    title: 'The Canvas',
    description:
      'This is your workspace. Drag nodes, draw connections, design entire adaptive music systems. Everything you build here can sync to a live Wwise project.',
    position: 'canvas',
  },
  {
    title: 'Audio Assets',
    description:
      'Your music library lives here. 22 tracks organized by category. Click the play button to preview. Try not to headbang during the boss themes.',
    position: 'sidebar-assets',
  },
  {
    title: 'Chat with Claude',
    description:
      'Tell Claude what you want. "Create a combat music system with 4 intensity layers." It will build the nodes, draw the connections, and sync to Wwise. Like having a co-composer who never sleeps.',
    position: 'chat',
  },
  {
    title: 'Transport Bar',
    description:
      'Playback controls and the world-famous pixel sprite runner live down here. The cat walks across the bar while your music plays. It is non-negotiable.',
    position: 'transport',
  },
  {
    title: 'You Are Ready!',
    description:
      'Go forth and compose adaptive music systems. Remember: there are no wrong nodes, only unexpected transitions. If the raccoons attack, stay calm and mop faster.',
    position: 'center',
  },
];

function getTooltipStyle(position: TourStep['position']): React.CSSProperties {
  switch (position) {
    case 'center':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'sidebar-top':
      return { top: 60, left: 270 };
    case 'sidebar-nodes':
      return { top: 220, left: 270 };
    case 'canvas':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'sidebar-assets':
      return { top: 380, left: 270 };
    case 'chat':
      return { top: 120, right: 340 };
    case 'transport':
      return { bottom: 80, left: '50%', transform: 'translateX(-50%)' };
    default:
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
}

function getHighlightStyle(position: TourStep['position']): React.CSSProperties | null {
  switch (position) {
    case 'sidebar-top':
      return { top: 0, left: 0, width: 240, height: 180 };
    case 'sidebar-nodes':
      return { top: 180, left: 0, width: 240, height: 160 };
    case 'canvas':
      return { top: 40, left: 240, right: 320, bottom: 48 };
    case 'sidebar-assets':
      return { top: 340, left: 0, width: 240, height: 200 };
    case 'chat':
      return { top: 40, right: 0, width: 320, bottom: 48 };
    case 'transport':
      return { bottom: 0, left: 0, right: 0, height: 48 };
    default:
      return null;
  }
}

export default function GuidedTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    onComplete();
  }, [onComplete]);

  // Allow pressing Enter or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handleSkip]);

  const highlight = getHighlightStyle(current.position);
  const tooltipStyle = getTooltipStyle(current.position);
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Highlight cutout */}
      {highlight && (
        <div
          className="absolute border-2 border-canvas-highlight/60 rounded-lg z-[1]"
          style={{
            ...highlight,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 30px rgba(233,69,96,0.3)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute z-[2] bg-panel border border-canvas-highlight rounded-xl p-5 shadow-2xl"
        style={{ ...tooltipStyle, maxWidth: 320, minWidth: 260 }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono uppercase tracking-widest text-canvas-muted/60">
            {step + 1}/{STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-canvas-highlight' : i < step ? 'bg-canvas-highlight/40' : 'bg-canvas-accent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-canvas-text mb-2">{current.title}</h3>
        <p className="text-[11px] text-canvas-muted leading-relaxed mb-4">{current.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-[9px] text-canvas-muted/50 hover:text-canvas-muted transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 bg-canvas-highlight text-white text-[11px] font-bold rounded-lg hover:bg-canvas-highlight/80 transition-colors"
          >
            {isLast ? "Let's Go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useShouldShowTour(): boolean {
  return !localStorage.getItem(TOUR_STORAGE_KEY);
}
