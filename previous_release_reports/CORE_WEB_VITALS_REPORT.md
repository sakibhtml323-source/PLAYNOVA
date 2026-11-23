# CORE WEB VITALS REPORT — PLAYNOVA (Lab)
তারিখ: 2026-11-04 · Playwright/Chromium, 390×844 mobile viewport, local static server (lab environment — ফিল্ড ডেটা নয়)।

| পেজ | LCP | CLS | ইনপুট-ল্যাটেন্সি (গড়) | transferred |
|---|---|---|---|---|
| Home | **336 ms** ✅ | **0.046** ✅ | ~240 ms | 1.44 MB (lazy-thumbnails নেটওয়ার্কidle-এ সব লোড হয় — রিয়েল ব্রাউজারে viewport-নিচের গুলো বাদ পড়ে) |
| গেম পেজ | **376 ms** ✅ | **0.000** ✅ | — | 7.7 KB HTML (iframe/game lazy) |

- অর্থনীতি: LCP<2.5s ✅ · CLS<0.1 ✅ — Google thresholds-এর ভেতরে (lab)।
- INP ফিল্ড-পরিমাপ বাকি (রিয়েল ব্যবহারকারী ট্রাফিক দরকার) — NOT TESTED হিসেবে স্বীকৃত।
- Lighthouse চালানোর পরামর্শ: ডেপ্লয়-পরে PageSpeed Insights-এ `https://sakibhtml323-source.github.io/PLAYNOVA/` চেক করুন।
