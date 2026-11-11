import { ConnectionState } from '../types/telemetry';

export class SerialManager {
  private port: any = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private baudRate: number = 115200;
  private connectionState: ConnectionState = 'Disconnected';
  private autoReconnectTimer: any = null;
  private isAutoReconnectEnabled: boolean = true;
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();
  private dataCallbacks: Set<(line: string) => void> = new Set();

  constructor() {
    // Listen to browser disconnect events if supported
    if ('serial' in navigator) {
      (navigator.serial as any).addEventListener('disconnect', (event: any) => {
        console.warn('[SerialManager] Hardware serial device disconnected!', event);
        this.handleDisconnect('Receiver Disconnected');
      });
    }
  }

  public onStateChange(callback: (state: ConnectionState) => void) {
    this.stateChangeCallbacks.add(callback);
    callback(this.connectionState);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  public onData(callback: (line: string) => void) {
    this.dataCallbacks.add(callback);
    return () => this.dataCallbacks.delete(callback);
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.stateChangeCallbacks.forEach((cb) => cb(state));
  }

  public getBaudRate(): number {
    return this.baudRate;
  }

  public setBaudRate(rate: number) {
    this.baudRate = rate;
  }

  public getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Request COM Port selection & open connection
   */
  public async connect(overrideBaudRate?: number): Promise<boolean> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }

    try {
      this.setConnectionState('Connecting');
      const rate = overrideBaudRate || this.baudRate;
      this.baudRate = rate;

      if (!this.port) {
        this.port = await (navigator.serial as any).requestPort();
      }

      // Check if port is already open
      if (this.port && this.port.readable) {
        console.log('[SerialManager] Port is already open and active.');
        this.setConnectionState('Connected');
        this.stopAutoReconnect();
        if (!this.reader) {
          this.readLoop();
        }
        return true;
      }

      await this.port.open({ baudRate: rate });
      this.setConnectionState('Connected');
      this.stopAutoReconnect();

      // Start asynchronous stream reader loop
      this.readLoop();
      return true;
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already open')) {
        console.warn('[SerialManager] Port was already open, adopting active connection.');
        this.setConnectionState('Connected');
        this.stopAutoReconnect();
        if (!this.reader) {
          this.readLoop();
        }
        return true;
      }
      console.error('[SerialManager] Connection error:', err);
      this.setConnectionState('Disconnected');
      throw err;
    }
  }

  /**
   * Continuous stream reader loop using TextDecoder
   */
  private async readLoop() {
    let buffer = '';

    try {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      while (this.connectionState === 'Connected') {
        const { value, done } = await this.reader.read();
        if (done) {
          this.reader.releaseLock();
          break;
        }

        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          // Keep incomplete tail string in buffer
          buffer = lines.pop() || '';

          for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (trimmed) {
              this.dataCallbacks.forEach((cb) => cb(trimmed));
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[SerialManager] Stream read error:', err);
      this.handleDisconnect('Receiver Disconnected');
    }
  }

  /**
   * Disconnect port cleanly
   */
  public async disconnect(): Promise<void> {
    this.stopAutoReconnect();
    this.isAutoReconnectEnabled = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (err) {
      console.error('[SerialManager] Error during close:', err);
    } finally {
      this.setConnectionState('Disconnected');
    }
  }

  /**
   * Handle unexpected hardware disconnect & trigger auto-reconnect loop
   */
  private handleDisconnect(reason: ConnectionState) {
    this.setConnectionState(reason);
    if (this.reader) {
      try {
        this.reader.releaseLock();
      } catch (e) {}
      this.reader = null;
    }

    if (this.isAutoReconnectEnabled) {
      this.startAutoReconnect();
    }
  }

  /**
   * Auto reconnect watchdog every 2 seconds
   */
  private startAutoReconnect() {
    if (this.autoReconnectTimer) return;

    console.log('[SerialManager] Starting auto-reconnect watchdog (2s interval)...');
    this.autoReconnectTimer = setInterval(async () => {
      if (this.connectionState === 'Connected') {
        this.stopAutoReconnect();
        return;
      }

      if (this.port) {
        try {
          console.log('[SerialManager] Attempting automatic port re-open...');
          await this.port.open({ baudRate: this.baudRate });
          this.setConnectionState('Connected');
          this.stopAutoReconnect();
          this.readLoop();
        } catch (err) {
          console.warn('[SerialManager] Auto-reconnect attempt failed, will retry in 2s...');
        }
      }
    }, 2000);
  }

  private stopAutoReconnect() {
    if (this.autoReconnectTimer) {
      clearInterval(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }
  }
}

export const serialManager = new SerialManager();
