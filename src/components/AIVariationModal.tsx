import { useState, useEffect } from 'react';

interface AudioAnalysisResult {
  filename: string;
  format: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate: number;
  bpm?: number;
  key?: string;
  genre?: string;
  title?: string;
  energy: string;
  mood: string;
  instrumentProfile: string[];
  suggestedTags: string[];
  suggestedPrompt: string;
}

interface Props {
  assetName: string;
  assetPath?: string;
  onClose: () => void;
}

export default function AIVariationModal({ assetName, assetPath, onClose }: Props) {
  const [analysis, setAnalysis] = useState<AudioAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings (matching user's preferences: 90% audio influence, 25% weirdness)
  const [audioWeight, setAudioWeight] = useState(0.9);
  const [weirdness, setWeirdness] = useState(0.25);
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [instrumental, setInstrumental] = useState(true);
  const [model, setModel] = useState('V5');

  // Auto-analyze source on mount
  useEffect(() => {
    if (assetPath && window.audioAnalysis) {
      setAnalyzing(true);
      window.audioAnalysis
        .analyze(assetPath)
        .then((res) => {
          if (res.success && res.data) {
            setAnalysis(res.data);
            setPrompt(res.data.suggestedPrompt || '');
            setTags(res.data.suggestedTags?.join(', ') || '');
          }
        })
        .catch(() => {})
        .finally(() => setAnalyzing(false));
    }
  }, [assetPath]);

  const handleGenerate = async () => {
    if (!assetPath) {
      setError('No audio file path — assign an asset to this node first');
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress('Submitting...');

    try {
      if (window.kie) {
        // Listen for progress updates
        window.kie.onProgress((status: string) => setProgress(status));

        const res = await window.kie.generate({
          uploadUrl: assetPath, // In production, this would be a hosted URL
          prompt: prompt || undefined,
          tags: tags || undefined,
          title: `${assetName}_variation`,
          model,
          audioWeight,
          weirdnessConstraint: weirdness,
          instrumental,
        });

        if (res.success && res.data) {
          setResult(res.data);
          setProgress('Complete!');
        } else {
          setError(res.error || 'Generation failed');
        }
      } else {
        // Browser mode simulation
        setProgress('Simulating...');
        await new Promise((r) => setTimeout(r, 2000));
        setResult({
          taskId: 'demo-task',
          status: 'completed',
          audioUrl: '#demo',
          title: `${assetName}_variation`,
          tags: tags || 'cinematic, orchestral',
          duration: 120,
        });
        setProgress('Complete! (Demo mode)');
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-panel border border-canvas-accent rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-accent">
          <div>
            <h2 className="text-sm font-bold text-canvas-text">Generate AI Variation</h2>
            <p className="text-[10px] text-canvas-muted mt-0.5">
              Create a cover/variation via kie.ai (Suno)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-canvas-muted hover:text-canvas-text transition-colors text-lg"
          >
            x
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Source Info */}
          <div className="bg-canvas-bg rounded-lg border border-canvas-accent p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-canvas-muted mb-2">
              Source Analysis
            </div>
            {analyzing ? (
              <div className="text-[10px] text-canvas-muted animate-pulse">Analyzing audio...</div>
            ) : analysis ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-canvas-muted">File</span>
                  <span className="text-canvas-text font-mono">{analysis.filename}</span>
                </div>
                {analysis.duration > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-canvas-muted">Duration</span>
                    <span className="text-canvas-text font-mono">{Math.round(analysis.duration)}s</span>
                  </div>
                )}
                {analysis.bpm && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-canvas-muted">BPM</span>
                    <span className="text-canvas-text font-mono">{analysis.bpm}</span>
                  </div>
                )}
                {analysis.key && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-canvas-muted">Key</span>
                    <span className="text-canvas-text font-mono">{analysis.key}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span className="text-canvas-muted">Energy</span>
                  <span className={`font-mono ${
                    analysis.energy === 'high' ? 'text-red-400' :
                    analysis.energy === 'low' ? 'text-blue-400' : 'text-amber-400'
                  }`}>{analysis.energy}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-canvas-muted">Mood</span>
                  <span className="text-canvas-text">{analysis.mood}</span>
                </div>
                {analysis.instrumentProfile.length > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-canvas-muted">Instruments</span>
                    <span className="text-canvas-text text-right">{analysis.instrumentProfile.join(', ')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-canvas-muted/50 italic">
                {assetPath ? 'No analysis available' : 'No audio file assigned to this node'}
              </div>
            )}
          </div>

          {/* Generation Settings */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-canvas-muted">
              Variation Settings
            </div>

            {/* Audio Influence */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-canvas-muted">Audio Influence</label>
                <span className="text-[10px] font-mono text-canvas-text">{Math.round(audioWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioWeight}
                onChange={(e) => setAudioWeight(parseFloat(e.target.value))}
                className="w-full h-1 accent-canvas-highlight"
              />
              <div className="flex justify-between text-[8px] text-canvas-muted/40">
                <span>Creative</span>
                <span>Faithful</span>
              </div>
            </div>

            {/* Weirdness */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-canvas-muted">Weirdness</label>
                <span className="text-[10px] font-mono text-canvas-text">{Math.round(weirdness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weirdness}
                onChange={(e) => setWeirdness(parseFloat(e.target.value))}
                className="w-full h-1 accent-purple-400"
              />
              <div className="flex justify-between text-[8px] text-canvas-muted/40">
                <span>Conservative</span>
                <span>Experimental</span>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-[10px] text-canvas-muted block mb-1">Style Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., aggressive orchestral combat music with taiko drums"
                rows={2}
                className="w-full bg-canvas-bg border border-canvas-accent rounded px-2 py-1.5 text-[10px] text-canvas-text placeholder:text-canvas-muted/30 resize-none focus:outline-none focus:border-canvas-highlight/50"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[10px] text-canvas-muted block mb-1">Genre Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="orchestral, cinematic, epic, game soundtrack"
                className="w-full bg-canvas-bg border border-canvas-accent rounded px-2 py-1.5 text-[10px] text-canvas-text placeholder:text-canvas-muted/30 focus:outline-none focus:border-canvas-highlight/50"
              />
            </div>

            {/* Options Row */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[10px] text-canvas-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={instrumental}
                  onChange={(e) => setInstrumental(e.target.checked)}
                  className="accent-canvas-highlight"
                />
                Instrumental
              </label>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-canvas-bg border border-canvas-accent rounded px-2 py-1 text-[10px] text-canvas-text focus:outline-none"
              >
                <option value="V5">Suno V5</option>
                <option value="V4_5PLUS">V4.5+</option>
                <option value="V4_5">V4.5</option>
                <option value="V4">V4</option>
              </select>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
              <div className="text-[10px] font-bold text-emerald-400 mb-1">Variation Generated</div>
              <div className="space-y-1 text-[10px]">
                <div className="text-canvas-text font-mono truncate">{result.title}</div>
                {result.tags && <div className="text-canvas-muted">{result.tags}</div>}
                {result.duration && <div className="text-canvas-muted">{Math.round(result.duration)}s</div>}
                {result.audioUrl && result.audioUrl !== '#demo' && (
                  <a
                    href={result.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-canvas-highlight hover:underline"
                  >
                    Download Audio
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
              <div className="text-[10px] text-red-400">{error}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-canvas-accent flex items-center justify-between">
          {generating && (
            <div className="text-[10px] text-amber-400 animate-pulse">{progress || 'Generating...'}</div>
          )}
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[10px] text-canvas-muted border border-canvas-accent rounded hover:text-canvas-text transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 text-[10px] font-bold text-white bg-canvas-highlight/80 border border-canvas-highlight rounded hover:bg-canvas-highlight disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Variation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
