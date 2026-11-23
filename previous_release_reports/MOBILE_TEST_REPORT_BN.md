# MOBILE TEST REPORT (বাংলা)
তারিখ: 2026-11-04 · Android Chrome টার্গেট (Playwright touch-emulation)

## ফলাফল
- 375px/390px viewport: হোম/গেম/লিস্টিং — 0 horizontal overflow ✅
- Tap-to-fullscreen ফ্লো ✅ | ভাসমান ✕ exit ✅ | rotate hint ✅
- **Touch Bridge D-Pad:** ১২২টি keyboard-only গেমে on-screen control; dispatch-যাচাই: ArrowUp/Left ইভেন্ট iframe-এ পৌঁছেছে ✅
- **Swipe→Arrows:** রানার/লেন-গেমে সোয়াইপ কিবোর্ড-ইভেন্টে রূপ নেয় (touchpad.js) ✅
- touch-action: manipulation — accidental zoom/scroll প্রতিরোধ ✅

## MANUAL বাকি
আসল ডিভাইসে (iPhone/Android) হ্যান্ডস-অন — emulated পরিবেশে যা সম্ভব ছিল তা করা হয়েছে; ফিজিক্যাল-ডিভাইস ফাইনাল ফিল বাকি (NOT_TESTED হিসেবে স্বীকৃত)।
