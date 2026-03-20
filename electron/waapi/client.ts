import WebSocket from 'ws';

interface WaapiResponse {
  id: number;
  result?: any;
  error?: { message: string; details?: any };
}

interface ProjectInfo {
  name: string;
  version: string;
  platform: string;
  directories: Record<string, string>;
}

export class WaapiClient {
  private ws: WebSocket | null = null;
  private _connected = false;
  private _projectInfo: ProjectInfo | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();
  private subscriptions = new Map<number, (data: any) => void>();

  get isConnected(): boolean {
    return this._connected;
  }

  get projectInfo(): ProjectInfo | null {
    return this._projectInfo;
  }

  async connect(url: string = 'ws://127.0.0.1:8080/waapi'): Promise<ProjectInfo> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on('open', async () => {
        this._connected = true;
        try {
          const info = await this.call('ak.wwise.core.getInfo');
          this._projectInfo = {
            name: info.displayName || info.projectName || 'Unknown',
            version: info.version?.displayName || 'Unknown',
            platform: info.platform || 'Unknown',
            directories: info.directories || {},
          };
          resolve(this._projectInfo);
        } catch (err) {
          reject(err);
        }
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
            const pending = this.pendingRequests.get(msg.id)!;
            this.pendingRequests.delete(msg.id);
            if (msg.error) {
              pending.reject(new Error(msg.error.message || 'WAAPI error'));
            } else {
              pending.resolve(msg.result);
            }
          }
        } catch {
          // ignore parse errors
        }
      });

      this.ws.on('error', (err) => {
        if (!this._connected) reject(err);
      });

      this.ws.on('close', () => {
        this._connected = false;
        this._projectInfo = null;
        // Reject all pending requests
        for (const [, pending] of this.pendingRequests) {
          pending.reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this._connected = false;
      this._projectInfo = null;
      this.ws.close();
      this.ws = null;
    }
  }

  async call(uri: string, args?: object, options?: object): Promise<any> {
    if (!this.ws || !this._connected) {
      throw new Error('Not connected to Wwise');
    }

    const id = ++this.requestId;
    const message: any = { jsonrpc: '2.0', id, method: uri };
    if (args) message.params = args;
    if (options) message.options = options;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`WAAPI call timed out: ${uri}`));
        }
      }, 10000);
    });
  }

  // Convenience: create a Wwise object
  async createObject(
    parentPath: string,
    type: string,
    name: string,
    properties?: Record<string, any>
  ): Promise<any> {
    const args: any = {
      parent: parentPath,
      type,
      name,
      onNameConflict: 'rename',
    };
    if (properties) {
      args['@'] = properties;
    }
    return this.call('ak.wwise.core.object.create', args);
  }

  // Convenience: set a property
  async setProperty(objectPath: string, property: string, value: any): Promise<void> {
    await this.call('ak.wwise.core.object.setProperty', {
      object: objectPath,
      property,
      value,
    });
  }

  // Convenience: WAQL query
  async query(waql: string, returnFields: string[] = ['id', 'name', 'type', 'path']): Promise<any[]> {
    const result = await this.call('ak.wwise.core.object.get', {
      waql,
    }, {
      return: returnFields,
    });
    return result?.return || [];
  }
}
