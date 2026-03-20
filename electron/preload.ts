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

// Platform info
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
