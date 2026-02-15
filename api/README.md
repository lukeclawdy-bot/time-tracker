# Time Tracking API

A REST API for tracking time entries with project management, built with Node.js, Express.js, and SQLite.

## Features

- ✅ Create, read, update, and delete time entries
- ✅ Track project-specific time
- ✅ Input validation (end_time must be after start_time)
- ✅ Generate statistics by project
- ✅ Meaningful error messages
- ✅ >80% test coverage

## Tech Stack

- **Node.js** 18+
- **Express.js** 4.x
- **SQLite3** 5.x
- **Joi** for validation
- **Jest** + **Supertest** for testing

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# (Optional) Configure environment variables in .env
```

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or the `PORT` specified in `.env`).

## Testing

```bash
# Run all tests with coverage report
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Create Entry
```
POST /api/entries
Content-Type: application/json

{
  "start_time": "2026-02-14T08:00:00Z",
  "end_time": "2026-02-14T09:00:00Z",
  "project": "Project A",
  "notes": "Optional notes"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "start_time": "2026-02-14T08:00:00Z",
    "end_time": "2026-02-14T09:00:00Z",
    "project": "Project A",
    "notes": "Optional notes",
    "created_at": "2026-02-14T20:41:00.000Z",
    "updated_at": "2026-02-14T20:41:00.000Z"
  }
}
```

### List Entries
```
GET /api/entries?project=Project%20A&limit=10&offset=0
```

**Query Parameters:**
- `project` (optional): Filter by project name
- `limit` (optional, default: 100, max: 1000): Number of results
- `offset` (optional, default: 0): Number of results to skip

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "start_time": "2026-02-14T08:00:00Z",
      "end_time": "2026-02-14T09:00:00Z",
      "project": "Project A",
      "notes": "Optional notes",
      "created_at": "2026-02-14T20:41:00.000Z",
      "updated_at": "2026-02-14T20:41:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Entry by ID
```
GET /api/entries/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "start_time": "2026-02-14T08:00:00Z",
    "end_time": "2026-02-14T09:00:00Z",
    "project": "Project A",
    "notes": "Optional notes",
    "created_at": "2026-02-14T20:41:00.000Z",
    "updated_at": "2026-02-14T20:41:00.000Z"
  }
}
```

### Update Entry
```
PATCH /api/entries/:id
Content-Type: application/json

{
  "notes": "Updated notes",
  "project": "Project B"
}
```

Any combination of fields can be updated. The `end_time` must still be after `start_time`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "start_time": "2026-02-14T08:00:00Z",
    "end_time": "2026-02-14T09:00:00Z",
    "project": "Project B",
    "notes": "Updated notes",
    "created_at": "2026-02-14T20:41:00.000Z",
    "updated_at": "2026-02-14T20:42:00.000Z"
  }
}
```

### Delete Entry
```
DELETE /api/entries/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Entry deleted successfully",
  "id": 1
}
```

### Get Statistics by Project
```
GET /api/stats
```

Returns total hours and entry counts grouped by project.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "project": "Project A",
      "total_entries": 5,
      "total_hours": 12.5,
      "first_entry": "2026-02-10T08:00:00Z",
      "last_entry": "2026-02-14T17:00:00Z"
    }
  ],
  "count": 1
}
```

## Validation Rules

- **start_time**: Required, ISO 8601 date format
- **end_time**: Required, ISO 8601 date format, must be after `start_time`
- **project**: Required, non-empty string (max 255 characters)
- **notes**: Optional, max 1000 characters
- **id**: Must be a valid positive integer

## Error Responses

### Validation Error (400 Bad Request)
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

### Not Found (404)
```json
{
  "error": "Entry not found",
  "id": 999
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Port to run the server on (default: 3000)
PORT=3000

# Environment: development, production (default: development)
NODE_ENV=development

# Path to SQLite database file (default: ./data/time_tracking.db)
DB_PATH=./data/time_tracking.db
```

## Database Schema

### entries table
```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  project TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project ON entries(project);
CREATE INDEX idx_start_time ON entries(start_time);
```

## Testing

The test suite includes:
- ✅ Health check endpoint
- ✅ Create entry with validation
- ✅ List entries with filters and pagination
- ✅ Get single entry
- ✅ Update entry with partial updates
- ✅ Delete entry
- ✅ Statistics generation
- ✅ Error handling (404, 400, validation)
- ✅ Edge cases (whitespace trimming, time validation)

**Coverage Target:** >80% across statements, branches, functions, and lines

## Project Structure

```
time-tracking-api/
├── src/
│   ├── index.js          # Express app entry point
│   ├── db.js             # Database initialization and operations
│   └── routes.js         # API endpoint handlers
├── test/
│   └── entries.test.js   # Unit tests with >80% coverage
├── data/                 # SQLite database directory
├── package.json          # Dependencies and scripts
├── jest.config.js        # Jest configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Development Notes

- All timestamps use ISO 8601 format (e.g., `2026-02-14T08:00:00Z`)
- Database path is configurable via `DB_PATH` environment variable
- Tests use an isolated test database that's cleaned up after each test suite
- Input validation uses Joi for comprehensive field validation
- Errors include helpful messages for debugging

## License

MIT
