# PERFORMANCE REPORT — PLAYNOVA
Date: 2026-11-04

## Measured facts (this build)
| Asset | Value |
|---|---|
| Banners (500 × WebP 1200×630) | 9.4 MB total, avg ~19 KB each |
| Thumbnails (500 × WebP 400×300) | ~3 MB total (lazy-loaded via `loading="lazy"`) |
| Game files (500 self-contained HTML) | 2.9–8.0 KB each, ~2.4 MB total |
| Full portal ZIP | ~17 MB (see RELEASE_REPORT.md) |
| Portal pages | 0 console errors; no render-blocking third-party requests |

## Optimizations implemented
- WebP imagery (quality 80/78), `loading="lazy"` on all thumbnails, `fetchpriority="high"` on game-page banners.
- No frameworks, no CDN dependencies, no external fonts — system font stack.
- Self-contained games = zero extra network requests per game beyond the single HTML file.
- Static HTML pages — server can send `Cache-Control` headers (see DEPLOYMENT_GUIDE.md).
- Generative WebAudio music: **0 bytes downloaded** (synthesized at runtime).

## Honest limitations (not claimed as measured)
- Lighthouse/Core-Web-Vitals scores were **not** run in this environment (no network throttling profile); measure after deployment on real hardware.
- Layout-shift: image `width`/`height` attributes set on cards/banners to prevent CLS.
