const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const db = new sqlite3.Database('./notes.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      isDeleted INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating notes table:', err);
    else {
      // Create default users if they don't exist
      createDefaultUsers();
    }
  });
}

// Create default users
function createDefaultUsers() {
  db.run('INSERT OR IGNORE INTO users (username, role) VALUES (?, ?)', 
    ['admin', 'admin'], 
    (err) => {
      if (err) console.error('Error creating admin user:', err);
      else console.log('Admin user ready');
    }
  );

  db.run('INSERT OR IGNORE INTO users (username, role) VALUES (?, ?)', 
    ['user1', 'user'], 
    (err) => {
      if (err) console.error('Error creating user1:', err);
      else console.log('User1 ready');
    }
  );

  db.run('INSERT OR IGNORE INTO users (username, role) VALUES (?, ?)', 
    ['user2', 'user'], 
    (err) => {
      if (err) console.error('Error creating user2:', err);
      else console.log('User2 ready');
    }
  );
}

// API Routes

// Get all notes with pagination and search
app.get('/api/notes', (req, res) => {
  const { page = 1, limit = 10, search = '', userId = 1, role = 'user' } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM notes WHERE isDeleted = 0';
  let countQuery = 'SELECT COUNT(*) as total FROM notes WHERE isDeleted = 0';

  // Role-based access
  if (role !== 'admin') {
    query += ` AND userId = ${userId}`;
    countQuery += ` AND userId = ${userId}`;
  }

  // Search filter
  if (search) {
    query += ` AND (title LIKE '%${search}%' OR content LIKE '%${search}%')`;
    countQuery += ` AND (title LIKE '%${search}%' OR content LIKE '%${search}%')`;
  }

  // Add ordering and pagination
  query += ` ORDER BY updatedAt DESC LIMIT ${limit} OFFSET ${offset}`;

  db.all(query, (err, notes) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.get(countQuery, (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        notes,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / limit)
      });
    });
  });
});

// Create a new note
app.post('/api/notes', (req, res) => {
  const { title, content, userId = 1 } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const query = 'INSERT INTO notes (userId, title, content) VALUES (?, ?, ?)';
  
  db.run(query, [userId, title, content || ''], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const newNote = { id: this.lastID, userId, title, content: content || '', isDeleted: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    res.status(201).json(newNote);

    // Emit WebSocket event to all connected clients
    io.emit('noteCreated', newNote);
  });
});

// Update a note
app.put('/api/notes/:id', (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const query = 'UPDATE notes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND isDeleted = 0';
  
  db.run(query, [title, content || '', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Fetch updated note
    db.get('SELECT * FROM notes WHERE id = ?', [id], (err, note) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json(note);

      // Emit WebSocket event
      io.emit('noteUpdated', note);
    });
  });
});

// Soft delete a note
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;

  const query = 'UPDATE notes SET isDeleted = 1 WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ message: 'Note deleted successfully' });

    // Emit WebSocket event
    io.emit('noteDeleted', { id: parseInt(id) });
  });
});

// Restore a soft-deleted note (admin only)
app.post('/api/notes/:id/restore', (req, res) => {
  const { id } = req.params;
  const { role = 'user' } = req.body;

  if (role !== 'admin') {
    res.status(403).json({ error: 'Only admins can restore notes' });
    return;
  }

  const query = 'UPDATE notes SET isDeleted = 0 WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    db.get('SELECT * FROM notes WHERE id = ?', [id], (err, note) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json(note);
      io.emit('noteRestored', note);
    });
  });
});

// Get user info
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT id, username, role FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  });
});

// WebSocket Events
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Real-time note creation
  socket.on('createNote', (data) => {
    const { title, content, userId } = data;
    
    db.run('INSERT INTO notes (userId, title, content) VALUES (?, ?, ?)', 
      [userId, title, content], 
      function(err) {
        if (err) {
          socket.emit('error', { message: 'Failed to create note' });
          return;
        }

        const newNote = {
          id: this.lastID,
          userId,
          title,
          content,
          isDeleted: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        io.emit('noteCreated', newNote);
      }
    );
  });

  // Real-time note update
  socket.on('updateNote', (data) => {
    const { id, title, content } = data;

    db.run('UPDATE notes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', 
      [title, content, id], 
      function(err) {
        if (err) {
          socket.emit('error', { message: 'Failed to update note' });
          return;
        }

        db.get('SELECT * FROM notes WHERE id = ?', [id], (err, note) => {
          if (note) {
            io.emit('noteUpdated', note);
          }
        });
      }
    );
  });

  // Real-time note deletion
  socket.on('deleteNote', (data) => {
    const { id } = data;

    db.run('UPDATE notes SET isDeleted = 1 WHERE id = ?', [id], function(err) {
      if (err) {
        socket.emit('error', { message: 'Failed to delete note' });
        return;
      }

      io.emit('noteDeleted', { id });
    });
  });

  // Join user room for filtered updates
  socket.on('joinUserRoom', (data) => {
    const { userId } = data;
    socket.join(`user-${userId}`);
    socket.emit('joinedRoom', { room: `user-${userId}` });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Database: ./notes.db');
  console.log('\nDefault Users:');
  console.log('- admin (admin)');
  console.log('- user1 (user)');
  console.log('- user2 (user)');
});
