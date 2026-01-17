# Setup Instructions

## Quick Start

### Option 1: Using PowerShell Scripts (Windows)

1. **Start Backend Server:**
   ```powershell
   .\start-backend.ps1
   ```
   This will:
   - Install dependencies if needed
   - Create .env file if it doesn't exist
   - Start the backend server on port 5000

2. **Start Frontend Server (in a new terminal):**
   ```powershell
   .\start-frontend.ps1
   ```
   This will:
   - Install dependencies if needed
   - Start the frontend development server on port 3000

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file (copy from env.example):
```bash
copy env.example .env
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

#### Frontend Setup

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

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Database

The SQLite database (`library.db`) will be automatically created in the backend directory when you first start the server.

## Features Available

1. **Dashboard** - Overview of library statistics
2. **Students** - Manage student records (Add, Edit, Delete, Search)
3. **Books** - Manage book records (Add, Edit, Delete, Search)
4. **Transactions** - Issue and return books with automatic fine calculation
5. **Reports** - Generate and export reports for students and books

