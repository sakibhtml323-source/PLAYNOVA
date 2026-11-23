# ADD NEW GAME — PLAYNOVA (Drop-in System)

নতুন গেম যোগ করা = **২টি ফাইল + ১টি registry এন্ট্রি**। নতুন static পেজ বানানোর দরকার নেই — `play/?slug=<slug>` ডায়নামিক প্লেয়ার স্বয়ংক্রিয়ভাবে সব হ্যান্ডল করে (৪০৪ redirect সহ)।

## ধাপ ১ — গেম ফাইল রাখুন
`games-src/batch-XX/game-XXXX.html` — self-contained HTML5 গেম (canvas/DOM, inline JS/CSS, কোনো external dependency নয়)। গেমের নিজস্ব `<div id="ov">` স্প্ল্যাশ + Start বাটন (`id="btn"`) থাকতে হবে।

## ধাপ ২ — Registry এন্ট্রি যোগ করুন
`assets/js/registry.json` **এবং** `assets/js/registry.js`-এ (একই JSON, দুই ফাইলে) যোগ করুন:
```json
{"id":"0501","slug":"my-new-game","title":"My New Game","description":"...","category":"Puzzle","theme":"Neon",
 "thumbnail":"assets/img/thumbs/my-new-game.webp","banner":"assets/img/banners/my-new-game.webp",
 "gameUrl":"games-src/batch-26/game-0501.html","instructions":"Arrows to move, Space to act","difficulty":"Moderate",
 "tags":["puzzle","neon"],"emoji":"🧩","c1":"#1a2150","c2":"#0e3a3d","seoTitle":"My New Game | PLAYNOVA",
 "seoDescription":"...","added":"2026-11-05"}
```
id/slug/title — তিনটিই unique হতে হবে।

## ধাপ ৩ — ছবি (ঐচ্ছিক কিন্তু সুপারিশকৃত)
`assets/img/thumbs/<slug>.webp` (400×300) ও `assets/img/banners/<slug>.webp` (1200×630)। না দিলে কার্ডে খালি কভার দেখাবে — তাই দিন; banner-জেনারেটর স্ক্রিপ্ট চাইলে বলুন।

## ধাপ ৪ — সাইটম্যাপ রিজেনারেট
```bash
python3 tools/generate_sitemap.py   # project root থেকে
```
**বিশেষ:** ডায়নামিক প্লেয়ারের কারণে sitemap-এ নতুন গেমের আলাদা URL দরকার নেই (পুরোনো ৫০০-এর মতো) — তবে SEO-র জন্য সম্পূর্ণ static পেজ চাইলে আগের টেমপ্লেট দিয়ে বানিয়ে sitemap টুলই ধরে নেবে (registry থেকে)।

## ধাপ ৫ — যাচাই (লোকাল)
`python3 -m http.server` → `http://localhost:8000/play/?slug=my-new-game` খুলে PLAY → fullscreen → restart পরীক্ষা করুন। হোম/সার্চ/ক্যাটাগরিতে গেম সঙ্গে সঙ্গেই দেখাবে (portal.js registry থেকে render করে)।

## নিয়ম
- slug: lowercase, letters/digits/dash, 48 chars-এর মধ্যে
- difficulty: Relaxed | Moderate | Challenging | Casual
- category: আগের ৮টির একটিতে রাখলে ক্যাটাগরি পেজে অটো যুক্ত হবে; নতুন ক্যাটাগরি চাইলে registry + category/<slug>/ পেজ দুটোই বানাতে হবে
- Google Ads নয়; বিজ্ঞাপন সব ads-config.js-এর consent-gate-এর আড়ালেই থাকে
