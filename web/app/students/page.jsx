'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookMarked,
  Download,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  TableSkeleton,
} from '@/components/ui'
import { useToast } from '@/components/providers'
import { studentService, transactionService } from '@/lib/api'
import { downloadCsv, formatDate } from '@/lib/format'

const EMPTY_FORM = {
  student_id: '',
  name: '',
  email: '',
  phone: '',
  course: '',
  year: '',
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Postgraduate']

function validate(values) {
  const errors = {}
  if (!values.student_id.trim()) errors.student_id = 'Student ID is required'
  if (!values.name.trim()) errors.name = 'Name is required'
  else if (values.name.trim().length < 2) errors.name = 'Name is too short'
  if (!values.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address'
  if (values.phone && !/^[\d\s+()-]{7,15}$/.test(values.phone.trim()))
    errors.phone = 'Enter a valid phone number'
  return errors
}

export default function StudentsPage() {
  const toast = useToast()
  const [students, setStudents] = useState([])
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
      const [studentData, loanData] = await Promise.all([
        studentService.getAll(),
        transactionService.getAll('issued'),
      ])
      setStudents(studentData || [])
      setLoans(loanData || [])
    } catch (error) {
      toast(error.message, 'error', 'Could not load students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  // The command palette links here with ?new=1 to open the form directly.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new')) {
      openCreate()
      window.history.replaceState(null, '', '/students')
    }
  }, [])

  /** student_id -> number of books currently on loan. */
  const loanCounts = useMemo(() => {
    const counts = new Map()
    for (const loan of loans) {
      counts.set(loan.student_id, (counts.get(loan.student_id) || 0) + 1)
    }
    return counts
  }, [loans])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return students
    return students.filter((student) =>
      [student.name, student.student_id, student.email, student.course]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    )
  }, [students, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(student) {
    setEditing(student)
    setForm({
      student_id: student.student_id || '',
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      course: student.course || '',
      year: student.year || '',
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
      student_id: form.student_id.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      course: form.course.trim() || null,
      year: form.year || null,
    }

    try {
      setSaving(true)
      if (editing) {
        await studentService.update(editing.id, payload)
        toast(`${payload.name}'s record was updated.`, 'success', 'Saved')
      } else {
        await studentService.create(payload)
        toast(`${payload.name} is now enrolled.`, 'success', 'Student added')
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
      await studentService.remove(confirming.id)
      toast(`${confirming.name} was removed.`, 'success', 'Student deleted')
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
      'students.csv',
      [
        { header: 'Student ID', value: (row) => row.student_id },
        { header: 'Name', value: (row) => row.name },
        { header: 'Email', value: (row) => row.email },
        { header: 'Phone', value: (row) => row.phone },
        { header: 'Course', value: (row) => row.course },
        { header: 'Year', value: (row) => row.year },
        { header: 'On loan', value: (row) => loanCounts.get(row.student_id) || 0 },
        { header: 'Enrolled', value: (row) => formatDate(row.created_at) },
      ],
      filtered
    )
    toast(`${filtered.length} rows exported.`, 'success', 'CSV downloaded')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Members"
        title="Students"
        subtitle="Everyone who can borrow from your library, with their live loan count."
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
              <UserPlus className="h-4 w-4" /> Enrol student
            </button>
          </>
        }
      />

      <div className="card animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-col gap-3 border-b border-hairline/10 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, ID, email or course…"
          />
          <p className="text-xs text-faint sm:ml-auto">
            {filtered.length} of {students.length} students
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'No students match that search' : 'No students yet'}
            message={
              search
                ? 'Try a different name, ID or course.'
                : 'Enrol your first member to start issuing books.'
            }
            action={
              !search && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Enrol student
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline/10 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                    Student
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                    Programme
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-faint">
                    On loan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/10">
                {filtered.map((student, index) => {
                  const onLoan = loanCounts.get(student.student_id) || 0
                  return (
                    <tr
                      key={student.id}
                      className="group animate-fade-up transition-colors hover:bg-hairline/[0.03]"
                      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{student.name}</p>
                            <p className="truncate font-mono text-xs text-faint">
                              #{student.student_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-1.5 truncate text-muted">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-faint" />
                          {student.email}
                        </p>
                        {student.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {student.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {student.course ? (
                          <>
                            <p className="flex items-center gap-1.5 text-muted">
                              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-faint" />
                              {student.course}
                            </p>
                            {student.year && (
                              <p className="mt-1 text-xs text-faint">{student.year}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {onLoan > 0 ? (
                          <Badge tone="warning">
                            <BookMarked className="h-3 w-3" />
                            {onLoan} book{onLoan > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">None</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(student)}
                            aria-label={`Edit ${student.name}`}
                            className="rounded-lg p-2 text-muted transition-colors hover:bg-brand-500/10 hover:text-brand-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirming(student)}
                            aria-label={`Delete ${student.name}`}
                            className="rounded-lg p-2 text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- form */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit student' : 'Enrol a student'}
        description={
          editing
            ? 'Update the member record. The student ID must stay unique.'
            : 'Add a new member so they can start borrowing books.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student ID" required error={errors.student_id}>
              <input
                className={`input font-mono ${errors.student_id ? 'input-error' : ''}`}
                value={form.student_id}
                onChange={setValue('student_id')}
                placeholder="e.g. 22CS041"
              />
            </Field>
            <Field label="Full name" required error={errors.name}>
              <input
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={form.name}
                onChange={setValue('name')}
                placeholder="e.g. Aarav Sharma"
              />
            </Field>
          </div>

          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              value={form.email}
              onChange={setValue('email')}
              placeholder="student@college.edu"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone} hint="Optional">
              <input
                className={`input ${errors.phone ? 'input-error' : ''}`}
                value={form.phone}
                onChange={setValue('phone')}
                placeholder="9876543210"
              />
            </Field>
            <Field label="Course" hint="Optional">
              <input
                className="input"
                value={form.course}
                onChange={setValue('course')}
                placeholder="e.g. Computer Science"
              />
            </Field>
          </div>

          <Field label="Year" hint="Optional">
            <select className="input" value={form.year} onChange={setValue('year')}>
              <option value="">Not specified</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
              {form.year && !YEARS.includes(form.year) && (
                <option value={form.year}>{form.year}</option>
              )}
            </select>
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
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Enrol student'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete student"
        message={`${confirming?.name} will be removed permanently. Any loan history tied to this student ID stays in the transaction log.`}
      />
    </div>
  )
}
