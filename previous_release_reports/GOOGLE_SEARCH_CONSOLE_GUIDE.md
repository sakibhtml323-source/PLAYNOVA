# GOOGLE SEARCH CONSOLE GUIDE — PLAYNOVA (owner steps)
আমি Search Console কানেক্ট করতে পারি না — নিচের ধাপগুলো আপনার Google অ্যাকাউন্টে করুন।

## 1. সাইট যাচাই (GitHub Pages domain-verification)
- search.google.com/search-console → Add property → **URL prefix**: `https://sakibhtml323-source.github.io/PLAYNOVA/`
- Verify via **HTML tag**: PLAYNOVA-এ আপনার verification meta যোগ করুন (index.html-এর <head>-এ) অথবা Google-ফাইল root-এ আপলোড করুন
- GitHub-এ কমিট → Pages রিবিলল্ড হলে Verify চাপুন

## 2. Sitemap সাবমিট
- Sitemaps → Submit: `sitemap.xml` (সম্পূর্ণ URL: `https://sakibhtml323-source.github.io/PLAYNOVA/sitemap.xml`)

## 3. যাচাই-চেকলিস্ট
- **URL Inspection** `https://sakibhtml323-source.github.io/PLAYNOVA/game/jungle-farm-puzzle/` → Test Live URL → indexing, canonical, structured data দেখুন
- **Page Indexing** রিপোর্ট: ৫০০ গেম পেজ ধীরে ধীরে indexed হবে (কয়েক দিন–সপ্তাহ) — এটি স্বাভাবিক
- **Mobile Usability**: এরর আশা করা হচ্ছে না (responsive + overflow 0)
- **Core Web Vitals**: ফিল্ড ডেটা আসলে (28 দিন) threshold-চেক
- **Breadcrumbs/VideoGame rich result**: Enhancement রিপোর্টে দেখা যাবে; সমস্যা এলে আমাকে রিপোর্ট পাঠান
