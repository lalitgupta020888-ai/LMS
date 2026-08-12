'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Building2,
  Download,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  FilterTabs,
  Modal,
  PageHeader,
  SearchInput,
  TableSkeleton,
} from '@/components/ui'
import { useToast } from '@/components/providers'
import { bookService } from '@/lib/api'
import { downloadCsv, formatDate } from '@/lib/format'

const EMPTY_FORM = {
  isbn: '',
  title: '',
  author: '',
  category: '',
  publisher: '',
  total_copies: 1,
}

/** Deterministic spine colour so a book looks the same on every visit. */
const SPINES = [
  'from-indigo-500 via-violet-500 to-purple-600',
  'from-sky-500 via-cyan-500 to-teal-500',
  'from-emerald-500 via-green-500 to-lime-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-slate-500 via-slate-600 to-slate-700',
]

function spineFor(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return SPINES[hash % SPINES.length]
}

function validate(values) {
  const errors = {}
  if (!values.isbn.trim()) errors.isbn = 'ISBN is required'
  if (!values.title.trim()) errors.title = 'Title is required'
  if (!values.author.trim()) errors.author = 'Author is required'
  const copies = Number(values.total_copies)
  if (!Number.isInteger(copies) || copies < 1) errors.total_copies = 'At least 1 copy'
  else if (copies > 999) errors.total_copies = 'That is a lot — max 999'
  return errors
}

function AvailabilityBar({ available, total }) {
  const ratio = total > 0 ? available / total : 0
  const tone =
    ratio === 0 ? 'bg-rose-500' : ratio < 0.34 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-faint">Availability</span>
        <span className="font-medium text-muted">
          {available} / {total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-hairline/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone}`}
          style={{ width: `${Math.max(ratio * 100, available > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  )
}

export default function BooksPage() {
  const toast = useToast()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [view, setView] = useState('grid')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [confirming, setConfirming] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setBooks((await bookService.getAll()) || [])
    } catch (error) {
      toast(error.message, 'error', 'Could not load the catalogue')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new')) {
      openCreate()
      window.history.replaceState(null, '', '/books')
    }
  }, [])

  const categories = useMemo(() => {
    const counts = new Map()
    for (const book of books) {
      const name = book.category?.trim()
      if (name) counts.set(name, (counts.get(name) || 0) + 1)
    }
    return [
      { value: '', label: 'All', count: books.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ value: name, label: name, count })),
    ]
  }, [books])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return books.filter((book) => {
      if (category && book.category !== category) return false
      if (!needle) return true
      return [book.title, book.author, book.isbn, book.category, book.publisher]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [books, search, category])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(book) {
    setEditing(book)
    setForm({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      publisher: book.publisher || '',
      total_copies: book.total_copies ?? 1,
    })
    setErrors({})
    setModalOpen(true)
  }

  const setValue = (key) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const payload = {
      isbn: form.isbn.trim(),
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim() || null,
      publisher: form.publisher.trim() || null,
      total_copies: Number(form.total_copies),
    }

    try {
      setSaving(true)
      if (editing) {
        await bookService.update(editing.id, payload)
        toast(`“${payload.title}” was updated.`, 'success', 'Saved')
      } else {
        await bookService.create(payload)
        toast(`“${payload.title}” joined the catalogue.`, 'success', 'Book added')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      toast(error.message, 'error', 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirming) return
    try {
      setDeleting(true)
      await bookService.remove(confirming.id)
      toast(`“${confirming.title}” was removed.`, 'success', 'Book deleted')
      setConfirming(null)
      load()
    } catch (error) {
      toast(error.message, 'error', 'Could not delete')
    } finally {
      setDeleting(false)
    }
  }

  function exportCsv() {
    downloadCsv(
      'catalogue.csv',
      [
        { header: 'ISBN', value: (row) => row.isbn },
        { header: 'Title', value: (row) => row.title },
        { header: 'Author', value: (row) => row.author },
        { header: 'Category', value: (row) => row.category },
        { header: 'Publisher', value: (row) => row.publisher },
        { header: 'Total copies', value: (row) => row.total_copies },
        { header: 'Available', value: (row) => row.available_copies },
        { header: 'Added', value: (row) => formatDate(row.created_at) },
      ],
      filtered
    )
    toast(`${filtered.length} rows exported.`, 'success', 'CSV downloaded')
  }

  const rowActions = (book) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => openEdit(book)}
        aria-label={`Edit ${book.title}`}
        className="rounded-lg p-2 text-muted transition-colors hover:bg-brand-500/10 hover:text-brand-400"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => setConfirming(book)}
        aria-label={`Delete ${book.title}`}
        className="rounded-lg p-2 text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <div>
      <PageHeader
        eyebrow="Collection"
        title="Catalogue"
        subtitle="Every title you hold, with live availability across all copies."
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add book
            </button>
          </>
        }
      />

      <div
        className="mb-5 flex flex-col gap-3 animate-fade-up lg:flex-row lg:items-center"
        style={{ animationDelay: '80ms' }}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title, author, ISBN or publisher…"
        />
        {categories.length > 1 && (
          <FilterTabs options={categories} value={category} onChange={setCategory} />
        )}
        <div className="flex items-center gap-1 rounded-xl border border-hairline/10 bg-hairline/[0.03] p-1 lg:ml-auto">
          {[
            { key: 'grid', icon: LayoutGrid, label: 'Grid view' },
            { key: 'list', icon: List, label: 'List view' },
          ].map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.key}
                onClick={() => setView(option.key)}
                aria-label={option.label}
                className={`rounded-lg p-2 transition-all ${
                  view === option.key
                    ? 'bg-gradient-to-br from-brand-500 to-violet-500 text-white'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="card">
          <TableSkeleton rows={6} columns={5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title={
              search || category ? 'No books match those filters' : 'The shelves are empty'
            }
            message={
              search || category
                ? 'Try a broader search or clear the category filter.'
                : 'Add your first title to start building the catalogue.'
            }
            action={
              !search &&
              !category && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Add book
                </button>
              )
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((book, index) => (
            <article
              key={book.id}
              className="group card card-hover flex flex-col p-5 animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            >
              <div className="flex gap-4">
                {/* Book spine — a simple stand-in for a cover image. */}
                <div
                  className={`relative flex h-24 w-16 shrink-0 items-end overflow-hidden rounded-lg bg-gradient-to-br ${spineFor(
                    book.title
                  )} p-2 shadow-lg`}
                >
                  <span className="absolute inset-y-0 left-1.5 w-px bg-white/30" />
                  <BookOpen className="h-4 w-4 text-white/85" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className="headline truncate text-base leading-snug text-ink"
                    title={book.title}
                  >
                    {book.title}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-muted">by {book.author}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {book.category && <Badge tone="brand">{book.category}</Badge>}
                    <Badge
                      tone={book.available_copies > 0 ? 'success' : 'danger'}
                      dot
                    >
                      {book.available_copies > 0 ? 'On shelf' : 'All out'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-faint">
                <p className="truncate font-mono">ISBN {book.isbn}</p>
                {book.publisher && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {book.publisher}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4">
                <AvailabilityBar
                  available={book.available_copies}
                  total={book.total_copies}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-hairline/10 pt-3">
                <span className="text-xs text-faint">
                  Added {formatDate(book.created_at)}
                </span>
                <div className="opacity-60 transition-opacity group-hover:opacity-100">
                  {rowActions(book)}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto animate-fade-up">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline/10 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                  Title
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                  Category
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                  Publisher
                </th>
                <th className="w-48 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                  Availability
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-faint">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/10">
              {filtered.map((book) => (
                <tr
                  key={book.id}
                  className="group transition-colors hover:bg-hairline/[0.03]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-7 shrink-0 rounded bg-gradient-to-br ${spineFor(
                          book.title
                        )}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{book.title}</p>
                        <p className="truncate text-xs text-faint">
                          {book.author} · {book.isbn}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {book.category ? (
                      <Badge tone="brand">{book.category}</Badge>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted">{book.publisher || '—'}</td>
                  <td className="px-6 py-4">
                    <AvailabilityBar
                      available={book.available_copies}
                      total={book.total_copies}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end opacity-60 transition-opacity group-hover:opacity-100">
                      {rowActions(book)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- form */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit book' : 'Add a book'}
        description={
          editing
            ? 'Changing the copy count keeps issued copies accounted for.'
            : 'New copies land on the shelf immediately and can be issued right away.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Title" required error={errors.title}>
            <input
              className={`input ${errors.title ? 'input-error' : ''}`}
              value={form.title}
              onChange={setValue('title')}
              placeholder="e.g. Introduction to Algorithms"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author" required error={errors.author}>
              <input
                className={`input ${errors.author ? 'input-error' : ''}`}
                value={form.author}
                onChange={setValue('author')}
                placeholder="e.g. Thomas H. Cormen"
              />
            </Field>
            <Field label="ISBN" required error={errors.isbn}>
              <input
                className={`input font-mono ${errors.isbn ? 'input-error' : ''}`}
                value={form.isbn}
                onChange={setValue('isbn')}
                placeholder="978-0262033848"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" hint="Optional — groups the collection">
              <input
                className="input"
                value={form.category}
                onChange={setValue('category')}
                placeholder="e.g. Computer Science"
                list="book-categories"
              />
              <datalist id="book-categories">
                {[...new Set(books.map((book) => book.category).filter(Boolean))].map(
                  (name) => (
                    <option key={name} value={name} />
                  )
                )}
              </datalist>
            </Field>
            <Field label="Publisher" hint="Optional">
              <input
                className="input"
                value={form.publisher}
                onChange={setValue('publisher')}
                placeholder="e.g. MIT Press"
              />
            </Field>
          </div>

          <Field
            label="Total copies"
            required
            error={errors.total_copies}
            hint={
              editing
                ? `${editing.total_copies - editing.available_copies} copy(ies) currently issued`
                : undefined
            }
          >
            <input
              type="number"
              min="1"
              max="999"
              className={`input ${errors.total_copies ? 'input-error' : ''}`}
              value={form.total_copies}
              onChange={setValue('total_copies')}
            />
          </Field>

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
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add to catalogue'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete book"
        message={`“${confirming?.title}” and all its copies will be removed from the catalogue permanently.`}
      />
    </div>
  )
}
