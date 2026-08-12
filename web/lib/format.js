export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatCurrency(value) {
  const amount = Number(value) || 0
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('en-IN')
}

/** Whole days from today to `value`. Negative means the date has passed. */
export function daysUntil(value) {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

/** 'issued' | 'returned' plus a due date collapses into one display state. */
export function transactionState(transaction) {
  if (transaction.status === 'returned') return 'returned'
  const left = daysUntil(transaction.due_date)
  if (left === null) return 'issued'
  if (left < 0) return 'overdue'
  if (left <= 3) return 'due-soon'
  return 'issued'
}

export function relativeDue(dueDate) {
  const left = daysUntil(dueDate)
  if (left === null) return ''
  if (left === 0) return 'due today'
  if (left === 1) return 'due tomorrow'
  if (left > 0) return `${left} days left`
  if (left === -1) return '1 day overdue'
  return `${Math.abs(left)} days overdue`
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Deterministic gradient per name so avatars stay stable across renders. */
const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
]

export function avatarGradient(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

/** Builds a CSV and triggers a client-side download. */
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const str = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }

  const lines = [
    columns.map((column) => escape(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => escape(column.value(row))).join(',')),
  ]

  const blob = new Blob(['﻿' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
