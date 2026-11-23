/* PLAYNOVA Portal — library, search, filters, favorites, recents */
(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const G=(typeof REGISTRY!=='undefined'?REGISTRY:(window.REGISTRY||[]));
const isFav=id=>LS.get('p5_fav',[]).includes(id);
const addRecent=id=>{let r=LS.get('p5_recent',[]).filter(x=>x!==id);r.unshift(id);LS.set('p5_recent',r.slice(0,30));};
const plays=id=>LS.get('p5_plays',{})[id]||0;

function card(g){
  const d=document.createElement('div'); d.className='card';
  d.innerHTML=`<a class="cover" href="${ROOT}game/${g.slug}/" aria-label="${esc(g.title)}">
    <img loading="lazy" src="${ROOT}${g.thumbnail}" alt="${esc(g.title)} game thumbnail" width="400" height="300"></a>
  <div class="bd"><div class="badges">${(g.labels||[]).slice(0,2).map(l=>"<span class=\"gbadge\">"+esc(l)+"</span>").join("")}</div><h3><a href="${ROOT}game/${g.slug}/">${esc(g.title)}</a></h3>
  <div class="meta"><span class="tagcat c-${esc(g.category).replace(/[^A-Za-z]/g,"-")}">${g.emoji} ${g.category}</span>
  <button class="fav ${isFav(g.id)?'on':''}" title="Favorite">⭐</button></div></div>`;
  d.querySelector('.fav').onclick=e=>{e.stopPropagation();toggleFav(g.id,e.target);};
  return d;
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function toggleFav(id,btn){let f=LS.get('p5_fav',[]);f=f.includes(id)?f.filter(x=>x!==id):[...f,id];LS.set('p5_fav',f);
  if(btn)btn.classList.toggle('on',f.includes(id)); if(window.P5Audio)P5Audio.sfx.fav();
  if(document.body.dataset.page==='favorites')render();}
function grid(el,list){if(!el)return;el.innerHTML='';
  if(!list.length){el.innerHTML='<div class="empty">Nothing here yet — go play something! 🎮</div>';return;}
  list.forEach(g=>el.appendChild(card(g)));}

function seeded(n,off){return G.slice().sort((a,b)=>((parseInt(a.id)*2654435761+off)>>>0)-((parseInt(b.id)*2654435761+off)>>>0)).slice(0,n);}
const POPULAR=()=>G.slice().sort((a,b)=>plays(b.id)-plays(a.id)||parseInt(a.id)-parseInt(b.id));

function render(){
  const page=document.body.dataset.page;
  if(page==='home'){
    grid($('#featGrid'),seeded(10,7));
    const trend=[];POPULAR().slice(0,8).forEach(g=>trend.push(g));seeded(8,3).forEach(g=>{if(trend.length<10&&!trend.includes(g))trend.push(g);});
    grid($('#trendRow'),trend);
    grid($('#newRow'),G.slice(-14).reverse());
    const counts={};G.forEach(g=>counts[g.category]=(counts[g.category]||0)+1);
    document.querySelectorAll('[data-catrow]').forEach(el=>{
      const c=el.dataset.catrow;
      grid(el,G.filter(g=>g.category===c).slice(0,12));
    });
    const rc=LS.get('p5_recent',[]).map(id=>G.find(g=>g.id===id)).filter(Boolean);
    const rp=$('#recentRow');if(rp){rp.innerHTML='';if(rc.length)rc.slice(0,10).forEach(g=>rp.appendChild(card(g)));
      else rp.innerHTML='<div class="empty" style="flex:1">No games played yet on this device &mdash; tap any game and it will appear here &#127918;</div>';}
    grid($('#allGrid'),G.slice(0,24));
  }
  if(page==='games'||page==='category'||page==='popular'||page==='new'||page==='favorites'||page==='recent'){
    let list=G;
    if(page==='category'){const c=document.body.dataset.category;list=G.filter(g=>g.category===c);}
    if(page==='popular')list=POPULAR();
    if(page==='new')list=G.slice().reverse();
    if(page==='favorites'){const f=LS.get('p5_fav',[]);list=G.filter(g=>f.includes(g.id));}
    if(page==='recent'){const rc=LS.get('p5_recent',[]);list=rc.map(id=>G.find(g=>g.id===id)).filter(Boolean);}
    const q=($('#q')?$('#q').value:'').trim().toLowerCase();
    if(q)list=list.filter(g=>g.title.toLowerCase().includes(q)||g.tags.map(x=>x.toLowerCase()).includes(q));
    const cat=$('#fcat')?$('#fcat').value:'all';
    if(cat!=='all')list=list.filter(g=>g.category===cat);
    const feat=$('#ffeat')?$('#ffeat').value:'all';
    if(feat!=='all')list=list.filter(g=>(g.labels||[]).includes(feat));
    const pm=$('#fpm')?$('#fpm').value:'all';
    if(pm!=='all')list=list.filter(g=>g.playerMode===pm);
    const df=$('#fdiff')?$('#fdiff').value:'all';
    if(df!=='all')list=list.filter(g=>g.difficulty===df);
    const im=$('#fim')?$('#fim').value:'all';
    if(im!=='all')list=list.filter(g=>(g.inputMethods||[]).includes(im));
    const sort=$('#fsort')?$('#fsort').value:'default';
    if(sort==='az')list=list.slice().sort((a,b)=>a.title.localeCompare(b.title));
    if(sort==='plays')list=POPULAR().filter(g=>list.includes(g));
    if(sort==='newest')list=list.slice().reverse();
    const per=48, pg=Math.max(1,parseInt(new URLSearchParams(location.search).get('page')||'1'));
    const pages=Math.max(1,Math.ceil(list.length/per));
    grid($('#allGrid'),list.slice((pg-1)*per,pg*per));
    if($('#count'))$('#count').textContent=list.length+' games';
    const pager=$('#pager'); if(pager){pager.innerHTML='';
      for(let i=1;i<=pages;i++){const b=document.createElement('button');
        if(i===pg)b.classList.add('on');
        b.textContent=i; b.onclick=()=>{const u=new URL(location.href);u.searchParams.set('page',i);location.href=u;};
        pager.appendChild(b);}}
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  render();
  ['#q','#fcat','#fsort','#ffeat','#fpm','#fim','#fdiff'].forEach(s=>{const e=$(s);if(e)e.addEventListener('input',()=>{
    if(history.replaceState)history.replaceState(null,'',location.pathname);
    new URLSearchParams(location.search).delete('page');
    render();
  });});
  const r=$('#randomBtn'); if(r)r.onclick=()=>{if(!G.length)return;const g=G[Math.floor(Math.random()*G.length)];location.href=ROOT+'game/'+g.slug+'/';};
});
window.P5={card,grid,toggleFav,isFav,addRecent,POPULAR,render};
document.addEventListener('DOMContentLoaded',()=>{const f=document.querySelector('footer.site .base span:last-child');if(f){const a=document.createElement('a');a.href='javascript:void(0)';a.textContent='Privacy preferences';a.style.cssText='margin-left:10px;color:var(--acc)';a.onclick=()=>window.P5Consent&&P5Consent.reopen();f.appendChild(a);}});
})();

/* --- cookie consent (preference storage only; ads stay disabled without owner config) --- */
(function(){
  try{
    var _c=JSON.parse(localStorage.getItem('p5_consent')||'null');
    if(_c&&(_c.v==='accepted'||_c.v==='declined')&&Date.now()-(_c.t||0)<180*864e5)return;
  }catch(e){}
  const bar=document.createElement('div');
  bar.id='consentBar';
  bar.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:300;background:#141b2d;border:1px solid #2a3a66;border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 10px 34px rgba(0,0,0,.5);font-size:.88rem;color:#b9c3dd';
  bar.innerHTML='<span style="flex:1;min-width:220px">&#127850; We store game scores, favorites and audio preferences on <b>your device</b> only. If advertising is enabled by the site owner, its provider may use cookies — see the <a href="'+ROOT+'cookies/" style="color:var(--acc2)">Cookie Policy</a>.</span><button class="btn pri" id="consentOk" style="padding:9px 18px">Accept</button><button class="btn ghost" id="consentNo" style="padding:9px 18px">Decline</button>';
  function pick(v){try{localStorage.setItem('p5_consent',JSON.stringify({v:v,t:Date.now()}));}catch(e){}bar.remove();}
  window.P5Consent={get:function(){try{var c=JSON.parse(localStorage.getItem('p5_consent')||'null');return(c&&c.v)||null;}catch(e){return null}},set:pick,reopen:function(){try{localStorage.removeItem('p5_consent');}catch(e){} location.reload();}};
  document.addEventListener('DOMContentLoaded',()=>{
    document.body.appendChild(bar);
    document.getElementById('consentOk').onclick=()=>pick('accepted');
    document.getElementById('consentNo').onclick=()=>pick('declined');
  });
})();

/* PWA: register SW only on secure contexts; failure is silent-safe */
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  if(document.body.dataset.page==='home')window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}