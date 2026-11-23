/* PLAYNOVA Advertising Manager — CSP: provider চালু করলে ads-config.js-এর scriptTag.src ডোমেইন CSP-র script-src-এ যোগ করুন (AD_NETWORK_SETUP.md §CSP)। — modular provider adapters.
 * Ads are disabled by default. Providers: adsense, adsterra, monetag, propellerads. No fake/placeholder ads are ever shown.
 * Each adapter stays inert until the owner pastes the provider's OFFICIAL
 * script tag into ADS_CONFIG.<provider>.scriptTag (see AD_NETWORK_SETUP.md).
 * Empty slots are hidden — no fake or placeholder ads are ever shown. */
(function(){
  const cfg = window.ADS_CONFIG || {};
  function ready(p){ const c = cfg[p]; if(p==='adsense') return !!(cfg.enabled && cfg.provider==='adsense' && c && /^ca-pub-\d{10,20}$/.test(String(c.client||'')));
    return !!(cfg.enabled && cfg.provider===p && adapters[p] && c && (c.key||c.zoneId) && c.scriptTag); }
  const adapters = {
    adsense:      { run(c,slot){ /* needs a real publisher id + numeric slot id from the owner; consent already checked */
        const id=c.slots&&c.slots[slot.dataset.place]; if(!/^\d{6,}$/.test(String(id||''))) return false;
        inject({src:'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(c.client),attrs:{async:'',crossorigin:'anonymous'}});
        const ins=document.createElement('ins'); ins.className='adsbygoogle'; ins.style.display='block';
        ins.setAttribute('data-ad-client',c.client); ins.setAttribute('data-ad-slot',String(id)); ins.setAttribute('data-ad-format','auto'); ins.setAttribute('data-full-width-responsive','true');
        const inner=slot.querySelector('.inner'); inner.textContent=''; inner.appendChild(ins);
        try{ (window.adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){} return true; } },
    adsterra:     { run(c){ inject(c.scriptTag); } },
    monetag:      { run(c){ inject(c.scriptTag); } },
    propellerads: { run(c){ inject(c.scriptTag); } }
  };
  let __adInjected=false;
  function inject(tag){ // tag: {src:'https://official-url', attrs:{...}} — official provider code only
    if(!tag || !tag.src || __adInjected) return; __adInjected=true;
    const s=document.createElement('script');
    s.src=tag.src;
    Object.entries(tag.attrs||{}).forEach(([k,v])=>s.setAttribute(k,v));
    document.body.appendChild(s);
  }
  function consent(){ try{
      var c=JSON.parse(localStorage.getItem('p5_consent')||'null');
      if(!c||!c.v)return null;
      if(Date.now()-(c.t||0)>180*864e5)return 'expired';
      return c.v;
    }catch(e){return null;} }
  function init(){
    document.querySelectorAll('.adslot').forEach(slot=>{
      const allowed = cfg.placements && cfg.placements[slot.dataset.place];
      const ok = allowed && ready(cfg.provider) && consent()==='accepted';
      if(!ok){ slot.style.display='none'; return; }
      const fill=()=>{ const r=adapters[cfg.provider].run(cfg[cfg.provider],slot); if(r===false){ slot.style.display='none'; return; }
        slot.dataset.filled='1'; if(cfg.provider!=='adsense') slot.querySelector('.inner').textContent='Advertisement'; };
      if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ io.disconnect(); fill(); } },{rootMargin:'200px'}); io.observe(slot); } else fill(); /* lazy: only near the viewport */
    });
  }
  window.addEventListener('DOMContentLoaded', init);
})();
