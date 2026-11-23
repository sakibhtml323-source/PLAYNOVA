# DEPLOYMENT-GUIDE — GitHub Pages (static, no build step)
Nothing was pushed or published by this work. You deploy it yourself.
1. Create the public repository `PLAYNOVA` under `sakibhtml323-source` (or your account).
2. Unzip PLAYNOVA-v3-FINAL-REPAIRED.zip and upload the CONTENTS to the repository root (`index.html`, `404.html`, `.nojekyll` at the top). With git: `git init && git add . && git commit -m "PLAYNOVA v3 repaired" && git branch -M main && git remote add origin https://github.com/sakibhtml323-source/PLAYNOVA.git && git push -u origin main`.
3. Settings -> Pages -> Deploy from a branch -> `main` / `(root)` -> Save. The site appears at `https://sakibhtml323-source.github.io/PLAYNOVA/` after 1-3 minutes. If your account/repo name differs, replace that base URL in canonical/OG tags, `sitemap.xml` and `robots.txt`.
4. After each update change the cache name in `sw.js` (`playnova-v4` -> `playnova-v5`).
5. Post-deploy check (5 minutes): open home, a game (reaches ready, Progress button works), `/profile/`, a policy page; play ~2 minutes (one "+10 XP" message); open a game, go offline, reopen it.
6. Run the tests yourself: `pip install playwright && playwright install chromium && python3 tests/run_all.py`.
## Ads (your own code, later)
`assets/js/ads-config.js` is the only switch (`enabled:false`). For AdSense set `provider:'adsense'`, `adsense.client:'ca-pub-<your id>'`, numeric slot ids, `enabled:true`. Ads load only after visitor consent and lazily near the viewport; slots never cover the game area. You must extend the CSP meta tags for the provider (AdSense needs at least: `script-src https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com`, `frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com https://tpc.googlesyndication.com`, `img-src https: data:`, `connect-src https://*.google.com https://*.doubleclick.net https://*.googlesyndication.com`) and test for console CSP errors. No approval is promised.
## Licence review (human action required)
The project claims the 500 games are original. This repair could not verify authorship or redistribution rights of any game, image or sound. Before running ads or commercial use: confirm you own or may commercially use every game file and asset; keep proof.
