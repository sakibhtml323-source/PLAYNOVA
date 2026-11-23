# MOBILE-COMPATIBILITY-REPORT — PLAYNOVA v3
**No physical device (including Android 9) was tested.** Everything below is emulation in headless Chromium.

| Check | Result |
|---|---|
| Layout at 320, 360, 375, 390, 414, 768, 1024, 1366, 1920 px x 7 page types + 3 landscape sizes (740x360, 915x412, 1024x768) | 84 checks, 0 with horizontal overflow or JS errors: PASS |
| Controls smaller than 32 px height | max 1 per page (informational); main buttons >= 40 px |
| Game page controls wrap on narrow screens; Back/Fullscreen/Restart/Sound/Favorite/Progress reachable | PASS (screenshots) |
| Fullscreen enter/exit | PASS in Chromium; iOS Safari does not allow fullscreen of arbitrary elements (NOT APPLICABLE there) |
| Touch input response observed by automated taps/swipes | 140 games showed an observable response, 360 UNVERIFIED (no visible change, or game animates by itself); this is not proof the others fail |
| Multi-touch, virtual keyboard, screen rotation on a real device | UNVERIFIED |
| Colour contrast (pixel-based estimate on 15 page types, 883 text elements) | FIXED the real problems found: legal pages (dark text on dark), invisible homepage category headings, white game control strip, active nav link, card titles. 41 elements are still flagged by the estimate: emoji glyphs, the logo text (bright cyan on dark; estimate 3.4-3.6:1, visually readable) and horizontally scrolling card rows measured against blank screenshot area; reviewed on screenshots, not re-measured. Treat as UNVERIFIED for strict WCAG AA |
| Keyboard navigation, visible focus ring, skip link, one h1 per page, reduced motion | PASS (checked) |
| Screen-reader behaviour with a real screen reader | UNVERIFIED |
| Browsers: Chromium only. Firefox / WebKit / Mobile Safari | UNVERIFIED (not installed in the test environment) |
Games that genuinely need a keyboard are labelled by their own on-screen instructions; 225 game files have no keyboard handler, and the registry `inputMethods`/`controls` fields were not re-verified.
