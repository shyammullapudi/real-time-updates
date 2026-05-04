# 🧪 Real-Time Notes App - Complete Testing Guide

## Quick Start Testing

### Step 1: Verify Server is Running
```bash
# Terminal should show:
✓ Server running on http://localhost:3000
✓ Connected to SQLite database
✓ Admin user ready
✓ User1 ready
✓ User2 ready
```

### Step 2: Open the Application
- URL: http://localhost:3000
- Expected: Beautiful dark-themed notes app loads
- Status: "● Online" shown in top-right corner

---

## 📋 Feature Testing Guide

### Test 1: Real-Time Updates (WebSockets)

#### 1.1 Basic Real-Time Sync
**Purpose**: Verify notes appear instantly across tabs

**Steps**:
1. Open http://localhost:3000 in Tab 1
2. Open http://localhost:3000 in Tab 2 (same browser)
3. In Tab 1, click "+ Create New Note"
4. Enter title: "Test Real-Time"
5. Enter content: "Testing WebSocket sync"
6. Press Ctrl+S to save (or wait auto-save)
7. **VERIFY**: Note instantly appears in Tab 2's list without refresh

**Success Indicators**:
- ✅ Toast message in Tab 1: "Note created successfully!"
- ✅ Note appears in Tab 2's note list immediately
- ✅ Activity feed shows creation event in both tabs
- ✅ Connection status stays "● Online"

#### 1.2 Real-Time Updates
**Purpose**: Verify edits sync across tabs

**Steps**:
1. Keep both tabs open from Test 1.1
2. In Tab 1, select the "Test Real-Time" note
3. Click in content area, add: " - This was updated!"
4. Wait 1 second (auto-save)
5. **VERIFY**: In Tab 2, select the same note, content auto-updates

**Success Indicators**:
- ✅ Tab 1 shows "Last updated: [current time]"
- ✅ Tab 2 updates without manual refresh
- ✅ Activity feed shows: "Note updated"

#### 1.3 Real-Time Deletion
**Purpose**: Verify deletions sync in real-time

**Steps**:
1. In Tab 1, select any note and click "🗑️ Delete"
2. Confirm deletion
3. **VERIFY**: Note disappears in Tab 2 immediately
4. **VERIFY**: Activity feed shows "Note deleted"

**Success Indicators**:
- ✅ Note removed from Tab 2's list
- ✅ No refresh required in Tab 2
- ✅ Toast notification appears: "Note deleted!"

---

### Test 2: Debounced Search

#### 2.1 Search Filtering
**Purpose**: Verify search filters notes correctly

**Steps**:
1. In Admin view (shows all 8 notes)
2. Click search box (🔍)
3. Type: "WebSocket" (slowly, one letter at a time)
4. **VERIFY**: After 300ms debounce, results filter to 1 note
5. Note shown: "Learning WebSockets"
6. Page info: "Page 1 of 1 (1 total)"

**Success Indicators**:
- ✅ Only "Learning WebSockets" appears
- ✅ Other notes hidden
- ✅ Page count shows 1 total
- ✅ Loading spinner visible during search

#### 2.2 Search Multiple Results
**Purpose**: Verify search finds multiple matching notes

**Steps**:
1. Clear previous search (Ctrl+A, Delete)
2. Type: "admin" (lowercase)
3. **VERIFY**: Finds "Admin users can view all..."
4. **VERIFY**: Also finds "Admin user ready" message?
5. **EXPECTED**: Should find at least 1 note with "admin" in content

**Success Indicators**:
- ✅ Shows matching note(s)
- ✅ Page count updates
- ✅ Search is case-insensitive

#### 2.3 Clear Search
**Purpose**: Verify clearing search shows all notes

**Steps**:
1. With search active (showing 1 result)
2. Click in search box
3. Select all text (Ctrl+A)
4. Delete text
5. **VERIFY**: All 8 notes reappear

**Success Indicators**:
- ✅ Full note list returns
- ✅ Page info: "Page 1 of 1 (8 total)"
- ✅ No lag or delay

#### 2.4 Debounce Performance
**Purpose**: Verify API calls are debounced

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "XHR" (API calls)
4. Click search box
5. Type quickly: "t-e-s-t" (5 characters)
6. **VERIFY**: Only 1 API call made (not 5!)
7. **VERIFY**: Call happens after you stop typing

**Success Indicators**:
- ✅ Single API request despite multiple keystrokes
- ✅ Request happens ~300ms after last keystroke
- ✅ No request spam in Network tab

---

### Test 3: Pagination & Infinite Scroll

#### 3.1 Pagination Controls
**Purpose**: Verify pagination buttons work correctly

**Steps**:
1. Ensure Admin view (shows all notes)
2. **VERIFY**: Page controls visible at bottom:
   - "← Previous" button (disabled)
   - "Page 1 of 1 (8 total)" text
   - "Next →" button (disabled)
3. Both buttons should be grayed out (no pagination needed with 8 notes)

**Success Indicators**:
- ✅ Pagination controls visible
- ✅ Buttons properly disabled
- ✅ Page info accurate

#### 3.2 Pagination with More Data
**Purpose**: Test pagination with multiple pages

**Steps**:
1. Create 5+ more notes to exceed 10 per page
2. Run: `npm run create-more-notes` (if script exists)
3. OR manually create via: POST /api/notes
4. **VERIFY**: Page info now shows "Page 1 of 2" or higher
5. Click "Next →" button
6. **VERIFY**: Shows notes 11+ on page 2
7. "← Previous" button now enabled
8. Click "Previous"
9. **VERIFY**: Back on page 1 with notes 1-10

**Success Indicators**:
- ✅ Multiple pages shown when needed
- ✅ Previous/Next buttons enable/disable correctly
- ✅ Page info updates accurately
- ✅ Notes properly sorted by update time

#### 3.3 Page Navigation State
**Purpose**: Verify page state during search

**Steps**:
1. On page 2 of notes (if applicable)
2. Search for a term
3. Results are limited to 1 page
4. **VERIFY**: Pagination resets to page 1
5. Clear search
6. **VERIFY**: Back to original page position (or page 1)

**Success Indicators**:
- ✅ Search resets to page 1
- ✅ Navigation controls update
- ✅ No orphaned page states

---

### Test 4: Role-Based Access Control

#### 4.1 User 1 View (Limited Access)
**Purpose**: Verify regular users see only their notes

**Steps**:
1. Select "👤 User 1" from dropdown
2. Click "All Notes" filter
3. **VERIFY**: Shows 6 notes (User 1's notes only)
4. Page info: "Page 1 of 1 (6 total)"
5. **VERIFY**: These notes are visible:
   - My First Note
   - Learning WebSockets
   - Debounced Search Tips
   - Database Design
   - Role-Based Access
   - Pagination Performance
6. **VERIFY**: These notes are NOT visible:
   - User 2 First Note
   - User 2 Second Note

**Success Indicators**:
- ✅ Only 6 notes shown
- ✅ User 2's notes completely hidden
- ✅ Cannot see other user's private notes

#### 4.2 User 2 View (Limited Access)
**Purpose**: Verify each user sees only their own notes

**Steps**:
1. Select "👤 User 2" from dropdown
2. Toast shows: "Switched to User 2"
3. **VERIFY**: Shows 2 notes only:
   - User 2 First Note
   - User 2 Second Note
4. Page info: "Page 1 of 1 (2 total)"
5. **VERIFY**: Cannot see any User 1 notes

**Success Indicators**:
- ✅ Only 2 notes shown
- ✅ User 1's notes hidden
- ✅ Complete privacy isolation

#### 4.3 Admin View (Full Access)
**Purpose**: Verify admin sees all notes

**Steps**:
1. Select "👑 Admin" from dropdown
2. Toast shows: "Switched to Admin (can see all notes)"
3. **VERIFY**: Shows ALL 8 notes
4. Page info: "Page 1 of 1 (8 total)"
5. **VERIFY**: Both User 1 AND User 2 notes visible:
   - User 2 First Note ✓
   - User 2 Second Note ✓
   - + All 6 User 1 notes ✓

**Success Indicators**:
- ✅ All 8 notes visible
- ✅ Can see mixed ownership
- ✅ No access restrictions for admin

#### 4.4 Admin Restore Privilege
**Purpose**: Verify only admin can restore notes

**Steps**:
1. As User 1: Delete any note
2. As Admin: Switch to admin role
3. Select the deleted note (visible in admin view)
4. **VERIFY**: Delete button shows "🗑️ Delete"
5. **VERIFY**: Restore button shows "↩️ Restore" (if deleted)
6. Click restore
7. **VERIFY**: Note is restored
8. Switch back to User 1
9. **VERIFY**: Note reappears in User 1's view

**Success Indicators**:
- ✅ User cannot see restore option
- ✅ Admin can restore deleted notes
- ✅ Restored note visible to original user
- ✅ Access control enforced properly

#### 4.5 API Access Control
**Purpose**: Verify backend enforces role-based access

**Steps**:
1. Open DevTools (F12)
2. Console tab
3. Run as User 1:
```javascript
fetch('/api/notes?role=user&userId=1')
  .then(r => r.json())
  .then(d => console.log('User 1 can see:', d.notes.length, 'notes'))
```
4. **VERIFY**: Shows 6 notes
5. Run as Admin:
```javascript
fetch('/api/notes?role=admin&userId=1')
  .then(r => r.json())
  .then(d => console.log('Admin can see:', d.notes.length, 'notes'))
```
6. **VERIFY**: Shows 8 notes

**Success Indicators**:
- ✅ API respects role parameter
- ✅ User gets filtered results
- ✅ Admin gets full results
- ✅ Backend enforces access control

---

### Test 5: Soft Delete

#### 5.1 Basic Soft Delete
**Purpose**: Verify notes can be deleted

**Steps**:
1. Select any note (e.g., "My First Note")
2. Click "🗑️ Delete" button
3. Confirmation dialog appears
4. Click "OK" to confirm
5. **VERIFY**: Note disappears from list
6. Toast shows: "Note deleted! Find it in trash."

**Success Indicators**:
- ✅ Confirmation dialog shown
- ✅ Note removed from user's view
- ✅ Toast notification appears
- ✅ Page updates automatically

#### 5.2 Deleted Note Visibility (Admin Only)
**Purpose**: Verify deleted notes are hidden from regular users but visible to admin

**Steps**:
1. As User 1: Delete a note
2. Note disappears from User 1 view
3. Count now shows 5 notes instead of 6
4. Switch to Admin view
5. **VERIFY**: Deleted note reappears in admin view
6. Note might have indicator it's deleted (trash icon)

**Success Indicators**:
- ✅ User cannot see deleted note
- ✅ Admin can still see it
- ✅ Note count accurate per role

#### 5.3 Restore Functionality
**Purpose**: Verify admin can restore deleted notes

**Steps**:
1. With Admin view showing deleted note
2. Click on the deleted note to select it
3. **VERIFY**: "↩️ Restore" button appears
4. Click "Restore" button
5. Toast shows: "Note restored successfully!"
6. **VERIFY**: Note back in both:
   - Admin view (still shows)
   - Original user's view (if User 1's note)

**Success Indicators**:
- ✅ Restore button only for deleted notes
- ✅ Success notification shown
- ✅ Note returns to active state
- ✅ Visible to original user again

#### 5.4 No Permanent Data Loss
**Purpose**: Verify soft delete keeps data recoverable

**Steps**:
1. Check database directly:
```bash
sqlite3 notes.db "SELECT id, title, isDeleted FROM notes LIMIT 5;"
```
2. For deleted note: `isDeleted` column = 1
3. For active note: `isDeleted` column = 0
4. **VERIFY**: No notes are permanently removed
5. Can always restore with:
```sql
UPDATE notes SET isDeleted = 0 WHERE id = ?;
```

**Success Indicators**:
- ✅ isDeleted flag used (not permanent deletion)
- ✅ Data retained in database
- ✅ Recovery always possible
- ✅ Audit trail maintained

---

## 🔍 Advanced Testing

### Test 6: Keyboard Shortcuts

#### 6.1 Create New Note (Ctrl+N)
```
Action: Press Ctrl+N anywhere
Expected: Prompt for note title OR new note created
Status: ✓ Working
```

#### 6.2 Save Note (Ctrl+S)
```
Action: Edit note, press Ctrl+S
Expected: Note saves immediately
Status: ✓ Working
```

#### 6.3 Focus Search (Ctrl+/)
```
Action: Press Ctrl+/ anywhere
Expected: Search box gains focus
Status: ✓ Working
```

---

### Test 7: Character & Word Count

**Purpose**: Verify statistics accuracy

**Steps**:
1. Select any note
2. Look at footer stats showing:
   - "X characters"
   - "Y words"
3. Edit content and verify counts update in real-time
4. Try empty note: "0 characters, 0 words"
5. Type "hello world": "11 characters, 2 words"

**Success Indicators**:
- ✅ Character count matches actual text
- ✅ Word count accurate
- ✅ Updates in real-time as you type

---

### Test 8: Auto-Save Functionality

**Purpose**: Verify notes save automatically

**Steps**:
1. Select a note
2. Edit content
3. Watch timestamp: "Last updated: [time]"
4. Wait 1 second without clicking save
5. **VERIFY**: Page updates to new time
6. Refresh page (F5)
7. **VERIFY**: Changes are still there!

**Success Indicators**:
- ✅ Last updated timestamp changes
- ✅ No manual save button needed
- ✅ Changes persist after refresh

---

### Test 9: Connection Status

**Purpose**: Verify WebSocket connection monitoring

**Steps**:
1. App shows "● Online" (green)
2. Disconnect WiFi/Network
3. **VERIFY**: Status changes to "● Offline" (red)
4. Reconnect to network
5. **VERIFY**: Auto-reconnects, shows "● Online" again

**Success Indicators**:
- ✅ Status indicator accurate
- ✅ Real-time connection monitoring
- ✅ Auto-reconnection works

---

### Test 10: Empty States

**Purpose**: Verify UI handles empty states gracefully

**Steps**:
1. As new user with no notes: See "No notes found"
2. With search results = 0: See "No notes found"
3. After deleting all notes: See "No notes found"
4. **VERIFY**: Message is helpful and clear

**Success Indicators**:
- ✅ Graceful fallback messages
- ✅ Clear UX for empty states
- ✅ No broken layouts

---

## 📊 Test Coverage Summary

| Feature | Test Cases | Status |
|---------|-----------|--------|
| Real-Time Updates | 3 | ✅ Complete |
| Debounced Search | 4 | ✅ Complete |
| Pagination | 3 | ✅ Complete |
| Role-Based Access | 5 | ✅ Complete |
| Soft Delete | 4 | ✅ Complete |
| Keyboard Shortcuts | 3 | ✅ Complete |
| Advanced Features | 3 | ✅ Complete |
| **TOTAL** | **25+** | **✅ COMPLETE** |

---

## 🐛 Known Issues & Workarounds

### Issue 1: Port Already in Use
**Problem**: `Error: listen EADDRINUSE :::3000`
**Workaround**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or change port in .env: PORT=3001
```

### Issue 2: Database Locked
**Problem**: `Error: database is locked`
**Workaround**:
```bash
# Restart server and try again
# Delete notes.db if needed: rm notes.db
```

### Issue 3: WebSocket Connection Fails
**Problem**: Socket connection won't establish
**Workaround**:
- Check browser console for errors
- Ensure server is running
- Check firewall/VPN settings

---

## 📝 Test Report Template

```
TEST EXECUTION REPORT
======================
Date: [Date]
Tester: [Name]
Build: v1.0.0

TEST RESULTS:
├─ Real-Time Updates: [PASS/FAIL]
├─ Debounced Search: [PASS/FAIL]
├─ Pagination: [PASS/FAIL]
├─ Role-Based Access: [PASS/FAIL]
└─ Soft Delete: [PASS/FAIL]

OVERALL: [PASS/FAIL]
ISSUES FOUND: [Number]
NOTES: [Any observations]
```

---

## ✅ Final Verification Checklist

Before deployment:

- [ ] All 5 main features working
- [ ] Real-time sync tested across tabs
- [ ] Search debounce verified (Network tab)
- [ ] Role-based access tested all roles
- [ ] Soft delete and restore working
- [ ] No console errors
- [ ] Database persists data
- [ ] Connection indicator accurate
- [ ] UI responsive on desktop
- [ ] Keyboard shortcuts functional
- [ ] Performance acceptable
- [ ] No memory leaks (DevTools)

---

*Run this comprehensive test suite to verify all features are working correctly!*
