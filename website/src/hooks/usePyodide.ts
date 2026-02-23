import { useState, useEffect, useRef, useCallback } from 'react';
import { PyodideManager } from '@/lib/pyodide-manager';
import type { TestRunResult } from '@/types/project';

type PyodideStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';

export function usePyodide() {
  const managerRef = useRef<PyodideManager | null>(null);
  const [status, setStatus] = useState<PyodideStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const manager = new PyodideManager();
    managerRef.current = manager;
    const unsub = manager.onStatus(setStatus);

    manager.init().catch((err) => {
      setError(String(err));
    });

    return () => {
      unsub();
      manager.terminate();
    };
  }, []);

  const runTests = useCallback(async (params: {
    userCode: string;
    testCode: string;
    moduleName: string;
    testFileName: string;
    levelFilter: number | null;
  }): Promise<TestRunResult> => {
    if (!managerRef.current) {
      throw new Error('Pyodide not initialized');
    }
    setError(null);
    try {
      return await managerRef.current.runTests(params);
    } catch (err) {
      const msg = String(err);
      setError(msg);
      // Re-init after timeout
      if (msg.includes('timed out')) {
        const manager = new PyodideManager();
        managerRef.current = manager;
        manager.onStatus(setStatus);
        manager.init().catch(() => {});
      }
      throw err;
    }
  }, []);

  return { status, error, runTests };
}
