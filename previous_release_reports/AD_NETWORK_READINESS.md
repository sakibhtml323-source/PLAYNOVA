# AD NETWORK READINESS — PLAYNOVA
Date: 2026-11-04

## Current state (verified)
- **Advertising is DISABLED.** `ADS_CONFIG.enabled=false`, `provider=null`, all credentials `null`.
- All 6 ad slots (home-after-hero, listing-between, game-page, footer, ×2 placements) render **hidden** — verified: no ad markup appears in DOM output and no network request is made for any ad resource.
- **No Google AdSense / Google Ads code, IDs, or dependencies exist anywhere in the project** (verified by source scan).

## Safety rules enforced by the implementation
1. Ads never overlay gameplay or controls (slots live outside the player; game iframe has no ad code).
2. No ads beside Play/Fullscreen buttons.
3. No fake/placeholder ads: empty slots are `display:none`.
4. No forced redirects or popups from our code; only the chosen provider's own script runs, and only after explicit owner configuration.
5. No intrusive audio ads (portal audio system is independent of ad code).

## To go live (owner actions — see AD_NETWORK_SETUP.md)
1. Create an account with ONE provider (Adsterra / Monetag / PropellerAds).
2. Paste the provider's **official** script tag into `assets/js/ads-config.js` (`scriptTag` object with `src`/`attrs`) plus the credential field.
3. Set `provider` and `enabled:true`. Consider consent-banner integration for GDPR/ePrivacy regions.
4. Verify placement policy compliance with the chosen network (formats differ per network).

## Status: READY but UNCONFIGURED
Integration adapters are coded and slots verified hidden; no network is connected — connection requires the owner's real credentials and cannot be faked.
