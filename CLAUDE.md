# ScoreCanvas Wwise — The Ultimate Conversational Adaptive Music Workstation

## Vision

ScoreCanvas Wwise is the merger of two systems built by Ted Kocher (Back Pocket Music / TKO Audio):

1. **ScoreCanvas** — A node-based visual workspace for designing adaptive music systems ("The Figma for Game Audio")
2. **Wwise Music MCP** — A conversational AI interface for controlling Wwise's Interactive Music system via WAAPI

This project unifies them into a single application: a **beautiful, dark-themed visual workstation** where you design adaptive music graphs on a canvas AND those designs are **live-synced to a real Wwise project** through conversational AI control. You talk to Claude, nodes appear on the canvas, and those nodes exist in Wwise simultaneously.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Desktop App                  │
│                                                          │
│  ┌──────────┐  ┌──────────────────────┐  ┌───────────┐ │
│  │ Sidebar   │  │   React Flow Canvas  │  │ Chat      │ │
│  │ Projects  │  │   (Node Graph)       │  │ Panel     │ │
│  │ Levels    │  │                      │  │ (Claude)  │ │
│  │ Assets    │  │   MusicState nodes   │  │           │ │
│  │ Wwise     │  │   Transition nodes   │  │ Talk to   │ │
│  │ Browser   │  │   Parameter nodes    │  │ your      │ │
│  │           │  │   Stinger nodes      │  │ music     │ │
│  │           │  │   Event nodes        │  │ system    │ │
│  └──────────┘  └──────────────────────┘  └───────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │              Transport Bar + Sprite Runner            ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │              Wwise Sync Engine (Backend)              ││
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  ││
│  │  │ MCP     │  │ WAAPI    │  │ Bidirectional Sync │  ││
│  │  │ Server  │  │ Client   │  │ Canvas ↔ Wwise     │  ││
│  │  └─────────┘  └──────────┘  └────────────────────┘  ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop Shell | **Electron** | Native Wwise integration, local WAAPI WebSocket, file system access |
| Frontend | **React 18 + TypeScript + Vite** | Matches existing ScoreCanvas stack |
| Graph Editor | **@xyflow/react** (React Flow) | Proven in ScoreCanvas, handles complex node graphs |
| Styling | **Tailwind CSS** with ScoreCanvas design tokens | Dark theme continuity |
| Chat Interface | **React** with streaming support | Conversational AI panel |
| AI Backend | **Claude API** (Anthropic SDK) | Powers conversational music control |
| MCP Server | **TypeScript + MCP SDK** | Rewritten from Python v2 to native TS |
| Wwise Integration | **WAAPI WebSocket Client** (JSON-RPC) | Direct connection to Wwise authoring |
| State Management | **Zustand** | Lightweight, replaces scattered contexts |
| Collaboration | **Yjs + WebSocket** | Real-time multi-user (carried from ScoreCanvas) |
| Audio Preview | **Web Audio API** | Local auditioning before Wwise commit |

---

## Design System (from ScoreCanvas)

### Color Tokens

```
canvas-bg:        #1a1a2e   (main background)
canvas-surface:   #16213e   (node backgrounds, cards)
canvas-accent:    #0f3460   (borders, secondary elements)
canvas-highlight: #e94560   (primary accent — hot pink/red)
canvas-text:      #eaeaea   (primary text)
canvas-muted:     #8892a4   (secondary text)

Panel backgrounds: #0d0d1a  (sidebar, topbar, chat panel)
Transport bg:      #0a0a18  (transport bar)
Sprite runner bg:  #080814  (near black)
```

### Node Type Colors

| Node Type | Background | Border | Glow When Active |
|-----------|-----------|--------|------------------|
| MusicState | #16213e | #0f3460 | green-400 |
| Transition | #0f3460 | #e94560 | red-400 |
| Parameter (RTPC) | #1a1a3e | #a855f7 (purple) | purple-400 |
| Stinger | #2a1a1e | priority-based | orange-400 |
| Event | #1a1520 | event-type-based | cyan-400 |

### Typography

- System sans stack (Tailwind defaults)
- Mono for technical data, codes, WAAPI paths
- Scale: 9px → 10px → 11px → 12px → 14px
- UPPERCASE mono tracking-widest for section headers

### Signature Visual Elements

- **Animated pixel sprites** (8x8 Journey cat, 6x6 Bloodborne cat) in transport bar
- **Pulsing green glow** on active/playing nodes
- **Color-coded status badges** (temp, wip, review, blocked, approved, final)
- **Director notes** in amber (#f59e0b) styling
- **Integration badges** (Wwise: orange, Unreal: slate, Perforce: teal, Jira: blue)
- **Draggable transport bar** with minimized pill state

---

## Core Feature Set

### Phase 1 — Foundation (Electron + Canvas + Wwise Connection)

1. **Electron app shell** with ScoreCanvas visual identity
2. **Node graph canvas** (port all 5 node types from ScoreCanvas)
3. **WAAPI connection manager** (connect/disconnect to local Wwise)
4. **Wwise object browser** in sidebar (tree view of project hierarchy)
5. **Bidirectional sync engine**:
   - Create a MusicState node on canvas → creates Music Segment in Wwise
   - Create a segment in Wwise → node appears on canvas
   - Edit properties in either place → syncs to the other
6. **Transport bar** with sprite runner (ported from ScoreCanvas)
7. **Web Audio preview** for auditioning without Wwise transport

### Phase 2 — Conversational AI Control

8. **Chat panel** (right sidebar) with Claude integration
9. **MCP server** (TypeScript rewrite) embedded in Electron backend
10. **Natural language → Wwise operations**:
    - "Create a combat music system with 4 intensity layers"
    - "Set all transitions to crossfade 500ms on next bar"
    - "Add a stinger for when the player picks up a weapon"
    - "Build a Ghost of Tsushima-style threat system"
11. **Visual feedback**: Chat commands animate the canvas (nodes fly in, connections draw)
12. **Canvas context awareness**: Claude sees the current graph state and can reference nodes by name

### Phase 3 — Advanced Integration

13. **Batch operations** with visual progress (batch transitions, bulk property edits)
14. **Threat system builder** — guided wizard that creates RTPCs, state groups, and stem layers
15. **Export to Wwise SoundBank** workflow
16. **Import existing Wwise project** → auto-generate canvas layout
17. **Collaboration** (Yjs) — multiple users designing the same adaptive music system
18. **Project templates** — pre-built adaptive music archetypes (linear, branching, layered, hybrid)

### Phase 4 — Production Tools

19. **Status tracking** with Jira integration (carried from ScoreCanvas)
20. **Version history** — track changes to the music system over time
21. **A/B comparison** — audition two different transition settings side by side
22. **Guided tour** for onboarding (carried from ScoreCanvas)
23. **Session recording** — record a playthrough of the adaptive music system

---

## MCP Server — TypeScript Rewrite

The Python v2 MCP server (35+ tools) must be rewritten in TypeScript to run natively in the Electron process. Key tool categories:

### Connection
- `connect_to_wwise(url?)` — establish WAAPI WebSocket
- `disconnect_from_wwise()` — close connection
- `get_project_info()` — project metadata

### Music Object Creation
- `create_music_segment(name, tempo, timeSignature, bars, parentPath)`
- `create_music_track(name, segmentName, trackType)`
- `create_music_switch_container(name, parentPath)`
- `create_music_playlist_container(name, parentPath)`
- `create_stinger(name, trigger, priority)`

### Transitions
- `set_transition_properties(objectPath, fadeIn, fadeOut, curves, syncPoint)`
- `batch_set_transitions(containerName, settings)` — the killer feature
- `copy_transition_settings(source, targetContainer)`

### Game Syncs
- `create_state_group(groupName, states[])` — e.g., Exploration/Combat/Infiltration
- `create_switch_group(groupName, switches[])`
- `create_game_parameter(name, min, max, default)` — RTPCs
- `create_threat_parameter(name, maxValue)` — Ghost of Tsushima pattern

### Query & Playback
- `query_wwise(waql)` — WAQL queries
- `preview_music(objectName)` — play in Wwise transport
- `stop_playback()`
- `get_object_properties(path)` — read any object's properties

### Canvas Integration (NEW — not in v2)
- `sync_canvas_to_wwise()` — push all canvas nodes to Wwise
- `sync_wwise_to_canvas()` — pull Wwise project into canvas
- `highlight_node(nodeId)` — visually highlight a node from chat context
- `create_and_place_node(type, data, position)` — Claude creates nodes with visual placement
- `connect_nodes(sourceId, targetId, transitionData)` — Claude draws edges

---

## Data Model

### Canvas Node Types (TypeScript)

```typescript
interface MusicStateData {
  label: string;
  intensity: number;          // 0-100
  looping: boolean;
  stems: string[];
  asset?: string;
  wwisePath?: string;         // NEW: linked Wwise object path
  wwiseId?: string;           // NEW: linked Wwise object GUID
  directorNote?: string;
  status?: NodeStatus;
  jiraTicket?: string;
}

interface TransitionData {
  label: string;
  duration: number;           // ms
  syncPoint: "immediate" | "next-bar" | "next-beat" | "custom";
  fadeType: "crossfade" | "sting" | "cut" | "bridge";
  fadeInCurve?: WwiseCurveType;   // NEW
  fadeOutCurve?: WwiseCurveType;  // NEW
  wwiseSynced?: boolean;          // NEW
  directorNote?: string;
  status?: NodeStatus;
}

interface ParameterData {
  label: string;
  paramName: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  description: string;
  wwisePath?: string;         // NEW
  directorNote?: string;
  status?: NodeStatus;
}

interface StingerData {
  label: string;
  trigger: string;
  asset: string;
  priority: "low" | "medium" | "high" | "critical";
  wwisePath?: string;         // NEW
  directorNote?: string;
  status?: NodeStatus;
}

interface EventData {
  label: string;
  eventType: "cinematic" | "igc" | "button_press" | "checkpoint" | "scripted_sequence" | "qte";
  blueprintRef: string;
  description: string;
  wwisePath?: string;         // NEW
  directorNote?: string;
  status?: NodeStatus;
}

type NodeStatus = "temp" | "wip" | "review" | "blocked" | "approved" | "final" | "needs_revision" | "placeholder";

type WwiseCurveType = "Linear" | "SCurve" | "Log1" | "Log2" | "Log3" | "Exp1" | "Exp2" | "Exp3";

// Wwise sync state for each node
interface WwiseSyncState {
  synced: boolean;
  lastSyncTime?: number;
  wwisePath?: string;
  wwiseId?: string;
  dirty: boolean;             // true if canvas state differs from Wwise
}
```

### Project Structure

```typescript
interface Project {
  id: string;
  name: string;
  subtitle: string;
  wwiseProjectPath?: string;  // NEW: path to .wproj file
  levels: Level[];
}

interface Level {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  nodes: Node[];
  edges: Edge[];
  assets: MusicAsset[];
}

interface MusicAsset {
  id: string;
  filename: string;
  category: "intro" | "loop" | "ending" | "transition" | "stinger" | "layer" | "ambient";
  duration: string;
  bpm: number;
  key: string;
  stems: string[];
  audioFile?: string;
  wwiseImported?: boolean;    // NEW
}
```

---

## WAAPI Integration Layer

```typescript
// Core WAAPI client wrapping WebSocket JSON-RPC
class WaapiClient {
  private ws: WebSocket;
  private connected: boolean = false;
  private requestId: number = 0;

  async connect(url: string = "ws://127.0.0.1:8080/waapi"): Promise<ProjectInfo>
  async disconnect(): Promise<void>

  // Generic WAAPI call
  async call(uri: string, args?: object, options?: object): Promise<any>

  // Convenience methods
  async getInfo(): Promise<ProjectInfo>
  async createObject(parent: string, type: string, name: string, props?: object): Promise<WwiseObject>
  async setProperty(objectPath: string, property: string, value: any): Promise<void>
  async getProperty(objectPath: string, property: string): Promise<any>
  async query(waql: string, returnFields: string[]): Promise<WwiseObject[]>
  async subscribe(topic: string, callback: (data: any) => void): Promise<number>
  async unsubscribe(subscriptionId: number): Promise<void>
}

// Bidirectional sync engine
class WwiseSyncEngine {
  private waapi: WaapiClient;
  private store: CanvasStore;  // Zustand store

  // Canvas → Wwise
  async pushNode(nodeId: string): Promise<void>
  async pushAllNodes(): Promise<void>

  // Wwise → Canvas
  async pullProject(): Promise<void>
  async watchForChanges(): Promise<void>  // Subscribe to WAAPI events

  // Conflict resolution
  resolveConflict(nodeId: string, canvasState: any, wwiseState: any): ResolvedState
}
```

---

## Directory Structure

```
/WWISE_MCP/
├── CLAUDE.md                          (this file)
├── package.json                       (monorepo root)
├── electron/
│   ├── main.ts                        (Electron main process)
│   ├── preload.ts                     (IPC bridge)
│   └── waapi/
│       ├── client.ts                  (WAAPI WebSocket client)
│       ├── sync-engine.ts             (bidirectional sync)
│       └── mcp-server.ts             (embedded MCP server)
├── src/
│   ├── main.tsx                       (React entry)
│   ├── App.tsx                        (root component)
│   ├── stores/
│   │   ├── canvas.ts                  (Zustand: nodes, edges, selection)
│   │   ├── wwise.ts                   (Zustand: connection, project, sync state)
│   │   ├── chat.ts                    (Zustand: messages, streaming state)
│   │   └── audio.ts                   (Zustand: playback, volume)
│   ├── components/
│   │   ├── Canvas.tsx                 (React Flow graph editor)
│   │   ├── Sidebar.tsx                (projects, levels, assets, Wwise browser)
│   │   ├── ChatPanel.tsx              (conversational AI interface)
│   │   ├── TopBar.tsx                 (title, stats, integration badges)
│   │   ├── TransportBar.tsx           (playback, sprite runner)
│   │   ├── WwiseConnectionStatus.tsx  (connection indicator)
│   │   ├── GuidedTour.tsx             (onboarding)
│   │   ├── ExportModal.tsx            (export options)
│   │   └── StatusReport.tsx           (production tracking)
│   ├── nodes/
│   │   ├── MusicStateNode.tsx
│   │   ├── TransitionNode.tsx
│   │   ├── ParameterNode.tsx
│   │   ├── StingerNode.tsx
│   │   ├── EventNode.tsx
│   │   └── index.ts                   (node type registry)
│   ├── audio/
│   │   └── synth.ts                   (Web Audio preview engine)
│   ├── hooks/
│   │   ├── useWwise.ts                (WAAPI operations hook)
│   │   ├── useChat.ts                 (Claude conversation hook)
│   │   └── useSync.ts                 (bidirectional sync hook)
│   ├── types/
│   │   ├── canvas.ts                  (node/edge/project types)
│   │   ├── wwise.ts                   (WAAPI types)
│   │   └── chat.ts                    (message types)
│   └── data/
│       └── templates.ts               (project templates)
├── tailwind.config.js                 (ScoreCanvas design tokens)
└── tsconfig.json
```

---

## Chat Panel UX

The chat panel is the conversational heart of the application. It should feel like talking to a collaborator who can see your canvas.

### Interaction Patterns

```
User: "Create a combat music system with 3 intensity tiers"
Claude: Creates 3 MusicState nodes (Low/Med/High), connects them with
        Transition nodes, creates a ThreatLevel RTPC. Nodes animate onto
        the canvas from the chat panel side. Wwise objects are created
        simultaneously.

User: "Make all transitions crossfade 500ms synced to next bar"
Claude: Batch updates all Transition nodes on canvas AND in Wwise.
        Nodes briefly flash to confirm the update.

User: "This exploration theme should loop at 120 BPM in 6/8"
Claude: Updates the selected MusicState node properties on canvas
        and syncs to Wwise segment properties.

User: "Import everything from the Interactive Music Hierarchy"
Claude: Reads the Wwise project via WAAPI, generates canvas nodes
        with auto-layout (BFS left-to-right, 340px columns, 220px rows).
```

### Visual Feedback

- When Claude creates nodes: they **fly in from the right** (chat panel side) with a fade+scale animation
- When Claude updates nodes: they **pulse once** in their accent color
- When Claude runs batch operations: a **progress bar** appears in the chat with per-node status
- Connection status: **green dot pulse** = connected, **red dot** = disconnected, **amber pulse** = syncing

---

## Key Implementation Notes

### WAAPI Protocol
- WebSocket JSON-RPC 2.0 at `ws://127.0.0.1:8080/waapi`
- Must enable in Wwise: Project → User Preferences → Enable WAAPI
- All calls are `ak.wwise.core.*` or `ak.wwise.ui.*` namespace
- Properties prefixed with `@` (e.g., `@Tempo`, `@Volume`)
- WAQL for queries: `$ from type MusicSegment where name = "Combat_Theme"`

### Bidirectional Sync Strategy
- **Optimistic local-first**: Canvas changes apply immediately, sync to Wwise async
- **Wwise subscriptions**: Use `ak.wwise.core.object.created/deleted/propertyChanged` topics
- **Conflict resolution**: Canvas wins by default (user is designing), with manual override option
- **Dirty tracking**: Each node has a `WwiseSyncState` tracking sync status

### Electron IPC
- Main process: WAAPI client, MCP server, file system
- Renderer process: React app, canvas, chat UI
- Communication via `contextBridge` and typed IPC channels

---

## What This Is NOT

- This is NOT a web app (requires local Wwise connection)
- This is NOT a DAW or audio editor (it's a system design tool)
- This is NOT a replacement for Wwise's authoring UI (it's a companion)
- This is NOT just an MCP server (it's a full visual workstation)

---

## Previous Work Reference

| Project | Location | What to Port |
|---------|----------|-------------|
| ScoreCanvas | `~/Desktop/ClaudeCode/ScoreCanvas` | All visual components, design system, node types, transport bar, sprites, audio engine |
| Wwise MCP v2 | `~/Downloads/wwise-music-mcp-v2` | All 35+ MCP tools, WAAPI patterns, batch operations, threat system |
| Wwise MCP v1 | `~/.openclaw/workspace/wwise-music-mcp` | Foundational WAAPI client patterns |
| Open Source | `github.com/pour-over/Wwise-MCP` | Public starting point, community patterns |
