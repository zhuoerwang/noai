import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  readme: string
  level: number
}

/**
 * Extract the section for a given level from the README.
 * READMEs use "## Level N:" headings to delineate levels.
 */
function extractLevelContent(readme: string, level: number): string {
  const lines = readme.split('\n')
  let inLevel = false
  let result: string[] = []
  let foundLevel = false

  for (const line of lines) {
    // Match "## Level N" heading (with optional trailing text)
    const headingMatch = line.match(/^## Level (\d+)/)
    if (headingMatch) {
      const headingLevel = parseInt(headingMatch[1], 10)
      if (headingLevel === level) {
        inLevel = true
        foundLevel = true
        result.push(line)
        continue
      } else if (inLevel) {
        // Hit the next level heading, stop
        break
      }
    }

    if (inLevel) {
      result.push(line)
    }
  }

  // If no level section found, show the whole README
  if (!foundLevel) {
    return readme
  }

  return result.join('\n')
}

export default function ProblemPanel({ readme, level }: Props) {
  const content = useMemo(() => extractLevelContent(readme, level), [readme, level])

  return (
    <div className="p-6">
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
