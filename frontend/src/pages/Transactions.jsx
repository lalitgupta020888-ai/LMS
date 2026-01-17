import { useEffect, useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { transactionService, studentService, bookService } from '../services/api'

const issueSchema = Yup.object().shape({
  student_id: Yup.string().required('Student ID is required'),
  book_id: Yup.number().required('Book is required'),
  due_days: Yup.number().min(1, 'Must be at least 1').max(90, 'Cannot exceed 90 days').required('Due days is required')
})

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [students, setStudents] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchTransactions()
    fetchStudents()
    fetchBooks()
  }, [filterStatus])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await transactionService.getAll(filterStatus || undefined)
      setTransactions(response.data)
    } catch (error) {
      console.error('📖 Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await studentService.getAll()
      setStudents(response.data)
    } catch (error) {
      console.error('👥 Error fetching students:', error)
      setStudents([])
    }
  }

  const fetchBooks = async () => {
    try {
      const response = await bookService.getAll()
      setBooks(response.data.filter(book => book.available_copies > 0))
    } catch (error) {
      console.error('📚 Error fetching books:', error)
      setBooks([])
    }
  }

  const handleIssue = async (values, { setSubmitting, resetForm }) => {
    try {
      await transactionService.issue(values)
      console.log('✅ Book issued successfully')
      fetchTransactions()
      fetchBooks()
      setShowIssueModal(false)
      resetForm()
    } catch (error) {
      console.error('❌ Error issuing book:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to issue book. Please check if backend is deployed and VITE_API_URL is configured in Vercel.'
      alert(`Error: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async (transactionId) => {
    if (window.confirm('Are you sure you want to return this book?')) {
      try {
        await transactionService.return({ transaction_id: transactionId })
        console.log('✅ Book returned successfully')
        fetchTransactions()
        fetchBooks()
      } catch (error) {
        console.error('❌ Error returning book:', error)
        alert(error.response?.data?.error || 'Failed to return book')
      }
    }
  }

  const getStatusBadge = (status, dueDate) => {
    if (status === 'returned') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Returned</span>
    }
    
    const today = new Date()
    const due = new Date(dueDate)
    const isOverdue = today > due

    if (isOverdue) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>
    }
    
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Issued</span>
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">Manage book issues and returns</p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Issue Book
        </button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Transactions</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Issue Book</h2>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <Formik
              initialValues={{
                student_id: '',
                book_id: '',
                due_days: 14
              }}
              validationSchema={issueSchema}
              onSubmit={handleIssue}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student *
                    </label>
                    <Field
                      name="student_id"
                      as="select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.student_id}>
                          {student.student_id} - {student.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="student_id" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Book *
                    </label>
                    <Field
                      name="book_id"
                      as="select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Book</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} by {book.author} (Available: {book.available_copies})
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="book_id" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Days *
                    </label>
                    <Field
                      name="due_days"
                      type="number"
                      min="1"
                      max="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <ErrorMessage name="due_days" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Issuing...' : 'Issue Book'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowIssueModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.student_name}</div>
                        <div className="text-sm text-gray-500">{transaction.student_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{transaction.book_title}</div>
                        <div className="text-sm text-gray-500">{transaction.book_author}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.return_date ? new Date(transaction.return_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status, transaction.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{transaction.fine_amount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {transaction.status === 'issued' && (
                          <button
                            onClick={() => handleReturn(transaction.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Return
                          </button>
                        )}
                        {transaction.status === 'returned' && (
                          <span className="text-gray-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions

