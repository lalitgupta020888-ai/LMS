import { useEffect, useState } from 'react'
import { reportService } from '../services/api'

const Dashboard = () => {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const response = await reportService.getOverview()
      setOverview(response.data)
    } catch (error) {
      console.error('📊 Error fetching overview:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Students',
      value: overview?.total_students || 0,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Books',
      value: overview?.total_books || 0,
      icon: '📚',
      color: 'bg-green-500'
    },
    {
      title: 'Books Issued',
      value: overview?.total_issued || 0,
      icon: '📖',
      color: 'bg-yellow-500'
    },
    {
      title: 'Books Returned',
      value: overview?.total_returned || 0,
      icon: '✅',
      color: 'bg-purple-500'
    },
    {
      title: 'Total Fine Collected',
      value: `₹${overview?.total_fine || 0}`,
      icon: '💰',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to Library Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3 text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/students"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold text-gray-900">Add Student</div>
            <div className="text-sm text-gray-600">Register new student</div>
          </a>
          <a
            href="/books"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="font-semibold text-gray-900">Add Book</div>
            <div className="text-sm text-gray-600">Add new book to library</div>
          </a>
          <a
            href="/transactions"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">📖</div>
            <div className="font-semibold text-gray-900">Issue Book</div>
            <div className="text-sm text-gray-600">Issue book to student</div>
          </a>
          <a
            href="/reports"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-gray-900">View Reports</div>
            <div className="text-sm text-gray-600">Generate reports</div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

