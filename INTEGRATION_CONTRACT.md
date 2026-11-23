# PLAYNOVA game integration contract (v3)

All 500 games run in `<iframe sandbox="allow-scripts">` (opaque origin). A game talks to the platform only through `assets/js/pn-bridge.js`, which MUST be the first `<script>` inside the game's `<head>`.

## Storage (all games, automatic)
`localStorage` / `sessionStorage` are replaced by a shim when the sandbox blocks them: `getItem, setItem, removeItem, clear, key, length` (JSON strings work as usual).
* Saved data is delivered synchronously: the parent page sets the iframe URL to `...game.html?r=...#pnls=<saved data>` before the game starts, and the bridge reads it before any game script runs. No handshake is needed to read saved data, so there is no initialisation race for reads.
* Writes are sent to the parent (`LS_SET`, `LS_DEL`, `LS_CLEAR`) and stored under `pn_gls:<slug>`. The parent accepts them only from that iframe window, origin `"null"`, with the per-load nonce, key `^[\w.:\-]{1,64}$`, value <= 256 KB, <= 100 keys, <= 900 KB per game.
* The shim enforces the same limits locally and throws `QuotaExceededError` synchronously, so games can handle it like a real quota error.
* `sessionStorage` is in-memory per page load. Cross-tab `storage` events are NOT emulated.
* Games that only save in a `beforeunload` handler: the bridge fires a synthetic `beforeunload` when the tab is hidden, on `pagehide`, and every 4 s while the player is active (input counter changed), so the data reaches the parent while it is still alive. A game that changes data in the last <4 s before the page is closed can still lose that last change.

## Events (optional, only where completion is genuinely detectable)
`pnEmit(type, {level, score})` with type in `GAME_READY, GAME_STARTED, GAME_PAUSED, GAME_RESUMED, GAME_LEVEL_COMPLETED, GAME_WON, GAME_LOST, GAME_SCORE_UPDATED, GAME_OVER`. The parent copies only `type, sessionId, level, score`, checks window/origin/nonce, then applies `assets/js/game-capabilities.json`. A game earns event rewards only if its status there is `FULLY_INTEGRATED` or `PARTIALLY_INTEGRATED`. XP/coin amounts are decided by the platform (`PLAYNOVA_CONFIG`); amounts in messages are ignored. Duplicate sessions, replayed levels and locked levels give nothing.

## Verification states used in the audit
`VERIFIED` tested successfully; `PARTIAL` some functionality tested; `UNVERIFIED` not tested; `FAILED` a test failed. A page that merely loads is not VERIFIED.
