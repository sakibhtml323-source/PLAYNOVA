# নতুন গেম যোগ করা — PLAYNOVA (বাংলা)

**নিয়ম: গেম ফাইল + Registry এন্ট্রি = সম্পন্ন।** নতুন static পেজ বানাতে হবে না — `play/?slug=<slug>` ডায়নামিক প্লেয়ার সব হ্যান্ডল করে।

## ১) গেম ফাইল
- `games-src/batch-XX/game-XXXX.html` — self-contained HTML5 (canvas/DOM, inline JS/CSS, কোনো external CDN নয়)
- গেমে `#ov` স্প্ল্যাশ + Start বাটন (`id="btn"`) থাকতে হবে

## ২) Registry এন্ট্রি
`assets/js/registry.json` **এবং** `assets/js/registry.js` (একই JSON দুই ফাইলে)। বাধ্যতামূলক ফিল্ড: id, slug, title, description, category, gameUrl, instructions, difficulty, seoTitle, seoDescription; সুপারিশকৃত: thumbnail, banner, tags, emoji, theme

## ৩) ছবি
- `assets/img/thumbs/<slug>.webp` (400×300), `assets/img/banners/<slug>.webp` (1200×630)

## ৪) যাচাই
```bash
# Existing game (consistency check):
python3 tools/validate_game.py --check iron-gunner
# New entry (validate before adding):
python3 tools/validate_game.py new-entry.json
```
ভ্যালিডেটর ধরে: duplicate id/slug, missing field, অনুপস্থিত ফাইল, root-absolute path, অবৈধ slug।

## ৫) চূড়ান্ত পরীক্ষা
`python3 -m http.server` → `http://localhost:8000/play/?slug=<slug>` খুলে PLAY/Fullscreen/Restart চেক করুন। হোম/সার্চ/ক্যাটাগরিতে অটো দেখাবে। পরে `python3 tools/generate_sitemap.py` চালান (SEO-র জন্য)।

## নিয়ম
- slug: lowercase+dash, 48 chars, **unique** · id: **unique** · difficulty: Relaxed/Moderate/Challenging/Casual
- category: বিদ্যমান ৮টির একটিতে রাখলে ক্যাটাগরি পেজে অটো যুক্ত হবে
- Google Ads নয়; বিজঞ্পান সবসময় consent-gate-এর আড়ালে
- root-absolute পথ (`/assets/...`) ব্যবহার করা যাবে না — GitHub Pages subpath-এ ভাঙবে

## PLAYNOVA v3 additions (English)
- Put `<script src="../../assets/js/pn-bridge.js"></script>` as the FIRST script inside the game's `<head>` (adjust the relative path). Games run in `sandbox="allow-scripts"` (opaque origin), so without the bridge `localStorage` is blocked.
- Level/win/loss events: call `pnEmit('GAME_LEVEL_COMPLETED',{level:N})`, `pnEmit('GAME_WON')`, `pnEmit('GAME_LOST')`, `pnEmit('GAME_SCORE_UPDATED',{score:N})` only where completion is genuinely detectable. Rewards are decided by the platform; amounts in messages are ignored.
- A game earns event rewards only after you test it with real input and set its status in `assets/js/game-capabilities.json`.
