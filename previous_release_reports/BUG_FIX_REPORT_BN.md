# BUG FIX REPORT (বাংলা) — PLAYNOVA
তারিখ: 2026-11-04

| # | বাগ | ফাইল(সমূহ) | ফিক্স | Regression test |
|---|---|---|---|---|
| ১ | গ্রিড খালি (window.REGISTRY) | registry.js, portal.js | `window.REGISTRY = REGISTRY;` + `typeof REGISTRY` defensive read | ✅ সব গ্রিড ভরে, random/sort/filter/pagination কাজ করে |
| ২ | Escape-fullscreen | player.js | Escape → exitFullscreen() | ✅ headless |
| ৩ | Favorites/Recent view নেই | favorites/, recent/, portal.js, 1022 পেজের footer | নতুন পেজ + হ্যান্ডলার + লিংক | ✅ favorites এ starred গেম, recent সঠিক ক্রমে |
| ৩-ক | recent render ব্লক | portal.js | outer condition-এ 'recent' যোগ | ✅ 2 গেম render |
| ৪ | Cookie consent নেই | portal.js | consent ব্যানার + localStorage | ✅ দেখা/সেভ/সরে যাওয়া |

নিয়ম মেনে: একটি বাগ ঠিক করতে গিয়ে অন্য ফিচার নষ্ট হয়নি — প্রতিটি ফিক্সের পর সম্পূর্ণ ফাংশনাল স্যুট re-run করে 0 broken ref, 0 console error নিশ্চিত করা হয়েছে। ৫০০ গেম অক্ষত (games-src কখনো স্পর্শ করা হয়নি)।


## দ্বিতীয় রিপেয়ার চক্র — 2026-11-04 (final)
| # | বাগ | ফাইল | ফিক্স | যাচাই |
|---|---|---|---|---|
| ৫ | Search/ফিল্টারে pagination-reset নেই | portal.js | change-listener-এ ?page= remove → Page 1 | ✅ |
| ৬ | Tag-substring সার্চ ভুলফল | portal.js | exact-tag ম্যাচ | ✅ 48/48 সঠিক |
| ৭ | LocalStorage-blocked crash-ঝুঁকি | audio.js, portal.js | সব access try/catch | ✅ blocked-context PASS |
| ৮ | Pause-এর মিথ্যা দাবি | ৫০০ game page | সৎ fallback টেক্সট | ✅ |
