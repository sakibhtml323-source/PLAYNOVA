# চূড়ান্ত রিলিজ রিপোর্ট (বাংলা) — PLAYNOVA
তারিখ: 2026-11-05

## যাচাইকৃত ফলাফল
- Games verified: 500/500 (unique ids 500, unique slugs 500, files 500/500)
- Browser tests: 31 run / 31 PASS / 0 FAIL (console errors: 0, network failures: 0)
- SEO: unique titles True, descriptions True, canonicals True, JSON-LD True, sitemap URLs: 521
- Environment: Chromium headless via Playwright, python3 -m http.server (local static), 2026-11-05 01:14 CST
- Production URL: https://sakibhtml323-source.github.io/PLAYNOVA/ (GitHub Pages, repo PLAYNOVA, no custom domain)
- Known limitations (verified vs not): real-device hands-on (iOS fullscreen, physical Android) = NOT TESTED; field INP/ranking = external, never claimed; iframe sandbox residual risk documented in SECURITY_AUDIT.md; Google ranking not guaranteed
- Evidence: test_results.json, screenshots/*.png, browser_console_errors.json, network_failures.json, AUDIT_INVENTORY.*

## অযাচাইকৃত দাবি
কোনো নয়। যা চালানো হয়নি, তা "সীমাবদ্ধতা"-তে স্বীকৃত — PASS বলা হয়নি।

## বিল্ড
PLAYNOVA-FINAL-RELEASE.zip — SHA-256 ও সাইজ ডেলিভারি-বার্তায় (প্রতি বিল্ডে নতুন করে গণনা করা হয়; আগের হ্যাশ পুনর্ব্যবহার করা হয় না)।

## Ads consent + adapter guard (verified this build)
- 10/10: accepted=exactly 1 inject · repeat=1 (no dup) · declined/no/expired/invalid=0 · unknown provider=0 inject + 0 uncaught · missing credentials=0

## Final evidence files (this build)
- tests/ads_consent_test.py + tests/ads_consent_results.json — 10/10 consent cases, TEST-ONLY local script
- tests/VALIDATOR_EVIDENCE.txt — both validator commands with actual output
- AUDIT_INVENTORY.json/.md — per-file sizes via fixed-point; match ZIP entries exactly
- SHA-256: compute on this ZIP (sha256sum PLAYNOVA-FINAL-RELEASE.zip) — value printed in the delivery message, never embedded here (self-reference would invalidate it)


## Edge-to-edge full-screen player (this build)
- player-mode: ৫০০ wrapper + play-রুট; header/nav/ads/related hidden; game 100vw×100dvh flex; safe-area; address-bar সহ্য
- Back বাটন top-left (pause থেকে আলাদা), infostrip নিচে (থাম্ব/টাইটেল/by PLAYNOVA/fav/fs/restart/ⓘ), fullscreen-এ strip+back লুকায়
- কেন্দ্রে কোনো ওভারলেই নয় (fsHint সরানো); acceptance ১৮/১৮ ALL True (card→গেম, viewport পূরণ, HUD উপস্থিত, back/browser-back, fs in/out, mobile portrait+landscape ০ overflow, ০ pageerror); suite31 ৩১/৩১; ৩০ র‍্যান্ডম রুট ২০০
তারিখ: 2026-11-05 11:45
