# LICENSE AUDIT — PLAYNOVA
Date: 2026-11-04

## Inventory & rights assessment

| Component | Origin | License / rights status |
|---|---|---|
| 500 game files (games-src/batch-01…25) | Created in earlier project phases for this portal; each is a single self-contained HTML file | Original works created for PLAYNOVA. Distribution right: project owner. No third-party game code embedded. |
| 500 banners + 500 thumbnails (assets/img) | **Procedurally generated in-session** (PIL): per-game seeded geometric motifs + each game's own palette + its title. Verified 0 duplicate images. | Original generated artwork — no third-party images, no stock photos, no scraped assets. Full rights held by project owner. |
| Portal CSS / JS (portal, player, audio, ads, registry) | Written for this project | Original code. System font stack only — no font files, no font licenses needed. |
| Background music | **Synthesized at runtime** via WebAudio (chord/arpeggio generator in audio.js) | Original generative composition — no licensed audio, 0 audio bytes shipped. |
| Sound effects | Synthesized WebAudio blips (audio.js) | Original — no samples used. |
| Third-party libraries | None. No frameworks, no CDN dependencies, no npm packages shipped. | N/A |
| Emoji glyphs in banners/titles | Unicode emoji (system-rendered) | Standard Unicode characters; fonts provided by the user's OS. |
| favicon.svg | Hand-written inline SVG | Original. |

## Advertising
- No Google AdSense / Google Ads code, accounts, or IDs anywhere in the project.
- Adsterra / Monetag / PropellerAds: integration adapters are original code; **no provider script is included or loaded** until the owner pastes their own official tag (ads-config.js ships with null placeholders).

## Outstanding owner obligations
1. Replace production URL https://sakibhtml323-source.github.io/PLAYNOVA `https://sakibhtml323-source.github.io/PLAYNOVA` with the real domain.
2. When enabling ads: name the active provider(s) in privacy/index.html and cookies/index.html (disclosure paragraphs already drafted).
3. If any future game/asset is added from outside sources, log it in this file with its license before shipping.

## Verdict
All shipped content is original or generated in-session for this project. No unlicensed third-party assets are distributed.
