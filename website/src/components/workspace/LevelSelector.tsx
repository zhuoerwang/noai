import { getProgress } from '@/lib/storage'

interface Props {
  levels: number
  current: number
  onChange: (level: number) => void
  slug: string
}

export default function LevelSelector({ levels, current, onChange, slug }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-[var(--text-muted)] mr-2">Level:</span>
      {Array.from({ length: levels }, (_, i) => i + 1).map((lvl) => {
        const progress = getProgress(slug, lvl)
        const isActive = lvl === current
        const isComplete = progress?.allPassed

        return (
          <button
            key={lvl}
            onClick={() => onChange(lvl)}
            className={`
              px-3 py-1 text-xs rounded transition-colors border
              ${isActive
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent-dim)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
              }
              ${isComplete && !isActive ? 'border-green-800 text-green-400' : ''}
            `}
          >
            {lvl}
            {isComplete && <span className="ml-1 text-[var(--green)]">&#10003;</span>}
          </button>
        )
      })}
    </div>
  )
}
