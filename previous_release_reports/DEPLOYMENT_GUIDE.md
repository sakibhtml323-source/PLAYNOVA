# DEPLOYMENT GUIDE — PLAYNOVA
Static site — no server code, no database, no build step.

## 1) Unzip
Upload the whole unzipped folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3+CloudFront, nginx).

## 2) Set your domain (required for SEO)


## 3) Optional: analytics
Add your Google Analytics 4 tag (or Plausible/Matomo) if desired. Analytics are not advertising and are not bundled by default. Do not add AdSense.

## 4) Optional: enable advertising
Follow AD_NETWORK_SETUP.md. Keep enabled:false to run ad-free.

## 5) Recommended HTTP headers (host config)
- Cache-Control: public, max-age=86400 for HTML; max-age=31536000, immutable for /assets/img/*.
- Serve over HTTPS (required for fullscreen in some browsers; all resources are same-origin).

## 6) Post-deploy smoke test (10 minutes)
1. Home loads, 4 sections render, search works, Random button works.
2. Open any game: PLAY, Fullscreen (F), Restart (R), Pause (P), Resume.
3. Favorite a game, reload, still favorited; Recently Played updates.
4. Audio panel: music starts after first click, prefs persist across reload.
5. 375px width: no horizontal scroll on home + 3 game pages.
6. /sitemap.xml loads; submit it to Google Search Console.

## Rollback
All previous stage ZIPs (A-D) are retained; re-upload any earlier ZIP to roll back.


**Production URL (স্থায়ী):** https://sakibhtml323-source.github.io/PLAYNOVA/ — custom domain আবশ্যক নয়।
