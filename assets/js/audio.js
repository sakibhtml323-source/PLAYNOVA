/* PLAYNOVA Audio Manager — original WebAudio generative music + UI sfx.
 * No audio files needed (all synthesized = original, license-free).
 * Never autoplays: AudioContext resumes on first user gesture. */
(function(){
  const KEY='p5_audio', $=s=>document.querySelector(s);
  let _ls={};try{_ls=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  const P=Object.assign({master:.7,music:.5,sfx:.8,musicOn:true,sfxOn:true},_ls);
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
  let ctx=null, master, musicBus, sfxBus, seq=null;
  function ensure(){
    if(ctx) return true;
    try{
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      master=ctx.createGain(); master.connect(ctx.destination);
      musicBus=ctx.createGain(); musicBus.connect(master);
      sfxBus=ctx.createGain(); sfxBus.connect(master);
      apply();
      startMusic();
      return true;
    }catch(e){ return false; }
  }
  function apply(){ if(!ctx)return;
    master.gain.value=P.master; musicBus.gain.value=P.musicOn?P.music:0; sfxBus.gain.value=P.sfxOn?P.sfx:0; }
  /* --- generative music: slow chord arpeggio, pentatonic --- */
  const CHORDS=[[220,261.63,329.63,392],[174.61,220,261.63,349.23],[196,246.94,293.66,392],[146.83,196,246.94,329.63]];
  let ci=0;
  function note(f,t,dur,type,vol,bus){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type; o.frequency.value=f;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.03);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t+dur+.05);
  }
  function startMusic(){
    if(seq) return;
    let step=0;
    seq=setInterval(()=>{
      if(!P.musicOn||ctx.state!=='running') return;
      const t=ctx.currentTime+.05, ch=CHORDS[ci%CHORDS.length];
      const f=ch[step%ch.length]*(step%8>=4?2:1);
      note(f,t,.5,'triangle',.11,musicBus);
      if(step%4===0) note(ch[0]/2,t,1.6,'sine',.09,musicBus);
      step++; if(step%16===0) ci++;
    },300);
  }
  /* --- sfx --- */
  function blip(f,d,type,vol){ if(!ctx||!P.sfxOn) return; note(f,ctx.currentTime+.01,d,type,vol,sfxBus); }
  const sfx={
    click(){ blip(660,.07,'square',.10); },
    hover(){ blip(440,.04,'sine',.05); },
    start(){ blip(523,.09,'square',.12); setTimeout(()=>blip(784,.12,'square',.12),90); },
    fav(){ blip(880,.08,'triangle',.10); }
  };
  function initUI(){
    document.querySelectorAll('button,a').forEach(el=>{
      el.addEventListener('click',()=>sfx.click(),{passive:true});
      el.addEventListener('mouseenter',()=>sfx.hover(),{passive:true});
    });
  }
  function buildPanel(){
    const el=document.createElement('div'); el.className='audiopanel'; el.id='audioPanel';
    el.innerHTML=`<div class="row"><b>🔊 Audio</b><button class="iconbtn" id="apClose">✕</button></div>
    <div class="row" style="margin-top:8px"><span style="font-size:.8rem">Music</span><button class="iconbtn" id="apMusic">${P.musicOn?'🎵':'🚫'}</button></div>
    <div class="row"><span style="font-size:.8rem">Sound FX</span><button class="iconbtn" id="apSfx">${P.sfxOn?'🔔':'🔕'}</button></div>
    <label>Master volume</label><input type="range" id="apMaster" min="0" max="1" step=".01" value="${P.master}">
    <label>Music volume</label><input type="range" id="apMusicV" min="0" max="1" step=".01" value="${P.music}">
    <label>Effects volume</label><input type="range" id="apSfxV" min="0" max="1" step=".01" value="${P.sfx}">`;
    document.body.appendChild(el);
    el.querySelector('#apClose').onclick=()=>el.classList.remove('on');
    el.querySelector('#apMusic').onclick=e=>{P.musicOn=!P.musicOn;e.target.textContent=P.musicOn?'🎵':'🚫';apply();save();};
    el.querySelector('#apSfx').onclick=e=>{P.sfxOn=!P.sfxOn;e.target.textContent=P.sfxOn?'🔔':'🔕';apply();save();};
    el.querySelector('#apMaster').oninput=e=>{P.master=+e.target.value;apply();save();};
    el.querySelector('#apMusicV').oninput=e=>{P.music=+e.target.value;apply();save();};
    el.querySelector('#apSfxV').oninput=e=>{P.sfx=+e.target.value;apply();save();};
  }
  ['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>{ if(ensure()){ initUI(); } },{once:true,passive:true}));
  document.addEventListener('DOMContentLoaded',()=>{
    buildPanel();
    const b=document.createElement('button'); b.className='iconbtn'; b.id='audioBtn'; b.title='Audio settings'; b.textContent='🔊';
    b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:200;width:44px;height:44px;border-radius:50%';
    b.onclick=()=>{ ensure(); const p=document.getElementById('audioPanel'); p.classList.toggle('on'); document.getElementById('audioBtn').style.bottom=p.classList.contains('on')?'266px':'16px'; };
    document.body.appendChild(b);
  });
  window.P5Audio={ sfx, ensure, prefs:P, apply, savePrefs:save };
})();
