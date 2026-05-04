# 🚀 Real-Time Notes App with Advanced Features

A modern, real-time note-taking application built with Node.js, Express, Socket.io, and SQLite.

## ✨ Features

### 1. **Real-Time Updates** 🔄
- WebSocket connection via Socket.io
- Live updates across all connected tabs/devices
- Instant sync of note creation, updates, and deletions
- Real-time activity feed showing all changes

### 2. **Debounced Search** 🔍
- Optimized search with 300ms debounce
- Prevents excessive API calls during typing
- Shows loading indicator while searching
- Search filters by title and content

### 3. **Pagination & Infinite Scroll** 📄
- Traditional pagination (10 notes per page)
- Navigate between pages easily
- Shows total count and page information
- Can be extended with infinite scroll functionality

### 4. **Role-Based Access Control** 👥
- **Admin User**: Can view all notes and restore deleted ones
- **Regular Users**: Can only see their own notes
- Switch between users/admin in the UI
- Different permissions for different operations

### 5. **Soft Delete** 🗑️
- Notes are soft-deleted (not permanently removed)
- Admin users can restore deleted notes
- Trash view shows all deleted notes (admin only)
- Data recovery is always possible

## 🏗️ Project Structure

```
real time updates/
├── server/
│   └── server.js           # Express server + Socket.io + Database
├── public/
│   ├── index.html          # Frontend HTML
│   ├── style.css           # Modern UI styling
│   └── script.js           # Frontend logic + WebSocket
├── package.json            # Dependencies
├── .env                    # Environment variables
├── notes.db                # SQLite database (auto-created)
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Navigate to the project directory:
```bash
cd "c:\Users\hp\OneDrive\Desktop\real time updates"
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 👥 Default Users

The application comes with 3 default users:

1. **Admin** - Full permissions (view all notes, restore deleted)
   - Select: "👑 Admin"
   - Can see all users' notes
   - Can restore deleted notes

2. **User 1** - Regular user
   - Select: "👤 User 1"
   - Can only see their own notes

3. **User 2** - Regular user
   - Select: "👤 User 2"
   - Can only see their own notes

## 🎮 How to Use

### Creating Notes
- Click "Create New Note" button or press `Ctrl+N`
- Enter a title (required)
- Type your content
- Auto-saves every second

### Searching Notes
- Use the search bar to filter by title or content
- Search is debounced to avoid excessive API calls
- Loading indicator shows search in progress

### Pagination
- Use Previous/Next buttons to navigate
- Shows current page and total notes
- Buttons are disabled at boundaries

### Deleting Notes
- Click the delete button on any note
- Note is soft-deleted (recoverable)
- Admin users can restore from trash

### Real-Time Updates
- Open the app in multiple tabs
- Create/edit/delete notes in one tab
- See instant updates in all other tabs
- Activity feed shows all changes

### User Switching
- Select a different user from the dropdown
- Your view updates to show only that user's notes (if regular user)
- As admin, you see all notes

## 🔌 API Endpoints

### GET `/api/notes`
Get paginated notes with optional search
- Query params: `page`, `limit`, `search`, `userId`, `role`
- Returns: Notes array with pagination info

### POST `/api/notes`
Create a new note
- Body: `{ title, content, userId }`
- Returns: Created note object

### PUT `/api/notes/:id`
Update a note
- Body: `{ title, content }`
- Returns: Updated note object

### DELETE `/api/notes/:id`
Soft-delete a note
- Returns: Success message

### POST `/api/notes/:id/restore`
Restore a deleted note (admin only)
- Body: `{ role }`
- Returns: Restored note object

## 🔌 WebSocket Events

### Client → Server
- `createNote` - Create a new note
- `updateNote` - Update an existing note
- `deleteNote` - Soft-delete a note
- `joinUserRoom` - Join a user-specific room

### Server → Client
- `noteCreated` - New note was created
- `noteUpdated` - Note was updated
- `noteDeleted` - Note was deleted
- `noteRestored` - Deleted note was restored
- `error` - An error occurred

## ⌨️ Keyboard Shortcuts

- `Ctrl+N` / `Cmd+N` - Create new note
- `Ctrl+S` / `Cmd+S` - Save note
- `Ctrl+/` / `Cmd+/` - Focus search bar

## 🎨 UI Features

- **Dark Mode**: Modern dark theme with accent colors
- **Responsive Design**: Works on desktop and mobile
- **Real-time Activity Feed**: Shows all changes
- **Connection Status**: Indicates WebSocket connection
- **Character & Word Count**: Shows note statistics
- **Last Updated Time**: Displays when note was last modified
- **Toast Notifications**: User feedback for actions

## 🔒 Security Considerations

This is a demo application. For production:
- Add proper authentication (JWT, OAuth)
- Implement rate limiting
- Add input validation and sanitization
- Use HTTPS for WebSocket connections
- Add database backups
- Implement proper error handling
- Add CORS restrictions

## 📊 Database Schema

### users table
```
id (INTEGER PRIMARY KEY)
username (TEXT UNIQUE)
role (TEXT) - 'admin' or 'user'
createdAt (DATETIME)
```

### notes table
```
id (INTEGER PRIMARY KEY)
userId (INTEGER FOREIGN KEY)
title (TEXT)
content (TEXT)
isDeleted (INTEGER) - 0 or 1 for soft delete
createdAt (DATETIME)
updatedAt (DATETIME)
```

## 🛠️ Development

### Running with auto-reload
```bash
npm run dev
```

This uses nodemon to automatically restart the server on file changes.

### Database Reset
Delete `notes.db` and restart the server to reset the database.

## 📈 Performance Optimizations

1. **Debounced Search**: 300ms delay prevents excessive API calls
2. **Pagination**: Loads only 10 notes per page
3. **Soft Deletes**: Archival instead of permanent deletion
4. **WebSocket**: Real-time updates without polling
5. **Indexed Queries**: Database queries optimized for speed

## 🐛 Troubleshooting

### Connection Issues
- Ensure server is running on port 3000
- Check browser console for errors
- Verify WebSocket connection in DevTools

### Database Locked
- Close all connections and restart the server
- Delete `notes.db` and restart to reset

### Port Already in Use
- Change PORT in .env file
- Or kill process on port 3000

## 📝 Future Enhancements

- [ ] User authentication system
- [ ] Note categories/tags
- [ ] Sharing and collaboration
- [ ] Rich text editor
- [ ] Note templates
- [ ] Export as PDF
- [ ] Cloud sync
- [ ] Mobile app
- [ ] End-to-end encryption

## 📄 License

MIT License - Feel free to use this project as you wish!

## 👤 Author

Created as a demonstration of modern web development with real-time features.

---

**Happy Note-Taking!** 📝✨
