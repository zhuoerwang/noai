import type { TestRunResult } from '@/types/project';
import { parseTestResults } from './test-parser';

type PyodideStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';
type StatusCallback = (status: PyodideStatus) => void;

export class PyodideManager {
  private worker: Worker | null = null;
  private statusCallbacks: StatusCallback[] = [];
  private status: PyodideStatus = 'idle';
  private pendingResolve: ((result: TestRunResult) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  onStatus(cb: StatusCallback) {
    this.statusCallbacks.push(cb);
    cb(this.status);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(c => c !== cb);
    };
  }

  private setStatus(s: PyodideStatus) {
    this.status = s;
    for (const cb of this.statusCallbacks) cb(s);
  }

  getStatus() {
    return this.status;
  }

  async init() {
    if (this.worker) return;
    this.setStatus('loading');

    return new Promise<void>((resolve, reject) => {
      this.worker = new Worker(
        new URL('../workers/pyodide.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, ...data } = event.data;
        switch (type) {
          case 'ready':
            this.setStatus('ready');
            resolve();
            break;
          case 'results':
            this.setStatus('ready');
            if (this.timeout) clearTimeout(this.timeout);
            if (this.pendingResolve) {
              const tests = parseTestResults(data.results);
              this.pendingResolve({
                exitCode: data.exitCode,
                tests,
                output: data.results,
              });
              this.pendingResolve = null;
              this.pendingReject = null;
            }
            break;
          case 'error':
            if (this.status === 'loading') {
              this.setStatus('error');
              reject(new Error(data.error));
            } else {
              this.setStatus('ready');
              if (this.timeout) clearTimeout(this.timeout);
              if (this.pendingReject) {
                this.pendingReject(new Error(data.error));
                this.pendingResolve = null;
                this.pendingReject = null;
              }
            }
            break;
        }
      };

      this.worker.onerror = (err) => {
        this.setStatus('error');
        reject(err);
      };

      this.worker.postMessage({ type: 'init' });
    });
  }

  async runTests(params: {
    userCode: string;
    testCode: string;
    moduleName: string;
    testFileName: string;
    levelFilter: number | null;
  }): Promise<TestRunResult> {
    if (!this.worker || this.status !== 'ready') {
      throw new Error('Pyodide not ready');
    }

    this.setStatus('running');

    return new Promise<TestRunResult>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      // 30s timeout for infinite loops
      this.timeout = setTimeout(() => {
        this.setStatus('error');
        this.worker?.terminate();
        this.worker = null;
        reject(new Error('Test execution timed out (30s). Possible infinite loop.'));
        this.pendingResolve = null;
        this.pendingReject = null;
      }, 30000);

      this.worker!.postMessage({
        type: 'run',
        ...params,
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.setStatus('idle');
    }
  }
}
