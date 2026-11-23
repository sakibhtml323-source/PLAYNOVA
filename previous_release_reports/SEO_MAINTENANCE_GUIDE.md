# SEO MAINTENANCE GUIDE — PLAYNOVA

## নতুন গেম যোগ করলে (১০,০০০+ পর্যন্ত স্কেল)
1. `assets/js/registry.json` + `registry.js`-এ রেকর্ড যোগ করুন (slug unique রাখুন)
2. `python3 tools/generate_sitemap.py` চালান → sitemap.xml নিজে আপডেট হবে
3. গেমের banner/thumbnail `assets/img/{banners,thumbs}/<slug>.webp` রাখুন
4. গেম পেজ (game/<slug>/index.html) আগের টেমপ্লেট অনুযায়ী বানান — অথবা জেনারেটর যোগ করলে বলুন
5. Google Search Console-এ নতুন sitemap রিসাবমিট করুন

## মাসিক চেকলিস্ট
- Search Console: Coverage/Indexing এরর শূন্য কিনা
- PageSpeed Insights (home + একটি গেম পেজ)
- Broken-link স্ক্যান (কোনো URL বদলালে)
- ক্যাটাগরি পেজে নতুন গেমের সংখ্যা আপডেট (render()-এ অটো — হাতে কিছু লাগে না)

## নিয়ম
- ভলিউম/র‍্যাংকিং-আশা-ভিত্তিক shortcut নয় (doorway page, keyword stuffing, fake schema) — জরিমানার ঝুঁকি।
