# DonghuaStream

A streaming website for Chinese animation (donghua). Provides a browsable catalog, episode streaming, download links, and airing schedules — all sourced from anichin.moe via the Axly API.

## Run & Operate

- **API server** runs on port 8080 via the `artifacts/api-server: API Server` workflow
- **Frontend** runs on port 18837 via the `artifacts/donghua-stream: web` workflow (requires `pnpm install` first)
- `pnpm install` — install all workspace dependencies (run once after cloning)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (run after editing `lib/api-spec/openapi.yaml`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes to Postgres (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (needed by the API server and DB package)

## Accounts, Profiles & Comments

- Users can sign up / log in (email + password, bcrypt-hashed) and get a cookie session (`express-session` backed by Postgres via `connect-pg-simple`, table `user_sessions`).
- Profile settings (`/profile` page) let a user set their display name, a short bio, and pick an avatar from a **fixed preset list** (DiceBear-seeded, no image uploads) — enforced both in the UI and server-side (`updateProfileSchema` uses a `zod` enum of the same presets), so profile pictures can never contain adult/NSFW images.
- Display names and bios are checked against a wordlist-based profanity/NSFW filter (`artifacts/api-server/src/lib/moderation.ts`, English + Indonesian terms) and rejected if they match.
- Each episode (`seriesSlug` + `episodeSlug`) has its own comment thread, shown below the download section on the watch page. Comments are plain text only (HTML is rejected), max 500 characters, and pass through the same profanity/NSFW filter. Users can delete their own comments.
- Security hardening: rate limiting on auth (10/15min) and comments (15/5min) via `express-rate-limit`, session regeneration on login/register (prevents session fixation), `SameSite=Lax` + `httpOnly` cookies (`secure` in production), CORS origin allowlist via `ALLOWED_ORIGINS` (comma-separated) when `NODE_ENV=production`, `trust proxy` enabled for correct client IPs/secure cookies behind a reverse proxy.
- New tables: `users`, `comments`, `user_sessions` (see `lib/db/src/schema/`). Push schema changes with `pnpm --filter @workspace/db run push`.

## API Endpoints

All routes are prefixed `/api/donghua/`:

| Endpoint | Description |
|---|---|
| `GET /ongoing?page=N` | Currently airing donghua |
| `GET /completed?page=N` | Completed donghua |
| `GET /upcoming` | Upcoming donghua |
| `GET /drop?page=N` | Dropped donghua |
| `GET /search?q=...` | Search by title |
| `GET /detail?slug=...` | Full series detail + episode list |
| `GET /stream?slug=...` | Primary stream URL + all servers |
| `GET /servers?slug=...` | All video servers for an episode (includes Vidio if found) |
| `GET /download?slug=...` | Download links grouped by quality |
| `GET /schedule` | Weekly airing schedule |
| `GET /trending` | Featured/trending series |
| `GET /popular` | Latest releases from homepage |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with stale-while-revalidate in-memory cache
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`)
- Frontend: React 19 + Vite + Tailwind CSS 4
- Build: esbuild

## Where things live

- `artifacts/api-server/src/routes/donghua/scraper.ts` — all scraping logic (Axly API + anichin.moe direct)
- `artifacts/api-server/src/routes/donghua/index.ts` — Express routes + SWR cache layer
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for types)
- `lib/db/` — Drizzle schema and migrations
- `artifacts/donghua-stream/` — React frontend

## Architecture decisions

- **Upstream proxy pattern**: The API proxies `axlyapi.qzz.io` rather than scraping anichin.moe directly for most endpoints. Direct scraping is only used for the homepage popular list and Vidio server detection.
- **Stale-while-revalidate cache**: All routes use an in-memory SWR cache with configurable TTLs. Stream/servers/download cached for 1 hour; lists for 10 min; schedule for 2 hours.
- **Vidio server enrichment**: `/servers` attempts to scrape the episode page for a Vidio embed URL (with a 5s timeout) if the upstream API doesn't include one.
- **Image proxy**: All thumbnail/cover URLs are rewritten to go through `/api/image-proxy` to bypass hotlink protection.
- **OpenAPI-driven codegen**: Editing `openapi.yaml` and running codegen regenerates all TypeScript types and React hooks automatically.

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` to regenerate types.
- The API server workflow command is `PORT=8080 pnpm --filter @workspace/api-server run dev` — it builds before starting.
- `DATABASE_URL` must be set for the API server to start without errors.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Setup notes

- Imported project required `pnpm install` (node_modules were missing, causing both workflows to fail: `ERR_MODULE_NOT_FOUND: esbuild` on the API server, `vite: not found` on the frontend). After installing and restarting both workflows, everything — including the video player's server selector and download links — works correctly against live upstream data.
- `DATABASE_URL` is only consumed by `lib/db`; the current donghua routes don't touch the DB, so the API server starts and serves fine without it in dev.
