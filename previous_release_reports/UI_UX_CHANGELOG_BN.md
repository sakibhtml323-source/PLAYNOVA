# UI/UX CHANGELOG (বাংলা) — Poki-Style Rebuild
তারিখ: 2026-11-04

## নতুন ডিজাইন সিস্টেম
- **হালকা, উজ্জ্বল থিম:** নরম গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড + রঙিন ক্যাটাগরি প্যালেট (Action=লাল, Puzzle=বেগুনি, Brain=সায়ান, Casual=কমলা, Strategy=সবুজ, Simulation=গোলাপি, Multiplayer=নীল, Arcade=অ্যাম্বার)
- **ভাসমান ন্যাভিগেশন বার (floating pill nav):** ব্লার-ব্যাকড গোলাকার বার + সক্রিয় লিংকে গ্রেডিয়েন্ট পিল
- **লোগো:** নিজস্ব ▶ gradient মার্কসহ PLAYNOVA (Poki-এর কোনো asset কপি নয়)

## হোমপেজ (Poki-স্টাইল)
- হিরো + ব্রাউজ/র‍্যান্ডম CTA
- **হরাইজন্টাল ক্যারোসেল** (scroll-snap): Featured (10), Popular (10), New (14), Recently Played (10, ডিভাইস-লোকাল)
- ক্যাটাগরি চিপ রো (8টি) + All Games গ্রিড (24)

## গেম পেজ
- **বিশাল ব্যানার সম্পূর্ণ সরানো** ✅ — প্লেয়ার এখন প্রথমে; ছোট থাম্ব + টাইটেল + মেটাডেটা প্লেয়ারের উপরে-পাশে, বর্ণনা h1-এর নিচে
- **নতুন লোডিং সিস্টেম:** spinner → ৪s-এ "slow connection?" → ৮s-এ auto-reveal (কখনো stuck নয়) → ব্যর্থ হলে Retry বাটন; iframe cached-হলে আগেই সরে যায়
- **৬টি কন্ট্রোল:** Fullscreen / Restart / Pause / Sound / Favorite / Retry
- Sound বাটন পোর্টাল-অডিও Music+SFX একসাথে mute/unmute করে
- `touch-action: manipulation`, ডার্ক প্লেয়ার ফ্রেম, রাউন্ডেড শ্যাডো

## মোবাইল
- 390px viewport-এ home/games/game/favorites — 0 horizontal overflow ✅
- কার্ড 132px গ্রিড, ক্যারোসেল 150px snap

## সংরক্ষিত (অপরিবর্তিত)
৫০০ গেম, রেজিস্ট্রি, ব্যানার/থাম্বনেইল, ads সিস্টেম, SEO/লিগ্যাল পেজ, আগের সব বাগ-ফিক্স।

## যাচাই (browser, Playwright)
হোম সেকশন: feat=10 trend=10 recent≥1 new=14 all=24 chips=8 navpill ✅ · গেম পেজ: 6 কন্ট্রোল + লোডস্টেট সরে যায় + সাউন্ড টগল ✅ · 0 pageerror · 390px overflow 0


## Poki-reference finetune — 2026-11-04 (from owner's screenshots)
- হোমপেজ: ৮টি প্যাস্টেল ক্যাটাগরি-সেকশন (Action/Puzzle/Brain/Casual/Strategy/Simulation/Multiplayer/Arcade), প্রতিটিতে ১২-গেমের horizontal row + "All ›" লিংক; প্রতিটি সেকশনের নিজস্ব soft-গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড
- Featured ও Recently Played কমপ্যাক্ট রো হিসেবে উপরে
- গেম পেজ: প্লেয়ার সবার আগে, তারপর "title card" (থাম্ব + title + "by PLAYNOVA" + মেটাডেটা) — Poki-এর "Subway Surfers by SYBO" স্টাইলের নিজস্ব সংস্করণ
- Poki-এর logo/artwork কপি করা হয়নি — শুধু লেআউট-অনুপ্রেরণা
- হোমের পুরনো catChips inline স্ক্রিপ্ট সরানো (এলিমেন্ট বাদ পড়ায় null.appendChild error ছিল — ঠিক)
- যাচাই: home feat=10 recent=1 সব catrow=12, গেম পেজ order=player→titlecard→howto, 390px overflow 0, pageerror 0


## Mobile Immersive + Touch Bridge — 2026-11-04 (owner feedback)
- **Tap-to-fullscreen:** গেম ওপেন করলেই "Tap for fullscreen" ফ্লোটিং হিন্ট; প্লেয়ারে এক ট্যাপেই ফুলস্ক্রিন (Poki-স্টাইল); load-এ auto-attempt; fullscreen-এ ভাসমান ✕ exit বাটন (Android-এ Esc নেই)
- **Touch Bridge (D-Pad):** touchpad.js — ১২২টি keyboard-only গেমসহ যেকোনো গেমে মোবাইলে on-screen D-Pad (⬆⬅✦➡⬇ + fullscreen) + কেন্দ্র-বাটন = canvas-এ tap/click dispatch; same-origin sandbox-এ প্রকৃত Keyboard/MouseEvent পাঠায় (যাচাই: ArrowUp ইভেন্ট iframe-এ পৌঁছেছে)
- **Rotate hint:** landscape গেম portrait-এ খুললে ৬ সেকেন্ডের "Rotate for best experience" হিন্ট
- ডিসপ্যাচ ব্রিজ যাচাই: synthetic pointerdown → iframe window-এ keydown ✅
