import WebSocket from 'ws';

// WAMP v2 message types
const WAMP = {
  HELLO: 1,
  WELCOME: 2,
  ABORT: 3,
  GOODBYE: 6,
  ERROR: 8,
  CALL: 48,
  RESULT: 50,
  SUBSCRIBE: 32,
  SUBSCRIBED: 33,
  UNSUBSCRIBE: 34,
  UNSUBSCRIBED: 35,
  EVENT: 36,
};

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
  private subscriptionMap = new Map<number, number>(); // requestId -> subscriptionId

  get isConnected(): boolean {
    return this._connected;
  }

  get projectInfo(): ProjectInfo | null {
    return this._projectInfo;
  }

  async connect(url: string = 'ws://127.0.0.1:8080/waapi'): Promise<ProjectInfo> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        // Send WAMP HELLO
        this.ws!.send(JSON.stringify([
          WAMP.HELLO,
          'realm1',
          { roles: { caller: {}, subscriber: {} } }
        ]));
      });

      this.ws.on('message', async (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString());
          const type = msg[0];

          switch (type) {
            case WAMP.WELCOME:
              // Session established
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
              break;

            case WAMP.RESULT: {
              // [RESULT, requestId, details, args?, kwargs?]
              const reqId = msg[1];
              const kwargs = msg[4] || {};
              const args = msg[3] || [];
              const pending = this.pendingRequests.get(reqId);
              if (pending) {
                this.pendingRequests.delete(reqId);
                // Wwise returns data in kwargs (5th element)
                pending.resolve(kwargs);
              }
              break;
            }

            case WAMP.ERROR: {
              // [ERROR, origType, requestId, details, error, args?, kwargs?]
              const reqId = msg[2];
              const errorUri = msg[4] || 'Unknown error';
              const errorArgs = msg[5] || [];
              const errorKwargs = msg[6] || {};
              const pending = this.pendingRequests.get(reqId);
              if (pending) {
                this.pendingRequests.delete(reqId);
                const errMsg = errorKwargs.message || errorArgs[0] || errorUri;
                pending.reject(new Error(String(errMsg)));
              }
              break;
            }

            case WAMP.SUBSCRIBED: {
              // [SUBSCRIBED, requestId, subscriptionId]
              const reqId = msg[1];
              const subId = msg[2];
              const pending = this.pendingRequests.get(reqId);
              if (pending) {
                this.pendingRequests.delete(reqId);
                this.subscriptionMap.set(reqId, subId);
                pending.resolve(subId);
              }
              break;
            }

            case WAMP.UNSUBSCRIBED: {
              // [UNSUBSCRIBED, requestId]
              const reqId = msg[1];
              const pending = this.pendingRequests.get(reqId);
              if (pending) {
                this.pendingRequests.delete(reqId);
                pending.resolve(true);
              }
              break;
            }

            case WAMP.EVENT: {
              // [EVENT, subscriptionId, publishId, details, args?, kwargs?]
              const subId = msg[1];
              const kwargs = msg[4] || {};
              const callback = this.subscriptions.get(subId);
              if (callback) callback(kwargs);
              break;
            }

            case WAMP.ABORT:
              this._connected = false;
              reject(new Error(`WAMP session aborted: ${msg[2]?.message || msg[1]}`));
              break;

            case WAMP.GOODBYE:
              this._connected = false;
              // Reply with goodbye
              this.ws?.send(JSON.stringify([WAMP.GOODBYE, {}, 'wamp.close.normal']));
              break;
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
        for (const [, pending] of this.pendingRequests) {
          pending.reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      if (this._connected) {
        this.ws.send(JSON.stringify([WAMP.GOODBYE, {}, 'wamp.close.normal']));
      }
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
    // WAMP CALL: [CALL, requestId, options, procedure, args, kwargs]
    const message = [WAMP.CALL, id, options || {}, uri, [], args || {}];

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));

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

  // Subscribe to WAAPI topic
  async subscribe(topic: string, callback: (data: any) => void): Promise<number> {
    if (!this.ws || !this._connected) {
      throw new Error('Not connected to Wwise');
    }

    const id = ++this.requestId;
    // WAMP SUBSCRIBE: [SUBSCRIBE, requestId, options, topic]
    const message = [WAMP.SUBSCRIBE, id, {}, topic];

    const subId = await new Promise<number>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Subscribe timed out: ${topic}`));
        }
      }, 10000);
    });

    this.subscriptions.set(subId, callback);
    return subId;
  }

  // Unsubscribe
  async unsubscribe(subscriptionId: number): Promise<void> {
    if (!this.ws || !this._connected) return;

    const id = ++this.requestId;
    // WAMP UNSUBSCRIBE: [UNSUBSCRIBE, requestId, subscriptionId]
    const message = [WAMP.UNSUBSCRIBE, id, subscriptionId];

    await new Promise<boolean>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve(true); // don't fail on unsubscribe timeout
        }
      }, 5000);
    });

    this.subscriptions.delete(subscriptionId);
  }
}
