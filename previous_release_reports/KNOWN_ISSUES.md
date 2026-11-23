# KNOWN ISSUES — PLAYNOVA
Date: 2026-11-04

## Requires manual verification (NOT claimed as passed)
1. **iOS Safari fullscreen** — code uses the webkitEnterFullscreen fallback, but real-device verification is impossible headless. Test on a physical iPhone before marketing fullscreen support there.
2. **Remaining 460 games on physical mobile devices** — the 375px Playwright sample (40/40 PASS, 0 overflow) shows no class-level defect, but a full device sweep is manual.
3. **In-iframe pause** — the player's Pause overlays and masks the game (input blocked). It cannot freeze a game's internal rAF loop across the iframe boundary; the game state effectively continues underneath. Documented behavior, by design.
4. **Landscape guidance** — portrait/landscape orientation hints are not implemented per-game; games auto-resize via their own resize handlers.
5. **Audio on iOS** — generative music starts on first gesture as required by autoplay policies; subtle iOS-specific timing quirks possible, manual check advised.
6. **Multiplayer Local second player on touch** — two-player games assume keyboard; touch sharing untested on real hardware.
7. **Difficulty labels** — assigned editorially by category (Action→Challenging, Puzzle/Brain/Strategy→Moderate, Casual/Simulation→Relaxed). Not playtest-derived.

## Editorial/technical notes (not bugs)
- Banner artwork is procedurally generated (original, unique per game) — not hand-drawn art. If professional illustrated banners are desired later, commission them per the asset-production checklist in the master brief and swap files 1:1 (same filenames).
- 14 games (68 in 14 clusters per prior uniqueness audit) share genre families but are mechanically differentiated at rule level; the uniqueness audit remains the authoritative record.
- Contact form is mailto-based; no backend exists, so no spam protection beyond client checks.

## Fixed this cycle (verified by re-test)
- player.js null onclick crash on all game pages.
- 0183 createRadialGradient NaN crash. 0184 strict-mode ReferenceError (lives).

8. **Game-internal storage:** with localStorage fully blocked, individual games may throw internally when saving high scores (e.g. game-0001.html:34). The portal itself works; per project rules game files are frozen. Manual note only.
9. **Pause overlay** now honestly states that sandboxed games' own timers may keep running (input is blocked while covered). This is the documented, truthful fallback — real per-game pause APIs do not exist in these single-file games.
