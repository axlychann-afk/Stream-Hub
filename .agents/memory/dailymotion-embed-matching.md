---
name: Dailymotion embed matching (DonghuaStream)
description: How/why Dailymotion server embeds are added per-episode, and why matching is alias-based not fuzzy.
---

DonghuaStream (artifacts/api-server + artifacts/donghua-stream) adds an optional
"Dailymotion" watch server sourced from a specific Dailymotion channel
(`dongchindopro`), alongside the existing anichin/Animasu-scraped servers.

**Rule:** matching a site series slug to a Dailymotion upload is done via an
explicit, manually maintained alias map (slug → normalized title code), never
fuzzy/derived matching.

**Why:** the channel's upload titles use ad-hoc, inconsistent abbreviations
(e.g. "BTTH", "ARMJI", "MSBS") that don't textually relate to the site's real
series titles/slugs, and some site slugs are internal codes unrelated to the
displayed title (e.g. the real slug for "BTTH Season 5" on this site is
`oyen-pertempuran-akhir-sekte-misty-cloud`). Guessing a mapping risks showing
the wrong show's video for an episode — a high-impact, silent mistake. An
unmapped series safely shows no Dailymotion server at all.

**How to apply:** before adding a new slug to the alias map, confirm the
mapping is correct by cross-checking the Dailymotion channel's actual upload
titles (via `api.dailymotion.com/user/<channel>/videos`) against the site's
real slug for that series, e.g. via its search endpoint. Never infer a slug
from the displayed title alone.

Separately: Dailymotion embeds are blocked by default site-wide
(`BLOCKED_SERVERS` checks in both the API scraper and the frontend watch page)
because ad-hoc Dailymotion links surfaced by anichin/Animasu scraping are often
not embeddable (uploader disabled embedding). Verified channel-sourced embeds
must carry a distinguishing marker in the embed URL so the frontend's block
filter can exempt them specifically, rather than loosening the blanket block.
