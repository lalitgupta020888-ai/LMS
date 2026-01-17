# Library Management System

A comprehensive Library Management System built with React and Node.js for managing student records, books, and transactions.

## Features

- ✅ Integration of all records of students
- ✅ Manage records systematically
- ✅ Track any information online
- ✅ Generate reports
- ✅ Manage all information online
- ✅ Easy to maintain records
- ✅ Fast book entry

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Formik & Yup (Form handling & validation)
- Axios (API calls)
- TailwindCSS (Styling)
- Vite (Build tool)

### Backend
- Node.js
- Express.js
- SQLite3 (Database)
- CORS

## Project Structure

```
LMS/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation & Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Students
- `GET /api/students` - Get all students (with optional search)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Books
- `GET /api/books` - Get all books (with optional search)
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Transactions
- `GET /api/transactions` - Get all transactions (with optional filters)
- `POST /api/transactions/issue` - Issue a book
- `POST /api/transactions/return` - Return a book

### Reports
- `GET /api/reports/overview` - Get overview statistics
- `GET /api/reports/students` - Get students report
- `GET /api/reports/books` - Get books report

## Usage

1. **Students Management**: Add, edit, delete, and search student records
2. **Books Management**: Add, edit, delete, and search book records
3. **Transactions**: Issue books to students and track returns with automatic fine calculation
4. **Reports**: View overview statistics and generate detailed reports for students and books

## Database

The system uses SQLite database which is automatically created when the backend server starts. The database file `library.db` will be created in the backend directory.

## Notes

- Make sure both backend and frontend servers are running
- The frontend is configured to proxy API requests to the backend
- All forms use Formik and Yup for validation
- The UI is fully responsive and works on all screen sizes

