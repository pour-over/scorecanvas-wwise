import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WaapiClient } from './waapi/client.js';
import { streamChat, type ChatMessageParam } from './services/claude.js';
import { submitCover, getCoverStatus, generateCover, type CoverRequest } from './services/kie.js';
import { analyzeAudio } from './services/audio-analysis.js';
import { importWwiseProject, importFromWaapi, generateAssetManifest } from './services/wwise-import.js';
import { WwiseSyncEngine } from './waapi/sync-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root — try multiple paths
// dotenv v17+ doesn't auto-inject into process.env, so we do it manually
const envPaths = [
  path.join(__dirname, '..', '.env'),       // from dist-electron/
  path.join(__dirname, '.env'),              // same dir
  path.join(process.cwd(), '.env'),          // cwd
];
for (const p of envPaths) {
  const result = dotenv.config({ path: p });
  if (!result.error && result.parsed) {
    // Manually inject into process.env (dotenv v17 compat)
    for (const [key, value] of Object.entries(result.parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
    break;
  }
}

let mainWindow: BrowserWindow | null = null;
let waapiClient: WaapiClient | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In dev mode: load from Vite. Detect by checking if Vite is running on 5173.
  // The electron:dev script runs Vite concurrently, so if we got here via that script, use Vite.
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const isDev = process.env.NODE_ENV === 'development'
    || process.env.VITE_DEV_SERVER_URL
    || !app.isPackaged; // !isPackaged = running from source = dev mode

  if (isDev) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// WAAPI IPC handlers
ipcMain.handle('waapi:connect', async (_event, url?: string) => {
  try {
    waapiClient = new WaapiClient();
    const info = await waapiClient.connect(url);
    return { success: true, data: info };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('waapi:disconnect', async () => {
  try {
    if (waapiClient) {
      await waapiClient.disconnect();
      waapiClient = null;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('waapi:call', async (_event, uri: string, args?: object, options?: object) => {
  if (!waapiClient?.isConnected) {
    return { success: false, error: 'Not connected to Wwise' };
  }
  try {
    const result = await waapiClient.call(uri, args, options);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('waapi:status', () => {
  return {
    connected: waapiClient?.isConnected ?? false,
    projectInfo: waapiClient?.projectInfo ?? null,
  };
});

// --- Claude Chat IPC ---
ipcMain.handle('claude:stream', async (event, messages: ChatMessageParam[]) => {
  try {
    let doneText = '';
    await streamChat(
      messages,
      (chunk) => {
        mainWindow?.webContents.send('claude:chunk', chunk);
      },
      (fullText) => {
        doneText = fullText;
      },
      (error) => {
        mainWindow?.webContents.send('claude:error', error);
      }
    );
    // Send done event AFTER streamChat fully resolves, then return
    if (doneText) {
      console.log('[main] Sending claude:done to renderer, length:', doneText.length);
      mainWindow?.webContents.send('claude:done', doneText);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// --- kie.ai Cover (AI Variation) IPC ---
ipcMain.handle('kie:cover', async (_event, req: CoverRequest) => {
  try {
    const { taskId } = await submitCover(req);
    return { success: true, taskId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('kie:status', async (_event, taskId: string) => {
  try {
    const result = await getCoverStatus(taskId);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('kie:generate', async (_event, req: CoverRequest) => {
  try {
    const result = await generateCover(req, (status) => {
      mainWindow?.webContents.send('kie:progress', status);
    });
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// --- Audio Analysis IPC ---
ipcMain.handle('audio:analyze', async (_event, filePath: string) => {
  try {
    const analysis = await analyzeAudio(filePath);
    return { success: true, data: analysis };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// --- Wwise Project Import IPC ---
ipcMain.handle('import:xml', async (_event, projectPath: string) => {
  try {
    const result = await importWwiseProject(projectPath);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('import:waapi', async () => {
  if (!waapiClient?.isConnected) {
    return { success: false, error: 'Not connected to Wwise' };
  }
  try {
    const result = await importFromWaapi(
      (uri, args, options) => waapiClient!.call(uri, args, options)
    );
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('import:manifest', async (_event, projectPath: string) => {
  try {
    const result = await importWwiseProject(projectPath);
    const manifest = generateAssetManifest(result);
    return { success: true, data: { manifest, result } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// --- Push to Wwise (Canvas → Wwise Sync) ---
ipcMain.handle('push:node', async (_event, node: any) => {
  if (!waapiClient?.isConnected) {
    return { success: false, error: 'Not connected to Wwise' };
  }
  try {
    const sync = new WwiseSyncEngine(waapiClient);
    const result = await sync.pushNode(node);
    return { success: result.success, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('push:all', async (_event, nodes: any[], edges: any[]) => {
  if (!waapiClient?.isConnected) {
    return { success: false, error: 'Not connected to Wwise' };
  }
  try {
    const sync = new WwiseSyncEngine(waapiClient);
    const result = await sync.pushAll(nodes, edges, (current, total, label) => {
      mainWindow?.webContents.send('push:progress', { current, total, label });
    });
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (waapiClient) {
    waapiClient.disconnect().catch(() => {});
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
