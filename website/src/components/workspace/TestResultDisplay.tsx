import type { TestResult } from '@/types/project'

interface Props {
  results: TestResult[] | null
  error: string | null
}

export default function TestResultDisplay({ results, error }: Props) {
  if (error) {
    return (
      <div className="p-3">
        <div className="text-xs text-[var(--red)] font-medium mb-1">Error</div>
        <pre className="text-[11px] text-[var(--text-muted)] whitespace-pre-wrap break-words leading-relaxed">
          {error}
        </pre>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="p-3 text-xs text-[var(--text-muted)]">
        Run tests to see results (Cmd+Enter)
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="p-3 text-xs text-[var(--text-muted)]">
        No test results
      </div>
    )
  }

  const passed = results.filter(t => t.passed).length
  const total = results.length
  const allPassed = passed === total

  return (
    <div className="p-3">
      <div className={`text-xs font-medium mb-2 ${allPassed ? 'text-[var(--green)]' : 'text-[var(--text-secondary)]'}`}>
        {passed}/{total} passed
        {allPassed && ' — All tests passing!'}
      </div>
      <div className="space-y-1">
        {results.map((test, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            <span className={test.passed ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
              {test.passed ? 'PASS' : 'FAIL'}
            </span>
            <span className="text-[var(--text-secondary)]">{test.name}</span>
            {test.duration !== undefined && (
              <span className="text-[var(--text-muted)]">({test.duration}s)</span>
            )}
            {test.error && (
              <details className="ml-2 text-[var(--text-muted)]">
                <summary className="cursor-pointer hover:text-[var(--text-secondary)]">details</summary>
                <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-relaxed max-h-32 overflow-y-auto">
                  {test.error}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
