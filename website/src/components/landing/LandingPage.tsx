import projectIndex from '@/data/project-index.json'
import type { ProjectSummary } from '@/types/project'
import { Link } from 'react-router-dom'

const projects = projectIndex as ProjectSummary[]

// Group projects by phase
const phases = projects.reduce<Map<number, { name: string; projects: ProjectSummary[] }>>((acc, p) => {
  if (!acc.has(p.phase)) {
    acc.set(p.phase, { name: p.phaseName, projects: [] })
  }
  acc.get(p.phase)!.projects.push(p)
  return acc
}, new Map())

const difficultyColor: Record<string, string> = {
  'Easy': 'text-green-400',
  'Easy-Medium': 'text-green-300',
  'Medium': 'text-yellow-400',
  'Medium-Hard': 'text-orange-400',
  'Hard': 'text-red-400',
  'Very Hard': 'text-red-500',
}

const pyodideBadge: Record<string, { label: string; color: string }> = {
  full: { label: 'Browser', color: 'bg-green-900/50 text-green-400 border-green-800' },
  partial: { label: 'Partial', color: 'bg-yellow-900/50 text-yellow-400 border-yellow-800' },
  none: { label: 'Local Only', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const badge = pyodideBadge[project.pyodide]
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group block border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent-dim)] transition-colors bg-[var(--bg-secondary)]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] text-xs">#{project.num}</span>
          <h3 className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
            {project.name}
          </h3>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.color}`}>
          {badge.label}
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">{project.concepts}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${difficultyColor[project.difficulty] ?? 'text-neutral-400'}`}>
          {project.difficulty}
        </span>
        {project.levels > 0 && (
          <span className="text-[10px] text-[var(--text-muted)]">
            {project.levels} levels
          </span>
        )}
      </div>
    </Link>
  )
}

function PhaseSection({ phaseNum, name, projects: phaseProjects }: { phaseNum: number; name: string; projects: ProjectSummary[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-[var(--accent-dim)] font-medium tracking-wider uppercase">
          Phase {phaseNum}
        </span>
        <h2 className="text-lg font-medium text-[var(--text-primary)]">{name}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {phaseProjects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">noaicoding.com</span>
          <a
            href="https://github.com/zhuoerwang/noaicoding"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Build Software From Scratch
          </h1>
          <p className="text-[var(--text-secondary)] text-base mb-2">
            30 projects. From hash maps to coding agents. All from scratch.
          </p>
          <p className="text-[var(--text-muted)] text-sm mb-8">
            Write Python in your browser. Run pytest instantly. No setup required.
          </p>
          <a
            href="#projects"
            className="inline-block px-5 py-2.5 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent-dim)]/80 transition-colors border border-[var(--accent-dim)]"
          >
            Start Building
          </a>
        </div>
      </section>

      {/* Project Grid */}
      <main id="projects" className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {Array.from(phases.entries()).map(([phaseNum, { name, projects: phaseProjects }]) => (
            <PhaseSection
              key={phaseNum}
              phaseNum={phaseNum}
              name={name}
              projects={phaseProjects}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="max-w-6xl mx-auto text-center text-xs text-[var(--text-muted)] space-y-2">
          <p>No AI coding assistance. Build understanding from first principles.</p>
          <p>
            Contact:{' '}
            <a href="mailto:joel@palolab.ai" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              joel@palolab.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
