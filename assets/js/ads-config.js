/* PLAYNOVA Advertising Configuration
 * Ads are DISABLED by default. Supported providers: adsense (Google AdSense), adsterra, monetag, propellerads.
 * Nothing is loaded and no ad slot is shown until enabled:true AND the provider credential below is valid AND the visitor accepted consent.
 * NEVER invent IDs: leave null until you have your own. AdSense needs your real publisher id (ca-pub-XXXXXXXXXXXXXXXX) and slot ids; also add the Google ad domains to the CSP of your pages (see DEPLOYMENT_GUIDE.md).
 * 1) Pick ONE provider below, enter your credential, and paste the provider's
 *    OFFICIAL script tag into scriptTag ({src:'https://...', attrs:{}}).
 * 2) Set provider and enabled:true.
 * Until then every ad slot stays hidden. See AD_NETWORK_SETUP.md. */
window.ADS_CONFIG = {
  enabled: false,                 // master on/off switch
  provider: null,                 // 'adsense' | 'adsterra' | 'monetag' | 'propellerads' | null
  adsense:       { client: null, slots: { homeAfterHero: null, listingBetween: null, gamePage: null, footer: null } }, // client: 'ca-pub-...' ; slots: numeric slot ids
  adsterra:      { key: null, scriptTag: null },
  monetag:       { zoneId: null, scriptTag: null },
  propellerads:  { zoneId: null, scriptTag: null },
  placements: { homeAfterHero: true, listingBetween: true, gamePage: true, footer: false }
};
