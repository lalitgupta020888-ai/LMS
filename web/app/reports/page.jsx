'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  BookOpen,
  Download,
  Flame,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import {
  Avatar,
  Badge,
  CardSkeleton,
  EmptyState,
  FilterTabs,
  PageHeader,
} from '@/components/ui'
import { useToast } from '@/components/providers'
import { reportService, transactionService } from '@/lib/api'
import { downloadCsv, formatCurrency, formatNumber, transactionState } from '@/lib/format'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card rounded-xl px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 max-w-[14rem] truncate font-medium text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-muted">
          {entry.name}: <span className="font-semibold text-ink">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

/** Ranked list with a proportional bar behind each row. */
function LeaderRow({ rank, title, subtitle, value, max, tone = 'brand', avatar }) {
  const width = max > 0 ? Math.max((value / max) * 100, 4) : 0
  const bars = {
    brand: 'from-brand-500/25 to-violet-500/10',
    emerald: 'from-emerald-500/25 to-teal-500/10',
  }

  return (
    <li className="relative overflow-hidden px-6 py-3.5">
      <div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${bars[tone]} transition-all duration-700`}
        style={{ width: `${width}%` }}
      />
      <div className="relative flex items-center gap-3">
        <span className="w-5 shrink-0 text-center text-xs font-semibold text-faint">
          {rank}
        </span>
        {avatar ? (
          <Avatar name={avatar} size="sm" />
        ) : (
          <div className="flex h-8 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-brand-500 to-violet-500">
            <BookOpen className="h-3 w-3 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          {subtitle && <p className="truncate text-xs text-faint">{subtitle}</p>}
        </div>
        <span className="shrink-0 text-sm font-semibold text-ink">{value}</span>
      </div>
    </li>
  )
}

export default function ReportsPage() {
  const toast = useToast()
  const [overview, setOverview] = useState(null)
  const [studentReport, setStudentReport] = useState([])
  const [bookReport, setBookReport] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState('books')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setFailed(false)
      const [overviewData, students, booksData, transactionData] = await Promise.all([
        reportService.overview(),
        reportService.students(),
        reportService.books(),
        transactionService.getAll(),
      ])
      setOverview(overviewData)
      setStudentReport(students || [])
      setBookReport(booksData || [])
      setTransactions(transactionData || [])
    } catch (error) {
      setFailed(true)
      toast(error.message, 'error', 'Could not build the reports')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const topBooks = useMemo(
    () =>
      [...bookReport]
        .filter((book) => book.total_issues > 0)
        .sort((a, b) => b.total_issues - a.total_issues)
        .slice(0, 8),
    [bookReport]
  )

  const topStudents = useMemo(
    () =>
      [...studentReport]
        .filter((student) => student.total_books_issued > 0)
        .sort((a, b) => b.total_books_issued - a.total_books_issued)
        .slice(0, 8),
    [studentReport]
  )

  const overdue = useMemo(
    () => transactions.filter((item) => transactionState(item) === 'overdue'),
    [transactions]
  )

  const outstandingFines = useMemo(
    () =>
      overdue.reduce((sum, item) => {
        const daysLate = Math.ceil(
          (Date.now() - new Date(item.due_date).getTime()) / 86400000
        )
        return sum + Math.max(daysLate, 0) * 10
      }, 0),
    [overdue]
  )

  const idleTitles = useMemo(
    () => bookReport.filter((book) => !book.total_issues).length,
    [bookReport]
  )

  const chartData = useMemo(
    () =>
      topBooks.slice(0, 6).map((book) => ({
        name: book.title.length > 22 ? `${book.title.slice(0, 21)}…` : book.title,
        Issues: book.total_issues,
      })),
    [topBooks]
  )

  const maxBookIssues = topBooks[0]?.total_issues || 0
  const maxStudentIssues = topStudents[0]?.total_books_issued || 0

  function exportStudents() {
    downloadCsv(
      'student-report.csv',
      [
        { header: 'Student ID', value: (row) => row.student_id },
        { header: 'Name', value: (row) => row.name },
        { header: 'Email', value: (row) => row.email },
        { header: 'Course', value: (row) => row.course },
        { header: 'Year', value: (row) => row.year },
        { header: 'Total borrowed', value: (row) => row.total_books_issued },
        { header: 'Currently held', value: (row) => row.currently_issued },
      ],
      studentReport
    )
    toast(`${studentReport.length} student rows exported.`, 'success', 'CSV downloaded')
  }

  function exportBooks() {
    downloadCsv(
      'book-report.csv',
      [
        { header: 'ISBN', value: (row) => row.isbn },
        { header: 'Title', value: (row) => row.title },
        { header: 'Author', value: (row) => row.author },
        { header: 'Category', value: (row) => row.category },
        { header: 'Total copies', value: (row) => row.total_copies },
        { header: 'Available', value: (row) => row.available_copies },
        { header: 'Times issued', value: (row) => row.total_issues },
        { header: 'Currently out', value: (row) => row.currently_issued },
      ],
      bookReport
    )
    toast(`${bookReport.length} book rows exported.`, 'success', 'CSV downloaded')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} className="h-32" />
          ))}
        </div>
        <CardSkeleton className="h-80" />
      </div>
    )
  }

  if (failed) {
    return (
      <div className="card">
        <EmptyState
          icon={AlertTriangle}
          title="Reports are unavailable"
          message="The library API did not respond. Start the backend and try again."
          action={
            <button className="btn-primary" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          }
        />
      </div>
    )
  }

  const activeRows = tab === 'books' ? bookReport : studentReport

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Where your collection is working hardest, and what needs chasing up."
        actions={
          <>
            <button className="btn-ghost" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              className="btn-primary"
              onClick={tab === 'books' ? exportBooks : exportStudents}
              disabled={activeRows.length === 0}
            >
              <Download className="h-4 w-4" /> Export {tab}
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Loans all time"
          value={formatNumber(
            (overview?.total_issued || 0) + (overview?.total_returned || 0)
          )}
          hint={`${formatNumber(overview?.total_returned)} completed`}
          icon={TrendingUp}
          tone="brand"
          delay={0}
        />
        <StatCard
          label="Fines collected"
          value={formatCurrency(overview?.total_fine)}
          hint="From settled returns"
          icon={IndianRupee}
          tone="emerald"
          delay={60}
        />
        <StatCard
          label="Outstanding fines"
          value={formatCurrency(outstandingFines)}
          hint={`${overdue.length} book(s) still overdue`}
          icon={AlertTriangle}
          tone="rose"
          delay={120}
        />
        <StatCard
          label="Never borrowed"
          value={formatNumber(idleTitles)}
          hint={`of ${formatNumber(bookReport.length)} titles`}
          icon={BookOpen}
          tone="amber"
          delay={180}
        />
      </div>

      {/* ------------------------------------------------------------- chart */}
      <div className="mt-6 card p-6 animate-fade-up" style={{ animationDelay: '220ms' }}>
        <div className="mb-6 flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" />
          <div>
            <h2 className="headline text-lg text-ink">Most borrowed titles</h2>
            <p className="mt-0.5 text-sm text-muted">Total issues per book, all time</p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No loans recorded yet"
            message="Once books start circulating, the leaderboard fills in here."
          />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-faint"
                  opacity={0.15}
                  vertical={false}
                />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgb(99 102 241 / 0.08)' }}
                />
                <Bar
                  dataKey="Issues"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="url(#barFill)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------- leaderboards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card animate-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="flex items-center gap-2 border-b border-hairline/10 px-6 py-5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="headline text-lg text-ink">Top titles</h2>
          </div>
          {topBooks.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nothing borrowed yet" />
          ) : (
            <ul className="divide-y divide-hairline/10">
              {topBooks.map((book, index) => (
                <LeaderRow
                  key={book.id}
                  rank={index + 1}
                  title={book.title}
                  subtitle={`${book.author}${book.currently_issued ? ` · ${book.currently_issued} out now` : ''}`}
                  value={book.total_issues}
                  max={maxBookIssues}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="card animate-fade-up" style={{ animationDelay: '340ms' }}>
          <div className="flex items-center gap-2 border-b border-hairline/10 px-6 py-5">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="headline text-lg text-ink">Most active readers</h2>
          </div>
          {topStudents.length === 0 ? (
            <EmptyState icon={Users} title="No borrowing activity yet" />
          ) : (
            <ul className="divide-y divide-hairline/10">
              {topStudents.map((student, index) => (
                <LeaderRow
                  key={student.id}
                  rank={index + 1}
                  avatar={student.name}
                  title={student.name}
                  subtitle={`#${student.student_id}${student.currently_issued ? ` · ${student.currently_issued} held` : ''}`}
                  value={student.total_books_issued}
                  max={maxStudentIssues}
                  tone="emerald"
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- full tables */}
      <div className="mt-6 card animate-fade-up" style={{ animationDelay: '400ms' }}>
        <div className="flex flex-col gap-3 border-b border-hairline/10 p-4 sm:flex-row sm:items-center">
          <FilterTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'books', label: 'Book report', count: bookReport.length },
              { value: 'students', label: 'Student report', count: studentReport.length },
            ]}
          />
          <p className="text-xs text-faint sm:ml-auto">
            Export the full table with the button above.
          </p>
        </div>

        {activeRows.length === 0 ? (
          <EmptyState
            icon={tab === 'books' ? BookOpen : Users}
            title={`No ${tab} to report on yet`}
          />
        ) : (
          <div className="overflow-x-auto">
            {tab === 'books' ? (
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline/10 text-left">
                    {['Title', 'Category', 'Copies', 'Times issued', 'Out now'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/10">
                  {bookReport.map((book) => (
                    <tr key={book.id} className="transition-colors hover:bg-hairline/[0.03]">
                      <td className="px-6 py-4">
                        <p className="truncate font-medium text-ink">{book.title}</p>
                        <p className="truncate text-xs text-faint">{book.author}</p>
                      </td>
                      <td className="px-6 py-4">
                        {book.category ? (
                          <Badge tone="brand">{book.category}</Badge>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {book.available_copies} / {book.total_copies}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-ink">{book.total_issues}</span>
                      </td>
                      <td className="px-6 py-4">
                        {book.currently_issued > 0 ? (
                          <Badge tone="warning">{book.currently_issued}</Badge>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline/10 text-left">
                    {['Student', 'Programme', 'Total borrowed', 'Currently held'].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/10">
                  {studentReport.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-hairline/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{student.name}</p>
                            <p className="truncate font-mono text-xs text-faint">
                              #{student.student_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {student.course || '—'}
                        {student.year && (
                          <span className="block text-xs text-faint">{student.year}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-ink">
                          {student.total_books_issued}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {student.currently_issued > 0 ? (
                          <Badge tone="warning">{student.currently_issued}</Badge>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
