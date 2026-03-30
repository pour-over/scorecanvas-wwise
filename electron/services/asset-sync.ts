import fs from 'fs';
import path from 'path';

/**
 * Asset Sync Service
 *
 * Mirrors audio assets between the ScoreCanvas /audio directory
 * and a Wwise project's Originals/Music folder.
 *
 * When syncing:
 * 1. Copies audio files from app /audio → Wwise Originals/Music/ScoreCanvas/
 * 2. Creates Wwise import structures via WAAPI
 * 3. Tracks what's already synced to avoid duplicate copies
 */

export interface AssetSyncResult {
  copied: number;
  skipped: number;
  failed: number;
  errors: string[];
  files: Array<{ name: string; source: string; destination: string; status: 'copied' | 'skipped' | 'failed' }>;
}

/**
 * Copy all audio files from the app's /audio directory to the Wwise project's
 * Originals/Music/ScoreCanvas folder. Creates the folder if needed.
 */
export async function syncAssetsToWwise(
  appAudioDir: string,
  wwiseProjectPath: string,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<AssetSyncResult> {
  const result: AssetSyncResult = { copied: 0, skipped: 0, failed: 0, errors: [], files: [] };

  // Determine Wwise originals path
  const projectDir = path.dirname(wwiseProjectPath);
  const targetDir = path.join(projectDir, 'Originals', 'Music', 'ScoreCanvas');

  // Ensure target directory exists
  try {
    fs.mkdirSync(targetDir, { recursive: true });
  } catch (err: any) {
    result.errors.push(`Failed to create directory: ${err.message}`);
    return result;
  }

  // Get list of audio files
  const audioExts = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aif', '.aiff']);
  let audioFiles: string[] = [];
  try {
    audioFiles = fs.readdirSync(appAudioDir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return audioExts.has(ext);
    });
  } catch (err: any) {
    result.errors.push(`Failed to read audio directory: ${err.message}`);
    return result;
  }

  // Copy each file
  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];
    const sourcePath = path.join(appAudioDir, file);
    // Sanitize filename for Wwise (replace dots and special chars)
    const sanitizedName = sanitizeForWwise(file);
    const destPath = path.join(targetDir, sanitizedName);

    onProgress?.(i + 1, audioFiles.length, file);

    try {
      if (fs.existsSync(destPath)) {
        // Check if same size — skip if identical
        const srcStat = fs.statSync(sourcePath);
        const dstStat = fs.statSync(destPath);
        if (srcStat.size === dstStat.size) {
          result.skipped++;
          result.files.push({ name: file, source: sourcePath, destination: destPath, status: 'skipped' });
          continue;
        }
      }

      fs.copyFileSync(sourcePath, destPath);
      result.copied++;
      result.files.push({ name: file, source: sourcePath, destination: destPath, status: 'copied' });
    } catch (err: any) {
      result.failed++;
      result.errors.push(`${file}: ${err.message}`);
      result.files.push({ name: file, source: sourcePath, destination: destPath, status: 'failed' });
    }
  }

  return result;
}

/**
 * Import synced audio files into Wwise via WAAPI.
 * Creates Sound objects under \\Actor-Mixer Hierarchy\\ScoreCanvas
 */
export async function importAssetsIntoWwise(
  syncResult: AssetSyncResult,
  waapiCall: (uri: string, args?: object, options?: object) => Promise<any>,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const result = { imported: 0, failed: 0, errors: [] as string[] };

  // Get successfully copied/skipped files
  const filesToImport = syncResult.files.filter((f) => f.status !== 'failed');
  if (filesToImport.length === 0) return result;

  // Ensure parent container exists
  try {
    await waapiCall('ak.wwise.core.object.create', {
      parent: '\\Actor-Mixer Hierarchy\\Default Work Unit',
      type: 'Folder',
      name: 'ScoreCanvas',
      onNameConflict: 'merge',
    });
  } catch {
    // May already exist — that's fine
  }

  // Import each file as a Sound object
  for (let i = 0; i < filesToImport.length; i++) {
    const file = filesToImport[i];
    const soundName = path.basename(file.destination, path.extname(file.destination));

    onProgress?.(i + 1, filesToImport.length, soundName);

    try {
      await waapiCall('ak.wwise.core.audio.import', {
        importOperation: 'createNew',
        default: {
          importLanguage: 'SFX',
        },
        imports: [
          {
            audioFile: file.destination,
            objectPath: `\\Actor-Mixer Hierarchy\\Default Work Unit\\ScoreCanvas\\<Sound>${soundName}`,
          },
        ],
      });
      result.imported++;
    } catch (err: any) {
      // Try with 'useExisting' if createNew fails (already exists)
      try {
        await waapiCall('ak.wwise.core.audio.import', {
          importOperation: 'useExisting',
          default: {
            importLanguage: 'SFX',
          },
          imports: [
            {
              audioFile: file.destination,
              objectPath: `\\Actor-Mixer Hierarchy\\Default Work Unit\\ScoreCanvas\\<Sound>${soundName}`,
            },
          ],
        });
        result.imported++;
      } catch (err2: any) {
        result.failed++;
        result.errors.push(`${soundName}: ${err2.message || err.message}`);
      }
    }
  }

  return result;
}

/**
 * Sanitize a filename for Wwise compatibility.
 * Wwise doesn't like certain characters in names.
 */
function sanitizeForWwise(filename: string): string {
  // Keep the extension
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  // Replace problematic characters
  const sanitized = base
    .replace(/\./g, '_')           // dots → underscores
    .replace(/[()]/g, '')          // remove parens
    .replace(/\s+/g, '_')         // spaces → underscores
    .replace(/_+/g, '_')          // collapse multiple underscores
    .replace(/^_|_$/g, '');       // trim leading/trailing underscores

  return sanitized + ext;
}

/**
 * List audio files from the app's /audio directory with metadata.
 */
export function listAppAudioFiles(appAudioDir: string): Array<{
  name: string;
  path: string;
  size: number;
  ext: string;
  sanitizedName: string;
}> {
  const audioExts = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aif', '.aiff']);

  try {
    return fs.readdirSync(appAudioDir)
      .filter((f) => audioExts.has(path.extname(f).toLowerCase()))
      .map((f) => {
        const fullPath = path.join(appAudioDir, f);
        const stat = fs.statSync(fullPath);
        return {
          name: f,
          path: fullPath,
          size: stat.size,
          ext: path.extname(f).toLowerCase(),
          sanitizedName: sanitizeForWwise(f),
        };
      });
  } catch {
    return [];
  }
}
