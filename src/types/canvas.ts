import type { Node, Edge } from '@xyflow/react';

// --- Node Status ---
export type NodeStatus =
  | 'temp'
  | 'wip'
  | 'review'
  | 'blocked'
  | 'approved'
  | 'final'
  | 'needs_revision'
  | 'placeholder';

// --- Wwise Sync ---
export interface WwiseSyncState {
  synced: boolean;
  lastSyncTime?: number;
  wwisePath?: string;
  wwiseId?: string;
  dirty: boolean;
}

// --- Node Data Types ---
export interface MusicStateData {
  [key: string]: unknown;
  label: string;
  intensity: number;
  looping: boolean;
  stems: string[];
  asset?: string;
  wwisePath?: string;
  wwiseId?: string;
  directorNote?: string;
  status?: NodeStatus;
  jiraTicket?: string;
}

export interface TransitionData {
  [key: string]: unknown;
  label: string;
  duration: number;
  syncPoint: 'immediate' | 'next-bar' | 'next-beat' | 'custom';
  fadeType: 'crossfade' | 'sting' | 'cut' | 'bridge';
  fadeInCurve?: WwiseCurveType;
  fadeOutCurve?: WwiseCurveType;
  wwiseSynced?: boolean;
  wwisePath?: string;
  wwiseId?: string;
  directorNote?: string;
  status?: NodeStatus;
}

export interface ParameterData {
  [key: string]: unknown;
  label: string;
  paramName: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  description: string;
  wwisePath?: string;
  wwiseId?: string;
  directorNote?: string;
  status?: NodeStatus;
}

export interface StingerData {
  [key: string]: unknown;
  label: string;
  trigger: string;
  asset: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  wwisePath?: string;
  wwiseId?: string;
  directorNote?: string;
  status?: NodeStatus;
}

export interface EventData {
  [key: string]: unknown;
  label: string;
  eventType: 'cinematic' | 'igc' | 'button_press' | 'checkpoint' | 'scripted_sequence' | 'qte';
  blueprintRef: string;
  description: string;
  wwisePath?: string;
  wwiseId?: string;
  directorNote?: string;
  status?: NodeStatus;
}

export type WwiseCurveType = 'Linear' | 'SCurve' | 'Log1' | 'Log2' | 'Log3' | 'Exp1' | 'Exp2' | 'Exp3';

export type CanvasNodeData = MusicStateData | TransitionData | ParameterData | StingerData | EventData;
export type CanvasNodeType = 'musicState' | 'transition' | 'parameter' | 'stinger' | 'event';

export type CanvasNode = Node<CanvasNodeData>;
export type CanvasEdge = Edge;

// --- Project / Level ---
export interface MusicAsset {
  id: string;
  filename: string;
  name?: string;
  category: 'intro' | 'loop' | 'ending' | 'transition' | 'stinger' | 'layer' | 'ambient';
  duration: string;
  bpm: number;
  key: string;
  stems: string[];
  audioFile?: string;
  wwiseImported?: boolean;
  tags?: string[];
  description?: string;
}

export interface GameLevel {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  assets: MusicAsset[];
}

export interface GameProject {
  id: string;
  name: string;
  subtitle: string;
  wwiseProjectPath?: string;
  levels: GameLevel[];
}

// --- Default node data ---
export const DEFAULT_NODE_DATA: Record<CanvasNodeType, CanvasNodeData> = {
  musicState: {
    label: 'New State',
    intensity: 50,
    looping: true,
    stems: [],
    asset: '',
  } as MusicStateData,
  transition: {
    label: 'New Transition',
    duration: 500,
    syncPoint: 'next-bar',
    fadeType: 'crossfade',
  } as TransitionData,
  parameter: {
    label: 'NewParam',
    paramName: 'RTPC_NewParam',
    minValue: 0,
    maxValue: 100,
    defaultValue: 50,
    description: '',
  } as ParameterData,
  stinger: {
    label: 'New Stinger',
    trigger: 'OnEvent',
    asset: '',
    priority: 'medium',
  } as StingerData,
  event: {
    label: 'New Event',
    eventType: 'cinematic',
    blueprintRef: '',
    description: '',
  } as EventData,
};
