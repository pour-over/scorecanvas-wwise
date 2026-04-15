import { dialog, app } from 'electron';
import fs from 'fs';
import path from 'path';

const RECENT_FILE = path.join(app.getPath('userData'), 'recent-projects.json');
const FILE_EXTENSION = 'scwwise';
const FILE_FILTER = { name: 'ScoreCanvas Wwise Project', extensions: [FILE_EXTENSION] };

export interface ProjectFileData {
  version: number;
  name: string;
  savedAt: string;
  wwiseProjectPath?: string;
  nodes: any[];
  edges: any[];
  projectId: string | null;
  levelId: string | null;
  projects?: any[];
}

let currentFilePath: string | null = null;

/** Save to current file or prompt for location */
export async function saveProject(data: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!currentFilePath) {
    return saveProjectAs(data);
  }
  return writeProjectFile(currentFilePath, data);
}

/** Always prompt for save location */
export async function saveProjectAs(data: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const result = await dialog.showSaveDialog({
    title: 'Save ScoreCanvas Project',
    defaultPath: `${data.name || 'Untitled'}.${FILE_EXTENSION}`,
    filters: [FILE_FILTER],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }

  return writeProjectFile(result.filePath, data);
}

/** Open a project file */
export async function openProject(): Promise<{ success: boolean; data?: ProjectFileData; filePath?: string; error?: string }> {
  const result = await dialog.showOpenDialog({
    title: 'Open ScoreCanvas Project',
    filters: [FILE_FILTER, { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelled' };
  }

  const filePath = result.filePaths[0];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: ProjectFileData = JSON.parse(raw);
    currentFilePath = filePath;
    addToRecent(filePath, data.name);
    return { success: true, data, filePath };
  } catch (err: any) {
    return { success: false, error: `Failed to read: ${err.message}` };
  }
}

/** Create a new empty project */
export function newProject(name: string): ProjectFileData {
  currentFilePath = null; // No file yet
  return {
    version: 1,
    name,
    savedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    projectId: null,
    levelId: null,
  };
}

/** Get recent project list */
export function getRecentProjects(): Array<{ name: string; filePath: string; savedAt: string }> {
  try {
    if (fs.existsSync(RECENT_FILE)) {
      return JSON.parse(fs.readFileSync(RECENT_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return [];
}

/** Scan Wwise project's Originals folder for audio files */
export function scanWwiseOriginals(wwiseProjectPath: string): {
  success: boolean;
  files?: Array<{ name: string; path: string; size: number; ext: string; folder: string }>;
  error?: string;
} {
  try {
    // .wproj is at root of Wwise project dir
    const projectDir = path.dirname(wwiseProjectPath);
    const originalsMusic = path.join(projectDir, 'Originals', 'Music');
    const originalsSfx = path.join(projectDir, 'Originals', 'SFX');

    const files: Array<{ name: string; path: string; size: number; ext: string; folder: string }> = [];
    const audioExts = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aif', '.aiff', '.wem']);

    function scanDir(dir: string, folderLabel: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (audioExts.has(ext)) {
            const fullPath = path.join(entry.parentPath || dir, entry.name);
            const stat = fs.statSync(fullPath);
            files.push({
              name: entry.name,
              path: fullPath,
              size: stat.size,
              ext,
              folder: folderLabel,
            });
          }
        }
      }
    }

    scanDir(originalsMusic, 'Music');
    scanDir(originalsSfx, 'SFX');

    return { success: true, files };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Internal helpers ---

function writeProjectFile(filePath: string, data: any): { success: boolean; filePath?: string; error?: string } {
  try {
    const projectData: ProjectFileData = {
      version: 1,
      name: data.name || path.basename(filePath, `.${FILE_EXTENSION}`),
      savedAt: new Date().toISOString(),
      wwiseProjectPath: data.wwiseProjectPath,
      nodes: data.nodes || [],
      edges: data.edges || [],
      projectId: data.projectId || null,
      levelId: data.levelId || null,
      projects: data.projects,
    };

    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf-8');
    currentFilePath = filePath;
    addToRecent(filePath, projectData.name);
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

function addToRecent(filePath: string, name: string) {
  try {
    let recent = getRecentProjects();
    recent = recent.filter((r) => r.filePath !== filePath);
    recent.unshift({ name, filePath, savedAt: new Date().toISOString() });
    recent = recent.slice(0, 10); // Keep last 10
    fs.writeFileSync(RECENT_FILE, JSON.stringify(recent, null, 2), 'utf-8');
  } catch { /* ignore */ }
}
