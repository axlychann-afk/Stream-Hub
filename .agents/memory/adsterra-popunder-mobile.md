---
name: Adsterra popunder mobile quirk
description: Why an Adsterra/effectivecpmnetwork popunder script can seem to not fire on mobile even though the exact same script tag works on desktop.
---

A site-wide popunder `<script src="https://plXXXXXXXX.effectivecpmnetwork.com/.../....js">` tag is
identical for every device — there is no device-specific code on our side. If a user reports
"popunder works on desktop but not on mobile," the script itself can't be inspected via curl (the
endpoint 403s without a valid browser Referer/session, regardless of desktop or mobile User-Agent),
so this can't be root-caused from the server side.

**Why:** the most likely causes are on the ad network's side, not app code — mobile device
targeting disabled for that zone in the publisher dashboard, or mobile no-fill for that
traffic/geo at that time. It resolved itself later without any code change, consistent with a
transient no-fill/targeting issue rather than a bug.

**How to apply:** don't chase this as a code bug. Confirm the script tag is unconditionally present
for all devices (no viewport-based hiding), then point the user to their ad network dashboard's
device-targeting setting for that zone. If they want a placement you can fully control instead,
suggest their network's "Direct Link"/"Smart Link" ad unit (just a URL) wired to a same-call-stack
`window.open` on first click — that avoids relying on the third-party script's own mobile handling.
