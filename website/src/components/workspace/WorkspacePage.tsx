import { useParams, Link } from 'react-router-dom'
import { useState, useCallback, useMemo } from 'react'
import { useProject } from '@/hooks/useProject'
import { useCodePersistence } from '@/hooks/useCodePersistence'
import { usePyodide } from '@/hooks/usePyodide'
import { setProgress } from '@/lib/storage'
import type { TestResult } from '@/types/project'
import ProblemPanel from './ProblemPanel'
import EditorPanel from './EditorPanel'
import TestResultDisplay from './TestResultDisplay'
import LevelSelector from './LevelSelector'

export default function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>()
  const { project, loading, error } = useProject(slug)
  const [level, setLevel] = useState(1)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const { status: pyodideStatus, runTests } = usePyodide()

  // One code buffer per project — levels build on each other
  const defaultCode = useMemo(() => {
    if (!project) return ''
    return `# ${project.name}\n# Implement your solution here\n\nclass ${project.className}:\n    pass\n`
  }, [project])

  const { code, updateCode, resetCode } = useCodePersistence(
    slug ?? '',
    defaultCode
  )

  const handleRunTests = useCallback(async () => {
    if (!project || !project.testFile) return
    setTestResults(null)
    setTestError(null)

    try {
      const result = await runTests({
        userCode: code,
        testCode: project.testFile,
        moduleName: project.moduleName,
        testFileName: project.testFileName,
        levelFilter: level,
      })
      setTestResults(result.tests)

      // Save progress
      const passed = result.tests.filter(t => t.passed).length
      const total = result.tests.length
      setProgress(project.slug, level, {
        passed,
        total,
        allPassed: passed === total,
      })
    } catch (err) {
      setTestError(String(err))
    }
  }, [project, code, level, runTests])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--text-muted)]">Loading project...</span>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--red)]">Project not found</span>
        <Link to="/" className="text-xs text-[var(--accent)] hover:underline">Back to projects</Link>
      </div>
    )
  }

  const canRunTests = project.pyodide !== 'none' && project.hasTests

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            &larr; Projects
          </Link>
          <span className="text-xs text-[var(--border)]">|</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            #{project.num} {project.name}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{project.difficulty}</span>
        </div>
        <div className="flex items-center gap-2">
          {pyodideStatus === 'loading' && (
            <span className="text-[10px] text-[var(--yellow)] flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Loading Python...
            </span>
          )}
          {pyodideStatus === 'ready' && (
            <span className="text-[10px] text-[var(--green)] flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              Python Ready
            </span>
          )}
          {pyodideStatus === 'error' && (
            <span className="text-[10px] text-[var(--red)]">Python Error</span>
          )}
        </div>
      </header>

      {/* Level selector */}
      {project.levels > 0 && (
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
          <LevelSelector levels={project.levels} current={level} onChange={setLevel} slug={project.slug} />
        </div>
      )}

      {/* Main content: split pane */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Problem */}
        <div className="w-1/2 border-r border-[var(--border)] overflow-y-auto">
          <ProblemPanel readme={project.readme} level={level} />
        </div>

        {/* Right: Editor + Tests */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <EditorPanel code={code} onChange={updateCode} onRun={canRunTests ? handleRunTests : undefined} />
          </div>

          {/* Test controls + results */}
          <div className="border-t border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)]">
              {canRunTests ? (
                <button
                  onClick={handleRunTests}
                  disabled={pyodideStatus !== 'ready'}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent-dim)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-[var(--accent-dim)]"
                >
                  {pyodideStatus === 'running' ? 'Running...' : 'Run Tests'}
                </button>
              ) : (
                <span className="text-[10px] text-[var(--text-muted)]">
                  Run tests locally: <code className="text-[var(--accent)]">pytest {project.testFileName} -k "TestLevel{level}" -v</code>
                </span>
              )}
              <button
                onClick={resetCode}
                className="px-3 py-1.5 text-xs rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <TestResultDisplay results={testResults} error={testError} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
