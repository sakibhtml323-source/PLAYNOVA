/* PLAYNOVA bridge for sandboxed (opaque-origin) games. MUST be the first script in the game's <head>.
   - ready signal + input counter (parent validates window, origin "null" and nonce)
   - storage shim when the sandbox blocks localStorage/sessionStorage: localStorage is hydrated SYNCHRONOUSLY from the iframe URL hash (#pnls=...) before any game script runs; writes are sent to the parent, which validates and stores them per game. Quota is enforced locally (QuotaExceededError) like a real Storage.
   - save-on-exit emulation: many games only save in a "beforeunload" handler, which cannot reach the parent when the whole page unloads. The bridge therefore fires a synthetic "beforeunload" when the tab is hidden and every 4 s while the player is active, so saved data reaches the parent while it is still alive.
   - events from integrated games via window.pnEmit (the parent validates and decides rewards). */
(function(){'use strict';if(window.__PN_BRIDGE)return;window.__PN_BRIDGE=1;
var n=0,nonce=null,po=null,q=[],store={},QUOTA=900000,MAXV=262144,MAXK=100;
function post(t,x){var m={ns:'PLAYNOVA',v:1,type:t,nonce:nonce};for(var k in x)m[k]=x[k];if(nonce&&po){try{parent.postMessage(m,po)}catch(e){}}else if(q.length<400)q.push(m)}
var ok=true;try{window.localStorage.getItem('x')}catch(e){ok=false}
if(!ok){
 try{var h=location.hash.match(/pnls=([^&]*)/);if(h){var o=JSON.parse(decodeURIComponent(h[1]));if(o&&typeof o==='object'){for(var k in o)if(typeof o[k]==='string')store[k]=o[k]}}}catch(e){store={}}
 var has=function(s,k){return Object.prototype.hasOwnProperty.call(s,k)};
 var size=function(s){var t=0;for(var k in s)t+=k.length+s[k].length;return t};
 var mk=function(s,persist){var ls={getItem:function(k){k=String(k);return has(s,k)?s[k]:null},
  setItem:function(k,v){k=String(k);v=String(v);var old=has(s,k)?s[k].length+k.length:0;
   if(v.length>MAXV||(!has(s,k)&&Object.keys(s).length>=MAXK)||size(s)-old+k.length+v.length>QUOTA){var e=new Error('The quota has been exceeded.');e.name='QuotaExceededError';e.code=22;throw e}
   s[k]=v;if(persist)post('LS_SET',{key:k,val:v})},
  removeItem:function(k){k=String(k);delete s[k];if(persist)post('LS_DEL',{key:k})},
  clear:function(){for(var k in s)delete s[k];if(persist)post('LS_CLEAR',{})},
  key:function(i){return Object.keys(s)[i]||null}};
  Object.defineProperty(ls,'length',{get:function(){return Object.keys(s).length}});return ls};
 var L=mk(store,true),S=mk({},false);
 try{Object.defineProperty(window,'localStorage',{get:function(){return L},configurable:true})}catch(e){}
 try{Object.defineProperty(window,'sessionStorage',{get:function(){return S},configurable:true})}catch(e){}
 window.__pnMerge=function(extra){if(extra&&typeof extra==='object')for(var k in extra)if(typeof extra[k]==='string'&&!has(store,k))store[k]=extra[k]};
}
['pointerdown','keydown','touchstart'].forEach(function(ev){addEventListener(ev,function(){if(n<1e7)n++},{passive:true,capture:true})});
addEventListener('message',function(e){var d=e.data;if(e.source!==parent||nonce||!d||d.type!=='PN_INIT'||typeof d.nonce!=='string'||d.nonce.length>64)return;nonce=d.nonce;po=e.origin;if(window.__pnMerge&&d.store)window.__pnMerge(d.store);q.forEach(function(m){m.nonce=nonce;try{parent.postMessage(m,po)}catch(e){}});q=[];post('BRIDGE_READY',{inputs:n})});
var sid=Math.random().toString(36).slice(2,12);
window.pnEmit=function(type,x){x=x||{};var o={sessionId:sid};if(typeof x.level==='number')o.level=x.level;if(typeof x.score==='number')o.score=x.score;post(String(type),o)};
var lastN=-1;function flush(){try{window.dispatchEvent(new Event('beforeunload'))}catch(e){}}
setInterval(function(){if(nonce)post('BRIDGE_HEARTBEAT',{inputs:n});if(n!==lastN){lastN=n;flush()}},4000);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush()});
addEventListener('pagehide',flush);
})();
