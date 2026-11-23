/* Sets the iframe src for shimmed games, adding the stored per-game storage as a hash (#pnls=...). */
(function(){'use strict';
window.PN_FRAME_SRC=function(src){var base=String(src).split('#')[0];try{var slug=(location.pathname.match(/\/game\/([^\/]+)/)||[])[1];var raw=localStorage.getItem('pn_gls:'+slug)||'{}';JSON.parse(raw);if(raw.length>120000)raw='{}';return base+'#pnls='+encodeURIComponent(raw)}catch(e){return base}};
document.addEventListener('DOMContentLoaded',function(){var f=document.getElementById('gameFrame');if(f&&f.dataset.pnSrc&&!f.getAttribute('src'))f.setAttribute('src',window.PN_FRAME_SRC(f.dataset.pnSrc))})})();
