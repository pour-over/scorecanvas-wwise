import { contextBridge, ipcRenderer } from 'electron';

// WAAPI
contextBridge.exposeInMainWorld('wwise', {
  connect: (url?: string) => ipcRenderer.invoke('waapi:connect', url),
  disconnect: () => ipcRenderer.invoke('waapi:disconnect'),
  call: (uri: string, args?: object, options?: object) =>
    ipcRenderer.invoke('waapi:call', uri, args, options),
  status: () => ipcRenderer.invoke('waapi:status'),
});

// Claude Chat (streaming)
contextBridge.exposeInMainWorld('claude', {
  stream: (messages: Array<{ role: string; content: string }>) =>
    ipcRenderer.invoke('claude:stream', messages),
  onChunk: (callback: (chunk: string) => void) =>
    ipcRenderer.on('claude:chunk', (_e, chunk) => callback(chunk)),
  onDone: (callback: (fullText: string) => void) =>
    ipcRenderer.on('claude:done', (_e, fullText) => callback(fullText)),
  onError: (callback: (error: string) => void) =>
    ipcRenderer.on('claude:error', (_e, error) => callback(error)),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('claude:chunk');
    ipcRenderer.removeAllListeners('claude:done');
    ipcRenderer.removeAllListeners('claude:error');
  },
});

// kie.ai Cover (AI Variation)
contextBridge.exposeInMainWorld('kie', {
  cover: (req: any) => ipcRenderer.invoke('kie:cover', req),
  status: (taskId: string) => ipcRenderer.invoke('kie:status', taskId),
  generate: (req: any) => ipcRenderer.invoke('kie:generate', req),
  onProgress: (callback: (status: string) => void) =>
    ipcRenderer.on('kie:progress', (_e, status) => callback(status)),
});

// Audio Analysis
contextBridge.exposeInMainWorld('audioAnalysis', {
  analyze: (filePath: string) => ipcRenderer.invoke('audio:analyze', filePath),
});

// Wwise Project Import
contextBridge.exposeInMainWorld('wwiseImport', {
  fromXml: (projectPath: string) => ipcRenderer.invoke('import:xml', projectPath),
  fromWaapi: () => ipcRenderer.invoke('import:waapi'),
  getManifest: (projectPath: string) => ipcRenderer.invoke('import:manifest', projectPath),
});

// Canvas → Wwise Push/Sync
contextBridge.exposeInMainWorld('wwiseSync', {
  pushNode: (node: any) => ipcRenderer.invoke('push:node', node),
  pushAll: (nodes: any[], edges: any[]) => ipcRenderer.invoke('push:all', nodes, edges),
  onProgress: (callback: (progress: { current: number; total: number; label: string }) => void) =>
    ipcRenderer.on('push:progress', (_e, progress) => callback(progress)),
  removeProgressListeners: () => ipcRenderer.removeAllListeners('push:progress'),
});

// Project File System (save/load/new)
contextBridge.exposeInMainWorld('projectFS', {
  save: (data: any) => ipcRenderer.invoke('project:save', data),
  saveAs: (data: any) => ipcRenderer.invoke('project:saveAs', data),
  open: () => ipcRenderer.invoke('project:open'),
  newProject: (name: string) => ipcRenderer.invoke('project:new', name),
  getRecent: () => ipcRenderer.invoke('project:recent'),
  scanWwiseOriginals: (wwiseProjectPath: string) => ipcRenderer.invoke('project:scanOriginals', wwiseProjectPath),
});

// Asset Sync (copy to Wwise + import)
contextBridge.exposeInMainWorld('assetSync', {
  list: () => ipcRenderer.invoke('assets:list'),
  syncToWwise: (wwiseProjectPath: string) => ipcRenderer.invoke('assets:syncToWwise', wwiseProjectPath),
  importToWwise: (syncResult: string) => ipcRenderer.invoke('assets:importToWwise', syncResult),
  onSyncProgress: (callback: (p: { current: number; total: number; file: string }) => void) =>
    ipcRenderer.on('assets:syncProgress', (_e, p) => callback(p)),
  onImportProgress: (callback: (p: { current: number; total: number; file: string }) => void) =>
    ipcRenderer.on('assets:importProgress', (_e, p) => callback(p)),
});

// Platform info
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
