(function(){'use strict';if(document.body.dataset.page!=='profile')return;
const P=window.PLAYNOVA,app=document.getElementById('app');let tab=(location.hash||'#profile').slice(1);
const T=['profile','wallet','shop','achievements','daily','leaderboard','settings'];
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function row(a,b){const r=el('div','pn-row');r.append(el('span',null,a),el('span',null,b));return r}
function btn(t,fn,alt){const b=el('button','pn-btn'+(alt?' alt':''),t);b.onclick=fn;return b}
function card(){return el('div','pn-card')}
const fmt=t=>new Date(t).toLocaleString();
function render(){app.textContent='';const tabs=el('div','pn-tabs');tabs.setAttribute('role','tablist');
 T.forEach(t=>{const b=el('button',t===tab?'on':'',t[0].toUpperCase()+t.slice(1));b.onclick=()=>{tab=t;location.hash=t;render()};tabs.appendChild(b)});app.appendChild(tabs);V[tab]()}
const V={
profile(){const d=P.data,p=d.profile,L=P.plevel(),a=P.CONFIG.xpForLevel(L),b=P.CONFIG.xpForLevel(L+1),c=card();
 const av=el('div','pn-av',p.avatar);if(p.frame)av.classList.add('pn-frame-gold');c.append(av,el('h2',null,p.name),el('p',null,p.title+' • Level '+L));
 const bar=el('div','pn-bar'),i=el('i');i.style.width=Math.min(100,(d.xp-a)/(b-a)*100)+'%';bar.appendChild(i);c.append(bar,el('p',null,d.xp+' XP • '+(b-d.xp)+' XP to level '+(L+1)));
 const inp=el('input');inp.value=p.name;inp.maxLength=20;inp.setAttribute('aria-label','Display name');c.append(inp,btn('Save name',()=>{const v=inp.value.replace(/[^\w \-]/g,'').trim().slice(0,20);if(v){p.name=v;P.save();render()}}));app.appendChild(c);
 const s=d.stats,c2=card();c2.append(row('Games played (verified)',s.played),row('Rounds finished (observed)',s.attempts||0),row('Wins',s.wins),row('Losses',s.losses),row('Win %',(s.wins+s.losses?Math.round(s.wins/(s.wins+s.losses)*100):0)+'%'),row('Win streak / best',s.streak+' / '+s.bestStreak),row('Levels completed',s.levels),row('Playtime',Math.round(s.playMs/60000)+' min'),row('Achievements',Object.keys(d.ach).length));app.appendChild(c2);
 const c3=card();c3.appendChild(el('h3',null,'XP history'));d.xpLog.slice(-15).reverse().forEach(x=>c3.appendChild(row(x.desc,(x.n?'+'+x.n+' XP ':'')+fmt(x.t))));if(!d.xpLog.length)c3.appendChild(el('p',null,'No XP yet. Play a game for 2 minutes of active play to earn your first reward.'));app.appendChild(c3)},
wallet(){const c=card();c.append(el('h2',null,'🪙 '+P.bal()+' coins'),row('Total earned',P.earned()),row('Total spent',P.spent()),el('p',null,'Coins are virtual platform points with no cash value.'));app.appendChild(c);
 const h=card();h.appendChild(el('h3',null,'Transaction history'));P.data.ledger.slice().reverse().slice(0,60).forEach(t=>h.appendChild(row(t.desc+' • '+fmt(t.t),(t.amt>0?'+':'')+t.amt)));if(!P.data.ledger.length)h.appendChild(el('p',null,'No transactions yet.'));app.appendChild(h)},
shop(){const c=el('div','pn-card');c.append(el('h2',null,'Rewards Shop'),el('p',null,'Balance: '+P.bal()+' coins'));const g=el('div','pn-grid');
 P.SHOP.forEach(([id,k,n,v,price])=>{const o=P.data.owned.includes(id),it=card();it.append(el('div','pn-av',k==='avatar'?v:k==='theme'?'🎨':k==='frame'?'🖼️':'🏷️'),el('b',null,n),el('div',null,o?'Owned':price+' coins'));
  if(!o)it.appendChild(btn('Buy',()=>{if(!confirm('Buy '+n+' for '+price+' coins?'))return;const r=P.buy(id);alert(r==='OK'?'Purchased!':r==='INSUFFICIENT'?'Not enough coins.':'Unavailable.');render()}));
  else it.append(btn('Equip',()=>{P.equip(id);render()}),btn('Unequip',()=>{P.unequip(k);render()},1));g.appendChild(it)});c.appendChild(g);app.appendChild(c);
 const h=card();h.appendChild(el('h3',null,'Purchase history'));P.data.ledger.filter(t=>t.amt<0).reverse().forEach(t=>h.appendChild(row(t.desc+' • '+fmt(t.t),t.amt)));app.appendChild(h)},
achievements(){const s=Object.assign({},P.data.stats,{plevel:P.plevel()});P.ACH.forEach(([id,n,d,fn,goal,coins])=>{const c=card(),u=P.data.ach[id],v=Math.min(goal,fn(s));c.append(el('b',null,(u?'🏆 ':'🔒 ')+n),el('p',null,d+' • Reward: '+coins+' coins'));
 const bar=el('div','pn-bar'),i=el('i');i.style.width=v/goal*100+'%';bar.appendChild(i);c.append(bar,el('small',null,u?'Unlocked '+fmt(u):v+' / '+goal));app.appendChild(c)})},
daily(){const d=P.dayState(),c=card();c.append(el('h2',null,'Daily Challenges'),el('p',null,'Resets at 00:00 UTC. Today: '+P.today()+'. Stored on this device only, so it is not tamper-proof.'));
 P.DAILY.forEach(([id,n,desc,ok,xp,coins])=>{const k='daily:'+P.today()+':'+id,done=P.data.keys[k],r=el('div','pn-row');r.append(el('span',null,n+' — '+desc+' ('+xp+' XP, '+coins+' coins)'));
  const b=btn(done?'Claimed':'Claim',()=>{P.claim(id);render()});b.disabled=!!done||!ok(d);r.appendChild(b);c.appendChild(r)});c.appendChild(el('small',null,'Progress today: '+d.play+' verified session(s), '+d.games.length+' game(s).'));app.appendChild(c)},
leaderboard(){const c=card();c.append(el('h2',null,'Local Leaderboard'),el('p',null,'Shows only players and scores stored on this device. A global leaderboard across devices needs a trusted backend, which this static site does not have.'));
 c.appendChild(row(P.data.profile.name+' (you)','Level '+P.plevel()+' • '+P.data.xp+' XP'));app.appendChild(c);
 const h=card();h.appendChild(el('h3',null,'Personal bests (games that report scores)'));const e=Object.entries(P.data.stats.byGame).filter(([,g])=>g.best>0).sort((a,b)=>b[1].best-a[1].best);e.forEach(([id,g])=>h.appendChild(row(id,g.best)));if(!e.length)h.appendChild(el('p',null,'No scores recorded yet. No game reports scores in this release.'));app.appendChild(h)},
settings(){const c=card();c.appendChild(el('h2',null,'Data & Settings'));
 c.append(btn('Export data',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([P.exportData()],{type:'application/json'}));a.download='playnova-data.json';a.click()}),
 btn('Import data',()=>{const f=el('input');f.type='file';f.accept='.json';f.onchange=()=>f.files[0].text().then(t=>{alert(P.importData(t)?'Imported.':'Invalid file. Nothing changed.');render()});f.click()},1),
 btn('Reset all progress',()=>{if(confirm('Delete ALL progress, coins and items? This cannot be undone.')&&confirm('Really reset?')){P.reset();render()}},1),
 el('p',null,'Your data lives only in this browser. It can be edited or cleared by the user, so rewards are not cheat-proof.'));app.appendChild(c)}};
addEventListener('pn:restored',()=>render());addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(T.includes(h)){tab=h;render()}});if(!T.includes(tab))tab='profile';render();
})();
