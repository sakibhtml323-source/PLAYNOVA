/* PLAYNOVA core: profile, XP, wallet ledger, achievements, daily, shop, integration adapter.
   Client-side only: data can be edited by the user. NOT tamper-proof. */
(function(){'use strict';
const KEY='pn_data',V=1;
const CONFIG=window.PLAYNOVA_CONFIG||{xp:{session:10,win:25,level:20,daily:50},coins:{session:5,win:10,level:10,daily:20,login:10},
 xpForLevel:L=>50*L*(L-1),session:{activeMs:120000,inputs:20},ledgerMax:500};
const EVENTS=['GAME_READY','GAME_STARTED','GAME_PAUSED','GAME_RESUMED','GAME_LEVEL_COMPLETED','GAME_WON','GAME_LOST','GAME_SCORE_UPDATED','GAME_OVER'];
const ACH=[
['first_game','First Game','Complete 1 verified session',s=>s.played,1,20],['first_win','First Win','Win 1 verified match',s=>s.wins,1,20],
['g10','10 Games Played','Complete 10 verified sessions',s=>s.played,10,30],['g50','50 Games Played','Complete 50 verified sessions',s=>s.played,50,80],['g100','100 Games Played','Complete 100 verified sessions',s=>s.played,100,150],
['lvl1','First Level Completed','Complete 1 verified level',s=>s.levels,1,20],['lvl10','10 Levels Completed','Complete 10 verified levels',s=>s.levels,10,60],
['streak5','5 Consecutive Wins','Reach a win streak of 5',s=>s.bestStreak,5,60],['daily1','Daily Challenge Completed','Claim 1 daily challenge',s=>s.dailies,1,30],
['explorer','Explorer','Complete sessions in 10 different games',s=>Object.keys(s.byGame).length,10,50],['master','Master Player','Reach player level 10',s=>s.plevel,10,200]];
const SHOP=[['av_rocket','avatar','Rocket','🚀',50],['av_robot','avatar','Robot','🤖',50],['av_dragon','avatar','Dragon','🐉',80],['av_alien','avatar','Alien','👾',60],
['th_sunset','theme','Sunset Theme','sunset',100],['th_forest','theme','Forest Theme','forest',100],['fr_gold','frame','Gold Frame','gold',120],['ti_pro','title','Title: Pro Gamer','Pro Gamer',150],['ti_exp','title','Title: Explorer','Explorer',90]];
const today=()=>new Date().toISOString().slice(0,10); /* UTC day */
const uid=()=>'p'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);
function fresh(){return{v:V,profile:{id:uid(),name:'Player',avatar:'🎮',title:'Newbie',frame:'',theme:'',created:Date.now()},xp:0,ledger:[],keys:{},ach:{},owned:[],
 stats:{played:0,wins:0,losses:0,levels:0,streak:0,bestStreak:0,playMs:0,dailies:0,byGame:{}},xpLog:[],daily:{login:'',claims:{}},settings:{sound:true}}}
function validate(d){return d&&typeof d==='object'&&d.v===V&&d.profile&&Array.isArray(d.ledger)&&d.stats&&d.stats.byGame&&typeof d.xp==='number'&&d.xp>=0&&Array.isArray(d.owned)&&d.keys&&d.ach&&d.daily}
function migrate(d){return d} /* v1 only; hook for future versions */
let D;function load(){let r=null;try{r=localStorage.getItem(KEY);if(!r)return fresh();const d=migrate(JSON.parse(r));if(validate(d))return d}catch(e){}
 try{if(r)localStorage.setItem(KEY+'_corrupt_backup',r)}catch(e){}return fresh()}
/* IndexedDB mirror: localStorage stays the fast synchronous store; IndexedDB keeps a durable copy and restores it if localStorage was cleared/corrupted. */
const IDB='playnova',STORE='kv';
function idb(){return new Promise((res,rej)=>{try{const r=indexedDB.open(IDB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
let idbT=0;function idbWrite(){return idb().then(db=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(JSON.stringify(D),'pn_data');tx.oncomplete=()=>db.close()}).catch(()=>{})}
function idbSave(){clearTimeout(idbT);idbT=setTimeout(idbWrite,300)}
addEventListener('pagehide',()=>{clearTimeout(idbT);idbWrite()});
function idbRestore(){return idb().then(db=>new Promise(res=>{const q=db.transaction(STORE).objectStore(STORE).get('pn_data');q.onsuccess=()=>{db.close();res(q.result||null)};q.onerror=()=>{db.close();res(null)}})).catch(()=>null)}
function pristine(){return D.xp===0&&D.ledger.length===0&&D.stats.played===0&&D.owned.length===0&&Object.keys(D.ach).length===0}
function save(){try{if(D.ledger.length>CONFIG.ledgerMax)D.ledger=D.ledger.slice(-CONFIG.ledgerMax);localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}idbSave()}
D=load();
if(pristine())idbRestore().then(raw=>{try{const d=raw&&migrate(JSON.parse(raw));if(d&&validate(d)&&pristine()&&(d.xp>0||d.ledger.length>0||d.stats.played>0)){D=d;try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}toast('Progress restored from backup storage');dispatchEvent(new CustomEvent('pn:restored'))}}catch(e){}});
const bal=()=>D.ledger.reduce((a,t)=>a+t.amt,0);
const plevel=()=>{let L=1;while(D.xp>=CONFIG.xpForLevel(L+1))L++;return L};
function toast(m){if(!document.body)return;const t=document.createElement('div');t.className='pn-toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
function addCoins(amt,desc,key){if(!Number.isInteger(amt)||amt===0)return false;if(key&&D.keys['c:'+key])return false;if(bal()+amt<0)return false;
 if(key)D.keys['c:'+key]=1;D.ledger.push({id:uid(),t:Date.now(),amt,desc});return true}
function addXP(n,desc,key){if(!(n>0))return false;if(key&&D.keys['x:'+key])return false;if(key)D.keys['x:'+key]=1;const before=plevel();D.xp+=n;D.xpLog.push({t:Date.now(),n,desc});if(D.xpLog.length>200)D.xpLog.shift();
 const after=plevel();if(after>before){D.xpLog.push({t:Date.now(),n:0,desc:'Reached level '+after});toast('🎉 Level up! You are now level '+after);document.body&&document.body.classList.add('pn-lvl');}return true}
function reward(key,xp,coins,desc){const a=addXP(xp,desc,key),b=addCoins(coins,desc,key);if(a||b)toast('+'+xp+' XP  +'+coins+' coins — '+desc);}
function S(){const s=Object.assign({},D.stats);s.plevel=plevel();return s}
function checkAch(){ACH.forEach(([id,name,desc,fn,goal,coins])=>{if(!D.ach[id]&&fn(S())>=goal){D.ach[id]=Date.now();addCoins(coins,'Achievement: '+name,'ach:'+id);toast('🏆 Achievement: '+name+' (+'+coins+' coins)')}})}
const G=id=>D.stats.byGame[id]||(D.stats.byGame[id]={plays:0,wins:0,losses:0,best:0,ms:0,last:0,done:[],unlocked:1});
/* capability registry: honest default NOT_INTEGRATED for every game until verified individually */
const OK_STATUS=['FULLY_INTEGRATED','PARTIALLY_INTEGRATED','NOT_INTEGRATED','MANUAL_VERIFICATION_REQUIRED'];let CAPS={};
 /* capabilities are loaded from assets/js/game-capabilities.json and validated; until loaded (or if invalid) every game is NOT_INTEGRATED = no event rewards */
 function setCaps(o){const r={};if(o&&typeof o==='object')for(const k of Object.keys(o)){const v=o[k];if(v&&typeof v==='object'&&OK_STATUS.includes(v.status)&&/^[a-z0-9\-]+$/.test(k))r[k]=v}CAPS=Object.assign(r,window.PLAYNOVA_CAPS||{})}
 try{fetch((typeof ROOT!=='undefined'?ROOT:'/')+'assets/js/game-capabilities.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.schema===1)setCaps(j.games)}).catch(()=>{})}catch(e){}
 setCaps(null);const cap=id=>CAPS[id]||{status:'NOT_INTEGRATED'};
function sessionVerified(gid,sid){const k='sess:'+gid+':'+sid;if(D.keys[k])return;D.keys[k]=1;const g=G(gid);g.plays++;g.last=Date.now();D.stats.played++;
 reward(k,CONFIG.xp.session,CONFIG.coins.session,'Verified play session');dailyProgress(gid);checkAch();save()}
function addPlaytime(gid,ms){if(ms>0&&ms<36e5){G(gid).ms+=ms;D.stats.playMs+=ms;save()}}
/* adapter: validated messages only. Games send events; platform decides rewards. */
function handleMessage(e,gid,frameWin){
 if(e.source!==frameWin||e.origin!==location.origin)return 'REJECT_SENDER';
 const m=e.data;if(!m||typeof m!=='object'||m.ns!=='PLAYNOVA'||m.v!==1||!EVENTS.includes(m.type)||typeof m.sessionId!=='string'||m.sessionId.length>64)return 'REJECT_SCHEMA';
 const c=cap(gid);if(c.status!=='FULLY_INTEGRATED'&&c.status!=='PARTIALLY_INTEGRATED')return 'REJECT_UNSUPPORTED';
 const g=G(gid),sid=m.sessionId; /* any reward amount in message is ignored */
 if(m.type==='GAME_SCORE_UPDATED'&&c.score&&Number.isFinite(m.score)&&m.score>g.best){g.best=Math.floor(m.score)}
 else if(m.type==='GAME_WON'&&c.win){const k='win:'+gid+':'+sid;if(D.keys[k])return 'DUPLICATE';D.keys[k]=1;g.wins++;D.stats.wins++;D.stats.streak++;D.stats.bestStreak=Math.max(D.stats.bestStreak,D.stats.streak);reward(k,CONFIG.xp.win,CONFIG.coins.win,'Verified win')}
 else if((m.type==='GAME_LOST'||m.type==='GAME_OVER')&&c.loss){const k='loss:'+gid+':'+sid;if(D.keys[k])return 'DUPLICATE';D.keys[k]=1;g.losses++;D.stats.losses++;D.stats.streak=0}
 else if(m.type==='GAME_LEVEL_COMPLETED'&&c.levels&&Number.isInteger(m.level)&&m.level>=1&&m.level<=g.unlocked){dispatchEvent(new CustomEvent('pn:level',{detail:{level:m.level,first:!g.done.includes(m.level)}}));
  if(!g.done.includes(m.level)){g.done.push(m.level);g.unlocked=Math.max(g.unlocked,m.level+1);D.stats.levels++;reward('lvl:'+gid+':'+m.level,CONFIG.xp.level,CONFIG.coins.level,'Verified level '+m.level)}else return 'REPLAY_NO_REWARD'}
 else return 'IGNORED';
 checkAch();save();return 'OK'}
/* daily */
function dayState(){const t=today();if(D.daily.day!==t){D.daily.day=t;D.daily.play=0;D.daily.games=[]}return D.daily}
function dailyProgress(gid){const d=dayState();d.play++;if(!d.games.includes(gid))d.games.push(gid)}
const DAILY=[['login','Daily Login','Visit today',()=>true,0,CONFIG.coins.login],['play1','Play 1 session','Complete 1 verified session',d=>d.play>=1,CONFIG.xp.daily,CONFIG.coins.daily],['play3','Play 3 different games','Verified sessions in 3 different games',d=>d.games.length>=3,CONFIG.xp.daily,CONFIG.coins.daily]];
function claim(id){const d=dayState(),it=DAILY.find(x=>x[0]===id);if(!it||!it[3](d))return false;const k='daily:'+today()+':'+id;if(D.keys[k])return false;D.keys[k]=1;
 addXP(it[4],it[1],k);addCoins(it[5],'Daily: '+it[1],k);if(id!=='login')D.stats.dailies++;toast('✅ '+it[1]+' claimed');checkAch();save();return true}
/* shop */
function buy(id){const it=SHOP.find(x=>x[0]===id);if(!it||D.owned.includes(id))return 'OWNED_OR_INVALID';if(bal()<it[4])return 'INSUFFICIENT';
 D.ledger.push({id:uid(),t:Date.now(),amt:-it[4],desc:'Bought '+it[2]});D.owned.push(id);save();return 'OK'}
function equip(id){const it=SHOP.find(x=>x[0]===id);if(!it||!D.owned.includes(id))return false;const p=D.profile;
 if(it[1]==='avatar')p.avatar=it[3];else if(it[1]==='theme')p.theme=it[3];else if(it[1]==='frame')p.frame=it[3];else p.title=it[3];applyTheme();save();return true}
function unequip(kind){const p=D.profile,def={avatar:'🎮',theme:'',frame:'',title:'Newbie'};p[kind]=def[kind];applyTheme();save()}
function applyTheme(){if(document.body){if(D.profile.theme)document.body.dataset.pnTheme=D.profile.theme;else delete document.body.dataset.pnTheme}}
function exportData(){return JSON.stringify(D)}
function importData(txt){try{const d=migrate(JSON.parse(txt));if(!validate(d))return false;if(d.ledger.some(t=>!Number.isInteger(t.amt)))return false;D=d;save();return true}catch(e){return false}}
function reset(){D=fresh();save();clearTimeout(idbT);return idbWrite()}
function claimGameChallenge(slug,id){const CHS={s3:[g=>g.plays>=3,30,15],t10:[g=>g.ms>=600000,40,20],s10:[g=>g.plays>=10,80,40]};const c=CHS[id];if(!c||!/^[a-z0-9-]+$/.test(slug))return false;const g=D.stats.byGame[slug];if(!g||!c[0](g))return false;const k='gch:'+slug+':'+id;if(D.keys['x:'+k])return false;addXP(c[1],'Game challenge: '+slug+' '+id,k);addCoins(c[2],'Game challenge: '+slug+' '+id,k);D.stats.dailies=D.stats.dailies;toast('✅ Game challenge claimed (+'+c[1]+' XP, +'+c[2]+' coins)');checkAch();save();return true}
function gameFile(){const f=document.getElementById('gameFrame');const s=f&&(f.getAttribute('src')||f.dataset.pnSrc);return s?new URL(s.split('#')[0].split('?')[0],location.href).href:''}
window.PLAYNOVA={claimGameChallenge,gameFile,CONFIG,EVENTS,ACH,SHOP,DAILY,get data(){return D},bal,plevel,handleMessage,claim,buy,equip,unequip,exportData,importData,reset,sessionVerified,addPlaytime,save,CAPS:cap,today,dayState,
 earned:()=>D.ledger.filter(t=>t.amt>0).reduce((a,t)=>a+t.amt,0),spent:()=>-D.ledger.filter(t=>t.amt<0).reduce((a,t)=>a+t.amt,0)};
document.addEventListener('DOMContentLoaded',()=>{applyTheme();const n=document.querySelector('.mainnav');if(n){const a=document.createElement('a');a.href=(window.ROOT||'')+'profile/';a.textContent='Profile';if(document.body.dataset.page==='profile')a.className='on';n.appendChild(a)}
 const f=document.querySelector('iframe');if(f&&/\/(game|play)\//.test(location.pathname)){trackSession(f)}});
/* platform-verified play session: >=2 min active time AND >=20 real input events inside the game frame */
/* per-game storage proxy for sandboxed games: strict validation, small quotas, stored under pn_gls:<slug> */
function gls(slug,m){try{const K='pn_gls:'+slug;let o={};try{o=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){o={}}
 if(m.type==='LS_CLEAR')o={};
 else if(typeof m.key!=='string'||!/^[\w.:\-]{1,64}$/.test(m.key))return;
 else if(m.type==='LS_DEL')delete o[m.key];
 else if(m.type==='LS_SET'){if(typeof m.val!=='string'||m.val.length>262144)return;if(!(m.key in o)&&Object.keys(o).length>=100)return;o[m.key]=m.val}
 const s=JSON.stringify(o);if(s.length<=900000)localStorage.setItem(K,s)}catch(e){}}
function trackSession(f){const gid=(location.pathname.match(/\/game\/([^\/]+)/)||[])[1]||(/\/play\//.test(location.pathname)?new URLSearchParams(location.search).get('slug'):null);if(!gid||!/^[a-z0-9-]+$/.test(gid))return;const sid=Date.now().toString(36);let inputs=0,active=0,last=0,done=false;
 const bump=()=>{inputs++;last=Date.now()};
 function hook(){try{const w=f.contentWindow;['pointerdown','keydown','touchstart'].forEach(ev=>w.addEventListener(ev,bump,{passive:true}))}catch(e){}}
 f.addEventListener('load',hook);hook();
 if(f.dataset.pnIso==='1'){const nonce=uid()+uid();let ready=false;
  const ping=()=>{try{let st={};try{st=JSON.parse(localStorage.getItem('pn_gls:'+gid)||'{}')||{}}catch(e){}f.contentWindow.postMessage({type:'PN_INIT',nonce:nonce,store:st},'*')}catch(e){}};
  setInterval(()=>{if(!ready)ping()},400);f.addEventListener('load',()=>{ready=false;ping()}); /* new document after Retry/Replay needs a fresh handshake */
  addEventListener('message',e=>{const m=e.data;if(e.source!==f.contentWindow||e.origin!=='null'||!m||m.ns!=='PLAYNOVA'||m.v!==1||m.nonce!==nonce||!['BRIDGE_READY','BRIDGE_HEARTBEAT','LS_SET','LS_DEL','LS_CLEAR'].concat(EVENTS).includes(m.type))return;
   if(EVENTS.includes(m.type)){ready=true;handleMessage({source:e.source,origin:location.origin,data:{ns:'PLAYNOVA',v:1,type:m.type,sessionId:typeof m.sessionId==='string'?m.sessionId:'',level:m.level,score:m.score}},gid,f.contentWindow);return}
   if(m.type.startsWith('LS_')){gls(gid,m);return}
   ready=true;if(Number.isInteger(m.inputs)&&m.inputs>=inputs&&m.inputs<1e7){if(m.inputs>inputs)last=Date.now();inputs=m.inputs}})}
 addEventListener('message',e=>{handleMessage(e,gid,f.contentWindow)});
 /* platform-observed round end: the game's own end overlay (#ov/#overlay) appears after a real round (>=30s active, >=5 inputs). Counts an attempt only; never a win or loss. */
 /* level-complete panel: sits below the game area (never over active gameplay; hidden in fullscreen) */
 addEventListener('pn:level',ev=>{const old=document.getElementById('pnLevelPanel');if(old)old.remove();const d=ev.detail,p=document.createElement('div');p.id='pnLevelPanel';p.className='pn-card';p.setAttribute('role','status');
  const h=document.createElement('b');h.textContent='🎉 Level '+d.level+' complete! '+(d.first?'Reward earned. ':'Replay: no extra reward. ')+'Level '+(d.level+1)+' unlocked.';
  const nx=document.createElement('button');nx.className='pn-btn';nx.textContent='Next Level';nx.onclick=()=>{p.remove();try{f.focus()}catch(e){}};
  const rp=document.createElement('button');rp.className='pn-btn alt';rp.textContent='Replay from start';rp.onclick=()=>{p.remove();const rb=document.getElementById('btnRestart');if(rb)rb.click()};
  p.append(h,document.createElement('br'),nx,document.createTextNode(' '),rp);const w=f.parentElement;w.parentElement.insertBefore(p,w.nextSibling)});
 let roundStart=0,roundN=0;
 function watch(){try{const doc=f.contentDocument,ov=doc&&(doc.getElementById('ov')||doc.getElementById('overlay'));if(!ov)return;
  const vis=()=>getComputedStyle(ov).display!=='none';let was=vis();
  new MutationObserver(()=>{const now=vis();if(now&&!was&&active-roundStart>=30000&&inputs>=5){const k='round:'+gid+':'+sid+':'+(++roundN);if(!D.keys[k]){D.keys[k]=1;G(gid).attempts=(G(gid).attempts||0)+1;D.stats.attempts=(D.stats.attempts||0)+1;save()}}
   if(!now&&was){roundStart=active;}was=now}).observe(ov,{attributes:true,attributeFilter:['style','class']})}catch(e){}}
 f.addEventListener('load',watch);watch();
 setInterval(()=>{if(document.hidden||Date.now()-last>15000)return;active+=2000;if(!done&&active>=CONFIG.session.activeMs&&inputs>=CONFIG.session.inputs){done=true;sessionVerified(gid,sid)}
  if(active%10000===0)addPlaytime(gid,10000)},2000);
 addEventListener('pagehide',()=>save())}
})();
/* Drawer for per-game extras (progress, challenges, save tools, related games). Opened only on demand from the "Progress" button, never over active gameplay. */
function pnDrawerBody(){let d=document.getElementById('pnDrawer');if(d)return d.querySelector('.pn-dbody');
 const fav=document.getElementById('btnFav');if(!fav||!fav.parentElement)return null;
 const b=document.createElement('button');b.type='button';b.id='btnProg';b.className=fav.className;b.textContent='Progress';b.setAttribute('aria-haspopup','dialog');fav.parentElement.appendChild(b);
 d=document.createElement('div');d.id='pnDrawer';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Game progress, challenges and related games');
 const body=document.createElement('div');body.className='pn-dbody';const x=document.createElement('button');x.type='button';x.className='pn-btn';x.textContent='Close';
 const close=()=>{d.hidden=true;b.focus()};x.onclick=close;b.onclick=()=>{d.hidden=false;dispatchEvent(new Event('pn:drawer'));x.focus()};
 d.addEventListener('keydown',e=>{if(e.key==='Escape')close()});d.addEventListener('click',e=>{if(e.target===d)close()});
 d.append(x,body);document.body.appendChild(d);return body}
/* Related games: ranked from real registry metadata (category, tags, theme, difficulty). No popularity data is invented. */
document.addEventListener('DOMContentLoaded',()=>{try{
 const m=location.pathname.match(/\/game\/([^\/]+)/);if(!m||typeof REGISTRY==='undefined'||!window.P5||!P5.card)return;
 const me=REGISTRY.find(g=>g.slug===m[1]);if(!me)return;
 const sc=g=>(g.category===me.category?3:0)+(g.tags||[]).filter(t=>(me.tags||[]).includes(t)).length+(g.theme===me.theme?1:0)+(g.difficulty===me.difficulty?.5:0);
 const list=REGISTRY.filter(g=>g.id!==me.id).map(g=>[sc(g),g]).sort((a,b)=>b[0]-a[0]||a[1].id.localeCompare(b[1].id)).slice(0,12).map(x=>x[1]);
 const host=pnDrawerBody();if(!host||!list.length)return;
 const s=document.createElement('section');s.id='related';const h=document.createElement('h2');h.textContent='More games like this';
 const g=document.createElement('div');g.className='grid';list.forEach(x=>g.appendChild(P5.card(x)));s.append(h,g);host.appendChild(s)}catch(e){}});

/* Recommended for you (home): built only from this player's real recent history (category + tag overlap). Hidden when there is no history. */
document.addEventListener('DOMContentLoaded',()=>{try{
 if(document.body.dataset.page!=='home'||typeof REGISTRY==='undefined'||!window.P5)return;
 const rec=JSON.parse(localStorage.getItem('p5_recent')||'[]').slice(0,8);if(!rec.length)return;
 const seen=REGISTRY.filter(g=>rec.includes(g.id));if(!seen.length)return;
 const cats={},tags={};seen.forEach(g=>{cats[g.category]=(cats[g.category]||0)+2;(g.tags||[]).forEach(t=>tags[t]=(tags[t]||0)+1)});
 const sc=g=>(cats[g.category]||0)+(g.tags||[]).reduce((a,t)=>a+(tags[t]||0),0);
 const list=REGISTRY.filter(g=>!rec.includes(g.id)).map(g=>[sc(g),g]).sort((a,b)=>b[0]-a[0]||a[1].id.localeCompare(b[1].id)).slice(0,10).map(x=>x[1]);
 const anchor=document.getElementById('recentRow');const host=anchor?(anchor.closest('section')||anchor.parentElement):null;if(!host)return;
 const s=document.createElement('section');s.className=host.className;s.id='recommended';const h=document.createElement('h2');h.textContent='Recommended for you';
 const g=document.createElement('div');g.className='grid';list.forEach(x=>g.appendChild(P5.card(x)));s.append(h,g);host.after(s)}catch(e){}});

/* skip link for keyboard users */
document.addEventListener('DOMContentLoaded',()=>{try{const m=document.querySelector('main');if(!m||document.querySelector('.pn-skip'))return;if(!m.id)m.id='main';const a=document.createElement('a');a.className='pn-skip';a.href='#'+m.id;a.textContent='Skip to content';document.body.insertBefore(a,document.body.firstChild)}catch(e){}});
/* ===== Per-game panel (all 500 game pages): stats, challenges, save-data tools, honest offline status ===== */
document.addEventListener('DOMContentLoaded',()=>{try{
 const m=location.pathname.match(/\/game\/([^\/]+)/);if(!m)return;const slug=m[1];if(!/^[a-z0-9-]+$/.test(slug))return;
 const host=pnDrawerBody();if(!host||document.getElementById('pnGamePanel'))return;
 const P=window.PLAYNOVA,sec=document.createElement('section');sec.className='pn-card';sec.id='pnGamePanel';
 const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
 const row=(a,b)=>{const r=el('div','pn-row');r.append(el('span',null,a),el('span',null,b));return r};
 const btn=(t,fn,alt)=>{const b=el('button','pn-btn'+(alt?' alt':''),t);b.type='button';b.onclick=fn;return b};
 const CH=[['s3','Play 3 verified sessions',g=>g.plays>=3,30,15],['t10','Play 10 minutes in total',g=>g.ms>=600000,40,20],['s10','Play 10 verified sessions',g=>g.plays>=10,80,40]];
 function draw(){sec.textContent='';const g=Object.assign({plays:0,ms:0,best:0,done:[],unlocked:1,last:0},P.data.stats.byGame[slug]||{});
  sec.appendChild(el('h2',null,'Your progress in this game'));
  sec.append(row('Verified play sessions',g.plays),row('Time played (measured)',Math.round(g.ms/60000)+' min'),row('Last played',g.last?new Date(g.last).toLocaleString():'—'));
  if(g.best>0)sec.appendChild(row('Best score reported by the game',g.best));
  if(g.done.length)sec.appendChild(row('Levels completed',g.done.length+' (highest unlocked: '+g.unlocked+')'));
  const h=el('h3',null,'Challenges for this game');h.style.margin='12px 0 4px';sec.appendChild(h);
  CH.forEach(([id,name,ok,xp,coins])=>{const k='gch:'+slug+':'+id,done=!!P.data.keys['x:'+k],r=el('div','pn-row');r.appendChild(el('span',null,name+' (+'+xp+' XP, +'+coins+' coins)'));
   const b=btn(done?'Claimed':'Claim',()=>{if(P.claimGameChallenge(slug,id))draw()});b.disabled=done||!ok(g);r.appendChild(b);sec.appendChild(r)});
  const raw=localStorage.getItem('pn_gls:'+slug)||'';const tools=el('div');tools.style.marginTop='10px';
  sec.appendChild(row('Saved data of this game',raw?(raw.length/1024).toFixed(1)+' KB (on this device only)':'none'));
  tools.append(btn('Download save',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({game:slug,v:1,store:JSON.parse(localStorage.getItem('pn_gls:'+slug)||'{}')})],{type:'application/json'}));a.download='playnova-save-'+slug+'.json';a.click()},1),document.createTextNode(' '),
   btn('Import save',()=>{const i=el('input');i.type='file';i.accept='.json';i.onchange=()=>i.files[0].text().then(tx=>{try{const o=JSON.parse(tx);if(o.game!==slug||!o.store||typeof o.store!=='object')throw 0;const c={};for(const k in o.store){if(!/^[\w.:\-]{1,64}$/.test(k)||typeof o.store[k]!=='string'||o.store[k].length>262144)throw 0;c[k]=o.store[k]}localStorage.setItem('pn_gls:'+slug,JSON.stringify(c));alert('Save imported. The game will restart.');const r=document.getElementById('btnRestart');if(r)r.click();draw()}catch(e){alert('This file is not a valid save for this game. Nothing was changed.')}});i.click()},1),document.createTextNode(' '),
   btn('Reset this game\u2019s save',()=>{if(!confirm('Delete the saved data of this game? This cannot be undone.'))return;localStorage.removeItem('pn_gls:'+slug);const r=document.getElementById('btnRestart');if(r)r.click();draw()},1));
  sec.appendChild(tools);
  const off=el('p',null,'Offline: checking…');off.style.cssText='margin:10px 0 0;font-size:.85rem;opacity:.85';sec.appendChild(off);
  if(window.caches)Promise.all([caches.match(location.href),caches.match(P.gameFile?P.gameFile():'')]).then(([a,b])=>{off.textContent=(a&&b)?'Offline: this game page and file are cached on this device, so it should open without internet.':'Offline: not cached yet. Open this game once while online; only games you have opened are available offline.'}).catch(()=>{off.textContent='Offline: status unknown on this browser.'});else off.textContent='Offline: this browser has no cache support.'}
 host.insertBefore(sec,host.firstChild);draw();addEventListener('pn:restored',draw);addEventListener('pn:drawer',draw);setInterval(()=>{if(!document.hidden)draw()},30000);
}catch(e){}});
/* ===== Service worker: register everywhere, tell the player when an update was installed ===== */
(function(){if(!('serviceWorker' in navigator))return;
 addEventListener('load',()=>{navigator.serviceWorker.register((typeof ROOT!=='undefined'?ROOT:'./')+'sw.js').catch(()=>{});
  let had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had){had=true;return}
   if(document.getElementById('pnUpdate'))return;const d=document.createElement('div');d.id='pnUpdate';d.className='pn-toast';d.style.pointerEvents='auto';d.setAttribute('role','status');d.append('PLAYNOVA was updated. ');const b=document.createElement('button');b.className='pn-btn';b.textContent='Reload';b.onclick=()=>location.reload();d.appendChild(b);document.body.appendChild(d)})})})();
