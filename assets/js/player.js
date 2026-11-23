/* PLAYNOVA Game Player v3 — loading state machine, cooperative READY/pause protocol,
   honest pause (disabled when game can't truly pause), fullscreen, restart, sound */
(function(){
const $=s=>document.querySelector(s);
const S={state:'idle'}; // idle|loading|iframe-loaded|ready|ready-unconfirmed|error|timeout
let coopPause=false;

let booted=false;
function init(){
  if(booted)return; booted=true;
  const frame=$('#gameFrame'), wrap=$('#playerWrap'), loadEl=$('#loadState'), loadMsg=$('#loadMsg'), ov=$('#pauseOverlay');
  if(!frame) return;
  const SRC0=frame.getAttribute('src')||frame.dataset.pnSrc;
  const g=window.GAME||null;
  const isTouch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;

  /* ---------- loading state machine ---------- */
  let slowTimer=null, hardTimer=null, probeTimer=null, probeCount=0;
  function setState(st,msg){ S.state=st;
    if(msg&&loadMsg) loadMsg.textContent=msg;
    document.body.dataset.loadState=st; }
  function hideLoad(){ if(loadEl){loadEl.classList.add('hide'); setTimeout(()=>{loadEl.style.display='none';},350);} }
  function showRetry(){ const rb=$('#btnRetry'); if(rb) rb.style.display='inline-flex'; }
  function retry(){ if(loadEl){loadEl.classList.remove('hide');loadEl.style.display='flex';}
    const rb=$('#btnRetry'); if(rb) rb.style.display='none';
    const _src=SRC0; startLoad();
    if(_src){ const _b=_src.split('#')[0].replace(/[?&]r=\d+/,'')+'?r='+Date.now(); const _u=window.PN_FRAME_SRC&&frame.dataset.pnSrc?PN_FRAME_SRC(_b):_b; let _ok=false;
      try{ if(frame.contentWindow){ frame.contentWindow.location.replace(new URL(_u,location.href).href); _ok=true; } }catch(e){}
      if(!_ok){ frame.removeAttribute('src'); void frame.offsetWidth; frame.setAttribute('src',_u); } } /* location.replace keeps Back working (no extra history entries); the original src/data-pn-src attribute is kept for the next restart */ /* cache-bust: a URL differing only by fragment would not reload */
    if(window.P5Audio)P5Audio.sfx.start(); }
  /* cooperative readiness: poll iframe for actual rendered content (canvas painted / DOM built) */
  function probeReady(){
    try{
      const d=frame.contentDocument; if(!d) return false;
      const c=d.querySelector('canvas');
      if(c && c.width>0){
        const x=c.getContext && c.getContext('2d');
        if(x){ const im=x.getImageData(0,0,Math.min(40,c.width),Math.min(40,c.height)).data;
          let s=0; for(let i=3;i<im.length;i+=401) s+=im[i]; if(s>0) return true; }
      }
      const ovEl=d.getElementById('ov')||d.querySelector('#overlay');
      if(ovEl) return true;           // game rendered its own splash => alive
      if(d.body && d.body.innerHTML.length>200) return true;
    }catch(e){}
    return false;
  }
  function markReady(){ if(S.state==='ready') return;
    setState('ready'); hideLoad();
    if(slowTimer){clearTimeout(slowTimer);slowTimer=null;}
    if(hardTimer){clearTimeout(hardTimer);hardTimer=null;}
    if(probeTimer){clearInterval(probeTimer);probeTimer=null;} }
  function startLoad(){
    setState('loading','Loading game…');
    frame.addEventListener('load',onIframeLoad,{once:true});
    try{ if(frame.contentDocument && probeReady()) markReady(); }catch(e){}
    probeTimer=setInterval(()=>{
      probeCount++;
      if(probeReady()) markReady();
      else if(probeCount>=45 && S.state==='loading'){ setState('ready-unconfirmed','Loaded — tap to play'); hideLoad(); }
    },200);
    slowTimer=setTimeout(()=>{ if(S.state==='loading') loadMsg.textContent='Still loading… slow connection?'; },4000);
    hardTimer=setTimeout(()=>{
      if(S.state!=='ready'&&S.state!=='ready-unconfirmed'){
        setState('timeout','Taking too long… tap Retry or keep waiting.');
        showRetry();
      }
    },15000);
  }
  window.addEventListener('message',function(e){ if(frame.dataset.pnIso==='1'&&e.source===frame.contentWindow&&e.origin==='null'&&e.data&&e.data.ns==='PLAYNOVA'&&e.data.type==='BRIDGE_READY') markReady(); });
  function onIframeLoad(){ setState('iframe-loaded'); probeCount=0;
    setTimeout(()=>{ if(probeReady()) markReady(); },120); }

  /* postMessage protocol: only accept messages from our own iframe & origin */
  function onMsg(e){
    if(!frame.contentWindow || e.source!==frame.contentWindow) return;
    const d=e.data||{};
    if(d.type==='P5_READY') markReady();
    if(d.type==='P5_PAUSE_OK') coopPause=true;
  }
  window.addEventListener('message',onMsg);

  /* ---------- cooperative pause (honest) ---------- */
  const pauseBtn=$('#btnPause');
  function supportsPause(){ try{
    const w=frame.contentWindow;
    return coopPause || !!(w&&(w.pauseGame||w.togglePause||w.P5_pause));
  }catch(e){return false;} }
  function refreshPauseBtn(){
    if(!pauseBtn) return;
    const ok=supportsPause();
    pauseBtn.disabled=!ok;
    pauseBtn.style.opacity=ok?'1':'.45';
    pauseBtn.title=ok?'Pause (P)':'Pause unavailable — this game has no pause support';
  }
  function togglePause(){
    if(!supportsPause()){ refreshPauseBtn(); return; } // honest: do nothing
    ov.classList.toggle('on');
    try{ frame.contentWindow.postMessage({type:'P5_PAUSE'},location.origin); }catch(e){}
    if(window.P5Audio)P5Audio.sfx.click();
  }
  frame.addEventListener('load',()=>{ setTimeout(refreshPauseBtn,600); },{once:true});
  setTimeout(refreshPauseBtn,3000);

  /* ---------- controls ---------- */
  function tryFs(){ try{ const p=wrap.requestFullscreen&&wrap.requestFullscreen(); if(p&&p.catch)p.catch(()=>{});}catch(e){} }
  function toggleFs(){
    if(document.fullscreenElement){ document.exitFullscreen(); }
    else if(wrap.requestFullscreen){ wrap.requestFullscreen(); }
    else if(frame.webkitEnterFullscreen){ frame.webkitEnterFullscreen(); }
  }
  function restart(){ retry(); }

  $('#btnRestart').onclick=restart;
  $('#btnFs').onclick=toggleFs;
  if(pauseBtn) pauseBtn.onclick=togglePause;
  $('#btnResume').onclick=()=>{ ov.classList.remove('on'); };
  $('#btnReloadErr').onclick=()=>{ ov.classList.remove('on'); restart(); };
  const rb=$('#btnRetry'); if(rb) rb.onclick=retry;
  const snd=$('#btnSound');
  if(snd){ const sync=()=>{ const p=(window.P5Audio&&P5Audio.prefs)||{musicOn:true,sfxOn:true};
      const on=p.musicOn||p.sfxOn; snd.innerHTML=on?'&#128266; Sound':'&#128263; Muted'; };
    sync();
    snd.onclick=()=>{ if(!window.P5Audio)return; P5Audio.ensure(); const p=P5Audio.prefs;
      const on=p.musicOn||p.sfxOn; p.musicOn=p.sfxOn=!on; if(P5Audio.apply)P5Audio.apply(); if(P5Audio.savePrefs)P5Audio.savePrefs(); sync(); }; }
  const fav=$('#btnFav');
  if(fav&&g){ const sync=()=>fav.classList.toggle('on',window.P5.isFav(g.id)); sync();
    fav.onclick=()=>{P5.toggleFav(g.id,fav);sync();}; }

  /* exit/back */
  const back=$('#btnBack');
  if(back) back.onclick=()=>{ if(document.fullscreenElement)document.exitFullscreen(); else history.back(); };

  document.addEventListener('fullscreenchange',()=>{ wrap.classList.toggle('fs',!!document.fullscreenElement);
    const ex=$('#fsExit'); if(ex) ex.style.display=document.fullscreenElement?'flex':'none'; });
  /* floating exit for touch */
  if(isTouch){
    const ex=document.createElement('button'); ex.id='fsExit'; ex.textContent='✕'; ex.title='Exit fullscreen';
    ex.style.cssText='position:fixed;top:10px;right:10px;z-index:9999;width:42px;height:42px;border-radius:50%;border:none;background:rgba(20,26,44,.75);color:#fff;font-size:1.15rem;display:none;align-items:center;justify-content:center';
    document.body.appendChild(ex);
    /* শর্ত C: কোনো ভাসমান ওভারলেই নয় — fullscreen শুধু infostrip-এর বাটন থেকে */
  }
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select'))return;
    const k=e.key.toLowerCase();
    if(k==='escape'&&document.fullscreenElement){document.exitFullscreen();return;}
    if(k==='f')toggleFs();
    if(k==='r')restart();
    if(k==='p'||k===' '){ if(supportsPause()){togglePause();} e.preventDefault(); }
  });
  if(window.P5&&g)P5.addRecent(g.id);
  if(window.P5Audio)P5Audio.sfx.start();
  startLoad();
  const bb=document.getElementById('backBtn');
  if(bb) bb.onclick=()=>{ try{ if(window.history.length>1) window.history.back(); else location.href=ROOT||'./'; }catch(e){ location.href=ROOT||'./'; } };
  const pc=document.querySelector('.pcontrols');
  if(pc){ const inf=document.createElement('button'); inf.className='btn ghost'; inf.title='Info'; inf.innerHTML='&#8505;';
    inf.onclick=()=>{ const ex=document.getElementById('extraInfo'); if(ex) ex.classList.toggle('on'); }; pc.appendChild(inf); }
  document.addEventListener('fullscreenchange',()=>{ document.body.classList.toggle('fs-active',!!document.fullscreenElement); });
}
/* robust boot: works when script is statically included OR dynamically injected after DOMContentLoaded;
   guarded so init runs at most once */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  setTimeout(init,0);
}
window.P5Player={get state(){return S.state;}};
})();