# Time Tracking Dashboard

A modern Next.js 14 frontend dashboard for the Time Tracking API.

## Features

- **Dashboard**: View project statistics and recent entries at a glance
- **Entries Management**: Full CRUD operations with pagination and filtering
- **Statistics**: Visual breakdown of hours per project with bar charts
- **Responsive Design**: Clean Tailwind CSS styling with dark mode support
- **TypeScript**: Fully typed with strict mode enabled

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript (strict)
- Tailwind CSS

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Make sure the backend API is running on `localhost:3000`

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## Pages

- `/` - Dashboard with project stats and recent entries
- `/entries` - Full entries list with pagination and filtering
- `/entries/new` - Create new time entry
- `/entries/[id]/edit` - Edit existing entry
- `/stats` - Visual statistics and project breakdown

## API Endpoints Used

The frontend connects to these backend endpoints:

- `POST /api/entries` - Create entry
- `GET /api/entries` - List entries (supports `?project=X&limit=N&offset=N`)
- `GET /api/entries/:id` - Get single entry
- `PATCH /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry
- `GET /api/stats` - Project statistics

## Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── entries/
│   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── [id]/
│   │   │   └── edit/
│   │   │       └── page.tsx
│   │   └── page.tsx
│   ├── stats/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── EntryForm.tsx
│   ├── Navbar.tsx
│   └── StatsCard.tsx
└── lib/
    └── api.ts
```
