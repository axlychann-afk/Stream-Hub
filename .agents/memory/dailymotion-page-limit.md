---
name: Dailymotion channel page limit
description: MAX_PAGES must cover the full channel history; too low silently drops older episode uploads.
---

# Dailymotion Channel Page Limit

## Rule
Set MAX_PAGES high enough to cover the entire channel. The dongchindopro channel had ~1000 videos across 10 pages; MAX_PAGES=3 silently ignored pages 4-10 (70% of all uploads).

**Why:** The API returns pages newest-first. Ongoing series have recent episodes on page 1 but older episodes buried on later pages. A page cap silently drops anything beyond it with no error.

**How to apply:** Current setting is MAX_PAGES=10, CACHE_TTL_MS=30min. If the channel keeps growing past 1000 videos, raise MAX_PAGES again.

## Alias map additions confirmed July 2026
- MSBS: "seniorbrothersteady", "myseniorbrothersteady", "msbsmyseniorbrothersteady"
- Ze Tian Ji / Way of Choices: "zetianji"
- Da Zhu Zai / The Great Ruler: "dazhuzai"
- Walking the Way Allone (typo variant): "walkingthewayallone"
- The Other Side Deep Space (with "of"): "theothersideofdeepspace"
- The Gate of Mystical Realm (drops "of"): "thegatemysticalrealm"
- Legend of Martial Immortal (drops "of"): "legendmartialimmortal"
- Soul Land Season 2: "soulland2"
