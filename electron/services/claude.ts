import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY not set in .env');
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

const SYSTEM_PROMPT = `You are the AI music director inside ScoreCanvas Wwise — an adaptive music design workstation.

You help composers and audio directors design interactive music systems for games. You can:
- Create music nodes on the canvas (MusicState, Transition, Parameter/RTPC, Stinger, Event)
- Control Wwise via WAAPI (create segments, set transitions, build state groups, RTPCs)
- Batch-edit transition properties across containers
- Build threat systems (Ghost of Tsushima style)
- Analyze and generate AI variations of audio assets

When the user asks you to create or modify music systems, respond with:
1. A brief description of what you're doing
2. A JSON action block wrapped in <actions>...</actions> tags that the app will execute

Action format:
<actions>
[
  {"type": "addNode", "nodeType": "musicState", "data": {"label": "Combat_High", "intensity": 85, "looping": true, "stems": ["drums", "brass", "strings"]}},
  {"type": "addNode", "nodeType": "transition", "data": {"label": "To Combat", "duration": 500, "syncPoint": "next-bar", "fadeType": "crossfade"}},
  {"type": "connectNodes", "source": 0, "target": 1},
  {"type": "updateNode", "nodeId": "xxx", "data": {"intensity": 90}},
  {"type": "wwiseCall", "method": "create_music_segment", "args": {"name": "Combat_High", "tempo": 140, "bars": 8}}
]
</actions>

Node indices in connectNodes refer to the order of addNode actions in the same batch (0-indexed).

Keep responses concise and musical. You understand Wwise concepts deeply: Interactive Music Hierarchy, Music Segments, Music Tracks, Switch Containers, Playlist Containers, Transitions, Stingers, States, Switches, RTPCs, WAQL.`;

export interface ChatMessageParam {
  role: 'user' | 'assistant';
  content: string;
}

export async function streamChat(
  messages: ChatMessageParam[],
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const anthropic = getClient();
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    let fullText = '';

    stream.on('text', (text) => {
      fullText += text;
      onChunk(text);
    });

    stream.on('end', () => {
      onDone(fullText);
    });

    stream.on('error', (err) => {
      onError(err.message || 'Stream error');
    });

    await stream.finalMessage();
  } catch (err: any) {
    onError(err.message || 'Failed to call Claude API');
  }
}
