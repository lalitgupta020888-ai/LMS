'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  ChevronLeft,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  PieChart,
  Repeat,
  Search,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useTheme } from '@/components/providers'
import CommandPalette from '@/components/CommandPalette'
import { healthService } from '@/lib/api'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, hint: 'Library at a glance' },
  { href: '/students', label: 'Students', icon: Users, hint: 'Member records' },
  { href: '/books', label: 'Catalogue', icon: BookOpen, hint: 'Every title you hold' },
  { href: '/transactions', label: 'Circulation', icon: Repeat, hint: 'Issues and returns' },
  { href: '/reports', label: 'Reports', icon: PieChart, hint: 'Insights and exports' },
]

function NavLinks({ collapsed, onNavigate }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
              active
                ? 'text-white'
                : 'text-muted hover:bg-hairline/[0.06] hover:text-ink'
            }`}
          >
            {active && (
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-violet-500 shadow-[0_12px_28px_-12px_rgb(99_102_241)]" />
            )}
            <Icon
              className={`relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                active ? 'text-white' : 'text-faint group-hover:text-brand-400'
              }`}
            />
            {!collapsed && (
              <span className="relative z-10 flex-1 truncate font-medium">
                {item.label}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function BackendStatus({ collapsed }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    const ping = async () => {
      try {
        await healthService.check()
        if (!cancelled) setStatus('online')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }

    ping()
    const interval = setInterval(ping, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const tone = {
    checking: { dot: 'bg-slate-400', text: 'Connecting…' },
    online: { dot: 'bg-emerald-400', text: 'API online' },
    offline: { dot: 'bg-rose-500', text: 'API offline' },
  }[status]

  if (collapsed) {
    return (
      <div className="flex justify-center py-3" title={tone.text}>
        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      </div>
    )
  }

  return (
    <div className="mx-3 flex items-center gap-2.5 rounded-xl border border-hairline/10 bg-hairline/[0.03] px-3 py-2.5">
      <span className="relative flex h-2 w-2">
        {status === 'online' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
      </span>
      <span className="text-xs font-medium text-muted">{tone.text}</span>
    </div>
  )
}

function Brand({ collapsed }) {
  return (
    <Link href="/" className="flex items-center gap-3 px-5 py-6">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 shadow-[0_14px_30px_-12px_rgb(139_92_246)]">
        <Library className="h-5 w-5 text-white" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="headline truncate text-[15px] leading-tight text-ink">
            Athenaeum
          </p>
          <p className="truncate text-[11px] tracking-wide text-faint">
            Library Management
          </p>
        </div>
      )}
    </Link>
  )
}

export default function Shell({ children }) {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const current = NAV.find((item) => item.href === pathname)

  return (
    <>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* -------------------------------------------------- desktop rail */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline/10 bg-hairline/[0.02] backdrop-blur-xl transition-[width] duration-300 lg:flex ${
            collapsed ? 'w-[76px]' : 'w-64'
          }`}
        >
          <Brand collapsed={collapsed} />
          <NavLinks collapsed={collapsed} />

          <div className="mt-auto flex flex-col gap-3 pb-5">
            <BackendStatus collapsed={collapsed} />
            <button
              onClick={() => setCollapsed((value) => !value)}
              className="mx-3 flex items-center justify-center gap-2 rounded-xl border border-hairline/10 py-2 text-xs text-faint transition-colors hover:text-ink"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-300 ${
                  collapsed ? 'rotate-180' : ''
                }`}
              />
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* --------------------------------------------------- mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm"
              onClick={closeMobile}
            />
            <aside className="relative flex h-full w-72 animate-slide-in-right flex-col border-r border-hairline/10 bg-canvas/95 backdrop-blur-2xl">
              <div className="flex items-center justify-between pr-3">
                <Brand collapsed={false} />
                <button
                  onClick={closeMobile}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-faint hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks collapsed={false} onNavigate={closeMobile} />
              <div className="mt-auto pb-5">
                <BackendStatus collapsed={false} />
              </div>
            </aside>
          </div>
        )}

        {/* --------------------------------------------------------- content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-hairline/10 bg-canvas/70 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="rounded-lg p-2 text-muted transition-colors hover:text-ink lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-medium text-ink">
                  {current?.label || 'Athenaeum'}
                </p>
                <p className="truncate text-xs text-faint">
                  {current?.hint || 'Library Management System'}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="group flex items-center gap-2 rounded-xl border border-hairline/10 bg-hairline/[0.03] px-3 py-2 text-sm text-faint transition-colors hover:border-brand-500/40 hover:text-muted"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search…</span>
                  <kbd className="ml-2 hidden rounded-md border border-hairline/15 px-1.5 py-0.5 font-sans text-[10px] sm:block">
                    Ctrl K
                  </kbd>
                </button>

                <button
                  onClick={toggleTheme}
                  aria-label="Toggle colour theme"
                  className="rounded-xl border border-hairline/10 bg-hairline/[0.03] p-2.5 text-muted transition-all hover:border-brand-500/40 hover:text-ink"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <footer className="border-t border-hairline/10 px-4 py-5 text-center text-xs text-faint sm:px-6 lg:px-8">
            Athenaeum · Library Management System
          </footer>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
