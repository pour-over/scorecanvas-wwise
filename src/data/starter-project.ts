import type { GameProject, CanvasNode, CanvasEdge, MusicAsset } from '../types/canvas';
import type { MusicStateData, TransitionData, ParameterData, StingerData, EventData } from '../types/canvas';
import { audioAssets } from './audio-assets';

// ─── Game Identity ────────────────────────────────────────────────
export const GAME_NAME = 'CTRL+ALT+DEFEAT';
export const GAME_SUBTITLE = 'Have You Tried Turning It Off and On Again';

// ─── Node IDs (stable references for edges) ──────────────────────
const ID = {
  // MusicState nodes
  mainMenu:      'ms-main-menu',
  exploration:   'ms-exploration',
  tensionRising: 'ms-tension-rising',
  combatLow:     'ms-combat-low',
  combatHigh:    'ms-combat-high',
  bossEncounter: 'ms-boss-encounter',
  victory:       'ms-victory',
  defeat:        'ms-defeat',
  // Transition nodes
  tBeginMission:   'tr-begin-mission',
  tThreatDetected: 'tr-threat-detected',
  tEngage:         'tr-engage',
  tEscalate:       'tr-escalate',
  tBossPhase:      'tr-boss-phase',
  tVictory:        'tr-victory',
  tYouDied:        'tr-you-died',
  // Parameter nodes
  pThreatLevel:  'pm-threat-level',
  pPlayerHealth: 'pm-player-health',
  // Stinger nodes
  sEnemySpotted: 'st-enemy-spotted',
  sCriticalHit:  'st-critical-hit',
  sBossIntro:    'st-boss-intro',
  // Event nodes
  eCinematic:    'ev-cinematic-intro',
  eCheckpoint:   'ev-checkpoint',
} as const;

// ─── Nodes ────────────────────────────────────────────────────────

export const starterNodes: CanvasNode[] = [
  // ── MusicState Nodes ──
  {
    id: ID.mainMenu,
    type: 'musicState',
    position: { x: 80, y: 300 },
    data: {
      label: 'Main Menu',
      intensity: 0,
      looping: true,
      stems: ['pad', 'melody'],
      asset: 'Menu / Select',
      status: 'approved',
      directorNote: 'Ambient UI hum — the calm before the Ctrl',
    } as MusicStateData,
  },
  {
    id: ID.exploration,
    type: 'musicState',
    position: { x: 420, y: 100 },
    data: {
      label: 'Exploration',
      intensity: 20,
      looping: true,
      stems: ['ambient_pad', 'texture'],
      asset: 'Adrift 01',
      status: 'wip',
      directorNote: 'Floating through the server room of eternity',
    } as MusicStateData,
  },
  {
    id: ID.tensionRising,
    type: 'musicState',
    position: { x: 420, y: 500 },
    data: {
      label: 'Tension Rising',
      intensity: 40,
      looping: true,
      stems: ['pulse', 'eerie_pad'],
      asset: 'GHOST',
      status: 'wip',
      directorNote: 'Something is pinging your firewall',
    } as MusicStateData,
  },
  {
    id: ID.combatLow,
    type: 'musicState',
    position: { x: 760, y: 200 },
    data: {
      label: 'Combat Low',
      intensity: 60,
      looping: true,
      stems: ['drums', 'bass', 'synth_stab'],
      asset: 'STAGE ONE',
      status: 'wip',
      directorNote: 'Task Manager says there are too many hostile processes',
    } as MusicStateData,
  },
  {
    id: ID.combatHigh,
    type: 'musicState',
    position: { x: 760, y: 450 },
    data: {
      label: 'Combat High',
      intensity: 80,
      looping: true,
      stems: ['drums', 'bass', 'lead', 'fx_layer'],
      asset: 'PWN',
      status: 'review',
      directorNote: 'Full send — all cores overclocked',
    } as MusicStateData,
  },
  {
    id: ID.bossEncounter,
    type: 'musicState',
    position: { x: 1100, y: 300 },
    data: {
      label: 'Boss Encounter',
      intensity: 100,
      looping: true,
      stems: ['orchestra_hit', 'drums', 'choir', 'bass_drop'],
      asset: 'INEVITABLE ERADICATION (Enemy Cue 2 / Boss)',
      status: 'review',
      directorNote: 'The final firewall. He who must not be rebooted.',
    } as MusicStateData,
  },
  {
    id: ID.victory,
    type: 'musicState',
    position: { x: 1400, y: 200 },
    data: {
      label: 'Victory',
      intensity: 50,
      looping: false,
      stems: ['fanfare', 'shimmer'],
      asset: 'Rank Up',
      status: 'temp',
      directorNote: 'You have successfully defragmented the enemy',
    } as MusicStateData,
  },
  {
    id: ID.defeat,
    type: 'musicState',
    position: { x: 1400, y: 400 },
    data: {
      label: 'Defeat',
      intensity: 10,
      looping: false,
      stems: ['drone', 'reverb_tail'],
      asset: 'MEMORY',
      status: 'temp',
      directorNote: 'Blue screen of death. Literally.',
    } as MusicStateData,
  },

  // ── Transition Nodes ──
  {
    id: ID.tBeginMission,
    type: 'transition',
    position: { x: 250, y: 200 },
    data: {
      label: '→ Begin Mission',
      duration: 2000,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'SCurve',
    } as TransitionData,
  },
  {
    id: ID.tThreatDetected,
    type: 'transition',
    position: { x: 420, y: 300 },
    data: {
      label: '→ Threat Detected',
      duration: 1000,
      syncPoint: 'next-beat',
      fadeType: 'crossfade',
      fadeInCurve: 'Linear',
      fadeOutCurve: 'Linear',
    } as TransitionData,
  },
  {
    id: ID.tEngage,
    type: 'transition',
    position: { x: 590, y: 350 },
    data: {
      label: '→ Engage',
      duration: 500,
      syncPoint: 'immediate',
      fadeType: 'sting',
      fadeInCurve: 'Exp1',
      fadeOutCurve: 'Exp1',
    } as TransitionData,
  },
  {
    id: ID.tEscalate,
    type: 'transition',
    position: { x: 760, y: 330 },
    data: {
      label: '→ Escalate',
      duration: 500,
      syncPoint: 'next-beat',
      fadeType: 'crossfade',
      fadeInCurve: 'Linear',
      fadeOutCurve: 'Linear',
    } as TransitionData,
  },
  {
    id: ID.tBossPhase,
    type: 'transition',
    position: { x: 930, y: 380 },
    data: {
      label: '→ Boss Phase',
      duration: 3000,
      syncPoint: 'next-bar',
      fadeType: 'bridge',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'Log1',
    } as TransitionData,
  },
  {
    id: ID.tVictory,
    type: 'transition',
    position: { x: 1250, y: 250 },
    data: {
      label: '→ Victory!',
      duration: 2000,
      syncPoint: 'next-bar',
      fadeType: 'crossfade',
      fadeInCurve: 'SCurve',
      fadeOutCurve: 'SCurve',
    } as TransitionData,
  },
  {
    id: ID.tYouDied,
    type: 'transition',
    position: { x: 1250, y: 400 },
    data: {
      label: '→ You Died',
      duration: 0,
      syncPoint: 'immediate',
      fadeType: 'cut',
    } as TransitionData,
  },

  // ── Parameter Nodes ──
  {
    id: ID.pThreatLevel,
    type: 'parameter',
    position: { x: 590, y: 50 },
    data: {
      label: 'ThreatLevel',
      paramName: 'RTPC_ThreatLevel',
      minValue: 0,
      maxValue: 100,
      defaultValue: 0,
      description: 'Drives combat intensity — 0 = peaceful, 100 = existential dread. Mapped to enemy proximity, count, and type.',
      directorNote: 'This is the big one. Ghost of Tsushima threat vibes.',
    } as ParameterData,
  },
  {
    id: ID.pPlayerHealth,
    type: 'parameter',
    position: { x: 930, y: 550 },
    data: {
      label: 'PlayerHealth',
      paramName: 'RTPC_PlayerHealth',
      minValue: 0,
      maxValue: 100,
      defaultValue: 100,
      description: 'Health-reactive music — low health triggers filtered mix, heartbeat layer, and panic stingers.',
      directorNote: 'Below 20 HP the music should sound like your PC is dying.',
    } as ParameterData,
  },

  // ── Stinger Nodes ──
  {
    id: ID.sEnemySpotted,
    type: 'stinger',
    position: { x: 590, y: 550 },
    data: {
      label: 'Enemy Spotted',
      trigger: 'enemy_detected',
      asset: 'COLD LOGIC (Enemy Cue 1)',
      priority: 'medium',
      directorNote: 'Quick brass hit when first hostile pings on radar',
    } as StingerData,
  },
  {
    id: ID.sCriticalHit,
    type: 'stinger',
    position: { x: 930, y: 100 },
    data: {
      label: 'Critical Hit',
      trigger: 'critical_hit',
      asset: 'NOVA FLARE',
      priority: 'high',
      directorNote: 'Satisfying crunch — the dopamine button',
    } as StingerData,
  },
  {
    id: ID.sBossIntro,
    type: 'stinger',
    position: { x: 1100, y: 100 },
    data: {
      label: 'Boss Intro',
      trigger: 'boss_spawn',
      asset: 'BAD GUYS III',
      priority: 'critical',
      directorNote: 'THE FINAL ANTIVIRUS HAS ENTERED THE CHAT',
    } as StingerData,
  },

  // ── Event Nodes ──
  {
    id: ID.eCinematic,
    type: 'event',
    position: { x: 80, y: 100 },
    data: {
      label: 'Cinematic: Intro',
      eventType: 'cinematic',
      blueprintRef: 'BP_IntroCinematic',
      description: 'Opening cutscene — the server awakens, you are the last sysadmin',
    } as EventData,
  },
  {
    id: ID.eCheckpoint,
    type: 'event',
    position: { x: 1400, y: 50 },
    data: {
      label: 'Checkpoint Reached',
      eventType: 'checkpoint',
      blueprintRef: 'BP_CheckpointReached',
      description: 'Auto-save confirmation with subtle musical acknowledgment',
    } as EventData,
  },
];

// ─── Edges ────────────────────────────────────────────────────────

export const starterEdges: CanvasEdge[] = [
  // Main flow: Menu → Begin Mission → Exploration
  { id: 'e-menu-begin', source: ID.mainMenu, target: ID.tBeginMission },
  { id: 'e-begin-explore', source: ID.tBeginMission, target: ID.exploration },

  // Exploration → Threat Detected → Tension Rising
  { id: 'e-explore-threat', source: ID.exploration, target: ID.tThreatDetected },
  { id: 'e-threat-tension', source: ID.tThreatDetected, target: ID.tensionRising },

  // Tension Rising → Engage → Combat Low
  { id: 'e-tension-engage', source: ID.tensionRising, target: ID.tEngage },
  { id: 'e-engage-combatlow', source: ID.tEngage, target: ID.combatLow },

  // Combat Low → Escalate → Combat High
  { id: 'e-combatlow-escalate', source: ID.combatLow, target: ID.tEscalate },
  { id: 'e-escalate-combathigh', source: ID.tEscalate, target: ID.combatHigh },

  // Combat High → Boss Phase → Boss Encounter
  { id: 'e-combathigh-boss', source: ID.combatHigh, target: ID.tBossPhase },
  { id: 'e-bossphase-boss', source: ID.tBossPhase, target: ID.bossEncounter },

  // Boss → Victory! → Victory
  { id: 'e-boss-victory', source: ID.bossEncounter, target: ID.tVictory },
  { id: 'e-victory-win', source: ID.tVictory, target: ID.victory },

  // Boss → You Died → Defeat
  { id: 'e-boss-died', source: ID.bossEncounter, target: ID.tYouDied },
  { id: 'e-died-defeat', source: ID.tYouDied, target: ID.defeat },

  // ThreatLevel RTPC drives combat states
  { id: 'e-threat-combatlow', source: ID.pThreatLevel, target: ID.combatLow },
  { id: 'e-threat-combathigh', source: ID.pThreatLevel, target: ID.combatHigh },
  { id: 'e-threat-tension', source: ID.pThreatLevel, target: ID.tensionRising },

  // PlayerHealth RTPC connects to combat and defeat
  { id: 'e-health-combathigh', source: ID.pPlayerHealth, target: ID.combatHigh },
  { id: 'e-health-defeat', source: ID.pPlayerHealth, target: ID.defeat },

  // Cinematic intro → Main Menu
  { id: 'e-cine-menu', source: ID.eCinematic, target: ID.mainMenu },

  // Stinger → Boss Encounter
  { id: 'e-bossintro-boss', source: ID.sBossIntro, target: ID.bossEncounter },
];

// ─── Level Assets (references from audioAssets) ───────────────────

const levelAssetIds = [
  'aa-menuselect-19', 'aa-adrift01-21', 'aa-ghost-25', 'aa-stageone-14',
  'aa-pwn-11', 'aa-inevitable-05', 'aa-levelup-18', 'aa-memory-06',
  'aa-coldlogic-02', 'aa-novaflare-07', 'aa-badguys-24', 'aa-sweep-26',
];

const levelAssets: MusicAsset[] = audioAssets.filter((a) => levelAssetIds.includes(a.id));

// ─── Project Export ───────────────────────────────────────────────

export const starterProject: GameProject = {
  id: 'proj-ctrl-alt-defeat',
  name: GAME_NAME,
  subtitle: GAME_SUBTITLE,
  wwiseProjectPath: undefined,
  levels: [
    {
      id: 'level-sector-404',
      name: 'SECTOR 404: FILE NOT FOUND',
      subtitle: 'The Server Room at the End of the Universe',
      region: 'Core Mainframe',
      nodes: starterNodes,
      edges: starterEdges,
      assets: levelAssets,
    },
  ],
};
