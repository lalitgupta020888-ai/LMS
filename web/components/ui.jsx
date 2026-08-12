'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Search, X } from 'lucide-react'
import { avatarGradient, initials } from '@/lib/format'

/* ---------------------------------------------------------------- section */

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-5 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            {eyebrow}
          </p>
        )}
        <h1 className="headline gradient-text text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------------------------------------------------------- avatars */

export function Avatar({ name, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-semibold text-white shadow-lg ${
        sizes[size]
      } ${avatarGradient(name || '')}`}
    >
      {initials(name)}
    </div>
  )
}

/* ----------------------------------------------------------------- badges */

const BADGE_TONES = {
  neutral: 'bg-slate-500/10 text-muted ring-1 ring-inset ring-slate-500/25',
  brand: 'bg-brand-500/12 text-brand-400 ring-1 ring-inset ring-brand-500/30',
  success: 'bg-emerald-500/12 text-emerald-400 ring-1 ring-inset ring-emerald-500/30',
  warning: 'bg-amber-500/12 text-amber-500 ring-1 ring-inset ring-amber-500/30',
  danger: 'bg-rose-500/12 text-rose-400 ring-1 ring-inset ring-rose-500/30',
  info: 'bg-sky-500/12 text-sky-400 ring-1 ring-inset ring-sky-500/30',
}

export function Badge({ tone = 'neutral', children, dot = false }) {
  return (
    <span className={`chip ${BADGE_TONES[tone] || BADGE_TONES.neutral}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------ empty/loading */

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center animate-fade-in">
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 ring-1 ring-inset ring-brand-500/25">
          <Icon className="h-7 w-7 text-brand-400" />
        </div>
      )}
      <h3 className="headline text-lg text-ink">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="divide-y divide-hairline/10">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-6 py-4">
          <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
          {Array.from({ length: columns - 1 }).map((__, cellIndex) => (
            <div
              key={cellIndex}
              className="skeleton h-3.5 flex-1"
              style={{ opacity: 1 - cellIndex * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className = 'h-32' }) {
  return <div className={`skeleton rounded-2xl ${className}`} />
}

/* ------------------------------------------------------------------ search */

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  )
}

/** Pill-style segmented filter. */
export function FilterTabs({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-hairline/10 bg-hairline/[0.03] p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value || 'all'}
            onClick={() => onChange(option.value)}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              active
                ? 'bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-[0_8px_20px_-10px_rgb(99_102_241)]'
                : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-faint'}`}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, description, children, size = 'md' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Focus the first field so the form is immediately typeable.
    const focusTarget = panelRef.current?.querySelector(
      'input:not([type="hidden"]), select, textarea'
    )
    focusTarget?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <div
        className="fixed inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 my-auto w-full animate-scale-in rounded-2xl shadow-lift card ${widths[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline/10 px-6 py-5">
          <div>
            <h2 className="headline text-lg text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-faint transition-colors hover:bg-hairline/10 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 ring-1 ring-inset ring-rose-500/25">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-muted">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- form field */

export function Field({ label, error, required, hint, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}
