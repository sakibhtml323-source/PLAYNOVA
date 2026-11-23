# BUG-FIX-REPORT — PLAYNOVA v3 (every defect found and fixed, with evidence)
Status words: FIXED = found broken, repaired in the source, re-tested. Items 1-19 come from the earlier repair rounds of the same project; 20-32 from this round. Original game mechanics, art and audio were not changed except where a defect required it (marked **GAME CODE**).

| # | Defect | Fix | Evidence | Status |
|---|---|---|---|---|
| 1 | Storage bridge was the LAST script in 184 games, so game start-up code could not read saved data (Viking Farming, Eternal Halloween Tycoon, Mystic Physics Sandbox, Pirate Idle Clicker Fury, Haunted Chime Order, ...) | bridge is first script in all 500 games; saved data delivered synchronously via the iframe URL | static check 500/500; storage_all_500.json | FIXED |
| 2 | Saves > 1500 chars / > 20 keys silently dropped (physics sandboxes 3-4 KB) | limits 256 KB / 100 keys / 900 KB per game, hydration up to 120 KB | storage_real_saves_28_games.json | FIXED |
| 3 | Games that save only in `beforeunload` lost progress on close | synthetic `beforeunload` on tab hide, pagehide, every 4 s while active | same | FIXED (last <4 s of changes can still be lost) |
| 4 | No quota errors | shim throws `QuotaExceededError` synchronously | storage_all_500.json (huge value test) | FIXED |
| 5 | No duplicate-init guard / late state sync | `__PN_BRIDGE` guard, state in nonce handshake | code + tests | FIXED |
| 6 | Cookie policy HTML malformed; legacy `/play/` page had extra `</div>` | markup repaired, policy text updated (profile data, IndexedDB, cache) | tests/run_all.py (HTML nesting on 525 pages) | FIXED |
| 7 | Contradictory advertising statements on 523 pages | wording matches real behaviour | grep | FIXED |
| 8 | No AdSense integration point | disabled-by-default AdSense adapter, no publisher ID | tests/run_all.py (ads default) | FIXED |
| 9 | "Newest first" label wrong (all games share one import date) | relabelled; limitation documented | games/index.html | FIXED |
| 10 | Related games section hidden on game pages | moved to on-demand Progress drawer | game_panel_tests.json | FIXED |
| 11 | First version of the per-game panel covered the game | on-demand drawer, closed by default | game_panel_tests.json | FIXED |
| 12 | Service worker: home-only registration, wrong offline fallback page, no update notice | per-page cache keys, offline.html fallback, update notice, honest offline indicator | OFFLINE-TEST-REPORT.md | FIXED |
| 13 | No reduced-motion support in new CSS | `prefers-reduced-motion` | CSS | FIXED |
| 14 | Documentation contradictions (316 vs 500 isolated, 499-game text, 13-game list, unsupported offline/mobile claims, stale reports) | all reports regenerated from this build; old reports archived with a warning | previous_release_reports/README.md | FIXED |
| 15 | No per-game save tools | download / import / reset with validation; per-game challenges | game_panel_tests.json | FIXED |
| 16 | **GAME CODE** crystal-stack-sort-346 unwinnable (396 of 400 boards unsolvable) | board built from a solved layout by reverse moves | crystal_stack_sort_346_fix.json | FIXED |
| 17 | **GAME CODE** crystal-dot-link-276 generated unsolvable boards (93%) | board = random full-cover path cut into segments | four_games_fix_and_verify.json | FIXED |
| 18 | **GAME CODE** crystal-dot-link-276 drag could never extend a path (private per-cell flag) | shared flag + pointermove/elementFromPoint | same | FIXED (touch path untested) |
| 19 | **GAME CODE** haunted-clock-tower-348 hands drawn 90 degrees from the pointer | removed the +PI/2 offset | same | FIXED |
| 20 | **GAME CODE** game-0005 (Cosmic Medieval War) duplicate HTML ids `p1`,`p2` | overlay spans renamed `p1i`/`p2i` + CSS selectors | tests/run_all.py (no duplicate ids in any production HTML) | FIXED |
| 21 | 10 games use `confirm/alert/prompt`, silently ignored by the sandbox (reset/prestige confirmations never worked) | `allow-modals` on those 10 pages only; reviewed (see SECURITY-AUDIT-REPORT.md) | dialog test, run_all sandbox check | FIXED |
| 22 | **GAME CODE** 4 memory-sequence games showed the WRONG sequence (timer read `seq[i]` after `i++`; first item never shown, last undefined; NaN audio error): ninja-silver-chronicles, glassmorphism-realm, memory-sequence-isometric-edition, dark-mode-sport-hero | capture the index before the timer | memory_sequence_fix.json | FIXED |
| 23 | **GAME CODE** 5 tower-defense games threw an error on every tick of every wave (enemies spawn with negative offset, `path[-1]`): base-defense-isometric-edition, hero-defense-90, tower-forge-115, splitter-defense-165, robot-rush | skip enemies that have not entered yet | tower_defense_wave_fix.json | FIXED |
| 24 | **GAME CODE** 7 tower-defense games threw when a build spot was clicked before choosing a tower (`DEFS[undefined]`) | guard (no tower selected = not affordable) | QA harness re-run | FIXED |
| 25 | **GAME CODE** hero-defense-90 hero attack used undefined variables (`me`, `f.x`) | hero now uses the castle position and the foes' real grid position | tower_defense_wave_fix.json (15 s wave, 0 errors) | FIXED |
| 26 | **GAME CODE** crystal-match-blast-236: `msg` declared inside another function, every message failed | declared at top level | QA harness (0 errors) | FIXED |
| 27 | **GAME CODE** watercolor-physics-sandbox: invalid gradient colour `hsl(..)+'00'` threw every frame | valid `hsla(...,0)` | QA harness (0 errors) | FIXED |
| 28 | Legal pages (about, privacy, cookies, terms, disclaimer, contact) were almost unreadable: dark text on dark background (regression of the dark theme) | readable colours | contrast_audit_final.json + screenshots | FIXED |
| 29 | Home category section headings invisible (white text on pastel backgrounds) | dark tinted section backgrounds | screenshot | FIXED |
| 30 | Game page control strip was white with pale buttons and white-on-cyan Fullscreen text | dark strip, readable buttons, wrapping controls | screenshot | FIXED |
| 31 | Active navigation link white on cyan (2.3:1) | dark text on cyan | contrast audit | FIXED |
| 32 | Card titles/thumbnails: low contrast on light thumbnails; mobile cards hid the artwork | darker scrim, taller mobile cards | screenshots, contrast audit | FIXED |

## Checked and NOT a defect
* game-0253, game-0473, game-0480 (named in the request): no duplicate ids (static or in the live DOM), no JavaScript errors, restart OK, storage OK in the harness. No change made.
* ninja-stealth-grid-261: an earlier test failure was a limitation of the first test bot, not a game bug.
## Known unfixed
See KNOWN_LIMITATIONS.md.
