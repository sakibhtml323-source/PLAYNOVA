# Known limitations — PLAYNOVA v3 final repaired build (replaces all earlier versions)
Full evidence: reports/COMPLETE-AUDIT-REPORT.md. UNVERIFIED = not tested, not "probably fine".

## Gameplay
* 500 games load, start, restart and keep saves at the storage-API level; 0 failed checks in the harness, 0 JavaScript errors after the fixes. Win/lose/level/reward behaviour is UNVERIFIED for 484 games; only 16 games have a verified level-1 reward flow (real input; jungle-farm-puzzle by a scripted call of its own check function).
* For 299 games no input type produced an observable DOM/canvas change in the harness (many are animated or draw to a canvas I could not diff): UNVERIFIED, not failed.
* 17 game files had real defects repaired (BUG-FIX-REPORT.md items 16-27). Other defects that no test reaches may exist.
* Pause is unavailable in all games (no game implements it).
## Data
* XP/coins/levels/achievements/shop are stored in the browser and are NOT cheat-proof; no global leaderboard.
* Per-game saves: 256 KB per value, 100 keys, 900 KB per game; the last <4 s of changes can be lost for games that save only on exit; old saves stored in a game's own localStorage before v3 were not migrated.
## Security
* No clickjacking protection possible on GitHub Pages; meta CSP only. A sandboxed game can still run code and spam the bridge. 10 games have `allow-modals` (documented). Firefox/WebKit behaviour UNVERIFIED.
## Offline
* Only pages and games opened before are available offline (20/20 tested visited games passed). Registry `offlineSupport: verified` is an old, unverified field.
## Mobile / browsers
* Emulation in Chromium only: no real device, no Android 9, no Firefox/Safari. Touch gameplay UNVERIFIED for 360 games. Automated contrast estimate still flags 41 of 883 text elements (emoji, logo text, scrolling rows - reviewed visually, not re-measured).
## SEO / catalogue
* No real publication dates exist (all games: 2026-11-04 = catalog import). Indexing not tested. Thumbnails/banners are generated artwork.
## Ads / legal
* Ads disabled; AdSense/other providers never run against real code; no approval promised. Authorship and licences of games/assets are NOT verified: human review required before commercial use.
