import { useState, useEffect, useRef, useCallback } from 'react';
import { getCode, setCode } from '@/lib/storage';

/**
 * One code buffer per project (not per level).
 * Levels build on each other, so the user writes one growing implementation.
 */
export function useCodePersistence(slug: string, defaultCode: string) {
  const [code, setCodeState] = useState(() => {
    return getCode(slug, 0) ?? defaultCode;
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update code when slug changes (project switch)
  useEffect(() => {
    const saved = getCode(slug, 0);
    setCodeState(saved ?? defaultCode);
  }, [slug, defaultCode]);

  const updateCode = useCallback((newCode: string) => {
    setCodeState(newCode);
    // Debounced save
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCode(slug, 0, newCode);
    }, 500);
  }, [slug]);

  const resetCode = useCallback(() => {
    setCodeState(defaultCode);
    setCode(slug, 0, defaultCode);
  }, [slug, defaultCode]);

  return { code, updateCode, resetCode };
}
