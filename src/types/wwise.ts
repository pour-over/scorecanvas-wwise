export interface WwiseProjectInfo {
  name: string;
  version: string;
  platform: string;
  directories: Record<string, string>;
}

export interface WwiseObject {
  id: string;
  name: string;
  type: string;
  path: string;
  children?: WwiseObject[];
}

export interface WaapiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WwiseConnectionState {
  connected: boolean;
  connecting: boolean;
  projectInfo: WwiseProjectInfo | null;
  error: string | null;
}

export interface TransitionProperties {
  fadeInDuration: number;
  fadeOutDuration: number;
  fadeInCurve: string;
  fadeOutCurve: string;
  syncPoint: string;
}
