import { useRef, useEffect } from 'react'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'

interface Props {
  code: string
  onChange: (code: string) => void
  onRun?: () => void
}

export default function EditorPanel({ code, onChange, onRun }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)
  const codeRef = useRef(code)

  onChangeRef.current = onChange
  onRunRef.current = onRun
  codeRef.current = code

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const runKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onRunRef.current?.()
          return true
        },
      },
    ])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: codeRef.current,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        runKeymap,
        updateListener,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external code changes (reset, level/project switch)
  // Only dispatch when the external code differs from what's in the editor
  useEffect(() => {
    const view = viewRef.current
    if (view && view.state.doc.toString() !== code) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      })
    }
  }, [code])

  return <div ref={containerRef} className="h-full" />
}
