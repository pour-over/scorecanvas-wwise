import https from 'https';
import http from 'http';
import { URL } from 'url';

const KIE_BASE = 'https://api.kie.ai';

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error('KIE_API_KEY not set in .env');
  return key;
}

interface KieResponse {
  code: number;
  msg: string;
  data?: any;
}

async function kieRequest(path: string, body: object): Promise<KieResponse> {
  const apiKey = getApiKey();
  const payload = JSON.stringify(body);
  const url = new URL(path, KIE_BASE);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function kieGet(path: string): Promise<KieResponse> {
  const apiKey = getApiKey();
  const url = new URL(path, KIE_BASE);

  return new Promise((resolve, reject) => {
    https.get(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
          }
        });
      }
    ).on('error', reject);
  });
}

// -------------------------------------------------------------------
// Cover (AI Variation) — Suno "Upload and Cover Audio"
// -------------------------------------------------------------------

export interface CoverRequest {
  uploadUrl: string;           // URL of the source audio file
  prompt?: string;             // Style/genre prompt for the cover
  tags?: string;               // Genre tags (e.g., "orchestral, cinematic, epic")
  title?: string;              // Title for the generated track
  model?: string;              // V5, V4_5PLUS, V4_5, V4
  audioWeight?: number;        // 0-1: how much to preserve original audio (0.9 = 90%)
  weirdnessConstraint?: number; // 0-1: creative deviation (0.25 = 25%)
  instrumental?: boolean;      // true = no vocals
  vocalGender?: 'm' | 'f';    // vocal gender preference
}

export interface CoverResult {
  taskId: string;
  status: string;
  audioUrl?: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  title?: string;
  tags?: string;
  prompt?: string;
  duration?: number;
}

/**
 * Submit a cover/variation request to kie.ai (Suno cover endpoint).
 * Returns a taskId for polling.
 */
export async function submitCover(req: CoverRequest): Promise<{ taskId: string }> {
  const body: any = {
    uploadUrl: req.uploadUrl,
    model: req.model || 'V5',
    instrumental: req.instrumental ?? true, // default instrumental for game audio
    audioWeight: req.audioWeight ?? 0.9,
    weirdnessConstraint: req.weirdnessConstraint ?? 0.25,
  };

  if (req.prompt) body.prompt = req.prompt;
  if (req.tags) body.tags = req.tags;
  if (req.title) body.title = req.title;
  if (req.vocalGender) body.vocalGender = req.vocalGender;

  const res = await kieRequest('/api/suno/cover', body);

  if (res.code !== 0 && res.code !== 200) {
    throw new Error(`kie.ai cover failed: ${res.msg || JSON.stringify(res)}`);
  }

  const taskId = res.data?.taskId || res.data?.task_id;
  if (!taskId) throw new Error('No taskId returned from kie.ai');

  return { taskId };
}

/**
 * Poll for cover task completion.
 */
export async function getCoverStatus(taskId: string): Promise<CoverResult> {
  const res = await kieGet(`/api/suno/task/${taskId}`);

  if (res.code !== 0 && res.code !== 200) {
    throw new Error(`kie.ai status check failed: ${res.msg || JSON.stringify(res)}`);
  }

  const d = res.data || {};
  const sunoData = d.sunoData?.[0] || d.suno_data?.[0] || d;

  return {
    taskId,
    status: d.status || 'unknown',
    audioUrl: sunoData.audioUrl || sunoData.audio_url,
    streamAudioUrl: sunoData.streamAudioUrl || sunoData.stream_audio_url,
    imageUrl: sunoData.imageUrl || sunoData.image_url,
    title: sunoData.title,
    tags: sunoData.tags,
    prompt: sunoData.prompt,
    duration: sunoData.duration,
  };
}

/**
 * Submit and poll until complete (with timeout).
 */
export async function generateCover(
  req: CoverRequest,
  onProgress?: (status: string) => void,
  timeoutMs: number = 300000 // 5 minutes
): Promise<CoverResult> {
  const { taskId } = await submitCover(req);
  onProgress?.('submitted');

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 5000)); // poll every 5s

    const result = await getCoverStatus(taskId);
    onProgress?.(result.status);

    if (result.status === 'completed' || result.status === 'complete' || result.audioUrl) {
      return result;
    }
    if (result.status === 'failed' || result.status === 'error') {
      throw new Error(`Cover generation failed for task ${taskId}`);
    }
  }

  throw new Error(`Cover generation timed out after ${timeoutMs / 1000}s`);
}
