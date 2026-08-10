# ANKA OS — Project Status Report (v2.0)

**What's Done, What's Left — Full Codebase Audit**
Internal — Development Team
Frontend: `anka-diversify-os` (Next.js 16 / React 19) | Backend: `anka-os-backend` (Express 5 / Prisma / PostgreSQL)
Compiled 5 August 2026 — based on direct source inspection, HEAD commits 3 August 2026
Supersedes v1.0 (8 July 2026, based on HEAD commits 15 June 2026)

Status legend: `DONE` implemented and wired end-to-end · `PARTIAL` exists but incomplete/inconsistent/duplicated · `MISSING` not built · `RISK` working but a live bug/security/data-integrity concern · `FIXED` resolved since v1.0 · `NEW` added since v1.0 · `UNCHANGED` still open from v1.0

---

## 1. What Changed Since v1.0

**Headline: the project is no longer dormant.** v1.0 was compiled on the assumption that both repos had gone quiet after 15 June 2026 (23 days idle at the time). That has since reversed — active development resumed on **26 July 2026** and ran through **3 August 2026** (frontend +11 commits to 99 total, backend +12 commits to 70 total). This update re-audits the codebase against that new work.

### The two pre-launch security blockers from v1.0 are both fixed

| v1.0 finding | Status now |
|---|---|
| JWT auth middleware written but applied to zero routes — API reachable via any `X-User-ID` header | **FIXED** — Commit `148fc39` (26 Jul) wraps `/api/ai`, `/api/admin`, `/api/projects`, `/api/notifications`, `/api/admin/rules`, `/api/admin/departments` in `authenticateToken` at the router-mount level in `src/index.ts`. Public-by-design routes (login, signup, invite validate/accept) apply it selectively per-route instead. |
| `ENCRYPTION_KEY` missing/short silently falls back to a hardcoded in-source key | **FIXED** — Same commit adds `src/config/env.ts`, which calls `required("JWT_SECRET")` and `required("ENCRYPTION_KEY", 32)` and is imported first-line in `src/index.ts` — missing/short values now crash the process at startup instead of degrading silently. `encryption.ts` no longer contains a fallback key. |

### One of the two mock-data pages is fixed; the other is now honestly labeled

| v1.0 finding | Status now |
|---|---|
| `/development` — every widget sourced from `lib/mock-data.ts`, presented as live | **FIXED** — Commit `83706bd` (26 Jul): now fetches real projects/tasks/sprints/commits via `projectApi`. The one piece with no real backing yet (historical sprint-velocity trend) is kept, but now explicitly labeled "Demo data" in the UI rather than presented as real. |
| `/product-modeling` — four fictional products hardcoded inline, no real backing | **STILL MOCK, NOW LABELED** — Same commit adds a banner disclosing the content is sample data — there is still no backend model for product modeling, so the underlying gap is unresolved, but it no longer misrepresents itself as live. |

### A major new feature shipped that v1.0 never saw: the Phased Workflow

Commit `511463f` (26 Jul, backend) plus a matching frontend push add a full **requirements → documentation → architecture → implementation → testing → review** pipeline, entirely new:

- **4 new Prisma models** — `ProjectPhaseState`, `PhaseArtifact`, `PhaseApproval`, `WorkflowRun` — all with real `onDelete: Cascade` relations to `Project` (notably *not* repeating the orphaning bug called out in v1.0 for chat/activity rows).
- **New route group** `/api/projects/:projectId/phases/*` (in `phase-routes.ts`, not yet in CLAUDE.md): list phase states, list/create artifacts, approval history, workflow runs, and per-phase `start` / `run` (AI drafts a proposal) / `request-approval` / `approve` / `request-changes` actions.
- **Frontend:** `components/project/phase-stepper.tsx`, an Architecture Phase view, brief-input + copy/download-PDF + revise-after-approval for phase docs, and a batch task runner with dependency ordering and mid-task Q&A.
- **Backend AI:** the coding agent gained task detail / architecture / memory / clarification awareness, and `ai-service.ts` nearly doubled — 1,378 → **2,373 lines** — across several same-day "implement AiService with OpenAI agentic tool support" commits (26–30 Jul), which read as iterative rewrites of the same feature rather than distinct additions.

*This is a genuinely new subsystem, not a patch — it belongs in the main inventory (§3–§6 below), not just this changelog.*

### Unchanged from v1.0 — still open

| Item | Status |
|---|---|
| No automated tests, no CI in either repo | UNCHANGED |
| `GET /api/projects/config/s3` debug endpoint (AWS config exposure) | PARTIAL — route still exists and is not admin-gated, but is no longer reachable with zero identity — it now sits behind the global `authenticateToken` on `/api/projects` like every other route on that router, since fix #1 above applies at the mount point, not per-route. |
| Rules engine only executes 2 of the rule types it lets you create (`sprint_auto_close`, `overdue_escalation`) | UNCHANGED |
| Two parallel S3 implementations (`s3.service.ts` dead, reads wrong env var `AWS_S3_BUCKET_NAME`) | UNCHANGED — confirmed zero importers, still ships |
| Duplicate terminal implementations (real WebSocket one vs. simulated `/development/terminal`) | UNCHANGED |
| Orphaned frontend files: `app/api/ai/chat/route.ts`, `lib/enhanced-ai-service.ts`, `lib/context-manager.ts`, `lib/github-service.ts` | UNCHANGED |
| `lib/project-ai-service.ts` — literal 0-byte file | UNCHANGED — confirmed still 0 bytes |
| Duplicate signup components (`signup-form.tsx` / `signup-form-with-role.tsx`) | UNCHANGED |
| Duplicate AI chat route `/projects/[projectId]/ai` alongside the in-tab AI Assistant | UNCHANGED — page still present |
| `ProjectChatMessage` / `ProjectActivity` have no real Prisma relation to `Project` — orphan on delete | UNCHANGED — worth noting the team clearly knows how to do this correctly now, since all 4 new phase-workflow models use proper cascading relations |
| Internal docs (CLAUDE.md) understate the real route count | WORSE — the gap has grown; the new `/phases/*` group (9 endpoints) isn't documented either |

---

## 2. Updated One-Paragraph Summary

Anka OS remains a substantial product, and it is **active again** after a six-week pause. The 26 Jul – 3 Aug push did two things at once: it closed the two items v1.0 flagged as pre-launch blockers (unauthenticated API, insecure encryption fallback) and one of its two fake-data pages, *and* it shipped an entirely new phased-workflow subsystem (requirements → documentation → architecture → implementation → testing → review) with its own AI-driven approval flow. The remaining gaps are almost entirely the same ones v1.0 named — no tests, a decorative rules engine, a handful of confirmed-dead files, duplicate terminal/signup/AI-chat implementations — none of which this push touched. The one new observation is a documentation debt now compounding on itself: CLAUDE.md and the internal route map were already stale in v1.0, and the new phase-workflow routes and models widen that gap further.

---

## 3. Data Model — Delta

23 → **27** Prisma models. All four additions belong to the phased workflow (see §1); everything else in v1.0's data-model inventory is unchanged, including the two flagged `RISK` items (`ProjectFile.size` as String; `ProjectChatMessage`/`ProjectActivity` with no cascade).

| New model | Key fields | Notes |
|---|---|---|
| ProjectPhaseState | phase, status, approvedById?, approvedAt? | `@@unique([projectId, phase])`; cascades on project delete |
| PhaseArtifact | phase, type, title, content (Text), version, approved | relates to `ProjectDecision[]`; cascades on project delete |
| PhaseApproval | phase, approvedById, decision, comments? | append-only approval log; cascades on project delete |
| WorkflowRun | triggerType, currentPhase, status, modelUsage (Json), costUSD | tracks AI cost per phase run; cascades on project delete |

---

## 4. Backend API — Delta

~50 → **~59** real endpoints. New group, mounted under each project and layered behind the now-global `authenticateToken`:

| Method & Path | Purpose |
|---|---|
| `GET /api/projects/:id/phases` | List phase states for a project |
| `GET /api/projects/:id/phases/approvals?phase=` | Approval history for a phase |
| `GET/POST /api/projects/:id/phases/artifacts` | List / create phase artifacts (docs, diagrams, decision logs) |
| `GET /api/projects/:id/phases/runs` | Workflow run history (incl. AI cost/model usage) |
| `POST /api/projects/:id/phases/:phase/run` | AI drafts a phase proposal, logs a WorkflowRun |
| `POST /api/projects/:id/phases/:phase/start` | Mark a phase in-progress |
| `POST /api/projects/:id/phases/:phase/request-approval` | Move phase to awaiting_approval |
| `POST /api/projects/:id/phases/:phase/approve` | Approve a phase, records PhaseApproval |
| `POST /api/projects/:id/phases/:phase/request-changes` | Send phase back with feedback |

All are new/undocumented relative to CLAUDE.md, same as the majority of v1.0's route inventory.

---

## 5. Backend Services — Delta

| Service | What changed |
|---|---|
| `middleware/auth.ts` | **FIXED** — now actually wired in at `src/index.ts` router-mount level for every non-public route group. |
| `utils/encryption.ts` | **FIXED** — insecure fallback key removed; key is sourced from the now-required `ENCRYPTION_KEY`. |
| `config/env.ts` | **NEW** — fail-fast startup validation for `JWT_SECRET` and `ENCRYPTION_KEY` (min length 32), imported before any module that signs/encrypts. |
| `ai-service.ts` | 1,378 → 2,373 lines. Still gpt-4o (chat/agent) + gpt-4o-mini (cost-estimate paths) — CLAUDE.md's "gpt-4" claim for the coding agent remains inaccurate, and now also undersells the model actually used for phase-drafting calls. Gained phase-drafting, task-detail, architecture, memory, and clarification capabilities for the new workflow. |
| `s3.service.ts` | UNCHANGED — still reads `AWS_S3_BUCKET_NAME`, still has zero importers, confirmed dead. |
| `rule-engine.ts` | UNCHANGED — still exactly 2 executable rule types. |
| `github.service.ts` | Gained empty-repo handling: syncs gracefully against a repo with no commits yet, and initializes empty repos via the Contents API when the agent pushes changes. |

---

## 6. Frontend Pages — Delta

| Route / Component | Data | What changed |
|---|---|---|
| `/development` | FIXED | Now backend-wired for projects/tasks/sprints/commits; only the velocity trend remains placeholder, explicitly labeled. |
| `/product-modeling` | LABELED MOCK | Still sample content (no backend model exists), now disclosed via an on-page banner instead of presented as real. |
| Phase Stepper + Architecture Phase view | NEW | `components/project/phase-stepper.tsx` — drives the requirements→...→review UI; brief input, copy/download-PDF, and revise-after-approval for phase docs. |
| Batch task runner | NEW | Dependency-ordered batch execution of tasks with mid-task Q&A. |
| ProjectAIAssistant | NEW | `components/ai/project-ai-assistant.tsx` — multi-phase agent capabilities, loading/self-healing status reporting; appears to have gone through several same-week rewrites (4 commits, 29–30 Jul, similar messages) rather than one linear build. |
| `/development/terminal` (fake) | UNCHANGED | Still a fully simulated standalone page, coexisting with the real WebSocket terminal in the IDE tab. |
| `/projects/[projectId]/ai` (duplicate) | UNCHANGED | Still present alongside the in-tab AI Assistant. |
| `signup-form.tsx` / `signup-form-with-role.tsx` | UNCHANGED | Both still present; which is live is still unclear from the file layout alone. |

---

## 7. Updated Recommended Next Steps

1. **Confirm the `/config/s3` debug endpoint is acceptable behind auth-only** — it's no longer publicly reachable (fix #1 covers it), but it's still not admin-gated specifically; anyone with a valid session token, not just admins, can read AWS config state. Decide if that's the intended blast radius.
2. **Add a baseline automated test suite + CI** — still nothing here; now more overdue given a second feature wave (phased workflow) has shipped with zero regression coverage.
3. **Delete the confirmed-dead code** — `s3.service.ts`, the four orphaned frontend AI files, the empty `project-ai-service.ts`, and one of the two signup forms. None of this was touched in the 26 Jul – 3 Aug push despite it being flagged in v1.0.
4. **Decide the fate of the decorative Rules engine** — unchanged; still only 2 of N rule types execute.
5. **Reconcile the two terminal implementations** — unchanged.
6. **Give `/product-modeling` a real backend model** — the mock-label fix is good interim honesty, but the underlying feature still has no persistence layer.
7. **Update CLAUDE.md / internal docs** — now more urgent: it undercounted routes by ~20 in v1.0, and the gap has grown by 9 more with the undocumented `/phases/*` group, plus the AI model version claim (gpt-4 vs. actual gpt-4o/gpt-4o-mini) is still wrong.
8. **Consolidate the AiService rewrite commits** — four same-week commits with near-identical messages ("implement AiService with OpenAI agentic tool support/function calling...") suggest either squash-worthy iteration or, worse, an actual merge/duplication problem worth a quick diff-review before it's forgotten.

---

## 8. Sprint 0 — Gap Analysis vs. v2.0 Company Operations & AI-Human Delivery Architecture Spec

A separate document, *Anka OS v2.0 | Company Operations & AI-Human Delivery Architecture* (dated 5 Aug 2026), lays out a much larger target: turning Anka OS from a single-project phased-delivery tool into a full company operating system — multi-project portfolio control, department workshops, multi-repository projects, versioned project intelligence, hallucination controls, and dependency-graph task orchestration. That document explicitly requires a **Sprint 0 current-state audit** before any migration work starts ("No large rewrite... should start before the current-state audit, domain boundaries, migration approach, and compatibility strategy are approved"). This section is that audit, run directly against the live Prisma schema and codebase on 5 Aug 2026.

### 8.1 What already exists toward the spec

| Spec capability | Current state |
|---|---|
| Six-phase pipeline (§9) | **DONE**, matches spec exactly — `ProjectPhaseState`/`PhaseArtifact`/`PhaseApproval`/`WorkflowRun` implement intake→docs→architecture→implementation→testing→review, hardcoded as string phases rather than a generic template (expected — spec's own §17.5 says keep these during migration). |
| Department (§8) | **PARTIAL** — `Department` model exists (name, headUserId) but has no relation to `Project` or `User`; `User.department` is a free-text string, not a foreign key. No department-owned records, no workshop views beyond Development. |
| Task as first-class object (§7.2) | **PARTIAL** — `ProjectTask` has status/priority/phase/dueDate/checklist/comments/dependencies, but no acceptance criteria field, no risk class, no AI-permission-level field, no reviewer/approver distinct from assignee. |
| Task dependency graph (§14) | **PARTIAL, further along than the spec assumes** — `TaskDependency` (blocking/blockedBy) exists for manual task links, **and** three models not mentioned in the spec at all — `TaskDecomposition`, `SubTaskExecution`, `AgentManifest` — already implement AI-driven request decomposition into a topologically-ordered sub-task graph with per-subtask status and a "FileManifest" validation/approval step. This is real, independent progress toward §14's execution pipeline that the spec's authors didn't know about. |
| Project intelligence / memory (§12) | **PARTIAL** — `ProjectMemorySummary` (1:1, versioned but no history table), `ProjectDecision`, `ProjectRepoSnapshot` exist. No context-authority ordering, no `ContextSnapshot` persisted per agent run, no distinction between "verified," "approved," "inferred," "unknown" evidence labels (§13.1). |
| Audit trail (§3, §5.2) | **PARTIAL** — `ProjectActivity` logs actions but (per v1.0 finding, still open) has no real FK relation to `Project`, so it isn't reliably queryable per-project after cascade scenarios, and it doesn't record AI model/context/cost per action the way `WorkflowRun.modelUsage`/`costUSD` does for phase runs. |
| Approval gates (§15) | **PARTIAL** — `PhaseApproval` covers the six-phase pipeline only; no generic `ApprovalPolicy`/`ApprovalRequest` usable outside that pipeline (e.g. for a bug-fix change request per §10.3). |
| Governance / AI permission levels (§15.1) | **MISSING** — no per-task or per-user AI permission-level field anywhere; the coding agent's risk boundaries are enforced only in prompt text (`ai-service.ts`), not as a queryable policy. |

### 8.2 What does not exist yet

| Spec capability | Status |
|---|---|
| Organization, Client, ClientContact, Engagement models (§5, §17.1) | **MISSING** — no multi-tenant/client layer at all; the app currently models one implicit organization. |
| Role/PermissionPolicy as real RBAC (§5.1) | **MISSING** — `User.role` is a free-text string ("admin"/"manager"/"developer"/etc., not enforced anywhere in code beyond display), matching the exact gap v1.0 flagged for `Department`. |
| Workstream, Milestone, Request/ChangeRequest (§7.1) | **MISSING** — `ProjectTask` has a flat `phase` string but no workstream/milestone grouping layer above it. |
| Generic WorkflowTemplate / WorkflowInstance / WorkflowStageInstance (§17.2) | **MISSING** — workflow logic is hardcoded to the six phase-pipeline string values; nothing else in the app can define its own stage sequence (e.g. the spec's shorter "bug fix" workflow in §10.3 has no representation). |
| Multi-repository project model — `ProjectRepository` (§11) | **MISSING** — `Project` has exactly one `githubUrl`/`githubToken`/`localPath` triplet. A project cannot register a separate frontend + backend repo today; this is the single largest structural gap against the spec, since §11 treats multi-repo as a first-class requirement. |
| Coordinator/repository-worker pattern (§11.2) | **MISSING** — the existing coding agent (`runCodingAgent` in `ai-service.ts`) operates against one repo/local path; there is no cross-repo impact analysis, shared contract, or per-repo worker concept. |
| ContextSnapshot persistence (§12.5) | **MISSING** — agent runs assemble context on the fly from `ProjectRepoSnapshot` + prompt strings; nothing is frozen/persisted per run, so repeatability/audit/hallucination-analysis per §13.3 metrics isn't possible today. |
| ArchitectureDriftRecord (§12.4) | **MISSING**. |
| File/resource reservations (§14.3) | **MISSING** — no collision detection between concurrent agent runs or human+AI edits on the same files. |
| Portfolio-level views (§6) | **MISSING** — no cross-project dashboard; `/development` (per §1 above) now shows real per-project data but nothing aggregates health/risk/capacity across projects the way §6.3's Project Health Model describes. |
| Shared platform services as named services (§16) — Workflow Engine, Approval Engine, Search, Feature Flags, AI Gateway | **MOSTLY MISSING** — Auth, Notification, File Storage, and Audit exist in some form; Workflow Engine and Approval Engine are hardcoded to phases rather than generic; there is no feature-flag system, no dedicated AI Gateway (model calls are inlined per-service), no unified search. |
| Release/Deployment/Incident/TechnicalDebtItem records (§17.3) | **MISSING** — releases happen via the GitHub push flow with no persisted `Release` record separate from the git commit itself. |

### 8.3 Recommendation

This is a multi-month, schema-altering roadmap (the spec's own §20 lays out 8 stages). Given the size and the fact that it touches live production schema and multi-tenant assumptions the current single-org app doesn't make, **the sensible next step is to pick one Sprint-1-sized slice and confirm it before any migration code is written** — consistent with the spec's own gate ("architecture review approves migration plan" before Stage 1 begins). See the open question raised with the team below for the candidate slice.

## 9. Sprint 1 Progress — Multi-Repository Project Model

Following the Sprint 0 gap analysis (§8), the team picked **multi-repository support** (spec §11) as the first Sprint-1 slice — the single largest structural gap, since `Project` previously had exactly one `githubUrl`/`githubToken`/`localPath` triplet. This was built and verified end-to-end against the real dev database on 6 August 2026.

### 9.1 What shipped

| Layer | What was built |
|---|---|
| Schema | New `ProjectRepository` model (backend `prisma/schema.prisma`): `name`, `role` (frontend/backend/mobile/infrastructure/shared_library/documentation/data/custom), `githubUrl`, encrypted `githubToken`, `localPath`, `defaultBranch`, `languages`/`frameworks` (tech profile), `buildCommand`/`testCommand`/`lintCommand`/`typecheckCommand`, `currentIndexedCommit`, `ownerUserId`, `dependencies`, `executionPolicy` (JSON), `isPrimary` flag. Cascades on `Project` delete. Matches the spec's §11.1 field list. |
| Migration | `20260806130207_add_project_repository`, created and applied against the real dev DB (`anka-os` on `localhost:5432`). `Project.githubUrl`/`githubToken`/`localPath` were **kept, not removed**, per the spec's own migration rules (§20.1) and the compatibility approach used for the existing phase models. |
| Backfill | `scripts/backfill-project-repositories.ts` — idempotent, mirrors each project's legacy repo fields into one `isPrimary: true` `ProjectRepository` row. Run against the real dev DB: **4 projects backfilled, 0 skipped** (all 4 projects that had a `githubUrl` now have a primary repo record). |
| API | New route group `/api/projects/:projectId/repositories` (list/create/update/delete), sitting behind the same global `authenticateToken` as the rest of `/api/projects`. Token validation and AES-256-CBC encryption reuse the existing `utils/encryption.ts` helpers — no new crypto path introduced. The primary (legacy-backfilled) repository is protected from deletion via the API (must edit the project's main GitHub connection instead). |
| Frontend | New "Repositories" tab on the project detail page (`components/project/project-repositories-panel.tsx`), plus `projectRepositoryApi` in `lib/project-api.ts` following the existing `getHeaders()` pattern. Lists repos with role badges, primary-repo indicator, add dialog (name/role/GitHub URL/token/local path), and delete-with-confirmation for non-primary repos. |

### 9.2 Verification performed

- `npx tsc --noEmit` clean on both repos.
- Full CRUD lifecycle tested with a real JWT (via `/api/auth/login`) against the running dev server and real dev DB: list → create → update → delete-blocked-on-primary → delete-non-primary → list-again. All behaved as expected.
- Frontend page (`/development/projects/:id`) confirmed rendering (HTTP 200, no compile errors in the dev server log) with the new Repositories tab wired in.

### 9.3 A live bug found and fixed as a side effect

Running the migration surfaced a real, pre-existing defect: three Prisma models added in the 26 Jul – 3 Aug AI-agent work — `AgentManifest`, `TaskDecomposition`, `SubTaskExecution` — **had never had a migration generated or committed**. Any code path calling `prisma.agentManifest.*` or `prisma.taskDecomposition.*` against a real database would have thrown a `relation does not exist` Postgres error. Creating the `add_project_repository` migration also generated and applied the missing tables for these three models as a side effect, since Prisma diffs actual DB state against the full current schema. This should be treated as a genuine bug that existed in the repo, not something introduced by this work.

### 9.4 Still not done from §11 (out of scope for this slice)

- Coordinator/repository-worker pattern (§11.2) — the coding agent still operates against a single repo/local path; no cross-repo impact analysis or shared-contract mechanism yet.
- Parallel execution rules / file reservations (§11.3, §14.3) — not built.
- No UI yet for editing an existing repository's tech profile/build commands after creation (create/list/delete only; update exists at the API level but isn't exposed in the panel).

## 10. Sprint 1 Progress (continued) — AI Agent Wired to the Repository Registry

§9 shipped the `ProjectRepository` data model, but flagged (§9.4) that nothing actually read it yet — the coding agent still only ever saw the legacy single-repo fields. This closes that loop: **a project with 2+ repos can now have the AI agent actually target and get real context from a non-primary repo**, not just the primary one.

### 10.1 What shipped

| Layer | What was built |
|---|---|
| Schema | New `RepositorySnapshot` model — 1:1 with `ProjectRepository`, additive and separate from `ProjectRepoSnapshot` on purpose. The legacy single-repo path (`ProjectRepoSnapshot`, keyed by `projectId`) is completely untouched, so existing single-repo projects have zero behavior change. Migration `20260806131832_add_repository_snapshot`, applied to the real dev DB. |
| Backend service | `ProjectGitHubService.buildRepositoryContext(repositoryId, githubUrl, token)` and `getRepositorySnapshot(repositoryId)` — repo-scoped siblings of the existing `buildProjectContext`/`getSnapshot`. `ProjectRepositoryService.sync()` wraps this with decryption + a real API endpoint. |
| API | `POST /api/projects/:projectId/repositories/:repoId/sync` — pulls a fresh snapshot for one specific repo. |
| Agent wiring | `ChatRequest` gained an optional `repositoryId`. `runCodingAgent` in `ai-service.ts` now resolves context (snapshot, `githubUrl`, decrypted token, `localPath`) from the targeted `ProjectRepository` when `repositoryId` is passed and isn't the primary repo — otherwise falls through to the exact same legacy code path as before. This is a narrow, additive change to a ~7-stage, actively-tuned agent pipeline; the rest of the pipeline (intent classification, execution contract, staged progress events) is untouched. |
| Frontend | Repo selector dropdown in the AI Agent header (only rendered when a project has >1 repo), threaded through `runAgent`/`runAgentStream` in `lib/ai-client.ts`. "Sync AI Context" button on each non-primary repository card in the Repositories panel. |

### 10.2 Verification performed

- `npx tsc --noEmit` clean on both repos after the change.
- Full CRUD + sync smoke test against the real dev DB and running server, using a real public repo — the `/sync` call itself hit a **401**, traced to the global `GITHUB_TOKEN` env var being stale/invalid (confirmed pre-existing and unrelated: the existing legacy `/sync-github` endpoint succeeds on the same repo because that project has its own valid per-project token; anything relying on the global fallback token would fail identically, old code or new).
- To verify the actual mechanism (not just the CRUD layer), ran a direct one-off script using this project's own valid token against a temporary secondary `ProjectRepository`: `buildRepositoryContext` produced a real `RepositorySnapshot` (8-file tree, 2 key files), and `getRepositorySnapshot` correctly read it back in the shape `runCodingAgent` expects. Test data cleaned up afterward.

### 10.3 New known issue found

**`GITHUB_TOKEN` (global env fallback) is stale/invalid.** `github.service.ts`'s `githubHeaders()` falls back to `process.env.GITHUB_TOKEN` whenever a per-repo/per-project token isn't set. That value in `.env` returns 401 from the GitHub API. This affects any repo — legacy or new `ProjectRepository` — that doesn't have its own valid encrypted token. Not urgent (most real usage so far has per-project tokens), but worth rotating.

### 10.4 Still not done (unchanged from §9.4)

Coordinator/repo-worker pattern, cross-repo impact analysis, and parallel file reservations remain future work — this slice makes the agent capable of being pointed at one repo at a time, not of reasoning across multiple repos in a single run.

## 11. Sprint 1 Progress (continued) — ContextSnapshot Persistence

Next backlog item picked (§8's "Still not done" list): `ContextSnapshot` persistence (spec §12.5/§13) — the actual mechanism behind the spec's hallucination-control section. Every `runCodingAgent` call now writes a frozen, auditable record of exactly what it saw before doing anything else.

### 11.1 What shipped

| Layer | What was built |
|---|---|
| Schema | New `ContextSnapshot` model — purely additive, no changes to any existing model. Captures: `projectId`, `repositoryId` (which repo was targeted, null = primary/legacy), `sessionId`, `userMessage`, resolved repo info (`repoUrl`/`repoName`/`defaultBranch`/`repoLastSyncedAt`), `keyFilesUsed` (the actual file list in context for this run), `approvedArchitectureId` (if an approved architecture doc was in scope), and the classified `taskType`/`risk`/`estimatedComplexity`/`targetPaths`. Migration `20260806135034_add_context_snapshot`, applied to the real dev DB. |
| Agent wiring | Inserted into `runCodingAgent` right after the execution contract is built (before Stage 1 of the 7-stage pipeline), using the same `snapshot`/`githubUrl`/`resolvedRepositoryId` variables the §10 multi-repo work introduced — so a snapshot correctly records *which* repo (primary or secondary) a run actually targeted. The write is wrapped in try/catch and is explicitly best-effort: a failed audit write can never block or fail the actual agent run. |
| API | `GET /api/ai/projects/:projectId/context-snapshots` — returns the last 50 snapshots for a project, for future audit/debugging UI. No frontend view built yet (backend/data-layer only, per scope). |

### 11.2 Verification performed

- `npx tsc --noEmit` clean on both repos.
- Migration applied cleanly to the real dev DB (additive-only `CREATE TABLE`, confirmed via the generated SQL).
- The exact `prisma.contextSnapshot.create()` call shape used inside `runCodingAgent` was verified with an isolated script against the real dev DB (create → read back via the same query the new endpoint uses → clean up) — confirmed field types and values round-trip correctly.
- The live `GET .../context-snapshots` endpoint was hit against the running dev server with a real JWT — returns the correct empty-array shape.
- **Not done:** an actual live `runCodingAgent` invocation was not triggered end-to-end, since that pipeline makes multiple real OpenAI calls per run — didn't want to spend API budget just to confirm a database write whose call shape was already verified directly. The code path is a small, isolated, try/caught addition to an otherwise-unchanged pipeline; recommend confirming with one real agent run when convenient.

### 11.3 Still not done from §12–§13

- Evidence labels ("Verified-Repository," "Approved-Human," "Inferred-Agent," "Unknown" per spec §13.1) are not yet attached to individual claims the agent makes — this snapshot captures *what context existed*, not a per-claim evidence trail.
- No `ArchitectureDriftRecord` yet (flagging when approved architecture and live repo state disagree).
- No audit UI — the data is queryable via API only.

## 12. Sprint 1 Progress (continued) — Audit UI for ContextSnapshot

§11 shipped `ContextSnapshot` as a write-only table — every agent run recorded its context, but nothing displayed it. Closed that loop with a read-only audit panel.

### 12.1 What shipped

- `GET /api/ai/projects/:id/context-snapshots` client wired into `lib/ai-client.ts` (`getContextSnapshots`), with a matching `ContextSnapshot` frontend type.
- `components/ai/context-snapshot-audit-panel.tsx` — compact card list per snapshot: user message, timestamp, task-type/risk badges, targeted repo name (or "(primary)" when `repositoryId` is null), and file-in-context count.
- Mounted under the existing **Activity** tab on the project detail page, below the human activity feed, as an "AI Context Audit" section — not a new top-level tab, to keep the addition low-footprint.

### 12.2 Verification performed

- `npx tsc --noEmit` clean.
- Confirmed the live API response shape matches the frontend type exactly (inserted a real row via script, fetched it through the actual `/context-snapshots` endpoint with a real JWT, compared field-for-field).
- Started this project's own dev server (not previously running in this session) and did a real render check: `GET /development/projects/:id` returned 200 with a clean compile log and no runtime errors, with a real snapshot row present to confirm the non-empty state renders. Test row cleaned up afterward.
- **Process note:** cleanup used `pkill -f "next dev"`, which was too broad and also killed an unrelated Next.js dev server the user had running on port 3000 (a separate portfolio project). Not restarted, since the exact project directory wasn't known — flagged directly to the user rather than guessing.

---

*Anka OS Internal — Confidential — Project Status Report v2.0 — 5 August 2026 — supersedes v1.0 (8 July 2026)*
*§8 (Sprint 0 gap analysis) added 5 August 2026 against "Anka OS v2.0 | Company Operations & AI-Human Delivery Architecture."*
*§9 (Sprint 1 progress — multi-repo model) added 6 August 2026.*
*§10 (Sprint 1 progress — agent wired to repository registry) added 6 August 2026.*
*§11 (Sprint 1 progress — ContextSnapshot persistence) added 6 August 2026.*
*§12 (Sprint 1 progress — audit UI for ContextSnapshot) added 10 August 2026.*
*§13 (real RBAC, and a critical signup vulnerability fix) added 10 August 2026.*

---

## 13. Real RBAC — and a Critical Vulnerability Found and Fixed

Next backlog item: turn `User.role` from an unenforced free-text string into real, enforced RBAC (flagged as a risk since v1.0). Scoping this surfaced something much worse than expected.

### 13.1 Critical finding: public signup allowed self-service admin escalation

**`POST /api/auth/signup` — a fully public, unauthenticated endpoint — accepted a client-supplied `role` field and validated it only against `["admin", "user", "manager"]`.** Anyone could register with `role: "admin"` in the request body and receive a valid admin JWT instantly, no invite or approval required.

This was not merely a theoretical API-level gap: **the live, actually-rendered `/auth/signup` page used `signup-form-with-role.tsx`, which has a plain dropdown with a literal "Admin" option.** Any visitor to the signup page could select it and get full admin access. This had been sitting behind two duplicate signup components (`signup-form.tsx` vs `signup-form-with-role.tsx`) flagged as "unclear which is live" since the v1.0 report §7 item #10 — it turned out the vulnerable one was live.

**Fixed:**
- Backend (`auth-controller.ts`): public signup no longer accepts a client-supplied role at all — it's hardcoded to `"developer"` regardless of what's in the request body. Real role assignment now only happens through the admin-gated invite flow.
- Frontend: `/auth/signup` now renders `signup-form.tsx` (which never sent a `role` field to begin with — the correct component). `signup-form-with-role.tsx` was deleted outright, not just unlinked, to remove any risk of it being re-wired later.

### 13.2 What else shipped (the RBAC work itself)

| Layer | What was built |
|---|---|
| Schema | New `Role` model — a canonical registry (`admin`, `manager`, `developer`, `designer`, `tester`), seeded via `prisma/seed.ts`. Deliberately **not** a hard FK on `User.role` — that column stays a String so the ~16 existing `user.role === '...'` comparisons across both repos keep working unchanged. The registry is what makes the string a real, validated value instead of arbitrary free text. Migration `20260810163218_add_role_registry`, additive-only. |
| Middleware | `src/middleware/rbac.ts` — `requireRole(...roles)` (403s if `req.user.role` isn't in the allowed list; must run after `authenticateToken`) and `isValidRole(role)` (checks against the seeded `Role` table, 60s in-memory cache). |
| Enforcement | `requireRole("admin")` applied at the mount point for `/api/admin`, `/api/admin/rules`, `/api/admin/departments` (in `src/index.ts`), and per-route in `invite-routes.ts` for invite create/list/revoke and user management — leaving `validate/:token` and `accept/:token` public by design, unchanged. |
| Validation | `isValidRole()` now gates invite creation and user-role updates — an admin can no longer set a user's role to an arbitrary string either. |
| Frontend | `app/admin/layout.tsx` (new) wraps every `/admin/*` page in the existing-but-previously-unused `ProtectedRoute` component with `requiredRole="admin"` — this component already had role-gating logic built in, it had simply never been imported anywhere in `app/`, so `/admin/*` pages had zero client-side gating before this. |

### 13.3 Verification performed

All tested live against the real dev DB and running backend with real JWTs:
- Signed up with `role: "admin"` in the request body → received `role: "developer"` back. Escalation closed.
- That same non-admin user hitting `/api/admin/departments` → `403 {"message":"Requires role: admin"}`.
- The real seeded admin (`admin@anka.os`) hitting the same route → `200`.
- Non-admin attempting `POST /api/invites` → `403`.
- Admin attempting to create an invite with `role: "superadmin"` → `400 {"error":"Invalid role: superadmin"}`.
- `npx tsc --noEmit` clean on both repos.
- `/admin` and `/auth/signup` both compile and return 200 against a real (temporarily started, then cleanly stopped by PID) dev server.
- Test user and test invite attempts cleaned up afterward.

**Not independently verified:** the frontend `ProtectedRoute` redirect/"Access Denied" UI itself wasn't exercised in an actual browser session (it depends on client-side `localStorage` auth state that curl can't simulate) — confirmed by reading the component logic and confirming clean compilation, not by a live click-through. Worth a real browser check next time you're testing as a non-admin user.

### 13.4 Scope note

This delivers real *enforcement* and *validation* — not the full generic `PermissionPolicy`/fine-grained-permission system from spec §5.1/§17.1. `Role` is a flat registry (5 roles, no per-permission granularity yet); `requireRole()` is a simple allow-list, not a policy engine. That's a deliberate, disclosed scope choice, not an oversight — a bigger permission system can build on this registry later if the team needs finer-grained control than "admin vs. everyone else."

---

## 14. Small Follow-up — S3 Debug Endpoint Now Admin-Gated

Immediate, one-line follow-up to §13: `GET /api/projects/config/s3` (flagged since v1.0 §7 item #11, and re-flagged in §1's "still open" table) was reachable by any authenticated user, not just admins — it exposes whether AWS env vars are set, the bucket name, and key length. Now that `requireRole()` exists, added `requireRole('admin')` directly on that route in `project-routes.ts`.

**Verified live:** a freshly-signed-up non-admin user got `403 {"message":"Requires role: admin"}`; the real admin got `200` with the expected config-status payload. Test user cleaned up afterward.

---

## 15. Dead Code Cleanup

Picked from the remaining backlog: delete the confirmed-dead code flagged since v1.0 §7. Re-verification changed the plan for one item.

### 15.1 Correction: `s3.service.ts` was not actually dead

v1.0 (and this report's own §9.4) described `s3.service.ts` as having zero importers and being confirmed dead. Re-checking before deleting found that's no longer true — `project-controller.ts`'s `getFileDownloadUrl` had picked up a real call to `S3Service.getPresignedUrl` at some point since. That's worse than dead code: it meant the long-standing `AWS_S3_BUCKET_NAME` vs. `AWS_S3_BUCKET` mismatch (the exact bug a past commit already fixed once, in `upload.service.ts`) was live again in the download path. Neither env var is actually set in this dev `.env`, so both silently fall back to the same default bucket name and the bug isn't currently visible — but it would break downloads the moment someone configures a real bucket via the documented `AWS_S3_BUCKET` var, since uploads and downloads would then point at two different buckets.

**Fixed properly instead of just deleted:** added `generateDownloadUrl(key)` to `upload.service.ts` (the correct implementation, already used for uploads/deletes) using its single `BUCKET` constant, repointed `project-controller.ts` at it, then deleted `s3.service.ts` — now there is exactly one S3 implementation, one bucket constant, no fork possible. Verified: compiles clean, backend stays healthy after restart, no other references remain. **Not independently verified:** an actual end-to-end file download, since no files exist on the test project and no real S3 credentials are configured in this dev environment — the fix was verified by code review + compile + confirming both upload and download now read the identical `BUCKET` constant, not by a live download.

### 15.2 Confirmed and deleted

Re-checked each for real importers before deleting (not just trusting the v1.0 report, since it turned out to be wrong for `s3.service.ts`):

| Removed | Why |
|---|---|
| `lib/enhanced-ai-service.ts` | Zero importers from `app/`/`components/`. Called the now-also-deleted `/api/ai/chat` route. |
| `lib/context-manager.ts` | Only imported by `enhanced-ai-service.ts` — dead transitively. |
| `lib/github-service.ts` | Zero importers (had its own unresolved `// TODO: Implement GitHub context building`, per v1.0). |
| `lib/project-ai-service.ts` | Literal 0-byte file. |
| `app/api/ai/chat/route.ts` | Only ever called by `enhanced-ai-service.ts`. Required its own `OPENAI_API_KEY` on the frontend deployment and violated the documented rule that only `project-api.ts`/`ai-client.ts` make HTTP calls. |
| `app/projects/[projectId]/ai/page.tsx` (duplicate AI chat route) | Superseded by the in-tab AI Assistant; zero nav links pointed to it anywhere. |
| `hooks/use-project-chat.ts` | Exclusively used by the deleted duplicate page. |
| `components/ui/context-panel.tsx` | Exclusively used by the deleted duplicate page. |

**Explicitly kept, not deleted:** `components/ui/chat-container.tsx` and `components/ui/session-list.tsx` — both looked related to the same dead cluster but turned out to be shared with the live `/ai/general` page. Confirmed via importer search before touching anything.

### 15.3 Verification performed

- `npx tsc --noEmit` clean on both repos (after clearing a stale `.next/` type-check cache that referenced the just-deleted routes — expected, gitignored, not a real error).
- Started this project's own dev server (stopped afterward by PID, not a broad `pkill`, learning from the earlier mistake): `/development/projects/:id` → 200, `/ai/general` → 200 (both untouched, confirming the shared components survived correctly), `/projects/:id/ai` (deleted route) → 404 as expected.
- Backend restarted cleanly (nodemon) after the `s3.service.ts` deletion and `upload.service.ts` change; health check 200.

---
