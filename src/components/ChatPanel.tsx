import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chat';
import { useWwiseStore } from '../stores/wwise';
import { useCanvasStore } from '../stores/canvas';

/**
 * Parse <actions>[...]</actions> blocks from Claude's response
 * and execute them against the canvas store.
 */
function useActionExecutor() {
  const { addNode, connectNodes, updateNodeData } = useCanvasStore();

  return useCallback(
    (fullText: string) => {
      const match = fullText.match(/<actions>([\s\S]*?)<\/actions>/);
      if (!match) return;

      try {
        const actions = JSON.parse(match[1]);
        const createdNodeIds: string[] = [];

        for (const action of actions) {
          switch (action.type) {
            case 'addNode': {
              const x = 200 + createdNodeIds.length * 280;
              const y = 250 + (createdNodeIds.length % 2) * 150;
              const id = addNode(action.nodeType, { x, y }, action.data);
              createdNodeIds.push(id);
              break;
            }
            case 'connectNodes': {
              const srcId = createdNodeIds[action.source];
              const tgtId = createdNodeIds[action.target];
              if (srcId && tgtId) connectNodes(srcId, tgtId);
              break;
            }
            case 'updateNode': {
              if (action.nodeId && action.data) {
                updateNodeData(action.nodeId, action.data);
              }
              break;
            }
          }
        }
      } catch {
        // Silently ignore parse errors — Claude may not always produce valid JSON
      }
    },
    [addNode, connectNodes, updateNodeData]
  );
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
  const [streamBuffer, setStreamBuffer] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const executeActions = useActionExecutor();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    addMessage('user', text);
    setInput('');
    setStreamBuffer('');
    setStreaming(true);

    // Build context-aware message
    const contextPrefix = connected
      ? `[Context: Wwise connected, ${nodes.length} nodes on canvas]`
      : `[Context: Wwise offline, ${nodes.length} nodes on canvas]`;

    // Build conversation history for Claude
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    history.push({ role: 'user', content: `${contextPrefix}\n\n${text}` });

    // Check if Electron IPC is available (real Claude streaming)
    if (window.claude) {
      // Add empty assistant message that we'll stream into
      addMessage('assistant', '');

      let buffer = '';
      window.claude.removeAllListeners();

      window.claude.onChunk((chunk: string) => {
        buffer += chunk;
        setStreamBuffer(buffer);
        updateLastAssistant(stripActions(buffer));
      });

      window.claude.onDone((fullText: string) => {
        updateLastAssistant(stripActions(fullText));
        setStreaming(false);
        setStreamBuffer('');
        executeActions(fullText);
      });

      window.claude.onError((error: string) => {
        setStreaming(false);
        setStreamBuffer('');
        setError(error);
        addMessage('assistant', `Error: ${error}`);
      });

      window.claude.stream(history);
    } else {
      // Browser fallback — call Anthropic API directly via fetch
      addMessage('assistant', '');
      callClaudeDirectly(history);
    }
  }, [input, isStreaming, messages, connected, nodes, addMessage, updateLastAssistant, setStreaming, setError, executeActions]);

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
          system: `You are the AI music director inside ScoreCanvas Wwise — an adaptive music design workstation. You help composers design interactive music systems for games. You can create music nodes on the canvas (MusicState, Transition, Parameter/RTPC, Stinger, Event) and control Wwise. When asked to create or modify systems, include a JSON action block in <actions>...</actions> tags. Actions: addNode, connectNodes, updateNode. Keep responses concise and musical.`,
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
      executeActions(text);
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
              {streamBuffer ? (
                <span className="text-[11px] text-canvas-text leading-relaxed">
                  {stripActions(streamBuffer)}
                  <span className="animate-pulse text-canvas-highlight">|</span>
                </span>
              ) : (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-canvas-highlight animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
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
