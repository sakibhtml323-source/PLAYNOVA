# PERFORMANCE-REPORT — PLAYNOVA v3
All numbers are from headless Chromium on the build machine (headless Chromium; CPU throttle 4x and network 1.6 Mbps / 150 ms latency emulate a slow phone; numbers are from this machine and are NOT measurements on real devices). They are NOT measurements on real phones. Lighthouse was not available offline (UNVERIFIED); sizes are uncompressed (GitHub Pages serves gzip).

| Page | Load (this machine) | Load (4x CPU + 1.6 Mbps) | Game ready (throttled) | Requests | Transferred | JS heap | DOM nodes |
|---|---|---|---|---|---|---|---|
| home | 0.34 s | 5.61 s | - | 114 | 789 KB (uncompressed) | 2.0 MB | 3014 |
| games list | 0.23 s | 5.58 s | - | 58 | 747 KB (uncompressed) | 2.1 MB | 1739 |
| profile | 0.22 s | 5.65 s | - | 11 | 678 KB (uncompressed) | 2.1 MB | 332 |
| game page (isolated game) | 0.33 s | 6.53 s | 6.62 | 16 | 718 KB (uncompressed) | 3.2 MB | 1053 |
| game page (heavy idle game) | 0.34 s | 6.39 s | 6.49 | 16 | 707 KB (uncompressed) | 3.2 MB | 1065 |

## Design facts that matter for low-memory phones (verified in code/tests)
* Game files are only loaded when a game page is opened; the home and list pages load thumbnails lazily (all `<img loading="lazy">`), thumbnails avg 6 KB, banners avg 31 KB.
* One game iframe at a time. Restart replaces the document (no stacking). Memory test: 8 consecutive restarts of a game page: JS heap / DOM nodes / event listeners after each restart = [[1.8, 958, 118], [2.6, 951, 326], [2.6, 955, 326], [2.6, 954, 326], [2.6, 955, 326], [2.6, 948, 326], [2.6, 955, 326], [2.6, 953, 326], [2.7, 954, 326]]. The first restart adds listeners and then the values stay flat (no growth across restarts).
* The service worker caches pages on demand and does not pre-cache the 500 games.
* The ads script is not loaded unless ads are enabled, configured and consented; ad slots are filled lazily (IntersectionObserver).
* `prefers-reduced-motion` is honoured by the platform CSS.
## Not done
* No Lighthouse run, no real-device or Android 9 / 4 GB measurement, no image re-compression pass (existing WebP files kept), no JavaScript minification (no build step by design).
