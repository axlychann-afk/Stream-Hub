---
name: Vercel Hobby serverless function limits and catch-all routing gotchas
description: Why adding a new /api/*.js file can silently 404 in production, and why req.query.path can be unreliable for catch-all routes on plain Vercel Functions.
---

Vercel's Hobby plan caps a deployment at 12 Serverless Functions (one file
under `api/` = one function, excluding `_`-prefixed helper files). Exceeding
it does not reliably fail the build loudly — one deployment silently 404'd
the newest-added route (fresh `x-vercel-id` with no region segment, `NOT_FOUND`,
zero server-side error) while all other functions kept working normally.

**Why:** a project already had ~11 files under `api/donghua/*.js`; adding one
more route file pushed the count to 13 and the extra one never got wired up,
even though the build log showed a clean success.

**How to apply:** if a *newly added* `/api/**` route 404s in production while
older ones work, and the failure is silent (no build error, no runtime
error), count the total non-underscore files under `api/**` first — don't
assume it's a code bug. Fix by consolidating routes into a catch-all dynamic
function (e.g. `api/donghua/[...path].js` dispatching by `req.url`'s
sub-path) instead of one file per route, which uses a single function slot
for an arbitrary number of logical routes and gives headroom to add more.

Separately: for plain Vercel Serverless Functions (not Next.js), don't trust
`req.query.<paramName>` to be populated for `[...paramName].js` catch-all
routes — it was empty in production despite working in every local test.
Parse the route segments directly from `req.url`'s pathname instead of
relying on Vercel to inject them into `req.query`.
