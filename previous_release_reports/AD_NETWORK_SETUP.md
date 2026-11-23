# AD NETWORK SETUP — PLAYNOVA
This portal has **no Google AdSense / Google Ads**. It supports three independent providers via one config file: `assets/js/ads-config.js`.

## How the system works
- `ads.js` reads `window.ADS_CONFIG`. An ad slot only renders when **all** are true: `enabled=true`, a valid `provider`, a non-null credential, and a non-null `scriptTag` (the provider's official code).
- Otherwise every slot stays `display:none`. No fake ads ever appear.
- To switch providers later, change `provider` and the matching block — no redesign needed.

## 1) Adsterra
1. Sign up at adsterra.com, add your site, create a **Popunder/Social Bar or Banner** unit.
2. Copy the **official script tag** from your own dashboard (never from third-party pages).
3. In `assets/js/ads-config.js` set: provider:'adsterra', enabled:true, and fill adsterra.key + adsterra.scriptTag with src/attrs.
4. If your unit format requires extra attributes (e.g. data-cfasync), put them in attrs.

## 2) Monetag
1. Sign up at monetag.com, add the site, create a zone (prefer non-intrusive banner/push formats).
2. Copy your zone's official script from your dashboard.
3. Set provider:'monetag', enabled:true, fill monetag.zoneId + monetag.scriptTag.

## 3) PropellerAds
1. Sign up at propellerads.com, add the site, create a zone.
2. Copy the official zone script from your dashboard.
3. Set provider:'propellerads', enabled:true, fill propellerads.zoneId + propellerads.scriptTag.

## Compliance checklist (all providers)
- Read the network's gaming/placement policy; some formats (aggressive popunders) may violate it or hurt retention — prefer banners/social bars.
- GDPR/ePrivacy: add a consent banner (CMP) before enabling ads for EU/UK traffic; the Privacy/Cookies pages already contain disclosure text — update provider names when live.
- If your ad format needs CSP exceptions, add the provider's script domains to the CSP meta in each page's head.

## Verification after setup
1. Open the site, confirm the slot shows "Advertisement" and a real ad appears.
2. Confirm ads never cover the game player or its buttons.
3. Confirm no ad network request fires when enabled:false (current shipped state).
