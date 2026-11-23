# BUG AUDIT REPORT (বাংলা) — PLAYNOVA
তারিখ: 2026-11-04 · পদ্ধতি: Playwright browser automation (headless Chromium) + static source audit + node --check

## মোট পাওয়া সমস্যা: ৭টি — আসল বাগ ৪টি, টেস্ট-আর্টিফ্যাক্ট ৩টি

### আসল বাগ (সবই ঠিক করা হয়েছে)

**বাগ ১ (CRITICAL — শিপড হয়েছিল):** পোর্টালের সব লিস্টিং-গ্রিড খালি
- ফাইল: `assets/js/registry.js` + `assets/js/portal.js`
- কারণ: registry.js-এ `const REGISTRY=...` top-level const হওয়ায় `window`-এ expose হয় না; portal.js পড়ত `window.REGISTRY` → সবসময় `undefined` → `G=[]` → খালি গ্রিড, খালি search/favorite-view, Random বাটনে crash
- ব্যবহারকারীর সমস্যা: হোম/All Games/Category/Popular/New — কোথাও কোনো গেম দেখা যেত না!
- ঠিক করা হয়েছে: registry.js-এ `window.REGISTRY = REGISTRY;` যোগ + portal.js-এ defensive read
- যাচাই: Playwright — reg:500, সব গ্রিড ভরা, random navigates ✅

**বাগ ২:** Escape চাপলে fullscreen exit হতো না (সব ব্রাউজারে নিশ্চিত নয়)
- ফাইল: `assets/js/player.js`
- কারণ: explicit Escape-handler ছিল না
- ঠিক: `keydown` Escape → `document.exitFullscreen()`; যাচাই ✅ (headless)

**বাগ ৩:** Favorites ও Recently Played-এর view পেজ নেই
- ফাইল: নতুন `favorites/index.html`, `recent/index.html`, portal.js, ১০২২ পেজের footer
- কারণ: ডেটা localStorage-এ সেভ হতো, দেখার জায়গা ছিল না
- ঠিক: দুটি পেজ + recent-হ্যান্ডলার; যাচাই: /favorites/ এ স্টার-করা গেম দেখায় ✅, /recent/ সঠিক ক্রমে ২ গেম ✅
- (একটি নতুন উপ-বাগ ফিক্সের সময় তৈরি হয়েছিল — outer condition-এ 'recent' বাদ পড়েছিল; ধরা পড়ে তাৎক্ষণিক ঠিক ✅)

**বাগ ৪:** Cookie Consent ব্যানার অনুপস্থিত (master-prompt-এর requirement)
- ফাইল: portal.js-এ consent মডিউল
- ঠিক: Accept/Decline → localStorage 'p5_consent'; Cookie Policy-লিংকসহ; যাচাই: বার দেখা ✅, ক্লিকে সেভ+সরে যায় ✅

### টেস্ট-আর্টিফ্যাক্ট ৩টি (সাইট ঠিক ছিল, টেস্ট-স্ক্রিপ্ট ভুল ছিল)
1. Category chips "404" — টেস্ট পাথে ভুল প্রিফিক্স; আসল URL সব 200
2. Related-links — টেস্টের key-extraction বাগ; আসল লিংক 200
3. Contact validation "false" — টেস্টে email ফিল্ড পূরণ করা হয়নি, HTML5 required block করেছিল; লাইভ-ডিবাগে মেসেজ ঠিক দেখে ✅

## ডোমেইন placeholder
`sakibhtml323-source.github.io/PLAYNOVA` ইচ্ছাকৃতভাবে placeholder — ভুয়া ডোমেইন বসানো হয়নি; DEPLOYMENT_GUIDE_BN.md-তে real domain replace-এর নির্দেশনা আছে।
