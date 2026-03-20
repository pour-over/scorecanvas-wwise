export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCallResult[];
}

export interface ToolCallResult {
  toolName: string;
  args: Record<string, any>;
  result?: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
}
