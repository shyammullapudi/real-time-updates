# Script to create demo notes
$notes = @(
    @{ title = "Learning WebSockets"; content = "WebSockets enable real-time bidirectional communication. Perfect for our note app!"; userId = 1 },
    @{ title = "Debounced Search Tips"; content = "Debouncing search queries prevents excessive API calls and improves performance significantly."; userId = 1 },
    @{ title = "Database Design"; content = "SQLite is lightweight and perfect for demo apps. Soft deletes keep data recoverable."; userId = 1 },
    @{ title = "Role-Based Access"; content = "Admin users can view all notes and restore deleted items. Regular users see only their own notes."; userId = 1 },
    @{ title = "Pagination Performance"; content = "Loading 10 notes per page keeps the UI responsive and smooth for large datasets."; userId = 1 },
    @{ title = "User 2 First Note"; content = "This is a note created by User 2. Admin users can see this note too!"; userId = 2 },
    @{ title = "User 2 Second Note"; content = "Notes are isolated by user unless viewing as admin. Great for privacy!"; userId = 2 }
)

foreach ($note in $notes) {
    $body = $note | ConvertTo-Json
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/notes' -Method Post -Headers @{'Content-Type' = 'application/json'} -Body $body -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-Host "[+] Created: $($result.title) (User $($result.userId))" -ForegroundColor Green
    Start-Sleep -Milliseconds 300
}

Write-Host "`n[SUCCESS] All demo notes created successfully!" -ForegroundColor Cyan
