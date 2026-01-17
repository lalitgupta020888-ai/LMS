import axios from 'axios'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  if (import.meta.env.PROD) {
    console.error('❌ VITE_API_URL is not set in production!')
    console.error('📝 Please set VITE_API_URL in Vercel Environment Variables')
    console.error('🔗 Go to: Vercel Dashboard → Settings → Environment Variables')
    console.error('💡 Add: VITE_API_URL = https://your-backend-url.railway.app/api')
  }
  
  return '/api'
}

const baseURL = getBaseURL()
console.log('🔗 API Base URL:', baseURL)

if (import.meta.env.PROD && baseURL === '/api') {
  console.error('❌❌❌ CRITICAL ERROR ❌❌❌')
  console.error('⚠️ VITE_API_URL is NOT set in Vercel!')
  console.error('⚠️ This will cause ALL API calls to fail with 404 errors!')
  console.error('')
  console.error('📝 QUICK FIX:')
  console.error('1. Deploy backend on Railway: https://railway.app')
  console.error('2. Go to Vercel Dashboard → Settings → Environment Variables')
  console.error('3. Add: VITE_API_URL = https://your-backend.railway.app/api')
  console.error('4. Redeploy your Vercel project')
  console.error('')
  console.error('📖 See QUICK_FIX.md for detailed instructions')
}

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
      if (baseURL === '/api' && import.meta.env.PROD) {
        error.message = '404 Error: Backend not configured. Please set VITE_API_URL in Vercel Environment Variables. See VERCEL_DEPLOY.md for instructions.'
      } else {
        error.message = 'API endpoint not found (404). Please check the backend URL configuration. Make sure VITE_API_URL includes /api at the end.'
      }
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

