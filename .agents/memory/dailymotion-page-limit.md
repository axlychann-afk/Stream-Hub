---
name: Dailymotion channel fetch — sort and page limit
description: Key lessons for fetching dongchindopro channel videos correctly so new and old episodes are all found.
---

# Dailymotion Channel Fetch

## Rule 1 — Always use `sort=recent`
Add `sort: "recent"` to the Dailymotion channel videos API call. Without it, the default sort is by view count, so brand-new episodes (0 views) sink to the back pages and are never fetched.

**Why:** A newly uploaded episode was confirmed published via the search endpoint but invisible in 10 pages of paginated fetch until `sort=recent` was added. The search API and the channel-list API use different default orderings.

**How to apply:** `params: { ..., sort: "recent" }` in `fetchChannelVideos()`.

## Rule 2 — MAX_PAGES must cover full channel
Set MAX_PAGES high enough to cover the entire channel. The dongchindopro channel had ~1000 videos across 10 pages; the original MAX_PAGES=3 silently ignored pages 4–10 (70% of all uploads), making most series' older episodes invisible.

**Why:** The API returns pages newest-first (with sort=recent). Ongoing series have recent episodes on page 1 but older episodes buried on later pages. A page cap silently drops anything beyond it.

**How to apply:** Current setting is MAX_PAGES=10, CACHE_TTL_MS=30min.

## Rule 3 — Auto token-matching, not manual aliases
Series slug → Dailymotion title matching uses word-token fuzzy matching (≥55% of slug words must appear in channel code, min 2 hits). Season-slug pattern (`series-season-N`) also tries `normalizedBase + N`. Manual SERIES_ALIASES kept only for truly non-derivable cases (e.g. Indonesian-title BTTH slug).
