'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  IndianRupee,
  Library,
  Plus,
  Repeat,
  Sparkles,
  Users,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import {
  Avatar,
  Badge,
  CardSkeleton,
  EmptyState,
  PageHeader,
} from '@/components/ui'
import { bookService, reportService, transactionService } from '@/lib/api'
import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatNumber,
  relativeDue,
  transactionState,
} from '@/lib/format'
import { useToast } from '@/components/providers'

const CATEGORY_COLORS = [
  '#6366f1',
  '#a855f7',
  '#22d3ee',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#38bdf8',
  '#f472b6',
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card rounded-xl px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-medium text-ink">{label ?? payload[0].name}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="text-muted">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
          {entry.name}: <span className="font-semibold text-ink">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

/*
 * The API stores plain calendar dates ("2026-08-12") with no timezone. Reading
 * a bucket key off toISOString() would convert local midnight to UTC first,
 * which lands on the previous day for any timezone ahead of UTC — so today's
 * loans would never match today's bucket. Build the key from local parts.
 */
const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

/** Buckets issue/return counts into the trailing 14 days. */
function buildActivitySeries(transactions) {
  const days = []
  for (let offset = 13; offset >= 0; offset--) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    days.push({
      key: dayKey(date),
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      Issued: 0,
      Returned: 0,
    })
  }

  const index = new Map(days.map((day) => [day.key, day]))

  for (const transaction of transactions) {
    const issued = index.get(String(transaction.issue_date).slice(0, 10))
    if (issued) issued.Issued += 1
    if (transaction.return_date) {
      const returned = index.get(String(transaction.return_date).slice(0, 10))
      if (returned) returned.Returned += 1
    }
  }

  return days
}

export default function DashboardPage() {
  const toast = useToast()
  const [overview, setOverview] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setFailed(false)
      const [overviewData, transactionData, bookData] = await Promise.all([
        reportService.overview(),
        transactionService.getAll(),
        bookService.getAll(),
      ])
      setOverview(overviewData)
      setTransactions(transactionData || [])
      setBooks(bookData || [])
    } catch (error) {
      setFailed(true)
      toast(error.message, 'error', 'Could not load the dashboard')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const activity = useMemo(() => buildActivitySeries(transactions), [transactions])

  const categories = useMemo(() => {
    const counts = new Map()
    for (const book of books) {
      const name = book.category?.trim() || 'Uncategorised'
      counts.set(name, (counts.get(name) || 0) + (Number(book.total_copies) || 0))
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [books])

  const overdue = useMemo(
    () =>
      transactions
        .filter((item) => transactionState(item) === 'overdue')
        .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date)),
    [transactions]
  )

  const dueSoon = useMemo(
    () => transactions.filter((item) => transactionState(item) === 'due-soon'),
    [transactions]
  )

  const recent = useMemo(() => transactions.slice(0, 6), [transactions])

  const availableCopies = books.reduce(
    (sum, book) => sum + (Number(book.available_copies) || 0),
    0
  )
  const totalCopies = books.reduce(
    (sum, book) => sum + (Number(book.total_copies) || 0),
    0
  )
  const utilisation = totalCopies
    ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100)
    : 0

  // A flat all-zero sparkline is invisible and just leaves dead space, so the
  // cards stay compact until there is something to actually show.
  const sparkOrNull = (key) => {
    const series = activity.map((day) => ({ value: day[key] }))
    return series.some((point) => point.value > 0) ? series : null
  }
  const issuedSpark = sparkOrNull('Issued')
  const returnedSpark = sparkOrNull('Returned')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} className="h-40" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton className="h-80 lg:col-span-2" />
          <CardSkeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="card">
        <EmptyState
          icon={AlertTriangle}
          title="The library API is not responding"
          message="Start the backend with `npm start` inside the backend folder, then try again."
          action={
            <button className="btn-primary" onClick={load}>
              Retry
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Good to see you again"
        subtitle="Everything happening across your library, in one glance."
        actions={
          <>
            <Link href="/books?new=1" className="btn-ghost">
              <Plus className="h-4 w-4" /> Add book
            </Link>
            <Link href="/transactions?new=1" className="btn-primary">
              <Repeat className="h-4 w-4" /> Issue a book
            </Link>
          </>
        }
      />

      {/* ------------------------------------------------------------- stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={formatNumber(overview?.total_students)}
          hint="Enrolled members"
          icon={Users}
          tone="brand"
          delay={0}
        />
        <StatCard
          label="Titles"
          value={formatNumber(overview?.total_books)}
          hint={`${formatNumber(totalCopies)} copies · ${formatNumber(availableCopies)} on shelf`}
          icon={BookOpen}
          tone="sky"
          delay={60}
        />
        <StatCard
          label="On loan"
          value={formatNumber(overview?.total_issued)}
          hint={`${overdue.length} overdue · ${dueSoon.length} due soon`}
          icon={BookMarked}
          tone="amber"
          spark={issuedSpark}
          delay={120}
        />
        <StatCard
          label="Fines collected"
          value={formatCurrency(overview?.total_fine)}
          hint={`${formatNumber(overview?.total_returned)} returns completed`}
          icon={IndianRupee}
          tone="emerald"
          spark={returnedSpark}
          delay={180}
        />
      </div>

      {/* ------------------------------------------------------------ charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div
          className="card p-6 animate-fade-up lg:col-span-2"
          style={{ animationDelay: '240ms' }}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="headline text-lg text-ink">Circulation</h2>
              <p className="mt-1 text-sm text-muted">Issues and returns, last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-400" /> Issued
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Returned
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="issuedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="returnedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-faint"
                  opacity={0.15}
                  vertical={false}
                />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#818cf8', strokeOpacity: 0.3 }} />
                <Area
                  type="monotone"
                  dataKey="Issued"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#issuedFill)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="Returned"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#returnedFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <h2 className="headline text-lg text-ink">Collection mix</h2>
          <p className="mt-1 text-sm text-muted">Copies held per category</p>

          {categories.length === 0 ? (
            <EmptyState
              icon={Library}
              title="No books yet"
              message="Add your first title to see the collection break down here."
            />
          ) : (
            <>
              <div className="relative mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={3}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {categories.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="headline text-2xl text-ink">{utilisation}%</p>
                  <p className="text-[11px] text-faint">on loan</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {categories.slice(0, 5).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate text-muted">{entry.name}</span>
                    <span className="font-medium text-ink">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* -------------------------------------------------- activity + alerts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card animate-fade-up lg:col-span-2" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between border-b border-hairline/10 px-6 py-5">
            <div>
              <h2 className="headline text-lg text-ink">Recent activity</h2>
              <p className="mt-1 text-sm text-muted">Latest issues and returns</p>
            </div>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-xs font-medium text-brand-400 transition-colors hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Nothing has moved yet"
              message="Once you issue a book, the activity trail shows up here."
              action={
                <Link href="/transactions?new=1" className="btn-primary">
                  Issue a book
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-hairline/10">
              {recent.map((item) => {
                const state = transactionState(item)
                const tone =
                  state === 'returned'
                    ? 'success'
                    : state === 'overdue'
                      ? 'danger'
                      : state === 'due-soon'
                        ? 'warning'
                        : 'info'
                const stateLabel =
                  state === 'returned'
                    ? 'Returned'
                    : state === 'overdue'
                      ? 'Overdue'
                      : state === 'due-soon'
                        ? 'Due soon'
                        : 'On loan'

                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-hairline/[0.03]"
                  >
                    <Avatar name={item.student_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.book_title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {item.student_name} · {formatDate(item.issue_date)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-muted">
                        {item.status === 'returned'
                          ? `Returned ${formatDate(item.return_date)}`
                          : relativeDue(item.due_date)}
                      </p>
                    </div>
                    <Badge tone={tone} dot>
                      {stateLabel}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="card animate-fade-up" style={{ animationDelay: '420ms' }}>
          <div className="flex items-center gap-2 border-b border-hairline/10 px-6 py-5">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h2 className="headline text-lg text-ink">Needs attention</h2>
          </div>

          {overdue.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="All clear"
              message="No book is past its due date. Nicely run library."
            />
          ) : (
            <ul className="divide-y divide-hairline/10">
              {overdue.slice(0, 6).map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <p className="truncate text-sm font-medium text-ink">
                    {item.book_title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {item.student_name} · {item.student_id}
                  </p>
                  <p className="mt-2 text-xs font-medium text-rose-400">
                    {relativeDue(item.due_date)} · fine so far{' '}
                    {formatCurrency(Math.abs(daysUntil(item.due_date)) * 10)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
