// ==================== GLOBAL STATE ====================
const state = {
  notes: [],
  selectedNoteId: null,
  currentPage: 1,
  pageLimit: 10,
  totalNotes: 0,
  searchQuery: '',
  userId: 1,
  role: 'user',
  isViewingTrash: false,
  socket: null,
  debounceTimeout: null,
  saveTimeout: null,
  activityLog: []
};

// ==================== SOCKET.IO CONNECTION ====================
function initSocket() {
  state.socket = io();

  state.socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
    showToast('Connected to real-time updates', 'success');
    
    // Join user room
    state.socket.emit('joinUserRoom', { userId: state.userId });
  });

  state.socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
  });

  // Real-time note events
  state.socket.on('noteCreated', (note) => {
    addActivityLog(`Note created: "${note.title}"`);
    loadNotes();
    showToast('New note created!', 'info');
  });

  state.socket.on('noteUpdated', (note) => {
    if (state.selectedNoteId === note.id) {
      updateNoteInUI(note);
    } else {
      loadNotes();
    }
    addActivityLog(`Note updated: "${note.title}"`);
  });

  state.socket.on('noteDeleted', (data) => {
    if (state.selectedNoteId === data.id) {
      state.selectedNoteId = null;
      showEditor(false);
    }
    loadNotes();
    addActivityLog(`Note deleted`);
  });

  state.socket.on('noteRestored', (note) => {
    loadNotes();
    addActivityLog(`Note restored: "${note.title}"`);
  });

  state.socket.on('error', (error) => {
    showToast(error.message, 'error');
  });
}

// ==================== UI UTILITIES ====================
function updateConnectionStatus(isConnected) {
  const statusEl = document.getElementById('connectionStatus');
  if (isConnected) {
    statusEl.textContent = '● Online';
    statusEl.classList.add('online');
    statusEl.classList.remove('offline');
  } else {
    statusEl.textContent = '● Offline';
    statusEl.classList.remove('online');
    statusEl.classList.add('offline');
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function addActivityLog(activity) {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.activityLog.unshift(`${now} - ${activity}`);
  
  // Keep only last 10 activities
  if (state.activityLog.length > 10) {
    state.activityLog.pop();
  }

  const feed = document.getElementById('activityFeed');
  feed.innerHTML = state.activityLog.map(log => `<li>${log}</li>`).join('');
}

function showEditor(show) {
  document.getElementById('noSelection').style.display = show ? 'none' : 'flex';
  document.getElementById('editorView').style.display = show ? 'flex' : 'none';
}

// ==================== DEBOUNCED SEARCH ====================
function debounceSearch(query) {
  clearTimeout(state.debounceTimeout);
  
  const loadingEl = document.getElementById('searchLoading');
  loadingEl.style.display = 'inline';

  state.debounceTimeout = setTimeout(() => {
    state.searchQuery = query;
    state.currentPage = 1;
    loadNotes();
    loadingEl.style.display = 'none';
  }, 300); // 300ms debounce delay
}

// ==================== PAGINATION ====================
function updatePaginationButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');

  const totalPages = Math.ceil(state.totalNotes / state.pageLimit);
  
  prevBtn.disabled = state.currentPage <= 1;
  nextBtn.disabled = state.currentPage >= totalPages;
  
  pageInfo.textContent = `Page ${state.currentPage} of ${totalPages} (${state.totalNotes} total)`;
}

function previousPage() {
  if (state.currentPage > 1) {
    state.currentPage--;
    loadNotes();
  }
}

function nextPage() {
  const totalPages = Math.ceil(state.totalNotes / state.pageLimit);
  if (state.currentPage < totalPages) {
    state.currentPage++;
    loadNotes();
  }
}

// ==================== NOTE LOADING & DISPLAY ====================
async function loadNotes() {
  try {
    const params = new URLSearchParams({
      page: state.currentPage,
      limit: state.pageLimit,
      search: state.searchQuery,
      userId: state.userId,
      role: state.role
    });

    const response = await fetch(`/api/notes?${params}`);
    const data = await response.json();

    state.notes = data.notes;
    state.totalNotes = data.total;

    renderNotesList();
    updatePaginationButtons();
  } catch (error) {
    console.error('Error loading notes:', error);
    showToast('Failed to load notes', 'error');
  }
}

function renderNotesList() {
  const notesList = document.getElementById('notesList');
  
  if (state.notes.length === 0) {
    notesList.innerHTML = '<div class="empty-state">No notes found</div>';
    return;
  }

  notesList.innerHTML = state.notes.map(note => `
    <div class="note-item ${state.selectedNoteId === note.id ? 'active' : ''}" data-id="${note.id}">
      <div class="note-item-title">${escapeHtml(note.title)}</div>
      <div class="note-item-preview">${escapeHtml(note.content || 'No content')}</div>
      <div class="note-item-time">${formatDate(note.updatedAt)}</div>
    </div>
  `).join('');

  // Add event listeners to note items
  document.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', () => selectNote(parseInt(item.dataset.id)));
  });
}

function selectNote(noteId) {
  state.selectedNoteId = noteId;
  const note = state.notes.find(n => n.id === noteId);

  if (note) {
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content || '';
    
    updateCharAndWordCount();
    renderNotesList();
    showEditor(true);
    updateLastUpdated();
    updateRestoreButton(note.isDeleted);

    // Clear any pending saves
    clearTimeout(state.saveTimeout);
  }
}

function updateNoteInUI(note) {
  if (state.selectedNoteId === note.id) {
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content || '';
    updateCharAndWordCount();
    updateLastUpdated();
  }
}

function syncSelectedNoteDraft() {
  if (!state.selectedNoteId) return;

  const note = state.notes.find(n => n.id === state.selectedNoteId);
  if (!note) return;

  note.title = document.getElementById('noteTitle').value;
  note.content = document.getElementById('noteContent').value;
  renderNotesList();
}

// ==================== NOTE OPERATIONS ====================
async function createNewNote() {
  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Note',
        content: '',
        userId: state.userId
      })
    });

    if (response.ok) {
      const note = await response.json();
      showToast('Note created successfully!', 'success');

      // Put the new note in local state immediately so the editor opens reliably.
      state.notes.unshift(note);
      state.selectedNoteId = note.id;
      renderNotesList();
      document.getElementById('noteTitle').value = note.title;
      document.getElementById('noteContent').value = note.content || '';
      updateCharAndWordCount();
      updateLastUpdated();
      updateRestoreButton(note.isDeleted);
      showEditor(true);

      await loadNotes();
    }
  } catch (error) {
    console.error('Error creating note:', error);
    showToast('Failed to create note', 'error');
  }
}

async function saveNote() {
  if (!state.selectedNoteId) return;

  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value;

  if (!title) {
    showToast('Title cannot be empty', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/notes/${state.selectedNoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    if (response.ok) {
      const updatedNote = await response.json();
      const noteIndex = state.notes.findIndex(note => note.id === updatedNote.id);
      if (noteIndex !== -1) {
        state.notes[noteIndex] = updatedNote;
      }
      renderNotesList();
      updateLastUpdated();
    } else {
      const errorData = await response.json().catch(() => ({}));
      showToast(errorData.error || 'Failed to save note', 'error');
    }
  } catch (error) {
    console.error('Error saving note:', error);
    showToast('Failed to save note', 'error');
  }
}

function debouncedSave() {
  clearTimeout(state.saveTimeout);
  state.saveTimeout = setTimeout(saveNote, 1000); // Save 1 second after user stops typing
}

function flushPendingSave() {
  if (!state.selectedNoteId || !state.saveTimeout) return;

  clearTimeout(state.saveTimeout);
  state.saveTimeout = null;
  saveNote();
}

async function deleteNote() {
  if (!state.selectedNoteId) return;

  const confirmed = confirm('Are you sure you want to delete this note? (You can restore it from trash)');
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/notes/${state.selectedNoteId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      state.socket.emit('deleteNote', { id: state.selectedNoteId });
      showToast('Note deleted! Find it in trash.', 'info');
      state.selectedNoteId = null;
      showEditor(false);
      loadNotes();
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    showToast('Failed to delete note', 'error');
  }
}

async function restoreNote() {
  if (!state.selectedNoteId || state.role !== 'admin') return;

  try {
    const response = await fetch(`/api/notes/${state.selectedNoteId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: state.role })
    });

    if (response.ok) {
      showToast('Note restored successfully!', 'success');
      loadNotes();
    }
  } catch (error) {
    console.error('Error restoring note:', error);
    showToast('Failed to restore note', 'error');
  }
}

// ==================== UI HELPERS ====================
function updateCharAndWordCount() {
  const content = document.getElementById('noteContent').value;
  document.getElementById('charCount').textContent = `${content.length} characters`;
  
  const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  document.getElementById('wordCount').textContent = `${words} words`;
}

function updateLastUpdated() {
  const now = new Date();
  document.getElementById('lastUpdated').textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

function updateRestoreButton(isDeleted) {
  const deleteBtn = document.getElementById('deleteBtn');
  const restoreBtn = document.getElementById('restoreBtn');

  if (isDeleted && state.role === 'admin') {
    deleteBtn.style.display = 'none';
    restoreBtn.style.display = 'inline-flex';
  } else {
    deleteBtn.style.display = 'inline-flex';
    restoreBtn.style.display = 'none';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // Within last minute
  if (diff < 60000) return 'Just now';

  // Within last hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }

  // Within last day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Within last week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  loadNotes();

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    debounceSearch(e.target.value);
  });

  // Pagination
  document.getElementById('prevBtn').addEventListener('click', previousPage);
  document.getElementById('nextBtn').addEventListener('click', nextPage);

  // Create new note
  document.getElementById('createNewBtn').addEventListener('click', createNewNote);
  document.getElementById('saveBtn').addEventListener('click', saveNote);

  // Note title and content
  document.getElementById('noteTitle').addEventListener('input', () => {
    syncSelectedNoteDraft();
    debouncedSave();
  });
  document.getElementById('noteContent').addEventListener('input', () => {
    updateCharAndWordCount();
    syncSelectedNoteDraft();
    debouncedSave();
  });
  document.getElementById('noteTitle').addEventListener('blur', flushPendingSave);
  document.getElementById('noteContent').addEventListener('blur', flushPendingSave);

  // Delete
  document.getElementById('deleteBtn').addEventListener('click', deleteNote);
  document.getElementById('restoreBtn').addEventListener('click', restoreNote);

  // Filters
  document.getElementById('viewAllBtn').addEventListener('click', () => {
    state.isViewingTrash = false;
    state.currentPage = 1;
    document.querySelector('.filter-btn').classList.add('active');
    document.getElementById('viewTrashBtn').classList.remove('active');
    loadNotes();
  });

  document.getElementById('viewTrashBtn').addEventListener('click', () => {
    state.isViewingTrash = true;
    state.currentPage = 1;
    document.querySelector('.filter-btn').classList.remove('active');
    document.getElementById('viewTrashBtn').classList.add('active');
    // Note: Trash view would need backend filter implementation
    showToast('Trash view - requires backend filter', 'info');
  });

  // User selection
  document.getElementById('userSelect').addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === '1-admin') {
      state.userId = 1;
      state.role = 'admin';
      showToast('Switched to Admin (can see all notes)', 'success');
    } else {
      state.userId = parseInt(value);
      state.role = 'user';
      showToast(`Switched to User ${value}`, 'info');
    }
    state.currentPage = 1;
    state.selectedNoteId = null;
    showEditor(false);
    loadNotes();
  });

  showEditor(false);
  addActivityLog('App started');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + N: Create new note
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    createNewNote();
  }
  
  // Ctrl/Cmd + S: Save note
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveNote();
  }
  
  // Ctrl/Cmd + /: Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

window.addEventListener('pagehide', flushPendingSave);

// ==================== INFINITE SCROLL (Alternative to Pagination) ====================
function enableInfiniteScroll() {
  const notesList = document.getElementById('notesList');
  
  notesList.addEventListener('scroll', () => {
    if (notesList.scrollTop + notesList.clientHeight >= notesList.scrollHeight - 50) {
      const totalPages = Math.ceil(state.totalNotes / state.pageLimit);
      if (state.currentPage < totalPages) {
        state.currentPage++;
        loadMoreNotes();
      }
    }
  });
}

async function loadMoreNotes() {
  try {
    const params = new URLSearchParams({
      page: state.currentPage,
      limit: state.pageLimit,
      search: state.searchQuery,
      userId: state.userId,
      role: state.role
    });

    const response = await fetch(`/api/notes?${params}`);
    const data = await response.json();

    // Append new notes to existing list
    state.notes = [...state.notes, ...data.notes];
    state.totalNotes = data.total;

    renderNotesList();
    updatePaginationButtons();
  } catch (error) {
    console.error('Error loading more notes:', error);
  }
}
