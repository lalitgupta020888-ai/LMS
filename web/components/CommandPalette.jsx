'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  LayoutDashboard,
  Moon,
  PieChart,
  Repeat,
  Search,
  Sun,
  Users,
} from 'lucide-react'
import { useTheme } from '@/components/providers'

export default function CommandPalette({ open, onClose }) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const commands = useMemo(
    () => [
      { id: 'dashboard', label: 'Go to Dashboard', group: 'Navigate', icon: LayoutDashboard, run: () => router.push('/') },
      { id: 'students', label: 'Go to Students', group: 'Navigate', icon: Users, run: () => router.push('/students') },
      { id: 'books', label: 'Go to Catalogue', group: 'Navigate', icon: BookOpen, run: () => router.push('/books') },
      { id: 'transactions', label: 'Go to Circulation', group: 'Navigate', icon: Repeat, run: () => router.push('/transactions') },
      { id: 'reports', label: 'Go to Reports', group: 'Navigate', icon: PieChart, run: () => router.push('/reports') },
      { id: 'new-student', label: 'Enrol a new student', group: 'Actions', icon: Users, run: () => router.push('/students?new=1') },
      { id: 'new-book', label: 'Add a book to the catalogue', group: 'Actions', icon: BookOpen, run: () => router.push('/books?new=1') },
      { id: 'issue', label: 'Issue a book', group: 'Actions', icon: Repeat, run: () => router.push('/transactions?new=1') },
      {
        id: 'theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Preferences',
        icon: theme === 'dark' ? Sun : Moon,
        run: toggleTheme,
      },
    ],
    [router, theme, toggleTheme]
  )

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter((command) => command.label.toLowerCase().includes(needle))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      // The portal mounts this frame; focus once it is actually in the DOM.
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open || typeof document === 'undefined') return null

  const runCommand = (command) => {
    onClose()
    command.run()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((current) => (results.length ? (current + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const command = results[cursor]
      if (command) runCommand(command)
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  let lastGroup = null

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="fixed inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl shadow-lift card"
      >
        <div className="flex items-center gap-3 border-b border-hairline/10 px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions…"
            className="w-full bg-transparent py-4 text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-hairline/15 px-1.5 py-0.5 text-[10px] text-faint sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-faint">
              Nothing matches “{query}”.
            </p>
          ) : (
            results.map((command, index) => {
              const Icon = command.icon
              const active = index === cursor
              const showGroup = command.group !== lastGroup
              lastGroup = command.group

              return (
                <div key={command.id}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                      {command.group}
                    </p>
                  )}
                  <button
                    data-active={active}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => runCommand(command)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      active ? 'bg-brand-500/12 text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-brand-400' : 'text-faint'}`}
                    />
                    <span className="flex-1">{command.label}</span>
                    {active && <ArrowRight className="h-3.5 w-3.5 text-brand-400" />}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-hairline/10 px-4 py-2.5 text-[11px] text-faint">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> to select
          </span>
          <span>↑ ↓ to navigate</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
