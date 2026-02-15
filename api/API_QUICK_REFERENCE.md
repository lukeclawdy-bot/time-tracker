# Time Tracking API - Quick Reference

## Base URL
```
http://localhost:3000/api
```

## HTTP Methods & Endpoints

### 📝 Create Entry
```
POST /api/entries
```
```json
{
  "start_time": "2026-02-14T08:00:00Z",
  "end_time": "2026-02-14T09:00:00Z",
  "project": "Project A",
  "notes": "Optional"
}
```
**Status:** 201 Created

---

### 📖 List All Entries
```
GET /api/entries
GET /api/entries?project=ProjectA
GET /api/entries?limit=10&offset=0
```
**Status:** 200 OK  
**Sort:** By start_time descending

---

### 🔍 Get Single Entry
```
GET /api/entries/1
```
**Status:** 200 OK or 404 Not Found

---

### ✏️ Update Entry
```
PATCH /api/entries/1
```
```json
{
  "notes": "Updated",
  "project": "New Project"
}
```
**Status:** 200 OK or 404 Not Found

---

### 🗑️ Delete Entry
```
DELETE /api/entries/1
```
**Status:** 200 OK or 404 Not Found

---

### 📊 Statistics by Project
```
GET /api/stats
```
Returns: project, total_entries, total_hours, first_entry, last_entry  
**Status:** 200 OK

---

## Validation Rules

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| start_time | ✅ | ISO 8601 | Before end_time |
| end_time | ✅ | ISO 8601 | After start_time |
| project | ✅ | String | 1-255 chars |
| notes | ❌ | String | 0-1000 chars |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, DELETE) |
| 201 | Created (POST) |
| 400 | Validation error |
| 404 | Entry not found |
| 500 | Server error |

---

## cURL Examples

### Create
```bash
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2026-02-14T08:00:00Z",
    "end_time": "2026-02-14T09:00:00Z",
    "project": "Project A"
  }'
```

### List
```bash
curl http://localhost:3000/api/entries
curl http://localhost:3000/api/entries?project=ProjectA
```

### Get One
```bash
curl http://localhost:3000/api/entries/1
```

### Update
```bash
curl -X PATCH http://localhost:3000/api/entries/1 \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated notes"}'
```

### Delete
```bash
curl -X DELETE http://localhost:3000/api/entries/1
```

### Stats
```bash
curl http://localhost:3000/api/stats
```

---

## JavaScript/Node Examples

### Using fetch()
```javascript
// Create entry
const response = await fetch('http://localhost:3000/api/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start_time: '2026-02-14T08:00:00Z',
    end_time: '2026-02-14T09:00:00Z',
    project: 'Project A'
  })
});
const data = await response.json();
console.log(data.data.id);

// List entries
const list = await fetch('http://localhost:3000/api/entries');
const entries = await list.json();
console.log(entries.data);
```

### Using axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Create
const { data } = await api.post('/entries', {
  start_time: '2026-02-14T08:00:00Z',
  end_time: '2026-02-14T09:00:00Z',
  project: 'Project A'
});

// List
const entries = await api.get('/entries?project=ProjectA');

// Get
const entry = await api.get(`/entries/${id}`);

// Update
await api.patch(`/entries/${id}`, { notes: 'Updated' });

// Delete
await api.delete(`/entries/${id}`);

// Stats
const stats = await api.get('/stats');
```

---

## Response Format

### Success Response (200/201)
```json
{
  "success": true,
  "data": { /* entry object */ },
  "count": 1
}
```

### Error Response (400/404)
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "end_time",
      "message": "end_time must be after start_time"
    }
  ]
}
```

---

## Common Errors & Solutions

### ❌ "end_time must be after start_time"
```json
// Wrong
{ "start_time": "2026-02-14T10:00:00Z", "end_time": "2026-02-14T09:00:00Z" }

// Right
{ "start_time": "2026-02-14T08:00:00Z", "end_time": "2026-02-14T09:00:00Z" }
```

### ❌ "project is required"
```json
// Wrong
{ "start_time": "...", "end_time": "...", "notes": "..." }

// Right
{ "start_time": "...", "end_time": "...", "project": "My Project" }
```

### ❌ "Entry not found"
```bash
# Make sure entry ID exists
curl http://localhost:3000/api/entries/999  # ❌ Likely doesn't exist
curl http://localhost:3000/api/entries/1    # ✅ Use existing ID
```

---

## Date Format

All dates must be **ISO 8601** format with timezone:

```
✅ Valid:  2026-02-14T08:00:00Z
✅ Valid:  2026-02-14T08:00:00+01:00
❌ Wrong:  02/14/2026
❌ Wrong:  2026-02-14
❌ Wrong:  2026-02-14T08:00:00
```

**Pro tip:** Use `new Date().toISOString()` in JavaScript to get the current timestamp.

---

## Pagination

```
GET /api/entries?limit=10&offset=0   # First 10
GET /api/entries?limit=10&offset=10  # Second 10
GET /api/entries?limit=10&offset=20  # Third 10
```

- `limit`: 1-1000 (default: 100)
- `offset`: 0+ (default: 0)

---

## Performance Tips

- Use `?project=ProjectName` to filter specific projects
- Use `limit` and `offset` for large result sets
- Check `/api/stats` for quick project summaries
- Create indexes are automatic (project, start_time)

---

## Environment

The API reads from `.env` file:

```bash
PORT=3000                          # Server port
NODE_ENV=development              # Environment
DB_PATH=./data/time_tracking.db   # Database location
```

---

## Testing

Run the test suite:
```bash
npm test              # Full test suite with coverage
npm run test:watch    # Watch mode
```

Coverage target: **>80%** on all metrics

---

## Support

Check the full documentation: `README.md`  
View implementation details: `IMPLEMENTATION_SUMMARY.md`
