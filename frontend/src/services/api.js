import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const studentService = {
  getAll: (search) => api.get('/students', { params: { search } }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`)
}

export const bookService = {
  getAll: (search) => api.get('/books', { params: { search } }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`)
}

export const transactionService = {
  getAll: (status, student_id) => api.get('/transactions', { params: { status, student_id } }),
  issue: (data) => api.post('/transactions/issue', data),
  return: (data) => api.post('/transactions/return', data)
}

export const reportService = {
  getOverview: () => api.get('/reports/overview'),
  getStudents: () => api.get('/reports/students'),
  getBooks: () => api.get('/reports/books')
}

export default api

