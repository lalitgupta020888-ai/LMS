'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  BookMarked,
  CalendarClock,
  Download,
  IndianRupee,
  Repeat,
  Undo2,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  EmptyState,
  Field,
  FilterTabs,
  Modal,
  PageHeader,
  SearchInput,
  TableSkeleton,
} from '@/components/ui'
import { useToast } from '@/components/providers'
import { bookService, studentService, transactionService } from '@/lib/api'
import {
  daysUntil,
  downloadCsv,
  formatCurrency,
  formatDate,
  relativeDue,
  transactionState,
} from '@/lib/format'

const EMPTY_FORM = { student_id: '', book_id: '', due_days: 14 }

const STATE_META = {
  returned: { tone: 'success', label: 'Returned' },
  overdue: { tone: 'danger', label: 'Overdue' },
  'due-soon': { tone: 'warning', label: 'Due soon' },
  issued: { tone: 'info', label: 'On loan' },
}

function validate(values) {
  const errors = {}
  if (!values.student_id) errors.student_id = 'Pick a student'
  if (!values.book_id) errors.book_id = 'Pick a book'
  const days = Number(values.due_days)
  if (!Number.isInteger(days) || days < 1) errors.due_days = 'At least 1 day'
  else if (days > 90) errors.due_days = 'Cannot exceed 90 days'
  return errors
}

export default function TransactionsPage() {
  const toast = useToast()
  const [transactions, setTransactions] = useState([])
  const [students, setStudents] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [returning, setReturning] = useState(null)
  const [returnBusy, setReturnBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [transactionData, studentData, bookData] = await Promise.all([
        transactionService.getAll(),
        studentService.getAll(),
        bookService.getAll(),
      ])
      setTransactions(transactionData || [])
      setStudents(studentData || [])
      setBooks(bookData || [])
    } catch (error) {
      toast(error.message, 'error', 'Could not load circulation')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new')) {
      openIssue()
      window.history.replaceState(null, '', '/transactions')
    }
  }, [])

  const availableBooks = useMemo(
    () => books.filter((book) => book.available_copies > 0),
    [books]
  )

  const counts = useMemo(() => {
    const result = { all: transactions.length, issued: 0, overdue: 0, returned: 0 }
    for (const item of transactions) {
      const state = transactionState(item)
      if (state === 'returned') result.returned += 1
      else {
        result.issued += 1
        if (state === 'overdue') result.overdue += 1
      }
    }
    return result
  }, [transactions])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return transactions.filter((item) => {
      const state = transactionState(item)
      if (filter === 'issued' && item.status !== 'issued') return false
      if (filter === 'returned' && item.status !== 'returned') return false
      if (filter === 'overdue' && state !== 'overdue') return false
      if (!needle) return true
      return [item.book_title, item.student_name, item.student_id, item.isbn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [transactions, search, filter])

  function openIssue() {
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const setValue = (key) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current))
  }

  // Preview of the due date the backend will compute for the chosen term.
  const previewDueDate = useMemo(() => {
    const days = Number(form.due_days)
    if (!Number.isFinite(days) || days < 1) return null
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date
  }, [form.due_days])

  async function handleIssue(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      setSaving(true)
      await transactionService.issue({
        student_id: form.student_id,
        book_id: Number(form.book_id),
        due_days: Number(form.due_days),
      })
      const book = books.find((item) => String(item.id) === String(form.book_id))
      toast(
        `“${book?.title ?? 'Book'}” is due back on ${formatDate(previewDueDate)}.`,
        'success',
        'Book issued'
      )
      setModalOpen(false)
      load()
    } catch (error) {
      toast(error.message, 'error', 'Could not issue the book')
    } finally {
      setSaving(false)
    }
  }

  async function handleReturn() {
    if (!returning) return
    try {
      setReturnBusy(true)
      const result = await transactionService.returnBook(returning.id)
      const fine = Number(result?.fine_amount) || 0
      if (fine > 0) {
        toast(
          `Returned late — a fine of ${formatCurrency(fine)} was recorded.`,
          'warning',
          'Book returned'
        )
      } else {
        toast(`“${returning.book_title}” is back on the shelf.`, 'success', 'Book returned')
      }
      setReturning(null)
      load()
    } catch (error) {
      toast(error.message, 'error', 'Could not process the return')
    } finally {
      setReturnBusy(false)
    }
  }

  function exportCsv() {
    downloadCsv(
      'circulation.csv',
      [
        { header: 'Student ID', value: (row) => row.student_id },
        { header: 'Student', value: (row) => row.student_name },
        { header: 'Book', value: (row) => row.book_title },
        { header: 'Author', value: (row) => row.book_author },
        { header: 'ISBN', value: (row) => row.isbn },
        { header: 'Issued', value: (row) => formatDate(row.issue_date) },
        { header: 'Due', value: (row) => formatDate(row.due_date) },
        { header: 'Returned', value: (row) => formatDate(row.return_date) },
        { header: 'Status', value: (row) => STATE_META[transactionState(row)].label },
        { header: 'Fine', value: (row) => row.fine_amount || 0 },
      ],
      filtered
    )
    toast(`${filtered.length} rows exported.`, 'success', 'CSV downloaded')
  }

  // Estimated fine if an overdue book came back today (₹10/day, matching the API).
  const projectedFine = (item) => Math.abs(daysUntil(item.due_date)) * 10

  return (
    <div>
      <PageHeader
        eyebrow="Movement"
        title="Circulation"
        subtitle="Issue books, track due dates and settle returns with automatic fines."
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button
              className="btn-primary"
              onClick={openIssue}
              disabled={availableBooks.length === 0 || students.length === 0}
            >
              <Repeat className="h-4 w-4" /> Issue a book
            </button>
          </>
        }
      />

      {counts.overdue > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-5 py-4 animate-fade-up">
          <CalendarClock className="h-5 w-5 shrink-0 text-rose-400" />
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">
              {counts.overdue} book{counts.overdue > 1 ? 's are' : ' is'} overdue.
            </span>{' '}
            Fines accrue at ₹10 per day until they come back.
          </p>
          <button
            onClick={() => setFilter('overdue')}
            className="ml-auto shrink-0 text-xs font-medium text-rose-400 transition-colors hover:text-rose-300"
          >
            Show them
          </button>
        </div>
      )}

      <div className="card animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-col gap-3 border-b border-hairline/10 p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by book, student or ISBN…"
          />
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: '', label: 'All', count: counts.all },
              { value: 'issued', label: 'On loan', count: counts.issued },
              { value: 'overdue', label: 'Overdue', count: counts.overdue },
              { value: 'returned', label: 'Returned', count: counts.returned },
            ]}
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title={
              transactions.length === 0 ? 'No books have moved yet' : 'Nothing matches'
            }
            message={
              transactions.length === 0
                ? 'Issue a book to a student and it will show up here.'
                : 'Try a different search term or filter.'
            }
            action={
              transactions.length === 0 &&
              availableBooks.length > 0 &&
              students.length > 0 && (
                <button className="btn-primary" onClick={openIssue}>
                  <Repeat className="h-4 w-4" /> Issue a book
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline/10 text-left">
                  {['Student', 'Book', 'Issued', 'Due', 'Status', 'Fine', ''].map(
                    (heading, index) => (
                      <th
                        key={heading || index}
                        className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint ${
                          index === 6 ? 'text-right' : ''
                        }`}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/10">
                {filtered.map((item, index) => {
                  const state = transactionState(item)
                  const meta = STATE_META[state]
                  const fine =
                    item.status === 'returned'
                      ? Number(item.fine_amount) || 0
                      : state === 'overdue'
                        ? projectedFine(item)
                        : 0

                  return (
                    <tr
                      key={item.id}
                      className="group animate-fade-up transition-colors hover:bg-hairline/[0.03]"
                      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.student_name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                              {item.student_name}
                            </p>
                            <p className="truncate font-mono text-xs text-faint">
                              #{item.student_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="truncate font-medium text-ink">{item.book_title}</p>
                        <p className="truncate text-xs text-faint">{item.book_author}</p>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {formatDate(item.issue_date)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-muted">{formatDate(item.due_date)}</p>
                        {item.status === 'issued' && (
                          <p
                            className={`text-xs ${
                              state === 'overdue'
                                ? 'text-rose-400'
                                : state === 'due-soon'
                                  ? 'text-amber-500'
                                  : 'text-faint'
                            }`}
                          >
                            {relativeDue(item.due_date)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {fine > 0 ? (
                          <span
                            className={`font-medium ${
                              item.status === 'returned' ? 'text-muted' : 'text-rose-400'
                            }`}
                          >
                            {formatCurrency(fine)}
                            {item.status !== 'returned' && (
                              <span className="ml-1 text-xs font-normal text-faint">
                                so far
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === 'issued' ? (
                          <button
                            onClick={() => setReturning(item)}
                            className="btn-ghost px-3 py-1.5 text-xs opacity-70 transition-opacity group-hover:opacity-100"
                          >
                            <Undo2 className="h-3.5 w-3.5" /> Return
                          </button>
                        ) : (
                          <span className="text-xs text-faint">
                            {formatDate(item.return_date)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------ issue */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Issue a book"
        description="Pick a member and an available title. The due date is set from today."
      >
        <form onSubmit={handleIssue} className="space-y-4" noValidate>
          <Field label="Student" required error={errors.student_id}>
            <select
              className={`input ${errors.student_id ? 'input-error' : ''}`}
              value={form.student_id}
              onChange={setValue('student_id')}
            >
              <option value="">Select a student…</option>
              {students.map((student) => (
                <option key={student.id} value={student.student_id}>
                  {student.name} · #{student.student_id}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Book"
            required
            error={errors.book_id}
            hint={`${availableBooks.length} title(s) currently on the shelf`}
          >
            <select
              className={`input ${errors.book_id ? 'input-error' : ''}`}
              value={form.book_id}
              onChange={setValue('book_id')}
            >
              <option value="">Select a book…</option>
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} — {book.author} ({book.available_copies} available)
                </option>
              ))}
            </select>
          </Field>

          <Field label="Loan period" required error={errors.due_days}>
            <div className="flex flex-wrap gap-2">
              {[7, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, due_days: days }))
                  }
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    Number(form.due_days) === days
                      ? 'border-brand-500/60 bg-brand-500/12 text-brand-400'
                      : 'border-hairline/10 text-muted hover:border-brand-500/30 hover:text-ink'
                  }`}
                >
                  {days} days
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="90"
                value={form.due_days}
                onChange={setValue('due_days')}
                aria-label="Custom loan period in days"
                className={`input w-24 ${errors.due_days ? 'input-error' : ''}`}
              />
            </div>
          </Field>

          {previewDueDate && !errors.due_days && (
            <div className="flex items-center gap-2.5 rounded-xl border border-brand-500/20 bg-brand-500/[0.07] px-4 py-3">
              <CalendarClock className="h-4 w-4 shrink-0 text-brand-400" />
              <p className="text-sm text-muted">
                Due back on{' '}
                <span className="font-semibold text-ink">
                  {formatDate(previewDueDate)}
                </span>
                . Late returns are fined ₹10 per day.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-hairline/10 pt-5">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <BookMarked className="h-4 w-4" />
              {saving ? 'Issuing…' : 'Issue book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- return */}
      <Modal
        open={Boolean(returning)}
        onClose={() => setReturning(null)}
        title="Confirm return"
        size="sm"
      >
        {returning && (
          <>
            <div className="rounded-xl border border-hairline/10 bg-hairline/[0.03] p-4">
              <p className="font-medium text-ink">{returning.book_title}</p>
              <p className="mt-0.5 text-sm text-muted">
                {returning.student_name} · #{returning.student_id}
              </p>
              <p className="mt-2 text-xs text-faint">
                Due {formatDate(returning.due_date)} · {relativeDue(returning.due_date)}
              </p>
            </div>

            {transactionState(returning) === 'overdue' ? (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3">
                <IndianRupee className="h-4 w-4 shrink-0 text-rose-400" />
                <p className="text-sm text-muted">
                  A fine of{' '}
                  <span className="font-semibold text-rose-400">
                    {formatCurrency(projectedFine(returning))}
                  </span>{' '}
                  will be recorded for this late return.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Returned on time — no fine will be charged.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setReturning(null)}
                disabled={returnBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleReturn}
                disabled={returnBusy}
              >
                <Undo2 className="h-4 w-4" />
                {returnBusy ? 'Processing…' : 'Confirm return'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
