import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chat';
import { useWwiseStore } from '../stores/wwise';
import { useCanvasStore } from '../stores/canvas';

/**
 * Parse <actions>[...]</actions> blocks from Claude's response
 * and execute them against the canvas store.
 * Uses getState() directly to avoid stale closure issues.
 */
function executeCanvasActions(fullText: string) {
  console.log('[ActionExecutor] called, text length:', fullText.length);
  const match = fullText.match(/<actions>([\s\S]*?)<\/actions>/);
  if (!match) {
    console.log('[ActionExecutor] No <actions> block found');
    return;
  }

  try {
    const actions = JSON.parse(match[1]);
    console.log('[ActionExecutor] Parsed', actions.length, 'actions:', actions.map((a: any) => a.type));
    const createdNodeIds: string[] = [];
    const store = useCanvasStore.getState();

    for (const action of actions) {
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
          }
          break;
        }
        case 'removeNode': {
          if (action.nodeId) {
            store.removeNode(action.nodeId);
          }
          break;
        }
        case 'clearCanvas': {
          console.log('[ActionExecutor] CLEARING CANVAS');
          store.setNodes([]);
          store.setEdges([]);
          break;
        }
        case 'pushToWwise': {
          console.log('[ActionExecutor] PUSHING TO WWISE');
          const wwSync = (window as any).wwiseSync;
          if (wwSync) {
            const allNodes = store.nodes;
            const allEdges = store.edges;
            useChatStore.getState().addMessage('system', `⏳ Pushing ${allNodes.length} nodes to Wwise...`);
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
                useChatStore.getState().addMessage('system', `✅ Pushed ${res.data.totalPushed} nodes to Wwise!${res.data.totalFailed > 0 ? ` (${res.data.totalFailed} failed)` : ''}`);
              } else {
                useChatStore.getState().addMessage('system', `❌ Push failed: ${res.error || 'Unknown error'}`);
              }
            }).catch((err: any) => {
              useChatStore.getState().addMessage('system', `❌ Push error: ${err.message}`);
            });
          } else {
            useChatStore.getState().addMessage('system', '❌ Push not available — connect to Wwise first');
          }
          break;
        }
      }
    }
    console.log('[ActionExecutor] Done. Nodes now:', useCanvasStore.getState().nodes.length);
  } catch (e) {
    console.error('[ActionExecutor] Parse/exec error:', e);
  }
}

/**
 * Strip <actions> blocks from displayed text so the user sees
 * the natural language response only.
 */
function stripActions(text: string): string {
  return text.replace(/<actions>[\s\S]*?<\/actions>/g, '').trim();
}

export default function ChatPanel() {
  const { messages, isStreaming, addMessage, updateLastAssistant, setStreaming, setError } =
    useChatStore();
  const { connected } = useWwiseStore();
  const { nodes } = useCanvasStore();
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs that persist across re-renders — this is the key fix
  const chunkBufferRef = useRef('');
  const streamingRef = useRef(false);
  const actionsExecutedRef = useRef(false);

  // DEBUG: Log on every render to confirm this component version is loaded
  console.log('[ChatPanel v3] RENDER — isStreaming:', isStreaming, 'messages:', messages.length, 'window.claude:', !!window.claude);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Register IPC listeners ONCE on mount, not inside handleSend
  useEffect(() => {
    if (!window.claude) return;

    const handleChunk = (_chunk: string) => {
      // Chunks are accumulated via the ref in handleSend's onChunk
    };

    // The key: poll for streaming completion via an interval
    // This avoids relying on onDone or .then() which get lost in re-renders
    const pollInterval = setInterval(() => {
      if (actionsExecutedRef.current) return;
      if (!streamingRef.current) return;

      const buf = chunkBufferRef.current;
      // Check if buffer has complete actions block and streaming text has stopped growing
      if (buf.includes('</actions>')) {
        console.log('[ChatPanel] Poll detected complete <actions> block, executing!');
        actionsExecutedRef.current = true;
        streamingRef.current = false;

        const chatStore = useChatStore.getState();
        chatStore.updateLastAssistant(stripActions(buf));
        chatStore.setStreaming(false);

        executeCanvasActions(buf);
      }
    }, 500); // Check every 500ms

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    addMessage('user', text);
    setInput('');
    setStreaming(true);

    // Reset refs
    chunkBufferRef.current = '';
    streamingRef.current = true;
    actionsExecutedRef.current = false;

    // Build context-aware message with node IDs
    const nodeList = nodes.slice(0, 30).map((n) => `${(n.data as any).label || 'unnamed'}(id:${n.id}, type:${n.type})`).join(', ');
    const contextPrefix = connected
      ? `[Context: Wwise connected, ${nodes.length} nodes on canvas: ${nodeList || 'empty'}]`
      : `[Context: Wwise offline, ${nodes.length} nodes on canvas: ${nodeList || 'empty'}]`;

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
        console.log('[ChatPanel] onDone fired, length:', fullText.length);
        // Use whichever has more content
        const buf = chunkBufferRef.current;
        const textToUse = fullText.length > buf.length ? fullText : buf;
        chunkBufferRef.current = textToUse; // Update ref so poll picks it up too

        if (!actionsExecutedRef.current) {
          actionsExecutedRef.current = true;
          streamingRef.current = false;
          updateLastAssistant(stripActions(textToUse));
          setStreaming(false);
          executeCanvasActions(textToUse);
        }
      });

      window.claude.onError((error: string) => {
        streamingRef.current = false;
        setStreaming(false);
        setError(error);
        addMessage('assistant', `Error: ${error}`);
      });

      // Fire and forget — the poll interval + onDone will handle completion
      window.claude.stream(history).then(() => {
        console.log('[ChatPanel] stream() resolved');
        // Mark streaming as done so poll can detect it
        // Give a small delay for final chunks to arrive
        setTimeout(() => {
          if (!actionsExecutedRef.current && chunkBufferRef.current.length > 0) {
            console.log('[ChatPanel] Executing from stream() .then() timeout');
            actionsExecutedRef.current = true;
            streamingRef.current = false;
            const finalBuf = chunkBufferRef.current;
            updateLastAssistant(stripActions(finalBuf));
            setStreaming(false);
            executeCanvasActions(finalBuf);
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
  }, [input, isStreaming, messages, connected, nodes, addMessage, updateLastAssistant, setStreaming, setError]);

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
          system: `You are the AI music director inside ScoreCanvas Wwise — an adaptive music design workstation. You help composers design interactive music systems for games. You can create music nodes on the canvas (MusicState, Transition, Parameter/RTPC, Stinger, Event) and control Wwise. When asked to create or modify systems, include a JSON action block in <actions>...</actions> tags. Actions: addNode, connectNodes, updateNode, removeNode, clearCanvas, pushToWwise. Keep responses concise and musical.`,
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
      executeCanvasActions(text);
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
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-canvas-accent">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Describe your music system...' : 'Describe a design or connect to Wwise...'}
            rows={2}
            className="flex-1 bg-canvas-bg border border-canvas-accent rounded-md px-2.5 py-1.5 text-[11px] text-canvas-text placeholder:text-canvas-muted/40 resize-none focus:outline-none focus:border-canvas-highlight/50 transition-colors"
          />
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
// force reload 1774071105
