import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { ChatMessage, MessageRole } from '../types/chat';

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;

  addMessage: (role: MessageRole, content: string) => void;
  updateLastAssistant: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Welcome to ScoreCanvas Wwise. I can help you design adaptive music systems — create segments, set transitions, build threat systems, and more. Connect to Wwise to get started, or describe what you'd like to build.",
      timestamp: Date.now(),
    },
  ],
  isStreaming: false,
  error: null,

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: uuid(), role, content, timestamp: Date.now() },
      ],
    })),

  updateLastAssistant: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      }
      return { messages: msgs };
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),
  clearMessages: () =>
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Chat cleared. What would you like to build?",
          timestamp: Date.now(),
        },
      ],
    }),
}));
