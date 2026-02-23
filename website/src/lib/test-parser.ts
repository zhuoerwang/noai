import type { TestResult } from '@/types/project';

/**
 * Parse pytest JSON output (from our custom collector) into structured results.
 */
export function parseTestResults(jsonStr: string): TestResult[] {
  try {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data)) {
      return data.map((t: { name: string; passed: boolean; duration?: number; error?: string }) => ({
        name: t.name,
        passed: t.passed,
        duration: t.duration,
        error: t.error,
      }));
    }
  } catch {
    // fallback: parse pytest text output
    return parseTestOutput(jsonStr);
  }
  return [];
}

/**
 * Fallback: parse raw pytest -v output.
 */
function parseTestOutput(output: string): TestResult[] {
  const results: TestResult[] = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const passMatch = line.match(/(\S+::(\S+))\s+PASSED/);
    if (passMatch) {
      results.push({ name: passMatch[2], passed: true });
      continue;
    }
    const failMatch = line.match(/(\S+::(\S+))\s+FAILED/);
    if (failMatch) {
      results.push({ name: failMatch[2], passed: false });
    }
  }
  return results;
}
