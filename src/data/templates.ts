import type { CanvasNode, CanvasEdge } from '../types/canvas';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ---------------------------------------------------------------------------
// 1. Combat System (Ghost of Tsushima style)
// ---------------------------------------------------------------------------

const combatNodes: CanvasNode[] = [
  {
    id: 'tpl-combat-ms-1',
    type: 'musicState',
    position: { x: 0, y: 120 },
    data: {
      label: 'Exploration',
      intensity: 15,
      looping: true,
      stems: ['strings_ambient', 'perc_light'],
      status: 'wip',
    },
  },
  {
    id: 'tpl-combat-ms-2',
    type: 'musicState',
    position: { x: 300, y: 120 },
    data: {
      label: 'Tension',
      intensity: 40,
      looping: true,
      stems: ['strings_tense', 'perc_building', 'brass_low'],
      status: 'wip',
    },
  },
  {
    id: 'tpl-combat-ms-3',
    type: 'musicState',
    position: { x: 600, y: 120 },
    data: {
      label: 'Combat',
      intensity: 75,
      looping: true,
      stems: ['drums_full', 'brass_action', 'strings_driving'],
      status: 'wip',
    },
  },
  {
    id: 'tpl-combat-ms-4',
    type: 'musicState',
    position: { x: 900, y: 120 },
    data: {
      label: 'Boss',
      intensity: 100,
      looping: true,
      stems: ['drums_epic', 'brass_full', 'choir', 'strings_intense'],
      status: 'wip',
    },
  },
  {
    id: 'tpl-combat-tr-1',
    type: 'transition',
    position: { x: 150, y: 300 },
    data: {
      label: 'Explore → Tension',
      duration: 1500,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'SCurve',
    },
  },
  {
    id: 'tpl-combat-tr-2',
    type: 'transition',
    position: { x: 450, y: 300 },
    data: {
      label: 'Tension → Combat',
      duration: 400,
      syncPoint: 'next-beat',
      fadeType: 'sting',
      fadeInCurve: 'Linear',
      fadeOutCurve: 'Exp1',
    },
  },
  {
    id: 'tpl-combat-tr-3',
    type: 'transition',
    position: { x: 750, y: 300 },
    data: {
      label: 'Combat → Boss',
      duration: 2000,
      syncPoint: 'next-bar',
      fadeType: 'bridge',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'SCurve',
    },
  },
  {
    id: 'tpl-combat-pm-1',
    type: 'parameter',
    position: { x: 450, y: 0 },
    data: {
      label: 'ThreatLevel',
      paramName: 'RTPC_ThreatLevel',
      minValue: 0,
      maxValue: 100,
      defaultValue: 0,
      description: 'Drives music intensity based on enemy proximity and alertness',
    },
  },
  {
    id: 'tpl-combat-st-1',
    type: 'stinger',
    position: { x: 900, y: 0 },
    data: {
      label: 'Kill Confirm',
      trigger: 'OnEnemyKilled',
      asset: 'sfx_kill_confirm',
      priority: 'high',
    },
  },
  {
    id: 'tpl-combat-ev-1',
    type: 'event',
    position: { x: 0, y: 0 },
    data: {
      label: 'Combat Start',
      eventType: 'scripted_sequence',
      blueprintRef: 'BP_CombatTrigger',
      description: 'Triggered when enemies detect the player',
    },
  },
];

const combatEdges: CanvasEdge[] = [
  { id: 'tpl-combat-e1', source: 'tpl-combat-ms-1', target: 'tpl-combat-tr-1' },
  { id: 'tpl-combat-e2', source: 'tpl-combat-tr-1', target: 'tpl-combat-ms-2' },
  { id: 'tpl-combat-e3', source: 'tpl-combat-ms-2', target: 'tpl-combat-tr-2' },
  { id: 'tpl-combat-e4', source: 'tpl-combat-tr-2', target: 'tpl-combat-ms-3' },
  { id: 'tpl-combat-e5', source: 'tpl-combat-ms-3', target: 'tpl-combat-tr-3' },
  { id: 'tpl-combat-e6', source: 'tpl-combat-tr-3', target: 'tpl-combat-ms-4' },
  { id: 'tpl-combat-e7', source: 'tpl-combat-ev-1', target: 'tpl-combat-ms-1' },
  { id: 'tpl-combat-e8', source: 'tpl-combat-pm-1', target: 'tpl-combat-ms-2' },
  { id: 'tpl-combat-e9', source: 'tpl-combat-pm-1', target: 'tpl-combat-ms-3' },
  { id: 'tpl-combat-e10', source: 'tpl-combat-st-1', target: 'tpl-combat-ms-3' },
];

// ---------------------------------------------------------------------------
// 2. Layered Exploration (Celeste style)
// ---------------------------------------------------------------------------

const layeredNodes: CanvasNode[] = [
  {
    id: 'tpl-layer-ms-1',
    type: 'musicState',
    position: { x: 0, y: 120 },
    data: {
      label: 'Base Layer',
      intensity: 30,
      looping: true,
      stems: ['piano_simple'],
      directorNote: 'Always playing — sparse piano foundation',
      status: 'wip',
    },
  },
  {
    id: 'tpl-layer-ms-2',
    type: 'musicState',
    position: { x: 300, y: 120 },
    data: {
      label: 'Mid Layer',
      intensity: 55,
      looping: true,
      stems: ['piano_simple', 'synth_pad', 'light_perc'],
      directorNote: 'Adds synth pad and gentle percussion',
      status: 'wip',
    },
  },
  {
    id: 'tpl-layer-ms-3',
    type: 'musicState',
    position: { x: 600, y: 120 },
    data: {
      label: 'Full Layer',
      intensity: 85,
      looping: true,
      stems: ['piano_full', 'synth_pad', 'synth_lead', 'drums_full', 'bass'],
      directorNote: 'Full arrangement — peak emotional intensity',
      status: 'wip',
    },
  },
  {
    id: 'tpl-layer-tr-1',
    type: 'transition',
    position: { x: 150, y: 300 },
    data: {
      label: 'Layer Up',
      duration: 2000,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'SCurve',
    },
  },
  {
    id: 'tpl-layer-tr-2',
    type: 'transition',
    position: { x: 450, y: 300 },
    data: {
      label: 'Layer Down',
      duration: 3000,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'Log1',
    },
  },
  {
    id: 'tpl-layer-pm-1',
    type: 'parameter',
    position: { x: 0, y: 0 },
    data: {
      label: 'Altitude',
      paramName: 'RTPC_Altitude',
      minValue: 0,
      maxValue: 1000,
      defaultValue: 0,
      description: 'Player height in the level — higher altitude adds layers',
    },
  },
  {
    id: 'tpl-layer-pm-2',
    type: 'parameter',
    position: { x: 300, y: 0 },
    data: {
      label: 'Collectibles',
      paramName: 'RTPC_Collectibles',
      minValue: 0,
      maxValue: 100,
      defaultValue: 0,
      description: 'Percentage of collectibles found — unlocks harmonic layers',
    },
  },
  {
    id: 'tpl-layer-st-1',
    type: 'stinger',
    position: { x: 600, y: 0 },
    data: {
      label: 'Collectible Found',
      trigger: 'OnCollectiblePickup',
      asset: 'sfx_collectible_chime',
      priority: 'medium',
    },
  },
];

const layeredEdges: CanvasEdge[] = [
  { id: 'tpl-layer-e1', source: 'tpl-layer-ms-1', target: 'tpl-layer-tr-1' },
  { id: 'tpl-layer-e2', source: 'tpl-layer-tr-1', target: 'tpl-layer-ms-2' },
  { id: 'tpl-layer-e3', source: 'tpl-layer-ms-2', target: 'tpl-layer-tr-2' },
  { id: 'tpl-layer-e4', source: 'tpl-layer-tr-2', target: 'tpl-layer-ms-3' },
  { id: 'tpl-layer-e5', source: 'tpl-layer-pm-1', target: 'tpl-layer-ms-1' },
  { id: 'tpl-layer-e6', source: 'tpl-layer-pm-2', target: 'tpl-layer-ms-2' },
  { id: 'tpl-layer-e7', source: 'tpl-layer-st-1', target: 'tpl-layer-ms-3' },
];

// ---------------------------------------------------------------------------
// 3. Menu & Cinematics (simple)
// ---------------------------------------------------------------------------

const menuNodes: CanvasNode[] = [
  {
    id: 'tpl-menu-ms-1',
    type: 'musicState',
    position: { x: 0, y: 120 },
    data: {
      label: 'Main Menu',
      intensity: 40,
      looping: true,
      stems: ['menu_theme_full'],
      status: 'wip',
    },
  },
  {
    id: 'tpl-menu-ms-2',
    type: 'musicState',
    position: { x: 300, y: 120 },
    data: {
      label: 'Cinematic',
      intensity: 70,
      looping: false,
      stems: ['cinematic_score'],
      directorNote: 'One-shot — plays through once then triggers credits or returns to menu',
      status: 'wip',
    },
  },
  {
    id: 'tpl-menu-ms-3',
    type: 'musicState',
    position: { x: 600, y: 120 },
    data: {
      label: 'Credits',
      intensity: 50,
      looping: true,
      stems: ['credits_theme'],
      status: 'wip',
    },
  },
  {
    id: 'tpl-menu-tr-1',
    type: 'transition',
    position: { x: 150, y: 300 },
    data: {
      label: 'Menu → Cinematic',
      duration: 0,
      syncPoint: 'immediate',
      fadeType: 'cut',
    },
  },
  {
    id: 'tpl-menu-tr-2',
    type: 'transition',
    position: { x: 450, y: 300 },
    data: {
      label: 'Cinematic → Credits',
      duration: 1500,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'SCurve',
    },
  },
  {
    id: 'tpl-menu-ev-1',
    type: 'event',
    position: { x: 150, y: 0 },
    data: {
      label: 'Play Cinematic',
      eventType: 'cinematic',
      blueprintRef: 'BP_CinematicTrigger',
      description: 'User presses Play on main menu — starts cinematic',
    },
  },
  {
    id: 'tpl-menu-ev-2',
    type: 'event',
    position: { x: 450, y: 0 },
    data: {
      label: 'Return to Menu',
      eventType: 'button_press',
      blueprintRef: 'BP_MenuReturn',
      description: 'User presses back or cinematic ends — return to menu theme',
    },
  },
];

const menuEdges: CanvasEdge[] = [
  { id: 'tpl-menu-e1', source: 'tpl-menu-ms-1', target: 'tpl-menu-tr-1' },
  { id: 'tpl-menu-e2', source: 'tpl-menu-tr-1', target: 'tpl-menu-ms-2' },
  { id: 'tpl-menu-e3', source: 'tpl-menu-ms-2', target: 'tpl-menu-tr-2' },
  { id: 'tpl-menu-e4', source: 'tpl-menu-tr-2', target: 'tpl-menu-ms-3' },
  { id: 'tpl-menu-e5', source: 'tpl-menu-ev-1', target: 'tpl-menu-tr-1' },
  { id: 'tpl-menu-e6', source: 'tpl-menu-ev-2', target: 'tpl-menu-ms-1' },
];

// ---------------------------------------------------------------------------
// 4. Horror Adaptive (Resident Evil style)
// ---------------------------------------------------------------------------

const horrorNodes: CanvasNode[] = [
  {
    id: 'tpl-horror-ms-1',
    type: 'musicState',
    position: { x: 0, y: 120 },
    data: {
      label: 'Safe Room',
      intensity: 10,
      looping: true,
      stems: ['piano_gentle', 'ambient_room'],
      directorNote: 'Calm, melancholic — player knows they are safe',
      status: 'wip',
    },
  },
  {
    id: 'tpl-horror-ms-2',
    type: 'musicState',
    position: { x: 300, y: 120 },
    data: {
      label: 'Exploration',
      intensity: 35,
      looping: true,
      stems: ['ambient_dark', 'texture_dread', 'strings_tension'],
      directorNote: 'Uneasy atmosphere — sparse, mostly textural',
      status: 'wip',
    },
  },
  {
    id: 'tpl-horror-ms-3',
    type: 'musicState',
    position: { x: 600, y: 120 },
    data: {
      label: 'Chase',
      intensity: 95,
      looping: true,
      stems: ['drums_frantic', 'strings_intense', 'brass_stabs', 'synth_pulse'],
      directorNote: 'Full panic — driving rhythm, no escape',
      status: 'wip',
    },
  },
  {
    id: 'tpl-horror-tr-1',
    type: 'transition',
    position: { x: 300, y: 300 },
    data: {
      label: 'Danger Detected',
      duration: 200,
      syncPoint: 'next-beat',
      fadeType: 'sting',
      fadeInCurve: 'Exp1',
      fadeOutCurve: 'Linear',
    },
  },
  {
    id: 'tpl-horror-tr-2',
    type: 'transition',
    position: { x: 0, y: 300 },
    data: {
      label: 'Return to Safety',
      duration: 3000,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'Log1',
      fadeOutCurve: 'SCurve',
    },
  },
  {
    id: 'tpl-horror-pm-1',
    type: 'parameter',
    position: { x: 300, y: 0 },
    data: {
      label: 'Fear',
      paramName: 'RTPC_Fear',
      minValue: 0,
      maxValue: 100,
      defaultValue: 20,
      description: 'Composite fear value — enemy distance, darkness, health, ammo scarcity',
    },
  },
  {
    id: 'tpl-horror-st-1',
    type: 'stinger',
    position: { x: 600, y: 0 },
    data: {
      label: 'Jump Scare',
      trigger: 'OnJumpScare',
      asset: 'sfx_jumpscare_hit',
      priority: 'critical',
    },
  },
  {
    id: 'tpl-horror-st-2',
    type: 'stinger',
    position: { x: 600, y: 340 },
    data: {
      label: 'Enemy Spotted',
      trigger: 'OnEnemySpotted',
      asset: 'sfx_enemy_alert',
      priority: 'high',
    },
  },
  {
    id: 'tpl-horror-ev-1',
    type: 'event',
    position: { x: 0, y: 0 },
    data: {
      label: 'Door Open',
      eventType: 'scripted_sequence',
      blueprintRef: 'BP_DoorInteraction',
      description: 'Player opens a door — potential transition between zones',
    },
  },
];

const horrorEdges: CanvasEdge[] = [
  { id: 'tpl-horror-e1', source: 'tpl-horror-ms-2', target: 'tpl-horror-tr-1' },
  { id: 'tpl-horror-e2', source: 'tpl-horror-tr-1', target: 'tpl-horror-ms-3' },
  { id: 'tpl-horror-e3', source: 'tpl-horror-ms-3', target: 'tpl-horror-tr-2' },
  { id: 'tpl-horror-e4', source: 'tpl-horror-tr-2', target: 'tpl-horror-ms-1' },
  { id: 'tpl-horror-e5', source: 'tpl-horror-ev-1', target: 'tpl-horror-ms-2' },
  { id: 'tpl-horror-e6', source: 'tpl-horror-pm-1', target: 'tpl-horror-ms-2' },
  { id: 'tpl-horror-e7', source: 'tpl-horror-pm-1', target: 'tpl-horror-ms-3' },
  { id: 'tpl-horror-e8', source: 'tpl-horror-st-1', target: 'tpl-horror-ms-3' },
  { id: 'tpl-horror-e9', source: 'tpl-horror-st-2', target: 'tpl-horror-ms-2' },
];

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-combat',
    name: 'Combat System',
    description:
      'Ghost of Tsushima-style threat escalation with 4 intensity tiers, ThreatLevel RTPC, kill stinger, and bar-synced transitions.',
    category: 'Action',
    nodeCount: combatNodes.length,
    nodes: combatNodes,
    edges: combatEdges,
  },
  {
    id: 'tpl-layered',
    name: 'Layered Exploration',
    description:
      'Celeste-style vertical layering driven by altitude and collectible RTPCs. Layers crossfade in and out over long durations.',
    category: 'Platformer',
    nodeCount: layeredNodes.length,
    nodes: layeredNodes,
    edges: layeredEdges,
  },
  {
    id: 'tpl-menu',
    name: 'Menu & Cinematics',
    description:
      'Simple linear flow for main menu, cinematic sequences, and credits with cut and crossfade transitions.',
    category: 'UI / Linear',
    nodeCount: menuNodes.length,
    nodes: menuNodes,
    edges: menuEdges,
  },
  {
    id: 'tpl-horror',
    name: 'Horror Adaptive',
    description:
      'Resident Evil-style adaptive system with safe rooms, tense exploration, and frantic chase music driven by a Fear RTPC.',
    category: 'Horror',
    nodeCount: horrorNodes.length,
    nodes: horrorNodes,
    edges: horrorEdges,
  },
];
