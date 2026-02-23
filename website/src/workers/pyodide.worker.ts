/**
 * Web Worker: loads Pyodide + pytest, runs user code against test files.
 * Uses dynamic import() to load Pyodide from CDN (works in ES module workers).
 */
/// <reference lib="webworker" />

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full';

const PYTEST_COLLECTOR = `
import json, time, sys

# Monkey-patch time.sleep for Pyodide (no SharedArrayBuffer on GitHub Pages)
_original_time = time.time
class _MockClock:
    _offset = 0.0
    def sleep(self, s):
        self._offset += s
    def time(self):
        return _original_time() + self._offset
_clock = _MockClock()
time.sleep = _clock.sleep
time.time = _clock.time

# Also patch time.monotonic
_original_monotonic = time.monotonic
def _mock_monotonic():
    return _original_monotonic() + _clock._offset
time.monotonic = _mock_monotonic

import pytest

class ResultCollector:
    def __init__(self):
        self.results = []

    def pytest_runtest_logreport(self, report):
        if report.when == "call":
            result = {
                "name": report.nodeid.split("::")[-1],
                "passed": report.passed,
                "duration": round(report.duration, 4),
            }
            if report.failed:
                result["error"] = str(report.longrepr)
            self.results.append(result)

    def pytest_runtest_makereport(self, item, call):
        pass

def run_tests(test_path, level_filter=None):
    collector = ResultCollector()
    args = [test_path, "-v", "--tb=short", "--no-header", "-q"]
    if level_filter is not None:
        args.extend(["-k", f"TestLevel{level_filter}"])
    exit_code = pytest.main(args, plugins=[collector])
    return json.dumps(collector.results), int(exit_code)
`;

async function initPyodide() {
  // Dynamic import from CDN — works in ES module workers
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}/pyodide.mjs`);

  pyodide = await loadPyodide({
    indexURL: `${PYODIDE_CDN}/`,
  });

  // Install pytest
  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');
  await micropip.install('pytest');

  // Load the test collector
  await pyodide.runPythonAsync(PYTEST_COLLECTOR);

  self.postMessage({ type: 'ready' });
}

async function runTests(data: {
  userCode: string;
  testCode: string;
  moduleName: string;
  testFileName: string;
  levelFilter: number | null;
}) {
  if (!pyodide) {
    self.postMessage({ type: 'error', error: 'Pyodide not initialized' });
    return;
  }

  try {
    // Write user code to virtual FS
    pyodide.FS.writeFile(`/home/pyodide/${data.moduleName}.py`, data.userCode);
    // Write test file
    pyodide.FS.writeFile(`/home/pyodide/${data.testFileName}`, data.testCode);

    // Ensure /home/pyodide is in sys.path
    await pyodide.runPythonAsync(`
import sys, importlib
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')
# Clear cached module so changes are picked up
if '${data.moduleName}' in sys.modules:
    del sys.modules['${data.moduleName}']
`);

    // Run tests
    const levelArg = data.levelFilter !== null ? data.levelFilter.toString() : 'None';
    const result = await pyodide.runPythonAsync(`
results_json, exit_code = run_tests('/home/pyodide/${data.testFileName}', ${levelArg})
(results_json, exit_code)
`);

    const [resultsJson, exitCode] = result.toJs();
    self.postMessage({
      type: 'results',
      results: resultsJson,
      exitCode,
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: String(err),
    });
  }
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent) => {
  const { type, ...data } = event.data;
  switch (type) {
    case 'init':
      try {
        await initPyodide();
      } catch (err) {
        self.postMessage({ type: 'error', error: `Failed to init Pyodide: ${err}` });
      }
      break;
    case 'run':
      await runTests(data);
      break;
  }
};
