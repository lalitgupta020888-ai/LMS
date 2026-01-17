const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      console.error('❌ Error enabling foreign keys:', err);
    } else {
      console.log('✅ Foreign keys enabled');
    }
  });
  
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    course TEXT,
    year TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,
    publisher TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'issued',
    fine_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  )`);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Library Management System API is running' });
});

app.get('/api/students', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM students';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR student_id LIKE ? OR email LIKE ?';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(row);
  });
});

app.post('/api/students', (req, res) => {
  const { student_id, name, email, phone, course, year } = req.body;

  if (!student_id || !name || !email) {
    return res.status(400).json({ error: 'Student ID, name, and email are required' });
  }

  db.run(
    'INSERT INTO students (student_id, name, email, phone, course, year) VALUES (?, ?, ?, ?, ?, ?)',
    [student_id, name, email, phone || null, course || null, year || null],
    function(err) {
      if (err) {
        console.error('❌ Error inserting student:', err);
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Student ID already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      console.log('✅ Student added successfully, ID:', this.lastID);
      res.status(201).json({ id: this.lastID, message: 'Student added successfully' });
    }
  );
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { student_id, name, email, phone, course, year } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.run(
    'UPDATE students SET student_id = ?, name = ?, email = ?, phone = ?, course = ?, year = ? WHERE id = ?',
    [student_id, name, email, phone || null, course || null, year || null, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json({ message: 'Student updated successfully' });
    }
  );
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  });
});

app.get('/api/books', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM books';
  const params = [];

  if (search) {
    query += ' WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ?';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(row);
  });
});

app.post('/api/books', (req, res) => {
  const { isbn, title, author, category, publisher, total_copies } = req.body;

  if (!isbn || !title || !author) {
    return res.status(400).json({ error: 'ISBN, title, and author are required' });
  }

  const copies = total_copies || 1;

  db.run(
    'INSERT INTO books (isbn, title, author, category, publisher, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [isbn, title, author, category || null, publisher || null, copies, copies],
    function(err) {
      if (err) {
        console.error('❌ Error inserting book:', err);
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'ISBN already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      console.log('✅ Book added successfully, ID:', this.lastID);
      res.status(201).json({ id: this.lastID, message: 'Book added successfully' });
    }
  );
});

app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { isbn, title, author, category, publisher, total_copies } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  db.get('SELECT total_copies, available_copies FROM books WHERE id = ?', [id], (err, book) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const newTotal = total_copies || book.total_copies;
    const issuedCopies = book.total_copies - book.available_copies;
    const newAvailable = Math.max(0, newTotal - issuedCopies);

    db.run(
      'UPDATE books SET isbn = ?, title = ?, author = ?, category = ?, publisher = ?, total_copies = ?, available_copies = ? WHERE id = ?',
      [isbn, title, author, category || null, publisher || null, newTotal, newAvailable, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Book updated successfully' });
      }
    );
  });
});

app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  });
});

app.get('/api/transactions', (req, res) => {
  const { status, student_id } = req.query;
  let query = `
    SELECT t.*, s.name as student_name, s.email as student_email, 
           b.title as book_title, b.author as book_author, b.isbn
    FROM transactions t
    JOIN students s ON t.student_id = s.student_id
    JOIN books b ON t.book_id = b.id
  `;
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('t.status = ?');
    params.push(status);
  }

  if (student_id) {
    conditions.push('t.student_id = ?');
    params.push(student_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY t.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/transactions/issue', (req, res) => {
  const { student_id, book_id, due_days } = req.body;

  if (!student_id || !book_id) {
    return res.status(400).json({ error: 'Student ID and Book ID are required' });
  }

  db.get('SELECT * FROM students WHERE student_id = ?', [student_id], (err, student) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    db.get('SELECT * FROM books WHERE id = ?', [book_id], (err, book) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      if (book.available_copies <= 0) {
        return res.status(400).json({ error: 'Book is not available' });
      }

      const issueDate = new Date().toISOString().split('T')[0];
      const days = due_days || 14;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      db.run(
        'INSERT INTO transactions (student_id, book_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
        [student_id, book_id, issueDate, dueDateStr, 'issued'],
        function(err) {
          if (err) {
            console.error('❌ Error inserting transaction:', err);
            return res.status(500).json({ error: err.message });
          }

          const transactionId = this.lastID;

          db.run(
            'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
            [book_id],
            function(err) {
              if (err) {
                console.error('❌ Error updating book copies:', err);
                return res.status(500).json({ error: err.message });
              }
              console.log('✅ Book issued successfully, Transaction ID:', transactionId);
              res.status(201).json({ id: transactionId, message: 'Book issued successfully' });
            }
          );
        }
      );
    });
  });
});

app.post('/api/transactions/return', (req, res) => {
  const { transaction_id } = req.body;

  if (!transaction_id) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  db.get('SELECT * FROM transactions WHERE id = ? AND status = ?', [transaction_id, 'issued'], (err, transaction) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found or already returned' });
    }

    const returnDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(transaction.due_date);
    const returnDateObj = new Date(returnDate);
    let fineAmount = 0;

    if (returnDateObj > dueDate) {
      const daysLate = Math.ceil((returnDateObj - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysLate * 10;
    }

    db.run(
      'UPDATE transactions SET return_date = ?, status = ?, fine_amount = ? WHERE id = ?',
      [returnDate, 'returned', fineAmount, transaction_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.run(
          'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
          [transaction.book_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Book returned successfully', fine_amount: fineAmount });
          }
        );
      }
    );
  });
});

app.get('/api/reports/overview', (req, res) => {
  const queries = {
    total_students: 'SELECT COUNT(*) as count FROM students',
    total_books: 'SELECT COUNT(*) as count FROM books',
    total_issued: 'SELECT COUNT(*) as count FROM transactions WHERE status = ?',
    total_returned: 'SELECT COUNT(*) as count FROM transactions WHERE status = ?',
    total_fine: 'SELECT SUM(fine_amount) as total FROM transactions WHERE status = ?'
  };

  const results = {};

  db.get(queries.total_students, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    results.total_students = row.count;

    db.get(queries.total_books, [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      results.total_books = row.count;

      db.get(queries.total_issued, ['issued'], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        results.total_issued = row.count;

        db.get(queries.total_returned, ['returned'], (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          results.total_returned = row.count;

          db.get(queries.total_fine, ['returned'], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            results.total_fine = row.total || 0;
            res.json(results);
          });
        });
      });
    });
  });
});

app.get('/api/reports/students', (req, res) => {
  const query = `
    SELECT s.*, 
           COUNT(t.id) as total_books_issued,
           COUNT(CASE WHEN t.status = 'issued' THEN 1 END) as currently_issued
    FROM students s
    LEFT JOIN transactions t ON s.student_id = t.student_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/reports/books', (req, res) => {
  const query = `
    SELECT b.*, 
           COUNT(t.id) as total_issues,
           COUNT(CASE WHEN t.status = 'issued' THEN 1 END) as currently_issued
    FROM books b
    LEFT JOIN transactions t ON b.id = t.book_id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`📚 Library Management System API running on port ${PORT}`);
});

