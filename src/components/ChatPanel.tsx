import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chat';
import { useWwiseStore } from '../stores/wwise';
import { useCanvasStore } from '../stores/canvas';

// ─── Action Types ─────────────────────────────────────────────
interface PendingAction {
  type: string;
  summary: string;
  raw: any;
}

interface PendingActionSet {
  actions: PendingAction[];
  rawActions: any[];
  fullText: string;
}

/** Summarize a single action for the confirmation UI */
function summarizeAction(action: any): string {
  switch (action.type) {
    case 'addNode':
      return `Create ${action.nodeType} node "${action.data?.label || 'unnamed'}"`;
    case 'connectNodes':
      return `Connect node ${action.source} → ${action.target}`;
    case 'updateNode':
      return `Update "${action.data?.label || action.nodeId}" — ${Object.keys(action.data || {}).filter(k => k !== 'label').join(', ')}`;
    case 'removeNode':
      return `Remove node ${action.nodeId}`;
    case 'clearCanvas':
      return 'Clear entire canvas';
    case 'setWwiseProperty':
      return `Set Wwise ${action.property} = ${action.value} on ${action.objectPath}`;
    case 'wwiseCall':
      return `WAAPI call: ${action.uri}`;
    case 'pushToWwise':
      return 'Push all nodes to Wwise';
    default:
      return `Unknown action: ${action.type}`;
  }
}

// ─── Action Executor ──────────────────────────────────────────
function executeCanvasActions(rawActions: any[]) {
  const createdNodeIds: string[] = [];
  const store = useCanvasStore.getState();

  for (const action of rawActions) {
    switch (action.type) {
      case 'addNode': {
        const x = 200 + createdNodeIds.length * 280;
        const y = 250 + (createdNodeIds.length % 2) * 150;
        const id = store.addNode(action.nodeType, { x, y }, action.data);
        createdNodeIds.push(id);
        break;
      }
      case 'connectNodes': {
        const srcId = createdNodeIds[action.source];
        const tgtId = createdNodeIds[action.target];
        if (srcId && tgtId) store.connectNodes(srcId, tgtId);
        break;
      }
      case 'updateNode': {
        if (action.nodeId && action.data) {
          store.updateNodeData(action.nodeId, action.data);

          // Auto-sync to Wwise if node has a wwisePath
          const updatedNode = store.nodes.find((n) => n.id === action.nodeId);
          const nd = updatedNode?.data as any;
          if (nd?.wwisePath) {
            const wwise = (window as any).wwise;
            if (wwise) {
              const propsToSync: Array<{ property: string; value: any }> = [];
              if (action.data.volume !== undefined) {
                propsToSync.push({ property: '@Volume', value: action.data.volume });
              } else if (action.data.intensity !== undefined) {
                propsToSync.push({ property: '@Volume', value: -96 + (action.data.intensity / 100) * 96 });
              }
              if (action.data.pitch !== undefined) {
                propsToSync.push({ property: '@Pitch', value: action.data.pitch });
              }
              if (action.data.lowpass !== undefined) {
                propsToSync.push({ property: '@LPF', value: action.data.lowpass });
              }
              if (action.data.highpass !== undefined) {
                propsToSync.push({ property: '@HPF', value: action.data.highpass });
              }
              for (const p of propsToSync) {
                wwise.call('ak.wwise.core.object.setProperty', {
                  object: nd.wwisePath,
                  property: p.property,
                  value: p.value,
                }).catch((err: any) => {
                  console.warn('[Sync] Failed:', p.property, err.message);
                });
              }
            }
          }
        }
        break;
      }
      case 'removeNode': {
        if (action.nodeId) store.removeNode(action.nodeId);
        break;
      }
      case 'clearCanvas': {
        store.setNodes([]);
        store.setEdges([]);
        break;
      }
      case 'setWwiseProperty': {
        const wwise = (window as any).wwise;
        if (wwise && action.objectPath && action.property !== undefined) {
          wwise.call('ak.wwise.core.object.setProperty', {
            object: action.objectPath,
            property: action.property,
            value: action.value,
          }).then((res: any) => {
            if (res.success) {
              useChatStore.getState().addMessage('system', `✅ Set ${action.property} = ${action.value}`);
            } else {
              useChatStore.getState().addMessage('system', `❌ ${res.error || 'Failed'}`);
            }
          }).catch((err: any) => {
            useChatStore.getState().addMessage('system', `❌ ${err.message}`);
          });
        }
        break;
      }
      case 'wwiseCall': {
        const ww = (window as any).wwise;
        if (ww && action.uri) {
          ww.call(action.uri, action.args || {}, action.options || {}).then((res: any) => {
            if (res.success) {
              useChatStore.getState().addMessage('system', `✅ ${action.uri}`);
            } else {
              useChatStore.getState().addMessage('system', `❌ ${res.error}`);
            }
          }).catch((err: any) => {
            useChatStore.getState().addMessage('system', `❌ ${err.message}`);
          });
        }
        break;
      }
      case 'pushToWwise': {
        const wwSync = (window as any).wwiseSync;
        if (wwSync) {
          const allNodes = store.nodes;
          const allEdges = store.edges;
          useChatStore.getState().addMessage('system', `⏳ Pushing ${allNodes.length} nodes…`);
          wwSync.pushAll(
            allNodes.map((n: any) => ({ id: n.id, type: n.type, data: n.data, position: n.position })),
            allEdges
          ).then((res: any) => {
            if (res.success && res.data) {
              const st = useCanvasStore.getState();
              for (const r of res.data.results) {
                if (r.success && r.wwisePath) {
                  st.updateNodeData(r.nodeId, { wwisePath: r.wwisePath, wwiseId: r.wwiseId });
                }
              }
              useChatStore.getState().addMessage('system', `✅ Pushed ${res.data.totalPushed} nodes`);
            } else {
              useChatStore.getState().addMessage('system', `❌ Push failed`);
            }
          }).catch((err: any) => {
            useChatStore.getState().addMessage('system', `❌ ${err.message}`);
          });
        }
        break;
      }
    }
  }
}

/** Strip <actions> blocks from displayed text */
function stripActions(text: string): string {
  return text.replace(/<actions>[\s\S]*?<\/actions>/g, '').trim();
}

/** Parse <actions> block from response text */
function parseActions(fullText: string): any[] | null {
  const match = fullText.match(/<actions>([\s\S]*?)<\/actions>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// ─── Main Component ───────────────────────────────────────────
export default function ChatPanel() {
  const { messages, isStreaming, addMessage, updateLastAssistant, setStreaming, setError } = useChatStore();
  const { connected } = useWwiseStore();
  const { nodes } = useCanvasStore();

  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingActionSet | null>(null);

  // Voice state
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Streaming refs
  const chunkBufferRef = useRef('');
  const streamingRef = useRef(false);
  const actionsExecutedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingActions]);

  // Poll for streaming completion
  useEffect(() => {
    if (!window.claude) return;
    const pollInterval = setInterval(() => {
      if (actionsExecutedRef.current || !streamingRef.current) return;
      const buf = chunkBufferRef.current;
      if (buf.includes('</actions>')) {
        actionsExecutedRef.current = true;
        streamingRef.current = false;
        const chatStore = useChatStore.getState();
        chatStore.updateLastAssistant(stripActions(buf));
        chatStore.setStreaming(false);
        handleActionsReceived(buf);
      }
    }, 500);
    return () => clearInterval(pollInterval);
  }, []);

  // ─── Confirmation Flow ──────────────────────────────────────
  const handleActionsReceived = useCallback((fullText: string) => {
    const rawActions = parseActions(fullText);
    if (!rawActions || rawActions.length === 0) return;

    const summaries: PendingAction[] = rawActions.map((a) => ({
      type: a.type,
      summary: summarizeAction(a),
      raw: a,
    }));

    setPendingActions({ actions: summaries, rawActions, fullText });
  }, []);

  const confirmActions = useCallback(() => {
    if (!pendingActions) return;
    executeCanvasActions(pendingActions.rawActions);
    addMessage('system', `✅ Applied ${pendingActions.rawActions.length} action(s)`);
    setPendingActions(null);
  }, [pendingActions, addMessage]);

  const cancelActions = useCallback(() => {
    addMessage('system', '⏹ Actions cancelled');
    setPendingActions(null);
  }, [addMessage]);

  // ─── Voice Input ────────────────────────────────────────────
  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterimText('');
    setVoiceSeconds(0);
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    textareaRef.current?.focus();
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    if (recognitionRef.current) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let restartCount = 0;
    const MAX_RESTARTS = 10;

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        setInput((prev) => (prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim()));
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[Voice] error:', event.error);
      // Don't stop on 'no-speech' — just keep listening
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      if (event.error === 'network') {
        useChatStore.getState().addMessage('system', '⚠️ Voice requires internet (uses Google Speech). Try typing instead.');
        stopListening();
        return;
      }
      stopListening();
    };

    recognition.onend = () => {
      // Auto-restart if we didn't manually stop (browser kills recognition after ~60s silence)
      if (recognitionRef.current && restartCount < MAX_RESTARTS) {
        restartCount++;
        try {
          recognition.start();
        } catch {
          stopListening();
        }
      } else {
        stopListening();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
      setVoiceSeconds(0);

      // Timer to show how long we've been listening
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('[Voice] Failed to start:', err);
      recognitionRef.current = null;
    }
  }, [SpeechRecognitionAPI, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, []);

  // ─── Send Message ───────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Stop voice if active
    if (listening) stopListening();

    addMessage('user', text);
    setInput('');
    setStreaming(true);

    chunkBufferRef.current = '';
    streamingRef.current = true;
    actionsExecutedRef.current = false;

    // Build rich context
    const { edges } = useCanvasStore.getState();
    const nodeList = nodes.slice(0, 40).map((n) => {
      const d = n.data as any;
      const props = [];
      if (d.intensity !== undefined) props.push(`intensity:${d.intensity}`);
      if (d.volume !== undefined) props.push(`vol:${d.volume}dB`);
      if (d.looping !== undefined) props.push(d.looping ? 'looping' : 'one-shot');
      if (d.duration !== undefined) props.push(`${d.duration}ms`);
      if (d.fadeType) props.push(d.fadeType);
      if (d.syncPoint) props.push(d.syncPoint);
      if (d.paramName) props.push(`rtpc:${d.paramName}`);
      if (d.priority) props.push(`priority:${d.priority}`);
      if (d.wwisePath) props.push(`wwise:${d.wwisePath}`);
      return `${d.label || 'unnamed'}(id:${n.id}, type:${n.type}${props.length ? ', ' + props.join(', ') : ''})`;
    }).join('\n  ');

    const edgeList = edges.slice(0, 30).map((e) => {
      const src = nodes.find((n) => n.id === e.source);
      const tgt = nodes.find((n) => n.id === e.target);
      return `${(src?.data as any)?.label || e.source} → ${(tgt?.data as any)?.label || e.target}`;
    }).join(', ');

    const contextPrefix = `[Context: Wwise ${connected ? 'connected' : 'offline'}, ${nodes.length} nodes, ${edges.length} edges
Nodes:
  ${nodeList || '(empty canvas)'}
Connections: ${edgeList || 'none'}]`;

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    history.push({ role: 'user', content: `${contextPrefix}\n\n${text}` });

    if (window.claude) {
      addMessage('assistant', '');
      window.claude.removeAllListeners();

      window.claude.onChunk((chunk: string) => {
        chunkBufferRef.current += chunk;
        updateLastAssistant(stripActions(chunkBufferRef.current));
      });

      window.claude.onDone((fullText: string) => {
        const buf = chunkBufferRef.current;
        const textToUse = fullText.length > buf.length ? fullText : buf;
        chunkBufferRef.current = textToUse;

        if (!actionsExecutedRef.current) {
          actionsExecutedRef.current = true;
          streamingRef.current = false;
          updateLastAssistant(stripActions(textToUse));
          setStreaming(false);
          handleActionsReceived(textToUse);
        }
      });

      window.claude.onError((error: string) => {
        streamingRef.current = false;
        setStreaming(false);
        setError(error);
        addMessage('assistant', `Error: ${error}`);
      });

      window.claude.stream(history).then(() => {
        setTimeout(() => {
          if (!actionsExecutedRef.current && chunkBufferRef.current.length > 0) {
            actionsExecutedRef.current = true;
            streamingRef.current = false;
            const finalBuf = chunkBufferRef.current;
            updateLastAssistant(stripActions(finalBuf));
            setStreaming(false);
            handleActionsReceived(finalBuf);
          }
        }, 300);
      }).catch((err: any) => {
        streamingRef.current = false;
        setStreaming(false);
        setError(err?.message || 'Stream failed');
      });
    } else {
      addMessage('assistant', '');
      callClaudeDirectly(history);
    }
  }, [input, isStreaming, listening, messages, connected, nodes, addMessage, updateLastAssistant, setStreaming, setError, stopListening, handleActionsReceived]);

  const callClaudeDirectly = async (history: Array<{ role: string; content: string }>) => {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: `You are the AI music director inside ScoreCanvas Wwise. Help composers design interactive music systems. Include actions in <actions>...</actions> tags. Always describe what you plan to do BEFORE the actions block so the user can review. Keep responses concise.`,
          messages: history,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data.content?.[0]?.text || 'No response';
      updateLastAssistant(stripActions(text));
      setStreaming(false);
      handleActionsReceived(text);
    } catch (err: any) {
      setStreaming(false);
      setError(err.message);
      updateLastAssistant(`Error: ${err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Collapsed View ─────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="w-10 bg-panel border-l border-canvas-accent flex flex-col items-center pt-3 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-7 h-7 rounded border border-canvas-accent text-canvas-muted hover:text-canvas-highlight hover:border-canvas-highlight/50 transition-colors text-[10px] font-bold"
          title="Open Chat"
        >
          AI
        </button>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="w-80 bg-panel border-l border-canvas-accent flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-accent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-canvas-highlight animate-pulse" />
          <span className="text-[11px] font-bold text-canvas-text">Claude</span>
          <span className="text-[9px] text-canvas-muted font-mono">Music AI</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-canvas-muted hover:text-canvas-text transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] px-3 py-2 rounded-lg text-[11px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-canvas-highlight/20 text-canvas-text border border-canvas-highlight/30'
                  : msg.role === 'system'
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] italic'
                    : 'bg-canvas-surface text-canvas-text border border-canvas-accent'
              }`}
            >
              {stripActions(msg.content) || (isStreaming && msg === messages[messages.length - 1] ? '' : msg.content)}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-canvas-surface border border-canvas-accent rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        {/* ─── Action Confirmation Card ─── */}
        {pendingActions && (
          <div className="bg-amber-500/[0.08] border border-amber-500/30 rounded-lg overflow-hidden animate-fade-in">
            <div className="px-3 py-2 border-b border-amber-500/20 flex items-center gap-2">
              <span className="text-amber-400 text-[10px]">⚡</span>
              <span className="text-[10px] font-bold text-amber-300">
                {pendingActions.actions.length} action{pendingActions.actions.length !== 1 ? 's' : ''} ready
              </span>
            </div>
            <div className="px-3 py-2 space-y-1">
              {pendingActions.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-canvas-text/80">
                  <span className="text-amber-400/60 mt-px shrink-0">
                    {a.type === 'addNode' ? '＋' : a.type === 'removeNode' ? '✕' : a.type === 'clearCanvas' ? '⌫' : a.type.includes('Wwise') || a.type.includes('wwise') || a.type === 'pushToWwise' ? '🔗' : '✎'}
                  </span>
                  <span className="leading-tight">{a.summary}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-3 py-2 border-t border-amber-500/20">
              <button
                onClick={confirmActions}
                className="flex-1 py-1.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                ✓ Apply
              </button>
              <button
                onClick={cancelActions}
                className="flex-1 py-1.5 text-[10px] font-bold rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Voice Active Banner ─── */}
      {listening && (
        <div className="mx-3 mb-1 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 animate-fade-in">
          {/* Waveform animation */}
          <div className="flex items-center gap-[2px] h-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.sin(Date.now() / 200 + i) * 6}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s',
                }}
              />
            ))}
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-red-300">
              Listening… {voiceSeconds > 0 && <span className="font-mono text-red-400/60">{voiceSeconds}s</span>}
            </div>
            {interimText && (
              <div className="text-[9px] text-red-300/60 italic truncate mt-0.5">
                {interimText}
              </div>
            )}
          </div>
          <button
            onClick={stopListening}
            className="text-[9px] text-red-400 font-bold px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* ─── Input ─── */}
      <div className="px-3 py-2 border-t border-canvas-accent">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              listening
                ? 'Speak now — your words appear here…'
                : connected
                  ? 'Describe your music system…'
                  : 'Describe a design or connect to Wwise…'
            }
            rows={2}
            className="flex-1 bg-canvas-bg border border-canvas-accent rounded-md px-2.5 py-1.5 text-[11px] text-canvas-text placeholder:text-canvas-muted/40 resize-none focus:outline-none focus:border-canvas-highlight/50 transition-colors"
          />
          {/* Mic button */}
          {SpeechRecognitionAPI && (
            <button
              onClick={listening ? stopListening : startListening}
              disabled={isStreaming}
              title={listening ? 'Stop listening (click or press Escape)' : 'Voice input — click to start, click again to stop'}
              className={`relative px-2 py-1.5 rounded border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                listening
                  ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)] scale-110'
                  : 'bg-canvas-accent text-canvas-muted border-canvas-accent hover:text-canvas-text hover:border-canvas-highlight/50'
              }`}
            >
              {listening && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill={listening ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </button>
          )}
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-2.5 py-1.5 bg-canvas-highlight/80 text-white text-[10px] font-bold rounded border border-canvas-highlight hover:bg-canvas-highlight disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className="text-[9px] text-canvas-muted/50">
            {connected ? 'Wwise connected — commands will sync' : 'Design mode — connect Wwise to sync'}
          </span>
        </div>
      </div>
    </div>
  );
}
