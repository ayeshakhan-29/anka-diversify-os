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
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=...
JWT_SECRET=...
PORT=3001
FRONTEND_URL=http://localhost:3000
GITHUB_TOKEN=...        # required for private repos; classic token with `repo` scope
AWS_ACCESS_KEY_ID=...   # required for file uploads
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

Backend uses `dotenv.config({ override: true })` — always restart the server after editing `.env` since nodemon only watches `.ts`/`.json` files.

## Architecture

### Frontend → Backend Communication

`lib/project-api.ts` and `lib/ai-client.ts` are the only files that make HTTP calls. Both use a `getHeaders()` helper that reads `authToken` and `user` from `localStorage` and sends `Authorization`, `X-User-ID`, and `X-User-Name` headers. Never hardcode `demo-user-id` — always go through `getHeaders()`.

The backend auto-creates any user via `ensureUser()` in `project-service.ts` if the ID from `X-User-ID` doesn't exist yet.

### Backend Route Map

```
GET/POST              /api/projects
GET/PUT/DELETE        /api/projects/:id
POST                  /api/projects/:id/sync-github        # fetch GitHub repo snapshot
GET/POST              /api/projects/:id/tasks
PUT/DELETE            /api/projects/:id/tasks/:taskId
GET/POST/DELETE       /api/projects/:id/tasks/:taskId/comments
GET/POST              /api/projects/:id/members
DELETE                /api/projects/:id/members/:userId
GET/POST              /api/projects/:id/chat
GET                   /api/projects/:id/activities
GET/POST              /api/projects/:id/files
POST                  /api/projects/:id/files/presign      # S3 presigned URL
POST                  /api/projects/:id/files/confirm      # confirm after S3 upload
DELETE                /api/projects/:id/files/:fileId
POST/GET              /api/ai/general/chat, /api/ai/general/sessions
POST/GET              /api/ai/projects/:id/chat, /api/ai/projects/:id/sessions
GET                   /api/ai/projects/:id/context
POST                  /api/ai/projects/:id/agent/run       # coding agent: returns proposed file changes
POST                  /api/ai/projects/:id/agent/push      # push confirmed changes to GitHub
GET/POST              /api/auth/*
GET/POST              /api/admin/*
GET/POST              /api/invites/*
```

All project queries have **no per-user filter** — this is a team app and all users see all projects.

### Status Mapping

Backend stores task status as `in_progress`; frontend uses `in-progress`. Conversion lives only in `lib/project-api.ts` (`toFrontendStatus` / `toBackendStatus`). Never convert anywhere else.

### AI / Repo Context

`github.service.ts` fetches a repo snapshot (up to 500 files in the tree, 15 key files × 3000 chars each) and stores it in `ProjectRepoSnapshot`. `ai-service.ts` injects this snapshot into the system prompt for every project chat message.

**Coding Agent** (`/agent/run` → `/agent/push`):
- `runCodingAgent` in `ai-service.ts` uses `gpt-4` with `response_format: json_object` to produce `{ explanation, changes[], commitMessage }`
- `pushChanges` in `github.service.ts` uses the GitHub Git Data API to make an atomic multi-file commit (creates blobs → tree → commit → updates ref)
- The frontend shows a diff-review panel before the user confirms the push

### Frontend Data Pattern

Pages that show projects start with `useState<Project[]>([])` (empty — no mock seed) and hydrate from the backend in `useEffect`. The exception is `lib/mock-data.ts` which still exports data used by pages that haven't been fully wired to the backend yet. Mock exports are named `projects`, `users`, `teamMembers`, `tasks` — **not** `mockProjects`/`mockUsers`.

Optimistic UI updates are used for task mutations (create, drag-drop status, delete) with rollback on API failure. Activity feed and chat use polling (`setInterval`) rather than websockets.

### File Upload Flow

Three-step: `POST /files/presign` → `PUT` directly to S3 with the presigned URL → `POST /files/confirm` to write metadata to DB. The confirm step stores `name`, `type`, `phase`, `url`, `s3Key`, `size`.

### Tailwind v4

Use canonical Tailwind v4 class names — avoid arbitrary values where equivalents exist:
- `w-[180px]` → `w-45`, `w-[400px]` → `w-100`
- `min-h-[600px]` → `min-h-150`
- `sm:max-w-[500px]` → `sm:max-w-125`, `sm:max-w-[400px]` → `sm:max-w-100`

### Key Frontend Pages

- `app/development/projects/[id]/page.tsx` — project detail with Kanban, Files, Chat, Activity, and AI Assistant tabs
- `app/development/projects/page.tsx` — project list; real data only, no mock seed
- `app/development/chats/page.tsx` — project chat rooms using real `ProjectChatMessage` data
- `components/ai/project-ai-assistant.tsx` — Chat mode (markdown + syntax highlighting) and Agent mode (propose + review + push)
