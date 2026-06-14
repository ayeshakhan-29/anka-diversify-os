# Anka Diversify

A full-stack project management and AI development platform for software teams.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, TypeScript
- **Backend**: Express 5, Prisma 5, PostgreSQL, TypeScript

## Getting Started

### Frontend

```bash
cd anka-diversify-os
npm install
npm run dev       # starts on http://localhost:3000
```

### Backend

```bash
cd anka-os-backend
npm install
npm run dev       # starts on http://localhost:3001
```

### Environment Variables

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
GITHUB_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

## Test Credentials

| Field    | Value           |
|----------|-----------------|
| Email    | admin@anka.os   |
| Password | admin@123       |

## Features

- Kanban board with drag-and-drop task management
- AI coding agent — proposes multi-file changes via GPT-4 with diff review and GitHub push
- Project-scoped AI assistant with GitHub repo context injection
- General AI assistant with persistent sessions and file/PDF/DOCX attachment support
- Real-time project chat rooms and activity feed
- S3 file upload (presign → direct upload → confirm)
- Sprint planning, team management, invite system, and role-based admin panel

## Commands

```bash
npm run build     # production build
npm run lint      # eslint
npm run db:migrate    # create + apply DB migration
npm run db:studio     # Prisma Studio GUI
```
