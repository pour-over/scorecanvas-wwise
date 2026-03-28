import { WaapiClient } from './client.js';

/**
 * Maps canvas node types to Wwise object creation strategies.
 * Canvas → Wwise push engine.
 */

interface CanvasNodeData {
  label: string;
  intensity?: number;
  looping?: boolean;
  stems?: string[];
  duration?: number;
  syncPoint?: string;
  fadeType?: string;
  paramName?: string;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  description?: string;
  trigger?: string;
  priority?: string;
  eventType?: string;
  wwisePath?: string;
  wwiseId?: string;
  [key: string]: any;
}

interface CanvasNode {
  id: string;
  type: string;
  data: CanvasNodeData;
  position: { x: number; y: number };
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

interface PushResult {
  nodeId: string;
  wwisePath: string;
  wwiseId: string;
  success: boolean;
  error?: string;
}

interface PushAllResult {
  results: PushResult[];
  totalPushed: number;
  totalFailed: number;
  errors: string[];
}

// Default parent paths in Wwise for each node type
const WWISE_PARENTS: Record<string, string> = {
  musicState: '\\Interactive Music Hierarchy\\Default Work Unit',
  transition: '\\Interactive Music Hierarchy\\Default Work Unit',
  stinger: '\\Interactive Music Hierarchy\\Default Work Unit',
  parameter: '\\Game Parameters\\Default Work Unit',
  event: '\\Events\\Default Work Unit',
};

// Map canvas node type to Wwise object type
const WWISE_TYPES: Record<string, string> = {
  musicState: 'MusicSegment',
  transition: 'MusicSegment', // Transitions are conceptual — create as segments
  stinger: 'MusicSegment',
  parameter: 'GameParameter',
  event: 'Event',
};

export class WwiseSyncEngine {
  private client: WaapiClient;

  constructor(client: WaapiClient) {
    this.client = client;
  }

  /**
   * Push a single canvas node to Wwise.
   * Creates the object if it doesn't exist, updates if it does.
   */
  async pushNode(node: CanvasNode): Promise<PushResult> {
    try {
      const wwiseType = WWISE_TYPES[node.type];
      const parentPath = WWISE_PARENTS[node.type];

      if (!wwiseType || !parentPath) {
        return {
          nodeId: node.id,
          wwisePath: '',
          wwiseId: '',
          success: false,
          error: `Unknown node type: ${node.type}`,
        };
      }

      // If node already has a wwisePath, try to update it
      if (node.data.wwisePath && node.data.wwiseId) {
        try {
          await this.updateWwiseObject(node);
          return {
            nodeId: node.id,
            wwisePath: node.data.wwisePath,
            wwiseId: node.data.wwiseId,
            success: true,
          };
        } catch {
          // Object may have been deleted in Wwise — fall through to create
          console.log(`[Sync] Object not found at ${node.data.wwisePath}, creating new`);
        }
      }

      // Create new object in Wwise
      const result = await this.createWwiseObject(node, wwiseType, parentPath);
      return result;
    } catch (err: any) {
      return {
        nodeId: node.id,
        wwisePath: '',
        wwiseId: '',
        success: false,
        error: err.message || 'Push failed',
      };
    }
  }

  /**
   * Push all canvas nodes to Wwise in batch.
   */
  async pushAll(
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    onProgress?: (current: number, total: number, label: string) => void
  ): Promise<PushAllResult> {
    const results: PushResult[] = [];
    const errors: string[] = [];
    let totalPushed = 0;
    let totalFailed = 0;

    // First, try to ensure parent containers exist
    try {
      await this.ensureParentContainers();
    } catch (err: any) {
      console.log('[Sync] Warning: Could not verify parent containers:', err.message);
    }

    // Push nodes in order: parameters first, then music states, then transitions/stingers/events
    const sortOrder: Record<string, number> = {
      parameter: 0,
      musicState: 1,
      stinger: 2,
      transition: 3,
      event: 4,
    };
    const sorted = [...nodes].sort((a, b) => (sortOrder[a.type] ?? 5) - (sortOrder[b.type] ?? 5));

    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i];
      onProgress?.(i + 1, sorted.length, node.data.label);

      const result = await this.pushNode(node);
      results.push(result);

      if (result.success) {
        totalPushed++;
      } else {
        totalFailed++;
        errors.push(`${node.data.label}: ${result.error}`);
      }

      // Small delay to avoid overwhelming WAAPI
      await new Promise((r) => setTimeout(r, 100));
    }

    return { results, totalPushed, totalFailed, errors };
  }

  /**
   * Create a new Wwise object from a canvas node.
   */
  private async createWwiseObject(
    node: CanvasNode,
    wwiseType: string,
    parentPath: string
  ): Promise<PushResult> {
    const name = this.sanitizeName(node.data.label);

    switch (node.type) {
      case 'musicState':
      case 'stinger':
      case 'transition': {
        const result = await this.client.createObject(parentPath, wwiseType, name);
        const path = result?.path || `${parentPath}\\${name}`;
        const id = result?.id || '';

        // Set properties if available
        if (node.data.intensity !== undefined && node.data.intensity > 0) {
          try {
            // Map intensity (0-100) to volume (-96 to 0 dB)
            const volume = -96 + (node.data.intensity / 100) * 96;
            await this.client.setProperty(path, '@Volume', volume);
          } catch { /* property may not be settable */ }
        }

        return { nodeId: node.id, wwisePath: path, wwiseId: id, success: true };
      }

      case 'parameter': {
        const result = await this.client.createObject(parentPath, 'GameParameter', name);
        const path = result?.path || `${parentPath}\\${name}`;
        const id = result?.id || '';

        // Set RTPC range
        try {
          if (node.data.minValue !== undefined) {
            await this.client.setProperty(path, '@Min', node.data.minValue);
          }
          if (node.data.maxValue !== undefined) {
            await this.client.setProperty(path, '@Max', node.data.maxValue);
          }
          if (node.data.defaultValue !== undefined) {
            await this.client.setProperty(path, '@InitialValue', node.data.defaultValue);
          }
        } catch { /* properties may not exist in this Wwise version */ }

        return { nodeId: node.id, wwisePath: path, wwiseId: id, success: true };
      }

      case 'event': {
        const result = await this.client.createObject(parentPath, 'Event', name);
        const path = result?.path || `${parentPath}\\${name}`;
        const id = result?.id || '';
        return { nodeId: node.id, wwisePath: path, wwiseId: id, success: true };
      }

      default:
        return {
          nodeId: node.id, wwisePath: '', wwiseId: '',
          success: false, error: `Unsupported type: ${node.type}`,
        };
    }
  }

  /**
   * Update an existing Wwise object's properties.
   */
  private async updateWwiseObject(node: CanvasNode): Promise<void> {
    const path = node.data.wwisePath!;

    // Rename if label changed
    try {
      await this.client.setProperty(path, '@Name', this.sanitizeName(node.data.label));
    } catch { /* rename may fail if name conflicts */ }

    // Update type-specific properties
    if (node.type === 'parameter') {
      if (node.data.minValue !== undefined) {
        try { await this.client.setProperty(path, '@Min', node.data.minValue); } catch {}
      }
      if (node.data.maxValue !== undefined) {
        try { await this.client.setProperty(path, '@Max', node.data.maxValue); } catch {}
      }
    }

    if (node.type === 'musicState') {
      try {
        if (node.data.volume !== undefined) {
          // Direct dB value — use as-is
          await this.client.setProperty(path, '@Volume', node.data.volume);
        } else if (node.data.intensity !== undefined) {
          // Map intensity (0-100) to volume (-96 to 0 dB)
          const volume = -96 + (node.data.intensity / 100) * 96;
          await this.client.setProperty(path, '@Volume', volume);
        }
      } catch {}
    }
  }

  /**
   * Ensure default parent containers exist in Wwise.
   */
  private async ensureParentContainers(): Promise<void> {
    // Check if Interactive Music Hierarchy default work unit exists
    try {
      await this.client.query(
        '$ from type WorkUnit where path = "\\\\Interactive Music Hierarchy\\\\Default Work Unit"',
        ['id', 'name', 'path']
      );
    } catch {
      console.log('[Sync] Default Work Unit check failed — may need manual setup');
    }
  }

  /**
   * Sanitize a name for Wwise (remove invalid characters).
   */
  private sanitizeName(name: string): string {
    // Wwise doesn't allow: \ / : * ? " < > | and leading/trailing spaces
    return name
      .replace(/[\\/:*?"<>|→←↔]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 64) || 'Unnamed';
  }
}
