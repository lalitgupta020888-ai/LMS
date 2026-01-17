import { Link, useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

