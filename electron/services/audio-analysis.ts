import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Audio metadata and analysis result.
 * Determines qualities of a source audio file to inform AI variation parameters.
 */
export interface AudioAnalysis {
  // File info
  filename: string;
  format: string;
  duration: number;       // seconds
  sampleRate: number;
  channels: number;
  bitRate: number;        // kbps

  // Musical properties (from ffprobe metadata + analysis)
  bpm?: number;
  key?: string;
  genre?: string;
  title?: string;
  artist?: string;

  // Derived qualities (for prompt generation)
  energy: 'low' | 'medium' | 'high';
  mood: string;
  instrumentProfile: string[];
  suggestedTags: string[];
  suggestedPrompt: string;
}

/**
 * Use ffprobe to extract technical metadata from an audio file.
 */
async function ffprobeAnalysis(filePath: string): Promise<Partial<AudioAnalysis>> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );
    const data = JSON.parse(stdout);
    const stream = data.streams?.find((s: any) => s.codec_type === 'audio') || {};
    const format = data.format || {};
    const tags = { ...format.tags, ...stream.tags };

    return {
      filename: path.basename(filePath),
      format: stream.codec_name || format.format_name || 'unknown',
      duration: parseFloat(format.duration || stream.duration || '0'),
      sampleRate: parseInt(stream.sample_rate || '0', 10),
      channels: stream.channels || 0,
      bitRate: Math.round(parseInt(format.bit_rate || '0', 10) / 1000),
      title: tags?.title || tags?.TITLE,
      artist: tags?.artist || tags?.ARTIST,
      genre: tags?.genre || tags?.GENRE,
      bpm: tags?.bpm ? parseInt(tags.bpm, 10) : undefined,
      key: tags?.key || tags?.initial_key || tags?.KEY,
    };
  } catch {
    return {
      filename: path.basename(filePath),
      format: path.extname(filePath).slice(1),
    };
  }
}

/**
 * Infer musical qualities from filename, metadata, and basic heuristics.
 * This is the "determine qualities of the source" logic.
 */
function inferQualities(meta: Partial<AudioAnalysis>, filename: string): Partial<AudioAnalysis> {
  const name = filename.toLowerCase();
  const instrumentProfile: string[] = [];
  let energy: 'low' | 'medium' | 'high' = 'medium';
  const moods: string[] = [];

  // Instrument detection from filename conventions
  const instrumentKeywords: Record<string, string> = {
    drum: 'drums', perc: 'percussion', bass: 'bass', guitar: 'guitar',
    strings: 'strings', violin: 'violin', cello: 'cello', viola: 'viola',
    brass: 'brass', trumpet: 'trumpet', horn: 'horn', trombone: 'trombone',
    woodwind: 'woodwinds', flute: 'flute', clarinet: 'clarinet', oboe: 'oboe',
    piano: 'piano', keys: 'keys', synth: 'synth', pad: 'synth pad',
    choir: 'choir', vocal: 'vocals', voice: 'vocals',
    taiko: 'taiko', orch: 'orchestra', ethnic: 'ethnic',
    ambient: 'ambient', fx: 'sfx', layer: 'layer',
  };

  for (const [keyword, instrument] of Object.entries(instrumentKeywords)) {
    if (name.includes(keyword)) instrumentProfile.push(instrument);
  }

  // Energy detection from common naming conventions
  const highEnergyKeywords = ['combat', 'battle', 'action', 'boss', 'chase', 'intense', 'high', 'full', 'heavy'];
  const lowEnergyKeywords = ['ambient', 'calm', 'explore', 'stealth', 'quiet', 'low', 'soft', 'peace', 'rest'];

  if (highEnergyKeywords.some((k) => name.includes(k))) energy = 'high';
  else if (lowEnergyKeywords.some((k) => name.includes(k))) energy = 'low';

  // BPM-based energy override
  if (meta.bpm) {
    if (meta.bpm >= 140) energy = 'high';
    else if (meta.bpm <= 80) energy = 'low';
  }

  // Mood inference
  const moodKeywords: Record<string, string> = {
    combat: 'aggressive', battle: 'aggressive', boss: 'intense',
    explore: 'curious', ambient: 'atmospheric', calm: 'peaceful',
    stealth: 'tense', sneak: 'tense', suspense: 'suspenseful',
    victory: 'triumphant', defeat: 'somber', sad: 'melancholic',
    menu: 'neutral', lobby: 'relaxed', cinematic: 'cinematic',
    epic: 'epic', heroic: 'heroic', dark: 'dark', mystery: 'mysterious',
  };

  for (const [keyword, mood] of Object.entries(moodKeywords)) {
    if (name.includes(keyword)) moods.push(mood);
  }

  // Genre from metadata or inference
  const genre = meta.genre || inferGenre(name, instrumentProfile);

  // Build suggested tags for kie.ai
  const suggestedTags = [
    genre,
    ...instrumentProfile.slice(0, 3),
    energy !== 'medium' ? `${energy} energy` : '',
    moods[0] || '',
    'game soundtrack',
  ].filter(Boolean);

  // Build suggested prompt
  const moodStr = moods.length > 0 ? moods.join(', ') : 'dynamic';
  const instrStr = instrumentProfile.length > 0
    ? instrumentProfile.slice(0, 4).join(', ')
    : 'orchestral';
  const suggestedPrompt = `${moodStr} ${genre || 'cinematic'} game music with ${instrStr}, ${energy} energy`;

  return {
    energy,
    mood: moods[0] || 'neutral',
    instrumentProfile,
    suggestedTags,
    suggestedPrompt,
  };
}

function inferGenre(name: string, instruments: string[]): string {
  if (name.includes('orch') || instruments.includes('strings') || instruments.includes('brass'))
    return 'orchestral';
  if (name.includes('electro') || instruments.includes('synth'))
    return 'electronic';
  if (name.includes('rock') || instruments.includes('guitar'))
    return 'rock';
  if (name.includes('ambient'))
    return 'ambient';
  if (name.includes('ethnic') || instruments.includes('taiko'))
    return 'world';
  return 'cinematic';
}

/**
 * Full analysis pipeline: technical metadata + inferred musical qualities.
 */
export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  const meta = await ffprobeAnalysis(filePath);
  const qualities = inferQualities(meta, path.basename(filePath));

  return {
    filename: meta.filename || path.basename(filePath),
    format: meta.format || 'unknown',
    duration: meta.duration || 0,
    sampleRate: meta.sampleRate || 0,
    channels: meta.channels || 0,
    bitRate: meta.bitRate || 0,
    bpm: meta.bpm,
    key: meta.key,
    genre: meta.genre || qualities.suggestedTags?.[0],
    title: meta.title,
    artist: meta.artist,
    energy: qualities.energy || 'medium',
    mood: qualities.mood || 'neutral',
    instrumentProfile: qualities.instrumentProfile || [],
    suggestedTags: qualities.suggestedTags || [],
    suggestedPrompt: qualities.suggestedPrompt || '',
  };
}
