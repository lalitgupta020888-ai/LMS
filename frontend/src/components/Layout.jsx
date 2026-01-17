import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const Layout = ({ children }) => {
  const location = useLocation()
  const [showApiWarning, setShowApiWarning] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    const checkApiConfig = async () => {
      if (import.meta.env.PROD) {
        const apiUrl = import.meta.env.VITE_API_URL
        if (!apiUrl || apiUrl === '/api') {
          setShowApiWarning(true)
          setApiStatus('not-configured')
        } else {
          setApiStatus('configured')
          setShowApiWarning(false)
        }
      } else {
        setApiStatus('dev-mode')
        setShowApiWarning(false)
      }
    }
    
    checkApiConfig()
  }, [])

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showApiWarning && (
        <div className="bg-red-600 text-white px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-bold text-lg">Backend API Not Configured!</span>
                </div>
                <div className="text-sm space-y-2 ml-8">
                  <p className="font-semibold">Quick Fix (3 Steps):</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Deploy backend on <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="underline font-bold">Railway.app</a> (Root: <code className="bg-red-700 px-1 rounded">backend</code>)</li>
                    <li>Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-bold">Vercel Dashboard</a> → Settings → Environment Variables</li>
                    <li>Add: <code className="bg-red-700 px-1 rounded">VITE_API_URL</code> = <code className="bg-red-700 px-1 rounded">https://your-backend.railway.app/api</code></li>
                    <li>Redeploy your Vercel project</li>
                  </ol>
                  <p className="mt-2 text-xs opacity-90">📖 See <code className="bg-red-700 px-1 rounded">QUICK_FIX.md</code> for detailed instructions</p>
                  <div className="mt-3 p-2 bg-red-700 rounded text-xs">
                    <strong>Current Status:</strong> API URL is set to <code className="bg-red-800 px-1 rounded">/api</code> which doesn't exist in production. 
                    You must set <code className="bg-red-800 px-1 rounded">VITE_API_URL</code> environment variable in Vercel.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowApiWarning(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold flex-shrink-0"
                aria-label="Close"
                title="Dismiss warning"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">📚 LMS</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/')} ${
                    location.pathname === '/' ? 'border-blue-500' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/students"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/students')} ${
                    location.pathname === '/students' ? 'border-blue-500' : ''
                  }`}
                >
                  Students
                </Link>
                <Link
                  to="/books"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/books')} ${
                    location.pathname === '/books' ? 'border-blue-500' : ''
                  }`}
                >
                  Books
                </Link>
                <Link
                  to="/transactions"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/transactions')} ${
                    location.pathname === '/transactions' ? 'border-blue-500' : ''
                  }`}
                >
                  Transactions
                </Link>
                <Link
                  to="/reports"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/reports')} ${
                    location.pathname === '/reports' ? 'border-blue-500' : ''
                  }`}
                >
                  Reports
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/')} ${
                location.pathname === '/' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/students"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/students')} ${
                location.pathname === '/students' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              Students
            </Link>
            <Link
              to="/books"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/books')} ${
                location.pathname === '/books' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              Books
            </Link>
            <Link
              to="/transactions"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/transactions')} ${
                location.pathname === '/transactions' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              Transactions
            </Link>
            <Link
              to="/reports"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/reports')} ${
                location.pathname === '/reports' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              Reports
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout

