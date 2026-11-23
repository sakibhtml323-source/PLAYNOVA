# ডেপ্লয়মেন্ট গাইড (বাংলা) — PLAYNOVA
স্ট্যাটিক সাইট — কোনো সার্ভার-কোড/ডেটাবেস/বিল্ড-স্টেপ লাগে না।

## ১) আনজিপ ও আপলোড
PLAYNOVA_PRODUCTION_FINAL.zip আনজিপ করে যেকোনো স্ট্যাটিক হোস্টে আপলোড করুন (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, nginx)।

## ২) ডোমেইন
প্রোডাকশন URL স্থায়ী: https://sakibhtml323-source.github.io/PLAYNOVA/ — কোনো URL বদলানোর প্রয়োজন নেই, custom domain বাধ্যতামূলক নয়।

## ৩) বিজ্ঞাপন (ঐচ্ছিক)
Google AdSense/Ads নিষিদ্ধ। চাইলে Adsterra/Monetag/PropellerAds — AD_NETWORK_SETUP.md দেখুন। `enabled:false` রাখলে বিজ্ঞাপন-মুক্ত চলবে (বর্তমান অবস্থা)।

## ৪) HTTPS
ফুলস্ক্রিন ও অডিও-আনলকের জন্য HTTPS দরকার; সব রিসোর্স same-origin তাই mixed-content সমস্যা নেই। HTML-এর জন্য Cache-Control: ১ দিন, /assets/img/*-এর জন্য ১ বছর রাখুন।

## ৫) ডেপ্লয়-পরবর্তী ১০-মিনিটের চেকলিস্ট
হোমের ৪ সেকশন ও সার্চ ✅ · যেকোনো গেমে PLAY → Fullscreen(F) → Restart(R) → Pause(P) → Resume ✅ · Favorite → রিলোডে টিকে থাকে ✅ · অডিও প্যানেল ✅ · 375px-এ কোনো sideways স্ক্রল নেই ✅ · /sitemap.xml খোলে ✅ → Google Search Console-এ সাবমিট ✅

## ৬) রোলব্যাক
Stage A–D ও BACKUP_PRE_AUDIT ZIP সংরক্ষিত আছে — পুরোনো ZIP আবার আপলোড করলেই রোলব্যাক।
