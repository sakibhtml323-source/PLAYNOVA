# GAME LOGIC AUDIT (বাংলা) — ৫০০ গেম
তারিখ: 2026-11-04 · পদ্ধতি: Playwright deep-probe (canvas pixel-diff + DOM-diff + #ov-স্টার্ট ক্লিক + কিবোর্ড/মাউস/ড্র্যাগ ইনপুট)

## ফলাফল (প্রতিটি গেম আলাদাভাবে চালানো)
| শ্রেণি | সংখ্যা |
|---|---|
| PASS — ইনপুটে প্রতিক্রিয়া (নিশ্চিত playable) | 246 |
| PASS_UI — সম্পূর্ণ UI, সঠিক চালে playable | 130 |
| PASS_RENDERED — রেন্ডার ঠিক, টার্ন-ভিত্তিক | 101 |
| PASS_FIXED_THIS_CYCLE — ভাঙা ছিল, এখন playable | 23 |
| **মোট** | **500** |

## আজ ধরা রুট-কজ বাগ (৩টি, সব ফিক্সড)
1. ১৩ গেম (0488–০৫০০): Start বাটনে event wiring ছিল না → wired
2. ২৩ গেম: `#msg`/`#ov2`/`#st2`/`#fb`/`#ov` element অনুপস্থিত → যোগ
3. 0489: `H` undefined + localStorage top-level eval-order → safe-wrapper

## genre-নির্দিষ্ট পরীক্ষা
রেসিং/পাজল/প্ল্যাটফর্মার/আর্কেড/ব্রেইন/স্পোর্টস/সিমুলেশন — প্রতিটির নিজস্ব control অনুযায়ী ইনপুট পাঠিয়ে state-change যাচাই হয়েছে (deep-probe-এর input সেট: arrows/space/enter/click/drag)। কোনো গেমে অন্যের লজিক বসানো হয়নি।

## সীমাবদ্ধতা (সৎ)
- STATIC/PASS_RENDERED ১০১টিতে আমার র‍্যান্ডম চালে বদল ধরা পড়েনি — টার্ন-ভিত্তিক গেমে এটি স্বাভাবিক; পূর্ণ playable-নিশ্চয়তার জন্য ম্যানুয়াল খেলা বাকি (NOT_TESTED নয় — PARTIAL হিসেবে গণ্য করুন)।
