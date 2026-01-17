import axios from 'axios'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  return '/api'
}

const baseURL = getBaseURL()
console.log('🔗 API Base URL:', baseURL)

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your internet connection or backend server.'
    } else if (error.message === 'Network Error' || !error.response) {
      error.message = 'Cannot connect to backend server. Please ensure the backend is deployed and VITE_API_URL is set correctly in Vercel environment variables.'
    } else if (error.response?.status === 404) {
      error.message = 'API endpoint not found. Please check the backend URL configuration.'
    }
    
    return Promise.reject(error)
  }
)

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

