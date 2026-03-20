import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';

const parseXml = parseStringPromise;

// -------------------------------------------------------
// Types for the imported Wwise project structure
// -------------------------------------------------------

export interface WwiseImportedNode {
  id: string;
  name: string;
  type: 'musicState' | 'transition' | 'parameter' | 'stinger' | 'event';
  wwiseType: string;           // Original Wwise type (MusicSegment, MusicSwitchContainer, etc.)
  wwisePath: string;
  wwiseId: string;             // GUID from Wwise
  parentId?: string;
  properties: Record<string, any>;
  children: string[];          // child node IDs
}

export interface RequiredAsset {
  name: string;
  originalPath: string;        // Path as referenced in Wwise
  wwiseObjectPath: string;     // The Wwise object that references this
  category: string;            // wav, wem, etc.
  expectedLocation: string;    // Where it should live relative to project
  found: boolean;              // Whether the file exists on disk
}

export interface WwiseImportResult {
  projectName: string;
  nodes: WwiseImportedNode[];
  edges: Array<{ source: string; target: string; label?: string }>;
  requiredAssets: RequiredAsset[];
  hierarchy: HierarchyEntry[];
  warnings: string[];
}

interface HierarchyEntry {
  id: string;
  name: string;
  type: string;
  depth: number;
  children: HierarchyEntry[];
}

// -------------------------------------------------------
// XML Work Unit Parser
// -------------------------------------------------------

/**
 * Recursively walk Wwise XML to extract Interactive Music objects.
 */
function walkXmlNode(
  xmlNode: any,
  parentPath: string,
  parentId: string | undefined,
  nodes: WwiseImportedNode[],
  edges: Array<{ source: string; target: string; label?: string }>,
  assets: RequiredAsset[],
  warnings: string[],
  depth: number
): void {
  if (!xmlNode || typeof xmlNode !== 'object') return;

  // Process known Wwise object types
  const wwiseTypes: Record<string, 'musicState' | 'transition' | 'parameter' | 'stinger' | 'event'> = {
    MusicSegment: 'musicState',
    MusicTrack: 'musicState',
    MusicSwitchContainer: 'musicState',
    MusicPlaylistContainer: 'musicState',
    MusicRanSeqContainer: 'musicState',
    MusicTransition: 'transition',
    Stinger: 'stinger',
    Event: 'event',
    GameParameter: 'parameter',
    RTPCItem: 'parameter',
    StateGroup: 'parameter',
    SwitchGroup: 'parameter',
  };

  for (const [xmlTag, canvasType] of Object.entries(wwiseTypes)) {
    const elements = findElements(xmlNode, xmlTag);
    for (const elem of elements) {
      const attrs = elem.$ || {};
      const name = attrs.Name || attrs.name || 'Unnamed';
      const id = attrs.ID || attrs.id || `gen-${Math.random().toString(36).slice(2, 10)}`;
      const wwisePath = `${parentPath}\\${name}`;

      const properties = extractProperties(elem);

      const node: WwiseImportedNode = {
        id,
        name,
        type: canvasType,
        wwiseType: xmlTag,
        wwisePath,
        wwiseId: id,
        parentId,
        properties,
        children: [],
      };

      nodes.push(node);

      // Connect to parent
      if (parentId) {
        edges.push({ source: parentId, target: id });
        const parentNode = nodes.find((n) => n.id === parentId);
        if (parentNode) parentNode.children.push(id);
      }

      // Extract audio file references
      const audioRefs = findAudioReferences(elem);
      for (const ref of audioRefs) {
        assets.push({
          name: ref.name,
          originalPath: ref.path,
          wwiseObjectPath: wwisePath,
          category: ref.ext || 'wav',
          expectedLocation: ref.path,
          found: false, // Will be checked later
        });
      }

      // Recurse into children
      walkXmlNode(elem, wwisePath, id, nodes, edges, assets, warnings, depth + 1);
    }
  }

  // Also recurse into generic container elements
  const containerTags = [
    'ChildrenList', 'Children', 'MusicSegments', 'MusicTracks',
    'Playlists', 'Playlist', 'TransitionList', 'Transitions',
    'Stingers', 'Events', 'GameParameters', 'States', 'Switches',
    'InteractiveMusic', 'AudioObjects', 'WorkUnit',
  ];

  for (const tag of containerTags) {
    const containers = findElements(xmlNode, tag);
    for (const container of containers) {
      walkXmlNode(container, parentPath, parentId, nodes, edges, assets, warnings, depth);
    }
  }
}

/**
 * Find all child elements matching a tag name (case-insensitive).
 */
function findElements(xmlNode: any, tagName: string): any[] {
  if (!xmlNode || typeof xmlNode !== 'object') return [];
  const results: any[] = [];

  for (const key of Object.keys(xmlNode)) {
    if (key.toLowerCase() === tagName.toLowerCase()) {
      const val = xmlNode[key];
      if (Array.isArray(val)) results.push(...val);
      else results.push(val);
    }
  }

  return results;
}

/**
 * Extract Wwise properties from an XML element's PropertyList.
 */
function extractProperties(elem: any): Record<string, any> {
  const props: Record<string, any> = {};

  const propList = elem.PropertyList?.[0]?.Property || elem.Property || [];
  const propArray = Array.isArray(propList) ? propList : [propList];

  for (const prop of propArray) {
    if (!prop?.$) continue;
    const name = prop.$.Name || prop.$.name;
    const value = prop.$.Value || prop.$.value || prop._ || '';
    if (name) props[name] = value;
  }

  // Also extract from attributes
  if (elem.$) {
    for (const [k, v] of Object.entries(elem.$)) {
      if (k !== 'Name' && k !== 'ID' && k !== 'name' && k !== 'id') {
        props[k] = v;
      }
    }
  }

  return props;
}

/**
 * Find audio file references (AudioFileSource, MediaFile, etc.)
 */
function findAudioReferences(elem: any): Array<{ name: string; path: string; ext?: string }> {
  const refs: Array<{ name: string; path: string; ext?: string }> = [];

  // AudioFileSource elements
  const sources = findElements(elem, 'AudioFileSource');
  for (const src of sources) {
    const attrs = src.$ || {};
    const name = attrs.Name || 'unknown';
    const filePath = attrs.Path || attrs.FileName || '';
    if (filePath) {
      refs.push({
        name,
        path: filePath,
        ext: path.extname(filePath).slice(1) || 'wav',
      });
    }
  }

  // MediaFile references
  const mediaFiles = findElements(elem, 'MediaFile');
  for (const mf of mediaFiles) {
    const attrs = mf.$ || {};
    const filePath = attrs.Path || attrs.FileName || '';
    if (filePath) {
      refs.push({
        name: path.basename(filePath, path.extname(filePath)),
        path: filePath,
        ext: path.extname(filePath).slice(1) || 'wem',
      });
    }
  }

  return refs;
}

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Import a Wwise project from its .wproj file or a Work Unit .wwu file.
 * Parses the XML structure and generates canvas-ready nodes + edges.
 */
export async function importWwiseProject(projectPath: string): Promise<WwiseImportResult> {
  const warnings: string[] = [];
  const ext = path.extname(projectPath).toLowerCase();

  let xmlFiles: string[] = [];
  let projectName = 'Imported Project';
  let projectDir = path.dirname(projectPath);

  if (ext === '.wproj') {
    // It's a project file — find all Work Unit files
    projectName = path.basename(projectPath, '.wproj');
    projectDir = path.dirname(projectPath);

    // Scan for .wwu files in the Interactive Music Hierarchy and other key folders
    const searchDirs = [
      'Interactive Music Hierarchy',
      'Events',
      'States',
      'Switches',
      'Game Parameters',
      'Master-Mixer Hierarchy',
    ];

    for (const dir of searchDirs) {
      const fullDir = path.join(projectDir, dir);
      if (fs.existsSync(fullDir)) {
        const files = findFilesRecursive(fullDir, '.wwu');
        xmlFiles.push(...files);
      }
    }

    if (xmlFiles.length === 0) {
      warnings.push('No .wwu Work Unit files found. Trying to parse .wproj directly.');
      xmlFiles = [projectPath];
    }
  } else if (ext === '.wwu' || ext === '.xml') {
    xmlFiles = [projectPath];
    projectName = path.basename(projectPath, ext);
  } else {
    throw new Error(`Unsupported file type: ${ext}. Expected .wproj, .wwu, or .xml`);
  }

  const nodes: WwiseImportedNode[] = [];
  const edges: Array<{ source: string; target: string; label?: string }> = [];
  const requiredAssets: RequiredAsset[] = [];

  for (const xmlFile of xmlFiles) {
    try {
      const xml = fs.readFileSync(xmlFile, 'utf-8');
      const parsed = await parseXml(xml, { explicitArray: true, mergeAttrs: false });

      const rootPath = `\\${path.basename(path.dirname(xmlFile))}`;
      walkXmlNode(parsed, rootPath, undefined, nodes, edges, requiredAssets, warnings, 0);
    } catch (err: any) {
      warnings.push(`Failed to parse ${path.basename(xmlFile)}: ${err.message}`);
    }
  }

  // Check which assets exist on disk
  for (const asset of requiredAssets) {
    // Try multiple possible locations
    const candidates = [
      path.join(projectDir, asset.originalPath),
      path.join(projectDir, 'Originals', asset.originalPath),
      path.join(projectDir, 'Originals', 'SFX', asset.originalPath),
      path.join(projectDir, '.cache', 'Windows', asset.originalPath),
    ];
    asset.found = candidates.some((p) => fs.existsSync(p));
  }

  // Build hierarchy tree
  const hierarchy = buildHierarchy(nodes);

  return {
    projectName,
    nodes,
    edges,
    requiredAssets,
    hierarchy,
    warnings,
  };
}

/**
 * Import from a live Wwise instance via WAAPI.
 * Returns the same structure as XML import.
 */
export async function importFromWaapi(
  waapiCall: (uri: string, args?: object, options?: object) => Promise<any>
): Promise<WwiseImportResult> {
  const warnings: string[] = [];
  const nodes: WwiseImportedNode[] = [];
  const edges: Array<{ source: string; target: string; label?: string }> = [];
  const requiredAssets: RequiredAsset[] = [];

  // Get project info
  const info = await waapiCall('ak.wwise.core.getInfo');
  const projectName = info?.displayName || info?.projectName || 'Wwise Project';

  // Query all Interactive Music objects
  const musicTypes = [
    'MusicSegment',
    'MusicTrack',
    'MusicSwitchContainer',
    'MusicPlaylistContainer',
    'MusicRanSeqContainer',
  ];

  for (const wwiseType of musicTypes) {
    const result = await waapiCall(
      'ak.wwise.core.object.get',
      { waql: `$ from type ${wwiseType}` },
      { return: ['id', 'name', 'type', 'path', 'parent.id', 'parent.name'] }
    );

    const objects = result?.return || [];
    for (const obj of objects) {
      const canvasType = wwiseType === 'MusicTransition' ? 'transition' : 'musicState';
      nodes.push({
        id: obj.id,
        name: obj.name,
        type: canvasType,
        wwiseType,
        wwisePath: obj.path,
        wwiseId: obj.id,
        parentId: obj['parent.id'],
        properties: {},
        children: [],
      });

      if (obj['parent.id']) {
        edges.push({ source: obj['parent.id'], target: obj.id });
      }
    }
  }

  // Query Game Syncs (States, Switches, RTPCs)
  const syncTypes = [
    { wwise: 'GameParameter', canvas: 'parameter' as const },
    { wwise: 'StateGroup', canvas: 'parameter' as const },
    { wwise: 'SwitchGroup', canvas: 'parameter' as const },
  ];

  for (const { wwise: wwiseType, canvas: canvasType } of syncTypes) {
    const result = await waapiCall(
      'ak.wwise.core.object.get',
      { waql: `$ from type ${wwiseType}` },
      { return: ['id', 'name', 'type', 'path'] }
    );

    for (const obj of (result?.return || [])) {
      nodes.push({
        id: obj.id,
        name: obj.name,
        type: canvasType,
        wwiseType,
        wwisePath: obj.path,
        wwiseId: obj.id,
        properties: {},
        children: [],
      });
    }
  }

  // Query Events
  const eventsResult = await waapiCall(
    'ak.wwise.core.object.get',
    { waql: `$ from type Event` },
    { return: ['id', 'name', 'type', 'path'] }
  );

  for (const obj of (eventsResult?.return || [])) {
    nodes.push({
      id: obj.id,
      name: obj.name,
      type: 'event',
      wwiseType: 'Event',
      wwisePath: obj.path,
      wwiseId: obj.id,
      properties: {},
      children: [],
    });
  }

  // Query audio source files for asset manifest
  const sourcesResult = await waapiCall(
    'ak.wwise.core.object.get',
    { waql: `$ from type AudioFileSource` },
    { return: ['id', 'name', 'path', 'sound:originalWavFilePath'] }
  );

  for (const obj of (sourcesResult?.return || [])) {
    const wavPath = obj['sound:originalWavFilePath'] || '';
    if (wavPath) {
      requiredAssets.push({
        name: obj.name,
        originalPath: wavPath,
        wwiseObjectPath: obj.path,
        category: path.extname(wavPath).slice(1) || 'wav',
        expectedLocation: wavPath,
        found: true, // It's in a live project, so it exists
      });
    }
  }

  const hierarchy = buildHierarchy(nodes);

  return {
    projectName,
    nodes,
    edges,
    requiredAssets,
    hierarchy,
    warnings,
  };
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function findFilesRecursive(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFilesRecursive(fullPath, ext));
      } else if (entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // skip unreadable directories
  }
  return results;
}

function buildHierarchy(nodes: WwiseImportedNode[]): HierarchyEntry[] {
  const rootNodes = nodes.filter((n) => !n.parentId || !nodes.find((p) => p.id === n.parentId));

  function buildEntry(node: WwiseImportedNode, depth: number): HierarchyEntry {
    return {
      id: node.id,
      name: node.name,
      type: node.wwiseType,
      depth,
      children: node.children
        .map((cid) => nodes.find((n) => n.id === cid))
        .filter(Boolean)
        .map((child) => buildEntry(child!, depth + 1)),
    };
  }

  return rootNodes.map((n) => buildEntry(n, 0));
}

/**
 * Generate a human-readable asset manifest.
 */
export function generateAssetManifest(result: WwiseImportResult): string {
  const lines: string[] = [
    `# Asset Manifest for "${result.projectName}"`,
    `# Generated by ScoreCanvas Wwise`,
    ``,
    `## Summary`,
    `- Music objects: ${result.nodes.length}`,
    `- Required assets: ${result.requiredAssets.length}`,
    `- Found on disk: ${result.requiredAssets.filter((a) => a.found).length}`,
    `- Missing: ${result.requiredAssets.filter((a) => !a.found).length}`,
    ``,
  ];

  if (result.requiredAssets.filter((a) => !a.found).length > 0) {
    lines.push(`## Missing Assets (you need these files)`);
    lines.push(``);
    for (const asset of result.requiredAssets.filter((a) => !a.found)) {
      lines.push(`- **${asset.name}** (${asset.category})`);
      lines.push(`  - Referenced by: \`${asset.wwiseObjectPath}\``);
      lines.push(`  - Expected at: \`${asset.expectedLocation}\``);
    }
    lines.push(``);
  }

  if (result.requiredAssets.filter((a) => a.found).length > 0) {
    lines.push(`## Found Assets`);
    lines.push(``);
    for (const asset of result.requiredAssets.filter((a) => a.found)) {
      lines.push(`- ${asset.name} (${asset.category}) — \`${asset.originalPath}\``);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(``);
    lines.push(`## Warnings`);
    for (const w of result.warnings) {
      lines.push(`- ${w}`);
    }
  }

  return lines.join('\n');
}
