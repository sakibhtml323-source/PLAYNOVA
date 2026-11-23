# FINAL AUDIT REPORT (বাংলা) — PLAYNOVA
তারিখ: 2026-11-05 11:31 · পরিবেশ: Chromium headless (Playwright) + local static server

## Independently verified PASS
- গেম integrity: 500/500 ফাইল, unique id 500, unique slug 500, থাম্ব 500, ব্যানার 500, JSON↔JS মিল
- ব্রাউজার টেস্ট: ৩১/৩১ PASS (প্রতিটির evidence: BROWSER_TEST_EVIDENCE/ screenshot বা test_results.json assertion)
- Ads consent: ১০/১০ (tests/ads_consent_test.py — সেলফ-সার্ভার, local stub; request-level যাচাই)
- Validator: self-test ৮/৮ + --check OK (extracted-কপিতে চালানো)
- Security: CSP SHA-256 hash-based (fixed-nonce সরানো), postMessage source-যাচাই, ads consent-gate
- SEO: ৫০০ unique title/desc (২৮৯টি generic পুনর্লিখন), canonical, JSON-LD, sitemap ৫২১, games-src noindex
- PWA: SW v2 (namespaced, 2xx-only, navigation-fallback), manifest './' + icons
- Inventory: fixed-point, প্রতি entry = ZIP entry size, bytes match
- ZIP: CRC PASS, ০ duplicate path, 2125 entries

## Failed tests
কোনো নয় (চলতি গেটে)।

## Manual review required
রিয়েল-ডিভাইস ফিল (iOS fullscreen, ফিজিক্যাল Android) — emulated-এর বাইরে।

## Known limitations
- **Iframe isolation: SECURITY STATUS = BLOCKED** — allow-scripts+allow-same-origin সরাতে গেলে ৫০০ ফ্রোজেন গেমের localStorage স্কোর ভাঙে; storage-bridge গেম-কোড পরিবর্তন চায় (নিষিদ্ধ)। সম্পূর্ণ নিরাপদ দাবি করা হয়নি; mitigation নথিভুক্ত।
- RENDER_ONLY ১০০ + UI_ONLY ১৩০ গেম: টার্ন-ভিত্তিক/সঠিক-চাল-প্রয়োজন — "সব ৫০০ পূর্ণ playable" দাবি নয় (বিস্তারিত: 500_GAME_FINAL_TEST_REPORT.csv)
- Field INP/Core Web Vitals ও Google র‍্যাংকিং — বহিরাগত ফলাফল

## Unverified claims
কোনো নয়। T22-ধরনের disabled-provider কেস positive-proof হিসেবে ব্যবহৃত হয়নি।

## Blocked items
Iframe sandbox isolation (উপরে)।


## Edge-to-edge full-screen player (this build)
- player-mode: ৫০০ wrapper + play-রুট; header/nav/ads/related hidden; game 100vw×100dvh flex; safe-area; address-bar সহ্য
- Back বাটন top-left (pause থেকে আলাদা), infostrip নিচে (থাম্ব/টাইটেল/by PLAYNOVA/fav/fs/restart/ⓘ), fullscreen-এ strip+back লুকায়
- কেন্দ্রে কোনো ওভারলেই নয় (fsHint সরানো); acceptance ১৮/১৮ ALL True (card→গেম, viewport পূরণ, HUD উপস্থিত, back/browser-back, fs in/out, mobile portrait+landscape ০ overflow, ০ pageerror); suite31 ৩১/৩১; ৩০ র‍্যান্ডম রুট ২০০
তারিখ: 2026-11-05 11:45
