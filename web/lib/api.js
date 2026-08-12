/**
 * Thin fetch wrapper around this app's own API routes (app/api/**).
 *
 * The browser always calls the relative `/api` path, so requests are
 * same-origin: no CORS hop and no URL baked into the bundle. Set
 * NEXT_PUBLIC_API_URL to call a different API instead (it must end in `/api`).
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE}${path}`

  if (params) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value)
      }
    }
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0
    )
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status
    )
  }

  return data
}

export const studentService = {
  getAll: (search) => request('/students', { params: { search } }),
  getById: (id) => request(`/students/${id}`),
  create: (data) => request('/students', { method: 'POST', body: data }),
  update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/students/${id}`, { method: 'DELETE' }),
}

export const bookService = {
  getAll: (search) => request('/books', { params: { search } }),
  getById: (id) => request(`/books/${id}`),
  create: (data) => request('/books', { method: 'POST', body: data }),
  update: (id, data) => request(`/books/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/books/${id}`, { method: 'DELETE' }),
}

export const transactionService = {
  getAll: (status, student_id) => request('/transactions', { params: { status, student_id } }),
  issue: (data) => request('/transactions/issue', { method: 'POST', body: data }),
  returnBook: (transaction_id) =>
    request('/transactions/return', { method: 'POST', body: { transaction_id } }),
}

export const reportService = {
  overview: () => request('/reports/overview'),
  students: () => request('/reports/students'),
  books: () => request('/reports/books'),
}

export const healthService = {
  check: () => request('/health'),
}
