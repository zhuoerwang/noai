import { useState, useEffect } from 'react';
import type { ProjectDetail } from '@/types/project';

export function useProject(slug: string | undefined) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`/projects/${slug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Project not found: ${slug}`);
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, [slug]);

  return { project, loading, error };
}
