const PREFIX = 'noaicoding';

export function getCode(slug: string, level: number): string | null {
  return localStorage.getItem(`${PREFIX}:code:${slug}:${level}`);
}

export function setCode(slug: string, level: number, code: string): void {
  localStorage.setItem(`${PREFIX}:code:${slug}:${level}`, code);
}

export function getProgress(slug: string, level: number): { passed: number; total: number; allPassed: boolean } | null {
  const raw = localStorage.getItem(`${PREFIX}:progress:${slug}:${level}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setProgress(slug: string, level: number, progress: { passed: number; total: number; allPassed: boolean }): void {
  localStorage.setItem(`${PREFIX}:progress:${slug}:${level}`, JSON.stringify(progress));
}
