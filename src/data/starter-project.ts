import type { GameProject, GameLevel, CanvasNode, CanvasEdge, MusicAsset } from '../types/canvas';
import type { MusicStateData, TransitionData, ParameterData, StingerData, EventData } from '../types/canvas';
import { audioAssets } from './audio-assets';

// ─── Helper ──────────────────────────────────────────────────────
function assets(...ids: string[]): MusicAsset[] {
  return audioAssets.filter((a) => ids.includes(a.id));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROJECT 1 — CTRL+ALT+DEFEAT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GAME_NAME = 'CTRL+ALT+DEFEAT';
export const GAME_SUBTITLE = 'Have You Tried Turning It Off and On Again';

// ── LEVEL 1: SECTOR 404 ─────────────────────────────────────────

const S4 = {
  mainMenu:      'ms-main-menu',
  exploration:   'ms-exploration',
  tensionRising: 'ms-tension-rising',
  combatLow:     'ms-combat-low',
  combatHigh:    'ms-combat-high',
  bossEncounter: 'ms-boss-encounter',
  victory:       'ms-victory',
  defeat:        'ms-defeat',
  tBeginMission:   'tr-begin-mission',
  tThreatDetected: 'tr-threat-detected',
  tEngage:         'tr-engage',
  tEscalate:       'tr-escalate',
  tBossPhase:      'tr-boss-phase',
  tVictory:        'tr-victory',
  tYouDied:        'tr-you-died',
  pThreatLevel:  'pm-threat-level',
  pPlayerHealth: 'pm-player-health',
  sEnemySpotted: 'st-enemy-spotted',
  sCriticalHit:  'st-critical-hit',
  sBossIntro:    'st-boss-intro',
  eCinematic:    'ev-cinematic-intro',
  eCheckpoint:   'ev-checkpoint',
} as const;

const sector404Nodes: CanvasNode[] = [
  { id: S4.mainMenu, type: 'musicState', position: { x: 80, y: 300 }, data: { label: 'Main Menu', intensity: 0, looping: true, stems: ['pad', 'melody'], asset: 'Menu / Select', status: 'approved', directorNote: 'Ambient UI hum — the calm before the Ctrl' } as MusicStateData },
  { id: S4.exploration, type: 'musicState', position: { x: 420, y: 100 }, data: { label: 'Exploration', intensity: 20, looping: true, stems: ['ambient_pad', 'texture'], asset: 'Ruins', status: 'wip', directorNote: 'Floating through the server room of eternity' } as MusicStateData },
  { id: S4.tensionRising, type: 'musicState', position: { x: 420, y: 500 }, data: { label: 'Tension Rising', intensity: 40, looping: true, stems: ['pulse', 'eerie_pad'], asset: 'GHOST', status: 'wip', directorNote: 'Something is pinging your firewall' } as MusicStateData },
  { id: S4.combatLow, type: 'musicState', position: { x: 760, y: 200 }, data: { label: 'Combat Low', intensity: 60, looping: true, stems: ['drums', 'bass', 'synth_stab'], asset: 'STAGE ONE', status: 'wip', directorNote: 'Task Manager says there are too many hostile processes' } as MusicStateData },
  { id: S4.combatHigh, type: 'musicState', position: { x: 760, y: 450 }, data: { label: 'Combat High', intensity: 80, looping: true, stems: ['drums', 'bass', 'lead', 'fx_layer'], asset: 'PWN', status: 'review', directorNote: 'Full send — all cores overclocked' } as MusicStateData },
  { id: S4.bossEncounter, type: 'musicState', position: { x: 1100, y: 300 }, data: { label: 'Boss Encounter', intensity: 100, looping: true, stems: ['orchestra_hit', 'drums', 'choir', 'bass_drop'], asset: 'INEVITABLE ERADICATION (Enemy Cue 2 / Boss)', status: 'review', directorNote: 'The final firewall. He who must not be rebooted.' } as MusicStateData },
  { id: S4.victory, type: 'musicState', position: { x: 1400, y: 200 }, data: { label: 'Victory', intensity: 50, looping: false, stems: ['fanfare', 'shimmer'], asset: 'Rank Up', status: 'temp', directorNote: 'You have successfully defragmented the enemy' } as MusicStateData },
  { id: S4.defeat, type: 'musicState', position: { x: 1400, y: 400 }, data: { label: 'Defeat', intensity: 10, looping: false, stems: ['drone', 'reverb_tail'], asset: 'MEMORY', status: 'temp', directorNote: 'Blue screen of death. Literally.' } as MusicStateData },
  { id: S4.tBeginMission, type: 'transition', position: { x: 250, y: 200 }, data: { label: '→ Begin Mission', duration: 2000, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: S4.tThreatDetected, type: 'transition', position: { x: 420, y: 300 }, data: { label: '→ Threat Detected', duration: 1000, syncPoint: 'next-beat', fadeType: 'crossfade', fadeInCurve: 'Linear', fadeOutCurve: 'Linear' } as TransitionData },
  { id: S4.tEngage, type: 'transition', position: { x: 590, y: 350 }, data: { label: '→ Engage', duration: 500, syncPoint: 'immediate', fadeType: 'sting', fadeInCurve: 'Exp1', fadeOutCurve: 'Exp1' } as TransitionData },
  { id: S4.tEscalate, type: 'transition', position: { x: 760, y: 330 }, data: { label: '→ Escalate', duration: 500, syncPoint: 'next-beat', fadeType: 'crossfade', fadeInCurve: 'Linear', fadeOutCurve: 'Linear' } as TransitionData },
  { id: S4.tBossPhase, type: 'transition', position: { x: 930, y: 380 }, data: { label: '→ Boss Phase', duration: 3000, syncPoint: 'next-bar', fadeType: 'bridge', fadeInCurve: 'SCurve', fadeOutCurve: 'Log1' } as TransitionData },
  { id: S4.tVictory, type: 'transition', position: { x: 1250, y: 250 }, data: { label: '→ Victory!', duration: 2000, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: S4.tYouDied, type: 'transition', position: { x: 1250, y: 400 }, data: { label: '→ You Died', duration: 0, syncPoint: 'immediate', fadeType: 'cut' } as TransitionData },
  { id: S4.pThreatLevel, type: 'parameter', position: { x: 590, y: 50 }, data: { label: 'ThreatLevel', paramName: 'RTPC_ThreatLevel', minValue: 0, maxValue: 100, defaultValue: 0, description: 'Drives combat intensity — 0 = peaceful, 100 = existential dread.', directorNote: 'This is the big one. Ghost of Tsushima threat vibes.' } as ParameterData },
  { id: S4.pPlayerHealth, type: 'parameter', position: { x: 930, y: 550 }, data: { label: 'PlayerHealth', paramName: 'RTPC_PlayerHealth', minValue: 0, maxValue: 100, defaultValue: 100, description: 'Health-reactive music — low health triggers filtered mix and panic stingers.', directorNote: 'Below 20 HP the music should sound like your PC is dying.' } as ParameterData },
  { id: S4.sEnemySpotted, type: 'stinger', position: { x: 590, y: 550 }, data: { label: 'Enemy Spotted', trigger: 'enemy_detected', asset: 'COLD LOGIC (Enemy Cue 1)', priority: 'medium', directorNote: 'Quick brass hit when first hostile pings on radar' } as StingerData },
  { id: S4.sCriticalHit, type: 'stinger', position: { x: 930, y: 100 }, data: { label: 'Critical Hit', trigger: 'critical_hit', asset: 'NOVA FLARE', priority: 'high', directorNote: 'Satisfying crunch — the dopamine button' } as StingerData },
  { id: S4.sBossIntro, type: 'stinger', position: { x: 1100, y: 100 }, data: { label: 'Boss Intro', trigger: 'boss_spawn', asset: 'BAD GUYS III', priority: 'critical', directorNote: 'THE FINAL ANTIVIRUS HAS ENTERED THE CHAT' } as StingerData },
  { id: S4.eCinematic, type: 'event', position: { x: 80, y: 100 }, data: { label: 'Cinematic: Intro', eventType: 'cinematic', blueprintRef: 'BP_IntroCinematic', description: 'Opening cutscene — the server awakens, you are the last sysadmin' } as EventData },
  { id: S4.eCheckpoint, type: 'event', position: { x: 1400, y: 50 }, data: { label: 'Checkpoint Reached', eventType: 'checkpoint', blueprintRef: 'BP_CheckpointReached', description: 'Auto-save confirmation with subtle musical acknowledgment' } as EventData },
];

const sector404Edges: CanvasEdge[] = [
  { id: 'e-menu-begin', source: S4.mainMenu, target: S4.tBeginMission },
  { id: 'e-begin-explore', source: S4.tBeginMission, target: S4.exploration },
  { id: 'e-explore-threat', source: S4.exploration, target: S4.tThreatDetected },
  { id: 'e-threat-tension', source: S4.tThreatDetected, target: S4.tensionRising },
  { id: 'e-tension-engage', source: S4.tensionRising, target: S4.tEngage },
  { id: 'e-engage-combatlow', source: S4.tEngage, target: S4.combatLow },
  { id: 'e-combatlow-escalate', source: S4.combatLow, target: S4.tEscalate },
  { id: 'e-escalate-combathigh', source: S4.tEscalate, target: S4.combatHigh },
  { id: 'e-combathigh-boss', source: S4.combatHigh, target: S4.tBossPhase },
  { id: 'e-bossphase-boss', source: S4.tBossPhase, target: S4.bossEncounter },
  { id: 'e-boss-victory', source: S4.bossEncounter, target: S4.tVictory },
  { id: 'e-victory-win', source: S4.tVictory, target: S4.victory },
  { id: 'e-boss-died', source: S4.bossEncounter, target: S4.tYouDied },
  { id: 'e-died-defeat', source: S4.tYouDied, target: S4.defeat },
  { id: 'e-threat-combatlow', source: S4.pThreatLevel, target: S4.combatLow },
  { id: 'e-threat-combathigh', source: S4.pThreatLevel, target: S4.combatHigh },
  { id: 'e-threat-tension2', source: S4.pThreatLevel, target: S4.tensionRising },
  { id: 'e-health-combathigh', source: S4.pPlayerHealth, target: S4.combatHigh },
  { id: 'e-health-defeat', source: S4.pPlayerHealth, target: S4.defeat },
  { id: 'e-cine-menu', source: S4.eCinematic, target: S4.mainMenu },
  { id: 'e-bossintro-boss', source: S4.sBossIntro, target: S4.bossEncounter },
];

// ── LEVEL 2: BUFFER OVERFLOW BEACH ──────────────────────────────

const BB = {
  beachPatrol:   'bb-ms-beach-patrol',
  sandstorm:     'bb-ms-sandstorm',
  tideCombat:    'bb-ms-tide-combat',
  bossFirewall:  'bb-ms-boss-firewall',
  restArea:      'bb-ms-rest-area',
  victoryLap:    'bb-ms-victory-lap',
  tShoreToStorm: 'bb-tr-shore-to-storm',
  tStormToTide:  'bb-tr-storm-to-tide',
  tTideToBoss:   'bb-tr-tide-to-boss',
  tBossToVic:    'bb-tr-boss-to-victory',
  pWaveIntensity:'bb-pm-wave-intensity',
  sAmbush:       'bb-st-ambush',
  sPowerWave:    'bb-st-power-wave',
} as const;

const bufferBeachNodes: CanvasNode[] = [
  { id: BB.beachPatrol, type: 'musicState', position: { x: 80, y: 200 }, data: { label: 'Beach Patrol', intensity: 30, looping: true, stems: ['rhythm', 'pad'], asset: 'BETTER', status: 'wip', directorNote: 'Sunny vibes with an underlying sense of impending segfault' } as MusicStateData },
  { id: BB.sandstorm, type: 'musicState', position: { x: 380, y: 100 }, data: { label: 'Sandstorm Alert', intensity: 60, looping: true, stems: ['synth_blast', 'drums'], asset: 'POW3R', status: 'wip', directorNote: 'Sand in your CPU. Thermal throttling imminent.' } as MusicStateData },
  { id: BB.tideCombat, type: 'musicState', position: { x: 680, y: 200 }, data: { label: 'Tide Combat', intensity: 75, looping: true, stems: ['drums', 'bass', 'lead'], asset: 'PWN', status: 'wip', directorNote: 'The ocean has declared war on your framerate' } as MusicStateData },
  { id: BB.bossFirewall, type: 'musicState', position: { x: 980, y: 200 }, data: { label: 'Boss: The Firewall', intensity: 100, looping: true, stems: ['orchestra_hit', 'choir', 'bass_drop'], asset: 'INEVITABLE ERADICATION (Enemy Cue 2 / Boss)', status: 'review', directorNote: 'Port 443 has become sentient and it is ANGRY' } as MusicStateData },
  { id: BB.restArea, type: 'musicState', position: { x: 680, y: 400 }, data: { label: 'Rest Area', intensity: 10, looping: true, stems: ['pad', 'ambient'], asset: 'MEMORY', status: 'temp', directorNote: 'A save point shaped like a beach umbrella' } as MusicStateData },
  { id: BB.victoryLap, type: 'musicState', position: { x: 1280, y: 200 }, data: { label: 'Victory Lap', intensity: 50, looping: false, stems: ['fanfare'], asset: 'Rank Up', status: 'temp', directorNote: 'You have successfully patched the beach' } as MusicStateData },
  { id: BB.tShoreToStorm, type: 'transition', position: { x: 230, y: 150 }, data: { label: '→ Sandstorm Incoming', duration: 1500, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: BB.tStormToTide, type: 'transition', position: { x: 530, y: 150 }, data: { label: '→ Tide Rises', duration: 800, syncPoint: 'next-beat', fadeType: 'sting', fadeInCurve: 'Exp1', fadeOutCurve: 'Linear' } as TransitionData },
  { id: BB.tTideToBoss, type: 'transition', position: { x: 830, y: 200 }, data: { label: '→ Firewall Breach', duration: 2500, syncPoint: 'next-bar', fadeType: 'bridge', fadeInCurve: 'SCurve', fadeOutCurve: 'Log1' } as TransitionData },
  { id: BB.tBossToVic, type: 'transition', position: { x: 1130, y: 200 }, data: { label: '→ Beach Cleared', duration: 2000, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: BB.pWaveIntensity, type: 'parameter', position: { x: 530, y: 380 }, data: { label: 'WaveIntensity', paramName: 'RTPC_WaveIntensity', minValue: 0, maxValue: 100, defaultValue: 20, description: 'Controls tide-based combat escalation — 0 = low tide, 100 = tsunami of enemies.' } as ParameterData },
  { id: BB.sAmbush, type: 'stinger', position: { x: 380, y: 380 }, data: { label: 'Ambush!', trigger: 'beach_ambush', asset: 'COLD LOGIC (Enemy Cue 1)', priority: 'high', directorNote: 'Enemies burst out of the sand like angry crabs' } as StingerData },
  { id: BB.sPowerWave, type: 'stinger', position: { x: 830, y: 80 }, data: { label: 'Power Wave', trigger: 'power_wave', asset: 'NOVA FLARE', priority: 'medium', directorNote: 'A wave of pure energy — surfable, apparently' } as StingerData },
];

const bufferBeachEdges: CanvasEdge[] = [
  { id: 'bb-e-patrol-storm', source: BB.beachPatrol, target: BB.tShoreToStorm },
  { id: 'bb-e-storm-sand', source: BB.tShoreToStorm, target: BB.sandstorm },
  { id: 'bb-e-sand-tide', source: BB.sandstorm, target: BB.tStormToTide },
  { id: 'bb-e-tide-combat', source: BB.tStormToTide, target: BB.tideCombat },
  { id: 'bb-e-combat-boss', source: BB.tideCombat, target: BB.tTideToBoss },
  { id: 'bb-e-boss-fire', source: BB.tTideToBoss, target: BB.bossFirewall },
  { id: 'bb-e-fire-vic', source: BB.bossFirewall, target: BB.tBossToVic },
  { id: 'bb-e-vic-lap', source: BB.tBossToVic, target: BB.victoryLap },
  { id: 'bb-e-wave-tide', source: BB.pWaveIntensity, target: BB.tideCombat },
  { id: 'bb-e-wave-sand', source: BB.pWaveIntensity, target: BB.sandstorm },
  { id: 'bb-e-combat-rest', source: BB.tideCombat, target: BB.restArea },
  { id: 'bb-e-ambush-patrol', source: BB.sAmbush, target: BB.beachPatrol },
];

// ── LEVEL 3: THE RECURSIVE JUNGLE ──────────────────────────────

const RJ = {
  canopy:       'rj-ms-canopy',
  vineTension:  'rj-ms-vine-tension',
  undergrowth:  'rj-ms-undergrowth',
  apexBoss:     'rj-ms-apex-boss',
  clearing:     'rj-ms-clearing',
  tCanopyToVine:     'rj-tr-canopy-vine',
  tVineToUndergrowth:'rj-tr-vine-under',
  tUnderToApex:      'rj-tr-under-apex',
  pVegetation:  'rj-pm-vegetation',
  sPredator:    'rj-st-predator',
  sTrap:        'rj-st-trap',
} as const;

const jungleNodes: CanvasNode[] = [
  { id: RJ.canopy, type: 'musicState', position: { x: 80, y: 200 }, data: { label: 'Canopy Exploration', intensity: 25, looping: true, stems: ['organic_pad', 'bird_texture'], asset: 'PERILOUS GROWTH (Jungle World)', status: 'wip', directorNote: 'The trees are whispering in recursion' } as MusicStateData },
  { id: RJ.vineTension, type: 'musicState', position: { x: 380, y: 120 }, data: { label: 'Vine Tension', intensity: 45, looping: true, stems: ['pulse', 'eerie_pad'], asset: 'GHOST', status: 'wip', directorNote: 'That vine just moved. Or did you move? The call stack is confused.' } as MusicStateData },
  { id: RJ.undergrowth, type: 'musicState', position: { x: 680, y: 200 }, data: { label: 'Undergrowth Combat', intensity: 70, looping: true, stems: ['drums', 'bass', 'synth'], asset: 'BETTER', status: 'wip', directorNote: 'Fighting ferns that fight back' } as MusicStateData },
  { id: RJ.apexBoss, type: 'musicState', position: { x: 980, y: 200 }, data: { label: 'Apex Predator Boss', intensity: 100, looping: true, stems: ['orchestra_hit', 'drums', 'choir'], asset: 'BAD GUYS III', status: 'review', directorNote: 'A T-Rex made of merge conflicts' } as MusicStateData },
  { id: RJ.clearing, type: 'musicState', position: { x: 1280, y: 200 }, data: { label: 'Clearing', intensity: 10, looping: true, stems: ['pad', 'ambient'], asset: 'MEMORY', status: 'temp', directorNote: 'Finally, a base case' } as MusicStateData },
  { id: RJ.tCanopyToVine, type: 'transition', position: { x: 230, y: 160 }, data: { label: '→ Something Stirs', duration: 1200, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: RJ.tVineToUndergrowth, type: 'transition', position: { x: 530, y: 160 }, data: { label: '→ Into the Brush', duration: 600, syncPoint: 'next-beat', fadeType: 'sting', fadeInCurve: 'Exp1', fadeOutCurve: 'Linear' } as TransitionData },
  { id: RJ.tUnderToApex, type: 'transition', position: { x: 830, y: 200 }, data: { label: '→ Apex Arrives', duration: 3000, syncPoint: 'next-bar', fadeType: 'bridge', fadeInCurve: 'SCurve', fadeOutCurve: 'Log1' } as TransitionData },
  { id: RJ.pVegetation, type: 'parameter', position: { x: 530, y: 380 }, data: { label: 'VegetationDensity', paramName: 'RTPC_VegetationDensity', minValue: 0, maxValue: 100, defaultValue: 50, description: 'How thick the jungle is — affects reverb, filter, and layer density.' } as ParameterData },
  { id: RJ.sPredator, type: 'stinger', position: { x: 380, y: 380 }, data: { label: 'Predator Alert', trigger: 'predator_near', asset: 'ENEMY Theme', priority: 'high', directorNote: 'Something with too many teeth just appeared on the minimap' } as StingerData },
  { id: RJ.sTrap, type: 'stinger', position: { x: 830, y: 80 }, data: { label: 'Trap Triggered', trigger: 'trap_triggered', asset: 'NOVA FLARE', priority: 'medium', directorNote: 'You stepped on a venus fly trap the size of a Buick' } as StingerData },
];

const jungleEdges: CanvasEdge[] = [
  { id: 'rj-e-canopy-vine', source: RJ.canopy, target: RJ.tCanopyToVine },
  { id: 'rj-e-vine-tension', source: RJ.tCanopyToVine, target: RJ.vineTension },
  { id: 'rj-e-tension-under', source: RJ.vineTension, target: RJ.tVineToUndergrowth },
  { id: 'rj-e-under-combat', source: RJ.tVineToUndergrowth, target: RJ.undergrowth },
  { id: 'rj-e-combat-apex', source: RJ.undergrowth, target: RJ.tUnderToApex },
  { id: 'rj-e-apex-boss', source: RJ.tUnderToApex, target: RJ.apexBoss },
  { id: 'rj-e-boss-clearing', source: RJ.apexBoss, target: RJ.clearing },
  { id: 'rj-e-veg-canopy', source: RJ.pVegetation, target: RJ.canopy },
  { id: 'rj-e-veg-under', source: RJ.pVegetation, target: RJ.undergrowth },
  { id: 'rj-e-predator-vine', source: RJ.sPredator, target: RJ.vineTension },
];

// ── LEVEL 4: ABSOLUTE ZERO — THE FROZEN STACK ──────────────────

const AZ = {
  glacierDrift:  'az-ms-glacier-drift',
  iceCave:       'az-ms-ice-cave',
  blizzard:      'az-ms-blizzard',
  cryoBoss:      'az-ms-cryo-boss',
  thaw:          'az-ms-thaw',
  tDriftToCave:  'az-tr-drift-cave',
  tCaveToBlizz:  'az-tr-cave-blizzard',
  tBlizzToBoss:  'az-tr-blizz-boss',
  pTemperature:  'az-pm-temperature',
  sAvalanche:    'az-st-avalanche',
  sCryoBlast:    'az-st-cryo-blast',
} as const;

const frozenStackNodes: CanvasNode[] = [
  { id: AZ.glacierDrift, type: 'musicState', position: { x: 80, y: 200 }, data: { label: 'Glacier Drift', intensity: 15, looping: true, stems: ['ice_pad', 'wind_texture'], asset: 'GLACIAL SOLITUDE (Icy Snow World)', status: 'wip', directorNote: 'So cold your variables froze mid-assignment' } as MusicStateData },
  { id: AZ.iceCave, type: 'musicState', position: { x: 380, y: 120 }, data: { label: 'Ice Cave Tension', intensity: 40, looping: true, stems: ['pulse', 'crystal_resonance'], asset: 'GHOST', status: 'wip', directorNote: 'The echo here has a stack depth of 47' } as MusicStateData },
  { id: AZ.blizzard, type: 'musicState', position: { x: 680, y: 200 }, data: { label: 'Blizzard Combat', intensity: 75, looping: true, stems: ['drums', 'synth_blast', 'wind'], asset: 'POW3R', status: 'wip', directorNote: 'Fighting in a blizzard: 30fps if you are lucky' } as MusicStateData },
  { id: AZ.cryoBoss, type: 'musicState', position: { x: 980, y: 200 }, data: { label: 'Cryo-Boss', intensity: 100, looping: true, stems: ['orchestra_hit', 'choir', 'frost_fx'], asset: 'INEVITABLE ERADICATION (Enemy Cue 2 / Boss)', status: 'review', directorNote: 'A sentient glacier with admin privileges' } as MusicStateData },
  { id: AZ.thaw, type: 'musicState', position: { x: 1280, y: 200 }, data: { label: 'Thaw', intensity: 10, looping: true, stems: ['ambient', 'drip_texture'], asset: 'Ruins', status: 'temp', directorNote: 'The ice melts. Your variables are free.' } as MusicStateData },
  { id: AZ.tDriftToCave, type: 'transition', position: { x: 230, y: 160 }, data: { label: '→ Into the Cave', duration: 1500, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: AZ.tCaveToBlizz, type: 'transition', position: { x: 530, y: 160 }, data: { label: '→ Blizzard Hits', duration: 500, syncPoint: 'immediate', fadeType: 'sting', fadeInCurve: 'Exp1', fadeOutCurve: 'Exp1' } as TransitionData },
  { id: AZ.tBlizzToBoss, type: 'transition', position: { x: 830, y: 200 }, data: { label: '→ Cryo Awakens', duration: 3000, syncPoint: 'next-bar', fadeType: 'bridge', fadeInCurve: 'SCurve', fadeOutCurve: 'Log1' } as TransitionData },
  { id: AZ.pTemperature, type: 'parameter', position: { x: 530, y: 380 }, data: { label: 'Temperature', paramName: 'RTPC_Temperature', minValue: 0, maxValue: 100, defaultValue: 0, description: 'Ambient temperature — 0 = absolute zero, 100 = thawed. Drives ice reverb and filter.' } as ParameterData },
  { id: AZ.sAvalanche, type: 'stinger', position: { x: 380, y: 380 }, data: { label: 'Avalanche!', trigger: 'avalanche', asset: 'COLD LOGIC (Enemy Cue 1)', priority: 'critical', directorNote: 'MOUNTAIN.EXE HAS STOPPED WORKING' } as StingerData },
  { id: AZ.sCryoBlast, type: 'stinger', position: { x: 830, y: 80 }, data: { label: 'Cryo Blast', trigger: 'cryo_blast', asset: 'NOVA FLARE', priority: 'high', directorNote: 'Flash-freeze attack — your HP bar gets freezer burn' } as StingerData },
];

const frozenStackEdges: CanvasEdge[] = [
  { id: 'az-e-drift-cave', source: AZ.glacierDrift, target: AZ.tDriftToCave },
  { id: 'az-e-cave-tension', source: AZ.tDriftToCave, target: AZ.iceCave },
  { id: 'az-e-cave-blizz', source: AZ.iceCave, target: AZ.tCaveToBlizz },
  { id: 'az-e-blizz-combat', source: AZ.tCaveToBlizz, target: AZ.blizzard },
  { id: 'az-e-blizz-boss', source: AZ.blizzard, target: AZ.tBlizzToBoss },
  { id: 'az-e-boss-cryo', source: AZ.tBlizzToBoss, target: AZ.cryoBoss },
  { id: 'az-e-cryo-thaw', source: AZ.cryoBoss, target: AZ.thaw },
  { id: 'az-e-temp-drift', source: AZ.pTemperature, target: AZ.glacierDrift },
  { id: 'az-e-temp-blizz', source: AZ.pTemperature, target: AZ.blizzard },
  { id: 'az-e-avalanche-cave', source: AZ.sAvalanche, target: AZ.iceCave },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROJECT 2 — SPREADSHEET QUEST: FISCAL FANTASY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SQ = {
  cubicle:    'sq-ms-cubicle',
  audit:      'sq-ms-audit',
  crunch:     'sq-ms-crunch',
  bossAuditor:'sq-ms-boss-auditor',
  victory:    'sq-ms-fiscal-victory',
  tCalm2Audit:'sq-tr-calm-audit',
  tAudit2Crunch:'sq-tr-audit-crunch',
  tCrunch2Boss: 'sq-tr-crunch-boss',
  pDeadline:  'sq-pm-deadline',
  sCellError: 'sq-st-cell-error',
} as const;

const spreadsheetNodes: CanvasNode[] = [
  { id: SQ.cubicle, type: 'musicState', position: { x: 80, y: 200 }, data: { label: 'Cubicle Calm', intensity: 10, looping: true, stems: ['ambient', 'keyboard_clicks'], asset: 'Ruins', status: 'wip', directorNote: 'The gentle hum of fluorescent lights and broken dreams' } as MusicStateData },
  { id: SQ.audit, type: 'musicState', position: { x: 380, y: 120 }, data: { label: 'Audit Tension', intensity: 45, looping: true, stems: ['pulse', 'anxiety_pad'], asset: 'GHOST', status: 'wip', directorNote: 'Someone from accounting just walked in with a clipboard' } as MusicStateData },
  { id: SQ.crunch, type: 'musicState', position: { x: 680, y: 200 }, data: { label: 'Crunch Time', intensity: 70, looping: true, stems: ['drums', 'synth', 'urgency'], asset: 'STAGE ONE', status: 'wip', directorNote: 'The deadline is in 3 hours and your VLOOKUP returns #REF!' } as MusicStateData },
  { id: SQ.bossAuditor, type: 'musicState', position: { x: 980, y: 200 }, data: { label: 'Boss: The Auditor', intensity: 100, looping: true, stems: ['orchestra_hit', 'menace', 'calculator_fx'], asset: 'ENEMY Theme', status: 'review', directorNote: 'He sees every unreconciled cell. He is INEVITABLE DEPRECIATION.' } as MusicStateData },
  { id: SQ.victory, type: 'musicState', position: { x: 1280, y: 200 }, data: { label: 'Fiscal Victory', intensity: 50, looping: false, stems: ['fanfare', 'receipt_printer'], asset: 'Rank Up', status: 'temp', directorNote: 'The spreadsheet balances. Tears of joy. Promoted to Senior Analyst.' } as MusicStateData },
  { id: SQ.tCalm2Audit, type: 'transition', position: { x: 230, y: 160 }, data: { label: '→ Audit Incoming', duration: 1500, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: SQ.tAudit2Crunch, type: 'transition', position: { x: 530, y: 160 }, data: { label: '→ Crunch Mode', duration: 800, syncPoint: 'next-beat', fadeType: 'sting', fadeInCurve: 'Exp1', fadeOutCurve: 'Linear' } as TransitionData },
  { id: SQ.tCrunch2Boss, type: 'transition', position: { x: 830, y: 200 }, data: { label: '→ The Auditor Arrives', duration: 3000, syncPoint: 'next-bar', fadeType: 'bridge', fadeInCurve: 'SCurve', fadeOutCurve: 'Log1' } as TransitionData },
  { id: SQ.pDeadline, type: 'parameter', position: { x: 530, y: 380 }, data: { label: 'DeadlinePressure', paramName: 'RTPC_DeadlinePressure', minValue: 0, maxValue: 100, defaultValue: 10, description: 'How close to the fiscal deadline — 0 = Monday morning, 100 = 11:59 PM Friday.' } as ParameterData },
  { id: SQ.sCellError, type: 'stinger', position: { x: 380, y: 380 }, data: { label: 'Cell Reference Error', trigger: 'cell_error', asset: 'COLD LOGIC (Enemy Cue 1)', priority: 'high', directorNote: '#VALUE! — the two most terrifying words in any language' } as StingerData },
];

const spreadsheetEdges: CanvasEdge[] = [
  { id: 'sq-e-cubicle-audit', source: SQ.cubicle, target: SQ.tCalm2Audit },
  { id: 'sq-e-audit-tension', source: SQ.tCalm2Audit, target: SQ.audit },
  { id: 'sq-e-audit-crunch', source: SQ.audit, target: SQ.tAudit2Crunch },
  { id: 'sq-e-crunch-time', source: SQ.tAudit2Crunch, target: SQ.crunch },
  { id: 'sq-e-crunch-boss', source: SQ.crunch, target: SQ.tCrunch2Boss },
  { id: 'sq-e-boss-auditor', source: SQ.tCrunch2Boss, target: SQ.bossAuditor },
  { id: 'sq-e-boss-victory', source: SQ.bossAuditor, target: SQ.victory },
  { id: 'sq-e-deadline-crunch', source: SQ.pDeadline, target: SQ.crunch },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROJECT 3 — CUSTODIAL ARTS SIMULATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CA = {
  mopping:       'ca-ms-mopping',
  suspicious:    'ca-ms-suspicious',
  raccoonAttack: 'ca-ms-raccoon',
  breakRoom:     'ca-ms-break-room',
  tQuietToSus:   'ca-tr-quiet-sus',
  tSusToRaccoon: 'ca-tr-sus-raccoon',
  pCleanliness:  'ca-pm-cleanliness',
  sSpill:        'ca-st-spill',
} as const;

const custodialNodes: CanvasNode[] = [
  { id: CA.mopping, type: 'musicState', position: { x: 80, y: 200 }, data: { label: 'Quiet Mopping', intensity: 10, looping: true, stems: ['ambient', 'mop_rhythm'], asset: 'MEMORY', status: 'wip', directorNote: 'The zen of floor care. One mop stroke at a time.' } as MusicStateData },
  { id: CA.suspicious, type: 'musicState', position: { x: 380, y: 120 }, data: { label: 'Suspicious Noises', intensity: 40, looping: true, stems: ['pulse', 'creak_texture'], asset: 'GHOST', status: 'wip', directorNote: 'Was that... was that the vending machine? At 2 AM?' } as MusicStateData },
  { id: CA.raccoonAttack, type: 'musicState', position: { x: 680, y: 200 }, data: { label: 'Raccoon Attack', intensity: 75, looping: true, stems: ['drums', 'chaos', 'trash_fx'], asset: 'BETTER', status: 'review', directorNote: 'THREE RACCOONS AND THEY KNOW KUNG FU' } as MusicStateData },
  { id: CA.breakRoom, type: 'musicState', position: { x: 980, y: 200 }, data: { label: 'Break Room', intensity: 5, looping: true, stems: ['ambient', 'microwave_hum'], asset: 'Ruins', status: 'temp', directorNote: 'Someone left fish in the microwave again. This is your Vietnam.' } as MusicStateData },
  { id: CA.tQuietToSus, type: 'transition', position: { x: 230, y: 160 }, data: { label: '→ What Was That?', duration: 1200, syncPoint: 'next-bar', fadeType: 'crossfade', fadeInCurve: 'SCurve', fadeOutCurve: 'SCurve' } as TransitionData },
  { id: CA.tSusToRaccoon, type: 'transition', position: { x: 530, y: 160 }, data: { label: '→ RACCOONS!', duration: 200, syncPoint: 'immediate', fadeType: 'cut' } as TransitionData },
  { id: CA.pCleanliness, type: 'parameter', position: { x: 380, y: 380 }, data: { label: 'FloorCleanliness', paramName: 'RTPC_FloorCleanliness', minValue: 0, maxValue: 100, defaultValue: 50, description: 'How clean the floor is — 0 = biohazard, 100 = you can see your reflection.' } as ParameterData },
  { id: CA.sSpill, type: 'stinger', position: { x: 680, y: 80 }, data: { label: 'Spill Detected!', trigger: 'spill_detected', asset: 'NOVA FLARE', priority: 'critical', directorNote: 'CODE RED. SOMEONE DROPPED A GRANDE MOCHA IN THE LOBBY.' } as StingerData },
];

const custodialEdges: CanvasEdge[] = [
  { id: 'ca-e-mop-sus', source: CA.mopping, target: CA.tQuietToSus },
  { id: 'ca-e-sus-noises', source: CA.tQuietToSus, target: CA.suspicious },
  { id: 'ca-e-sus-raccoon', source: CA.suspicious, target: CA.tSusToRaccoon },
  { id: 'ca-e-raccoon-attack', source: CA.tSusToRaccoon, target: CA.raccoonAttack },
  { id: 'ca-e-raccoon-break', source: CA.raccoonAttack, target: CA.breakRoom },
  { id: 'ca-e-clean-mop', source: CA.pCleanliness, target: CA.mopping },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEVEL DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sector404Level: GameLevel = {
  id: 'sector-404',
  name: 'SECTOR 404: FILE NOT FOUND',
  subtitle: 'The Server Room at the End of the Universe',
  region: 'Core Mainframe',
  nodes: sector404Nodes,
  edges: sector404Edges,
  assets: assets(
    'aa-menuselect-19', 'aa-ruins-13', 'aa-ghost-25', 'aa-stageone-14',
    'aa-pwn-11', 'aa-inevitable-05', 'aa-levelup-18', 'aa-memory-06',
    'aa-coldlogic-02', 'aa-novaflare-07', 'aa-badguys-24', 'aa-sweep-26',
  ),
};

const bufferBeachLevel: GameLevel = {
  id: 'buffer-overflow-beach',
  name: 'BUFFER OVERFLOW BEACH',
  subtitle: 'Sun, Sand, and Segmentation Faults',
  region: 'Coastal Memory Bank',
  nodes: bufferBeachNodes,
  edges: bufferBeachEdges,
  assets: assets(
    'aa-better-01', 'aa-pow3r-10', 'aa-pwn-11', 'aa-inevitable-05',
    'aa-memory-06', 'aa-levelup-18', 'aa-coldlogic-02', 'aa-novaflare-07',
  ),
};

const jungleLevel: GameLevel = {
  id: 'recursive-jungle',
  name: 'THE RECURSIVE JUNGLE',
  subtitle: 'It Calls Itself and Nobody Knows Why',
  region: 'Heap Overflow Rainforest',
  nodes: jungleNodes,
  edges: jungleEdges,
  assets: assets(
    'aa-perilous-08', 'aa-ghost-25', 'aa-better-01', 'aa-badguys-24',
    'aa-memory-06', 'aa-enemytheme-16', 'aa-novaflare-07',
  ),
};

const frozenStackLevel: GameLevel = {
  id: 'frozen-stack',
  name: 'ABSOLUTE ZERO: THE FROZEN STACK',
  subtitle: 'Where Variables Go to Die',
  region: 'Cryogenic Memory',
  nodes: frozenStackNodes,
  edges: frozenStackEdges,
  assets: assets(
    'aa-glacial-04', 'aa-ghost-25', 'aa-pow3r-10', 'aa-inevitable-05',
    'aa-ruins-13', 'aa-coldlogic-02', 'aa-novaflare-07',
  ),
};

const spreadsheetLevel: GameLevel = {
  id: 'q4-close',
  name: 'Q4 CLOSE: THE FINAL RECONCILIATION',
  subtitle: 'May Your Formulas Be Ever Balanced',
  region: 'Finance Wing',
  nodes: spreadsheetNodes,
  edges: spreadsheetEdges,
  assets: assets(
    'aa-ruins-13', 'aa-ghost-25', 'aa-stageone-14', 'aa-enemytheme-16',
    'aa-levelup-18', 'aa-coldlogic-02',
  ),
};

const custodialLevel: GameLevel = {
  id: 'corporate-hq',
  name: 'CORPORATE HQ: NIGHT SHIFT',
  subtitle: 'The Floors Won\'t Mop Themselves',
  region: 'Corporate Headquarters',
  nodes: custodialNodes,
  edges: custodialEdges,
  assets: assets(
    'aa-memory-06', 'aa-ghost-25', 'aa-better-01', 'aa-ruins-13',
    'aa-novaflare-07',
  ),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROJECT DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ctrlAltDefeat: GameProject = {
  id: 'ctrl-alt-defeat',
  name: 'CTRL+ALT+DEFEAT',
  subtitle: 'Have You Tried Turning It Off and On Again',
  levels: [sector404Level, bufferBeachLevel, jungleLevel, frozenStackLevel],
};

const spreadsheetQuest: GameProject = {
  id: 'spreadsheet-quest',
  name: 'SPREADSHEET QUEST: FISCAL FANTASY',
  subtitle: 'VLOOKUP or Die',
  levels: [spreadsheetLevel],
};

const custodialArts: GameProject = {
  id: 'custodial-arts',
  name: 'CUSTODIAL ARTS SIMULATOR',
  subtitle: 'Someone Has To',
  levels: [custodialLevel],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROJECTS: GameProject[] = [ctrlAltDefeat, spreadsheetQuest, custodialArts];

export const PROJECT_LEVELS: Record<string, GameLevel[]> = {
  'ctrl-alt-defeat': ctrlAltDefeat.levels,
  'spreadsheet-quest': spreadsheetQuest.levels,
  'custodial-arts': custodialArts.levels,
};

export const LEVEL_NODES: Record<string, CanvasNode[]> = {
  'sector-404': sector404Nodes,
  'buffer-overflow-beach': bufferBeachNodes,
  'recursive-jungle': jungleNodes,
  'frozen-stack': frozenStackNodes,
  'q4-close': spreadsheetNodes,
  'corporate-hq': custodialNodes,
};

export const LEVEL_EDGES: Record<string, CanvasEdge[]> = {
  'sector-404': sector404Edges,
  'buffer-overflow-beach': bufferBeachEdges,
  'recursive-jungle': jungleEdges,
  'frozen-stack': frozenStackEdges,
  'q4-close': spreadsheetEdges,
  'corporate-hq': custodialEdges,
};

export const DEFAULT_PROJECT_ID = 'ctrl-alt-defeat';
export const DEFAULT_LEVEL_ID = 'sector-404';

// ── Backward-compat exports (used by canvas store) ──────────────
export const starterProject = ctrlAltDefeat;
export const starterNodes = sector404Nodes;
export const starterEdges = sector404Edges;
