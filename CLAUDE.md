# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Repos

This is a monorepo split across two directories:

- **Frontend**: `anka-diversify-os/` — Next.js 16, React 19, Tailwind v4, TypeScript
- **Backend**: `anka-os-backend/` — Express 5, Prisma 5 + PostgreSQL, TypeScript

## Commands

### Frontend (`anka-diversify-os/`)
```bash
npm run dev       # start dev server on :3000
npm run build     # production build
npm run lint      # eslint
```

### Backend (`anka-os-backend/`)
```bash
npm run dev            # nodemon dev server on :3001
npm run build          # tsc compile to dist/
npm run db:generate    # prisma generate (after schema changes)
npm run db:migrate     # prisma migrate dev (create + apply migration)
npm run db:studio      # prisma studio GUI
```

## Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=...
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=...
JWT_SECRET=...
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Architecture

### Frontend → Backend Communication

All API calls use `X-User-ID: demo-user-id` header (no real auth yet). The backend auto-creates a demo user via `ensureUser()` in `project-service.ts` if it doesn't exist.

Frontend API layer lives in `lib/`:
- `lib/project-api.ts` — REST calls to `/api/projects/*`, maps backend shapes to frontend types
- `lib/ai-client.ts` — REST calls to `/api/ai/*`
- `lib/ai-service.ts` — wraps `ai-client.ts`; routes project chats to backend (which has repo context), general chats to `/api/ai/general/chat`

### Backend Routes

```
GET/POST   /api/projects
GET/PUT/DELETE /api/projects/:id
POST       /api/projects/:id/sync-github
GET/POST   /api/projects/:id/tasks
PUT/DELETE /api/projects/:id/tasks/:taskId
POST/GET   /api/ai/general/chat, /api/ai/general/sessions
POST/GET   /api/ai/projects/:id/chat, /api/ai/projects/:id/sessions
GET        /api/ai/projects/:id/context
```

### Status Mapping

Backend stores task status as `in_progress`; frontend uses `in-progress`. Always convert:
- `lib/project-api.ts`: `toFrontendStatus` / `toBackendStatus`
- Backend controller passes `req.body.status` directly — conversion happens on the frontend side only

### AI / Repo Context

When a project has a `githubUrl`, `github.service.ts` fetches the repo snapshot (file tree + up to 15 key files × 3000 chars) and stores it in `ProjectRepoSnapshot`. The AI service (`src/services/ai-service.ts`) injects this into the system prompt for project chats.

### Frontend Data Pattern

Pages seed from `lib/mock-data.ts` immediately for instant render, then hydrate from the backend in `useEffect`. Mock exports: `projects`, `users`, `teamMembers`, `tasks`, etc. — **not** `mockProjects`/`mockUsers`.

Optimistic UI updates are used for task mutations (create, drag-drop status, delete) with rollback on API failure.

### Tailwind v4

Use canonical Tailwind v4 class names — avoid arbitrary values where equivalents exist:
- `w-[180px]` → `w-45`, `w-[400px]` → `w-100`
- `min-h-[600px]` → `min-h-150`
- `sm:max-w-[500px]` → `sm:max-w-125`, `sm:max-w-[400px]` → `sm:max-w-100`
