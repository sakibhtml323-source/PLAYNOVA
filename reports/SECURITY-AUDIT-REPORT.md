# SECURITY-AUDIT-REPORT — PLAYNOVA v3 (final repaired build)
Scope: this archive, tested in headless Chromium. PASS/FAIL/FIXED/UNVERIFIED/NOT APPLICABLE as defined at the end.

## Architecture (verified)
| Item | Result | Evidence |
|---|---|---|
| Game iframes use `sandbox="allow-scripts"` (no `allow-same-origin`) on all 500 pages; 10 games also have `allow-modals` | PASS | tests/run_all.py (static check on 500 pages) |
| `allow-modals` justification (documented review) | The 10 games listed in `assets/js/modal-games.json` call `confirm()`/`alert()`/`prompt()`. Without `allow-modals` the browser silently returns false/null and the feature (e.g. reset/prestige confirmation) never works. A modal dialog cannot read platform data, cannot navigate the page and is rate-limited by browsers; `allow-same-origin`, `allow-top-navigation` and `allow-popups` stay off. | FIXED (bug 21) |
| Game cannot read platform storage (`pn_data`) or `parent.PLAYNOVA` | PASS | tests/run_all.py bridge tests; storage_all_500.json |
| postMessage validation: source window, origin `"null"`, `ns`, version, per-load nonce, type allow-list, key regex, size limits | PASS (Chromium) | tests/run_all.py: wrong nonce, missing nonce, fake XP/coin amounts, replay, locked level, unknown type, unsupported game |
| Per-game storage namespace `pn_gls:<slug>`; one game cannot write another game's key | PASS by design: the parent derives the slug from the page URL, never from the message | code review + storage tests |
| Corrupted per-game store does not crash the game | PASS | storage_all_500.json (500 games) |
| XSS: profile/shop/panel built with `textContent`; legacy `/play/` page escapes registry text; `<img onerror>` display name | PASS | earlier_runs + tests |
| JSON import validation (profile and per-game save) | PASS (invalid JSON, wrong schema, wrong game rejected) | tests/run_all.py, game_panel_tests.json |
| External resources loaded by games | None: no game file references an external http(s) host (500 files scanned) | scan in this audit |
| External resources on site pages | Only the site's own canonical/OG URLs; no third-party scripts, fonts or trackers | scan in this audit |
| Tracking / analytics code (gtag, GA, GTM, Facebook pixel, Hotjar, Clarity) | 0 occurrences in site pages and site scripts | scan in this audit |
| Dependencies | None (no npm/node_modules; the test suite uses Playwright only for testing, it is not shipped to visitors) | NOT APPLICABLE for vulnerability scanning |
| Secrets / API keys / publisher IDs in the project | None found; ad config has `client: null` | tests/run_all.py (ads default) |
| Service worker: same-origin only, versioned cache, old caches deleted, fetch errors fall back to cache/offline page | PASS | offline tests |
| Clickjacking | FAIL (cannot be fixed on GitHub Pages): no `X-Frame-Options`/`frame-ancestors` is possible; meta CSP ignores `frame-ancestors`. Other sites can frame PLAYNOVA | documented limitation |

## Limits that cannot be removed in a static client-only site
* **XP, coins, levels, achievements and shop items are NOT cheat-proof.** They are stored in the visitor's browser and can be edited by the visitor. A trusted backend would be needed.
* A meta `Content-Security-Policy` is weaker than HTTP headers (no `frame-ancestors`, no report-only, no HSTS, no `X-Content-Type-Options`, no `Permissions-Policy`). GitHub Pages does not allow custom response headers.
* Game pages have a CSP meta; the games themselves have none, so a sandboxed game could make network requests (none of the 500 do; verified by scan, not by network monitoring of every gameplay path).
* A sandboxed game can still run its own code, spam the bridge, or burn CPU.
* Firefox and WebKit were not available; their sandbox/IndexedDB/service-worker behaviour is UNVERIFIED.
* Third-party advertising code is outside this audit; enabling it requires CSP changes (see DEPLOYMENT-GUIDE.md).

Terms: PASS tested and passed; FAIL tested and failed or cannot be fixed; FIXED found broken and repaired and re-tested; UNVERIFIED not tested; NOT APPLICABLE does not apply.
