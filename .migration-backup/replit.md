# DonghuaStream

Streaming website for Chinese animation (Donghua) with subtitle Indonesia. Scrapes anichin.moe in real-time — no database required.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/donghua-stream run dev` — run the frontend (port 18837)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS v4, TanStack Query, Wouter
- API: Express 5
- Scraping: Axios + Cheerio (scrapes anichin.moe)
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `artifacts/donghua-stream/` — React frontend (pages, components, CSS)
- `artifacts/api-server/src/routes/donghua/` — web scraper + route handlers
- `artifacts/api-server/src/routes/donghua/scraper.ts` — all scraping logic (cheerio)
- `lib/api-spec/openapi.yaml` — source of truth for API contract
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- No database — all data is scraped on-demand from anichin.moe with in-memory TTL cache
- Cache TTL varies by endpoint: 3 min (ongoing), 5 min (completed/trending), 10 min (upcoming), 1 hour (streams)
- OpenAPI-first contract: spec → codegen → typed hooks on frontend
- Cinematic dark theme only (no light mode toggle needed for a streaming site)
- API server is shared backend at `/api` path; frontend is served at `/`

## Product

- Home: hero banner + ongoing/completed/upcoming sections
- Ongoing/Completed: paginated grids with Load More
- Schedule: weekly airing schedule grouped by day
- Search: live search by keyword
- Detail: series info + full episode list
- Watch: embedded video player (iframe) + episode sidebar

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After every OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen`
- The scraper depends on anichin.moe HTML structure — if that site changes layout, selectors in `scraper.ts` need updating
- `@workspace/db` is NOT used by this project (no DATABASE_URL needed)
- Vite build is resilient to missing PORT/BASE_PATH env vars (uses safe defaults); dev server still requires them via the artifact workflow

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
