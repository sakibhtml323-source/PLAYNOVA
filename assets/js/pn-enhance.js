/* PLAYNOVA Enhance v2 (premium theme) — runs INSIDE every sandboxed game (loaded right after pn-bridge.js).
   Zero backend, zero network, zero cost. Everything is local JS/CSS.
   Adds: modern visual polish, tap particles, real pause (rAF/timers/clock/audio), master mute,
   auto-pause on tab hide, working on-screen touch controller (joystick + action buttons),
   gamepad support, fullscreen, audio-unlock fix, scroll/zoom/long-press fixes, resize fixes.
   Safe-fail: every feature is wrapped; a failure never stops the game. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.__pnEnhance) return;
  W.__pnEnhance = '1';
  function safe(fn) { return function () { try { return fn.apply(this, arguments); } catch (e) { /* never break the game */ } }; }

  /* ---------- state ---------- */
  var paused = false, rawPausedAt = 0, offset = 0, dateOffset = 0, datePausedAt = 0;
  var muted = false;
  try { muted = W.localStorage && W.localStorage.getItem('pn_mute') === '1'; } catch (e) {}
  var ctxs = [], held = [], hasKeyListener = false, hasDragListener = false;
  var hostEl = null, ui = null;

  /* ---------- pausable clock ---------- */
  var _pnow = W.performance.now.bind(W.performance), _dnow = Date.now;
  try {
    Object.defineProperty(W.performance, 'now', { configurable: true, writable: true,
      value: function () { return (paused ? rawPausedAt : _pnow()) - offset; } });
    Date.now = function () { return (paused ? datePausedAt : _dnow()) - dateOffset; };
  } catch (e) {}

  /* ---------- pausable requestAnimationFrame ---------- */
  var _raf = W.requestAnimationFrame.bind(W), _caf = W.cancelAnimationFrame.bind(W);
  var rafSeq = 0, rafMap = {};
  function rafSchedule(id, cb) {
    rafMap[id] = _raf(function (t) {
      if (paused) { held.push([id, cb]); return; }
      delete rafMap[id];
      cb(t - offset);
    });
  }
  W.requestAnimationFrame = function (cb) { var id = ++rafSeq; rafSchedule(id, cb); return id; };
  W.cancelAnimationFrame = function (id) {
    if (rafMap[id] != null) { _caf(rafMap[id]); delete rafMap[id]; }
    held = held.filter(function (h) { return h[0] !== id; });
  };

  /* ---------- pausable timers ---------- */
  var _st = W.setTimeout.bind(W), _ct = W.clearTimeout.bind(W), _si = W.setInterval.bind(W);
  var tSeq = 1e6, tMap = {};
  W.setTimeout = function (fn, ms) {
    if (typeof fn !== 'function') return _st(fn, ms);
    var args = Array.prototype.slice.call(arguments, 2), id = ++tSeq;
    function run() { if (paused) { tMap[id] = _st(run, 120); return; } delete tMap[id]; fn.apply(W, args); }
    tMap[id] = _st(run, ms);
    return id;
  };
  W.clearTimeout = function (id) { if (tMap[id] != null) { _ct(tMap[id]); delete tMap[id]; } else _ct(id); };
  W.setInterval = function (fn, ms) {
    if (typeof fn !== 'function') return _si(fn, ms);
    var args = Array.prototype.slice.call(arguments, 2);
    return _si(function () { if (!paused) fn.apply(W, args); }, ms);
  };

  /* ---------- audio: master gain, mute, pause, unlock ---------- */
  ['AudioContext', 'webkitAudioContext'].forEach(function (n) {
    var A = W[n]; if (!A) return;
    var P = function (o) {
      var c = o === undefined ? new A() : new A(o);
      try {
        var m = c.createGain(); m.gain.value = muted ? 0 : 1; m.connect(c.destination);
        Object.defineProperty(c, 'destination', { configurable: true, get: function () { return m; } });
        c.__pnMaster = m;
      } catch (e) {}
      ctxs.push(c);
      return c;
    };
    P.prototype = A.prototype;
    try { W[n] = P; } catch (e) {}
  });
  function applyMute() {
    ctxs.forEach(function (c) { try { if (c.__pnMaster) c.__pnMaster.gain.value = muted ? 0 : 1; } catch (e) {} });
    [].forEach.call(D.querySelectorAll('audio,video'), function (el) { try { el.muted = muted; } catch (e) {} });
  }
  var _play = W.HTMLMediaElement && W.HTMLMediaElement.prototype.play;
  if (_play) W.HTMLMediaElement.prototype.play = function () { if (muted) this.muted = true; return _play.apply(this, arguments); };
  function unlockAudio() { if (paused) return; ctxs.forEach(function (c) { try { if (c.state === 'suspended') c.resume(); } catch (e) {} }); }

  /* ---------- pause / resume ---------- */
  function setPaused(p) {
    p = !!p; if (p === paused) return;
    if (p) {
      rawPausedAt = _pnow(); datePausedAt = _dnow(); paused = true;
      ctxs.forEach(function (c) { try { c.suspend(); } catch (e) {} });
      releaseAllKeys();
    } else {
      offset += _pnow() - rawPausedAt; dateOffset += _dnow() - datePausedAt; paused = false;
      ctxs.forEach(function (c) { try { c.resume(); } catch (e) {} });
      var q = held; held = [];
      q.forEach(function (h) { rafSchedule(h[0], h[1]); });
    }
    renderUI();
  }
  W.pnPause = function () { setPaused(true); };
  W.pnResume = function () { setPaused(false); };

  /* ---------- listener sniffing (keyboard / drag support) ---------- */
  var _ael = W.EventTarget.prototype.addEventListener;
  W.EventTarget.prototype.addEventListener = function (t) {
    if (t === 'keydown' || t === 'keyup' || t === 'keypress') hasKeyListener = true;
    else if (t === 'touchmove' || t === 'pointermove' || t === 'touchstart') hasDragListener = true;
    return _ael.apply(this, arguments);
  };

  /* ---------- synthetic keyboard ---------- */
  var CODE = { ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ' ': 'Space', Enter: 'Enter' };
  var KC = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ' ': 32, Enter: 13 };
  var down = {}, synth = false;
  function codeOf(k) { return CODE[k] || (k.length === 1 && /[a-z]/i.test(k) ? 'Key' + k.toUpperCase() : k); }
  function kcOf(k) { return KC[k] || (k.length === 1 ? k.toUpperCase().charCodeAt(0) : 0); }
  var fire = safe(function (type, key) {
    var ev = new W.KeyboardEvent(type, { key: key, code: codeOf(key), bubbles: true, cancelable: true });
    var kc = kcOf(key);
    try { Object.defineProperty(ev, 'keyCode', { get: function () { return kc; } }); Object.defineProperty(ev, 'which', { get: function () { return kc; } }); } catch (e) {}
    ev.__pn = 1;
    synth = true;
    try { (D.body || D).dispatchEvent(ev); } finally { synth = false; }
  });
  function keyDown(k) { if (paused || down[k]) return; down[k] = 1; fire('keydown', k); }
  function keyUp(k) { if (!down[k]) return; delete down[k]; fire('keyup', k); }
  function tap(k) { keyDown(k); _st(function () { keyUp(k); }, 70); }
  function releaseAllKeys() { Object.keys(down).forEach(keyUp); }

  /* ---------- CSS polish ---------- */
  var CSS = 'html{-webkit-tap-highlight-color:transparent;overscroll-behavior:none;touch-action:manipulation}' +
    'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;overscroll-behavior:none;' +
    '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;animation:pnIn .4s ease both}' +
    'input,textarea,[contenteditable]{-webkit-user-select:text;user-select:text}' +
    '@keyframes pnIn{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}' +
    'button,[role=button],input[type=button],select{transition:transform .12s cubic-bezier(.2,.8,.2,1),filter .15s ease,box-shadow .2s ease;touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    'button:not(:disabled):hover{filter:brightness(1.08) saturate(1.05)}' +
    'button:not(:disabled):active,[role=button]:active{transform:scale(.95);filter:brightness(.96)}' +
    'button:disabled{opacity:.55;cursor:not-allowed}' +
    'button:focus-visible,[role=button]:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid rgba(255,255,255,.9);outline-offset:2px;box-shadow:0 0 0 5px rgba(0,0,0,.35)}' +
    'canvas{-webkit-touch-callout:none;outline:none}' +
    '::selection{background:rgba(120,160,255,.35)}' +
    '*{scrollbar-width:thin;scrollbar-color:rgba(128,128,128,.5) transparent}' +
    '@media (prefers-reduced-motion:reduce){body{animation:none}button{transition:none}}';
  function injectCSS() {
    if (D.getElementById('pn-fx')) return;
    var s = D.createElement('style'); s.id = 'pn-fx'; s.textContent = CSS;
    (D.head || D.documentElement).appendChild(s);
  }

  /* ---------- UI (shadow DOM so game CSS can never touch it) ---------- */
  var UI_CSS =
    ':host{all:initial}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}' +
    '.fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483640}' +
    '.menu{position:fixed;top:calc(env(safe-area-inset-top,0px) + 6px);right:calc(env(safe-area-inset-right,0px) + 6px);z-index:2147483646;display:flex;gap:6px;align-items:center;opacity:.62;transition:opacity .2s}' +
    '.menu:hover,.menu.open{opacity:1}' +
    '.menu .row{display:none;gap:6px}.menu.open .row{display:flex}' +
    '.b{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(15,18,28,.62);color:#fff;font-size:17px;line-height:1;display:grid;place-items:center;cursor:pointer;' +
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.35);transition:transform .12s,background .15s;touch-action:manipulation;user-select:none;-webkit-user-select:none;padding:0}' +
    '.b:active{transform:scale(.9)}.b.on{background:rgba(52,120,246,.85)}.b.hide{display:none}' +
    '.ov{position:fixed;inset:0;z-index:2147483645;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(8,10,18,.62);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);color:#fff;text-align:center}' +
    '.ov.show{display:flex}.ov h2{margin:0;font-size:30px;letter-spacing:.5px}.ov p{margin:0;opacity:.75;font-size:14px}' +
    '.big{padding:14px 34px;border-radius:30px;border:0;background:linear-gradient(135deg,#4f8cff,#7a5cff);color:#fff;font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 10px 30px rgba(79,140,255,.45);touch-action:manipulation}' +
    '.big:active{transform:scale(.96)}' +
    '.pad{position:fixed;left:0;right:0;bottom:0;z-index:2147483641;display:none;pointer-events:none;padding:0 calc(env(safe-area-inset-right,0px) + 14px) calc(env(safe-area-inset-bottom,0px) + 14px) calc(env(safe-area-inset-left,0px) + 14px);justify-content:space-between;align-items:flex-end}' +
    '.pad.show{display:flex}' +
    '.grp{display:flex;gap:12px;align-items:flex-end;pointer-events:none}' +
    '.joy{position:relative;width:128px;height:128px;border-radius:50%;pointer-events:auto;touch-action:none;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.14),rgba(255,255,255,.05));border:2px solid rgba(255,255,255,.3);box-shadow:inset 0 0 20px rgba(0,0,0,.25),0 6px 20px rgba(0,0,0,.35);opacity:.6;transition:opacity .15s}' +
    '.joy.act{opacity:.95}.joy .th{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#b9c7ff);box-shadow:0 4px 12px rgba(0,0,0,.45);pointer-events:none}' +
    '.btns{display:flex;gap:12px;align-items:flex-end;pointer-events:none;flex-wrap:wrap;justify-content:flex-end;max-width:62vw}' +
    '.ab{pointer-events:auto;touch-action:none;width:68px;height:68px;border-radius:50%;border:2px solid rgba(255,255,255,.38);background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.35),rgba(90,110,255,.35));color:#fff;font-weight:800;font-size:15px;display:grid;place-items:center;opacity:.65;box-shadow:0 6px 18px rgba(0,0,0,.4);user-select:none;-webkit-user-select:none;padding:0;transition:opacity .1s,transform .1s}' +
    '.ab.act{opacity:1;transform:scale(.93)}.ab.sm{width:54px;height:54px;font-size:13px}' +
    '@media (max-height:420px){.joy{width:104px;height:104px}.joy .th{width:44px;height:44px;margin:-22px 0 0 -22px}.ab{width:58px;height:58px}.ab.sm{width:46px;height:46px}}' +
    '.toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 90px);transform:translateX(-50%);background:rgba(15,18,28,.88);color:#fff;padding:9px 16px;border-radius:20px;font-size:13px;z-index:2147483647;opacity:0;pointer-events:none;transition:opacity .25s}' +
    '.toast.show{opacity:1}';

  var els = {}, menuTimer = 0, padOn = false, padBuilt = false, padDefault = false, toastTimer = 0;
  function mk(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg; els.toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = _st(function () { els.toast.classList.remove('show'); }, 1600);
  }
  function buzz(ms) { try { if (W.navigator.vibrate) W.navigator.vibrate(ms || 8); } catch (e) {} }

  function buildUI() {
    if (hostEl) return;
    hostEl = D.createElement('div'); hostEl.id = 'pn-ui';
    hostEl.setAttribute('style', 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646');
    var root = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
    ui = root;
    var st = D.createElement('style'); st.textContent = UI_CSS; root.appendChild(st);

    els.fx = mk('canvas', 'fx'); root.appendChild(els.fx);

    els.menu = mk('div', 'menu'); els.menu.style.pointerEvents = 'auto';
    els.row = mk('div', 'row');
    els.bPause = mk('button', 'b', '⏸'); els.bPause.title = 'Pause (P)'; els.bPause.setAttribute('aria-label', 'Pause');
    els.bMute = mk('button', 'b', muted ? '🔇' : '🔊'); els.bMute.title = 'Sound'; els.bMute.setAttribute('aria-label', 'Toggle sound');
    els.bPad = mk('button', 'b hide', '🎮'); els.bPad.title = 'Touch controls'; els.bPad.setAttribute('aria-label', 'Toggle touch controls');
    els.bFs = mk('button', 'b', '⛶'); els.bFs.title = 'Fullscreen'; els.bFs.setAttribute('aria-label', 'Fullscreen');
    if (!(D.fullscreenEnabled || D.webkitFullscreenEnabled)) els.bFs.classList.add('hide');
    els.bMenu = mk('button', 'b', '⋮'); els.bMenu.setAttribute('aria-label', 'Game menu');
    els.row.appendChild(els.bPause); els.row.appendChild(els.bMute); els.row.appendChild(els.bPad); els.row.appendChild(els.bFs);
    els.menu.appendChild(els.row); els.menu.appendChild(els.bMenu); root.appendChild(els.menu);

    els.ov = mk('div', 'ov'); els.ov.style.pointerEvents = 'auto';
    els.ov.innerHTML = '<h2>⏸ Paused</h2><p>Your progress is safe</p>';
    els.bResume = mk('button', 'big', '▶ Resume'); els.ov.appendChild(els.bResume); root.appendChild(els.ov);

    els.toast = mk('div', 'toast'); root.appendChild(els.toast);

    function openMenu() { els.menu.classList.add('open'); clearTimeout(menuTimer); menuTimer = _st(function () { els.menu.classList.remove('open'); }, 4200); }
    function press(el, fn) { _ael.call(el, 'click', safe(function (e) { e.stopPropagation(); buzz(6); fn(); })); }
    press(els.bMenu, function () { els.menu.classList.contains('open') ? els.menu.classList.remove('open') : openMenu(); });
    press(els.bPause, function () { setPaused(true); });
    press(els.bResume, function () { setPaused(false); });
    press(els.bMute, function () {
      muted = !muted; applyMute(); els.bMute.textContent = muted ? '🔇' : '🔊';
      try { W.localStorage.setItem('pn_mute', muted ? '1' : '0'); } catch (e) {}
      toast(muted ? 'Sound off' : 'Sound on'); if (!muted) unlockAudio(); openMenu();
    });
    press(els.bPad, function () { setPad(!padOn); toast(padOn ? 'Touch controls on' : 'Touch controls off'); openMenu(); });
    press(els.bFs, function () {
      var d = D.documentElement;
      try {
        if (D.fullscreenElement || D.webkitFullscreenElement) (D.exitFullscreen || D.webkitExitFullscreen).call(D);
        else (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
      } catch (e) { toast('Fullscreen not available'); }
    });
    (D.documentElement || D).appendChild(hostEl);
  }
  function renderUI() {
    if (!ui) return;
    els.ov.classList.toggle('show', paused);
    els.bPause.classList.toggle('on', paused);
    if (els.pad) els.pad.classList.toggle('show', padOn && !paused);
  }

  /* ---------- tap particles ---------- */
  var parts = [], fxCtx = null, fxRun = false, dpr = 1;
  var reduced = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAL = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#b388ff', '#ff9f1c'];
  function fxSize() {
    if (!els.fx) return;
    dpr = Math.min(W.devicePixelRatio || 1, 2);
    els.fx.width = Math.max(1, Math.floor(W.innerWidth * dpr)); els.fx.height = Math.max(1, Math.floor(W.innerHeight * dpr));
    fxCtx = els.fx.getContext('2d'); fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function burst(x, y) {
    if (reduced || !fxCtx || parts.length > 90) return;
    var n = 9, base = Math.random() * 6.28;
    for (var i = 0; i < n; i++) {
      var a = base + i * (6.28 / n) + Math.random() * .4, s = 1.4 + Math.random() * 2.6;
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - .6, r: 2 + Math.random() * 2.6, life: 1, c: PAL[(Math.random() * PAL.length) | 0] });
    }
    if (!fxRun) { fxRun = true; _raf(fxLoop); }
  }
  function fxLoop() {
    if (!fxCtx) { fxRun = false; return; }
    fxCtx.clearRect(0, 0, W.innerWidth, W.innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .985; p.life -= .035;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      fxCtx.globalAlpha = Math.max(p.life, 0); fxCtx.fillStyle = p.c;
      fxCtx.beginPath(); fxCtx.arc(p.x, p.y, p.r * (.4 + p.life * .6), 0, 6.283); fxCtx.fill();
    }
    fxCtx.globalAlpha = 1;
    if (parts.length) _raf(fxLoop); else fxRun = false;
  }

  /* ---------- touch controller ---------- */
  var detect = { arrows: false, wasd: false, space: false, enter: false, letters: [], twoP: false, input: false };
  function scanGame() {
    var src = ''; [].forEach.call(D.scripts, function (s) { if (!s.src) src += s.textContent + '\n'; });
    var low = src.toLowerCase();
    detect.arrows = /arrow(left|right|up|down)/i.test(src);
    detect.wasd = /['"]w['"]/.test(low) && /['"]a['"]/.test(low) && /['"]d['"]/.test(low);
    detect.space = /(===?|case)\s*['"] ['"]|['"]space['"]|code\s*===?\s*['"]Space['"]|\[\s*['"] ['"]\s*\]/i.test(src);
    detect.enter = /['"]enter['"]/i.test(src);
    detect.input = !!D.querySelector('input[type=text],input:not([type]),textarea');
    var cnt = {}, re = /(?:key|k|code|ch|c)\s*(?:\)|\])?\s*===?\s*['"](?:Key)?([a-z])['"]|case\s*['"]([a-z])['"]\s*:|keys\[\s*['"]([a-z])['"]\s*\]/gi, m;
    while ((m = re.exec(src))) { var L = (m[1] || m[2] || m[3]).toLowerCase(); cnt[L] = (cnt[L] || 0) + 1; }
    detect.letters = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
    var txt = ((D.title || '') + ' ' + (D.body ? D.body.innerText : '')).slice(0, 4000);
    detect.twoP = /\b(2|two)[\s-]*(players?|p)\b|\bP1\b[\s\S]{0,200}\bP2\b|hotseat|versus|1v1/i.test(txt);
  }
  function wantsPad() {
    if (W.__pnNoPad) return false; /* a game can opt out of the generic touch pad */
    if (!hasKeyListener && !/keydown|onkeydown|keyup|onkeyup/.test([].map.call(D.scripts, function (s) { return s.textContent; }).join(''))) return false;
    if (detect.input && !detect.arrows && !detect.wasd) return false;
    return detect.arrows || detect.wasd || detect.space || detect.enter;
  }

  function makeJoy(dirs) {
    var j = mk('div', 'joy'), th = mk('div', 'th'); j.appendChild(th);
    var pid = null, cur = { l: 0, r: 0, u: 0, d: 0 };
    function set(dx, dy, r) {
      var dead = r * .32, nx = { l: dx < -dead, r: dx > dead, u: dy < -dead, d: dy > dead };
      [['l', 'left'], ['r', 'right'], ['u', 'up'], ['d', 'down']].forEach(function (p) {
        var on = nx[p[0]], was = cur[p[0]];
        if (on === !!was) return;
        cur[p[0]] = on ? 1 : 0;
        dirs[p[1]].forEach(function (k) { on ? keyDown(k) : keyUp(k); });
      });
    }
    function move(e) {
      var b = j.getBoundingClientRect(), r = b.width / 2, cx = b.left + r, cy = b.top + r;
      var dx = e.clientX - cx, dy = e.clientY - cy, len = Math.sqrt(dx * dx + dy * dy) || 1, lim = r * .62;
      var k = len > lim ? lim / len : 1;
      th.style.transform = 'translate(' + (dx * k) + 'px,' + (dy * k) + 'px)';
      set(dx, dy, r);
    }
    function end() {
      pid = null; j.classList.remove('act'); th.style.transform = '';
      set(0, 0, 100); ['l', 'r', 'u', 'd'].forEach(function (x) { cur[x] = 0; });
    }
    _ael.call(j, 'pointerdown', safe(function (e) { e.preventDefault(); e.stopPropagation(); if (pid !== null) return; pid = e.pointerId; try { j.setPointerCapture(pid); } catch (x) {} j.classList.add('act'); buzz(6); move(e); }));
    _ael.call(j, 'pointermove', safe(function (e) { if (e.pointerId === pid) { e.preventDefault(); move(e); } }));
    _ael.call(j, 'pointerup', safe(function (e) { if (e.pointerId === pid) end(); }));
    _ael.call(j, 'pointercancel', safe(function (e) { if (e.pointerId === pid) end(); }));
    _ael.call(j, 'lostpointercapture', safe(function () { if (pid !== null) end(); }));
    return j;
  }
  function makeBtn(label, key, small) {
    var b = mk('button', 'ab' + (small ? ' sm' : ''), label), pid = null;
    b.setAttribute('aria-label', 'Button ' + label);
    _ael.call(b, 'pointerdown', safe(function (e) { e.preventDefault(); e.stopPropagation(); pid = e.pointerId; try { b.setPointerCapture(pid); } catch (x) {} b.classList.add('act'); buzz(10); keyDown(key); }));
    function up(e) { if (pid !== null && e.pointerId === pid) { pid = null; b.classList.remove('act'); keyUp(key); } }
    _ael.call(b, 'pointerup', safe(up)); _ael.call(b, 'pointercancel', safe(up));
    _ael.call(b, 'lostpointercapture', safe(function () { if (pid !== null) { pid = null; b.classList.remove('act'); keyUp(key); } }));
    return b;
  }
  var P1_LET = ['f', 'g', 'e', 'q', 'r', 'c', 'x', 'z', 'v'], P2_LET = ['k', 'l', 'o', 'm', 'n', 'i', 'u'];
  function pickLetters(pool, avoid, n) {
    var out = [];
    detect.letters.forEach(function (L) { if (out.length < n && pool.indexOf(L) > -1 && avoid.indexOf(L) < 0) out.push(L); });
    return out;
  }
  function buildPad() {
    if (padBuilt || !ui) return; padBuilt = true;
    els.pad = mk('div', 'pad');
    var wasdKeys = { left: ['a'], right: ['d'], up: ['w'], down: ['s'] };
    var arrKeys = { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'] };
    var both = { left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd'], up: ['ArrowUp', 'w'], down: ['ArrowDown', 's'] };
    var hasDir = detect.arrows || detect.wasd;
    var dual = detect.arrows && detect.wasd && detect.twoP;
    var g1 = mk('div', 'grp'), g2 = mk('div', 'btns');
    if (dual) {
      /* two-player shared screen: left = P1 (WASD), right = P2 (arrows) */
      var l1 = pickLetters(P1_LET, [], 2), l2 = pickLetters(P2_LET, [], 2);
      g1.appendChild(makeJoy(wasdKeys));
      var b1 = mk('div', 'btns'); b1.style.maxWidth = '30vw';
      if (detect.space) b1.appendChild(makeBtn('P1', ' ', true));
      l1.forEach(function (L) { b1.appendChild(makeBtn(L.toUpperCase(), L, true)); });
      g1.appendChild(b1);
      g2.appendChild(makeJoy(arrKeys));
      l2.forEach(function (L) { g2.appendChild(makeBtn(L.toUpperCase(), L, true)); });
      if (detect.enter) g2.appendChild(makeBtn('OK', 'Enter', true));
      els.pad.appendChild(g1); els.pad.appendChild(g2);
    } else {
      var avoid = (detect.wasd ? ['w', 'a', 's', 'd'] : []);
      var extras = pickLetters(P1_LET.concat(P2_LET, ['b', 'h', 'j', 't', 'y']), avoid, 3);
      if (hasDir) g1.appendChild(makeJoy(detect.arrows && detect.wasd ? both : (detect.wasd ? wasdKeys : arrKeys)));
      extras.slice().reverse().forEach(function (L) { g2.appendChild(makeBtn(L.toUpperCase(), L, true)); });
      if (detect.enter) g2.appendChild(makeBtn('OK', 'Enter', true));
      if (detect.space || !hasDir) g2.appendChild(makeBtn(hasDir ? 'A' : '▶', ' '));
      els.pad.appendChild(g1); els.pad.appendChild(g2);
    }
    ui.appendChild(els.pad);
  }
  function setPad(on) {
    padOn = !!on; if (padOn) buildPad();
    if (els.pad) els.pad.classList.toggle('show', padOn && !paused);
    if (els.bPad) els.bPad.classList.toggle('on', padOn);
    if (!padOn) releaseAllKeys();
  }
  function initPad() {
    var touch = (W.matchMedia && W.matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in W) || (W.navigator.maxTouchPoints > 0);
    if (!touch) return;
    scanGame();
    if (!wantsPad()) return;
    els.bPad.classList.remove('hide');
    /* games that already read touch/drag themselves keep the controller OFF by default (toggle in menu) */
    var selfTouch = hasDragListener && !detect.arrows && !detect.wasd;
    padDefault = !selfTouch;
    setPad(padDefault);
  }

  /* ---------- gamepad ---------- */
  var gpPrev = {};
  function gpLoop() {
    var pads = (W.navigator.getGamepads && W.navigator.getGamepads()) || [], gp = null, i;
    for (i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }
    if (gp && !paused) {
      var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = gp.buttons;
      var st = { left: ax < -.4 || (b[14] && b[14].pressed), right: ax > .4 || (b[15] && b[15].pressed), up: ay < -.4 || (b[12] && b[12].pressed), down: ay > .4 || (b[13] && b[13].pressed) };
      var map = { left: [], right: [], up: [], down: [] };
      var useA = detect.arrows || !detect.wasd, useW = detect.wasd;
      if (useA) { map.left.push('ArrowLeft'); map.right.push('ArrowRight'); map.up.push('ArrowUp'); map.down.push('ArrowDown'); }
      if (useW) { map.left.push('a'); map.right.push('d'); map.up.push('w'); map.down.push('s'); }
      Object.keys(map).forEach(function (d) { map[d].forEach(function (k) { if (!!st[d] !== !!gpPrev[k]) { gpPrev[k] = !!st[d]; st[d] ? keyDown(k) : keyUp(k); } }); });
      var ex = detect.letters.filter(function (L) { return 'wasd'.indexOf(L) < 0; });
      var acts = [[0, ' '], [1, 'Enter'], [2, ex[0]], [3, ex[1]]];
      acts.forEach(function (a) { var k = a[1]; if (!k) return; var on = !!(b[a[0]] && b[a[0]].pressed); if (on !== !!gpPrev['b' + a[0]]) { gpPrev['b' + a[0]] = on; on ? keyDown(k) : keyUp(k); } });
      if (b[9] && b[9].pressed && !gpPrev.start) { gpPrev.start = true; setPaused(true); } else if (!(b[9] && b[9].pressed)) gpPrev.start = false;
    }
    _raf(gpLoop);
  }

  /* ---------- global event hooks ---------- */
  function isOurs(e) { return e.target === hostEl; }
  function installHooks() {
    /* block game input while paused */
    ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'touchstart', 'touchmove', 'touchend', 'wheel', 'keydown', 'keyup', 'contextmenu'].forEach(function (t) {
      _ael.call(W, t, function (e) {
        if (!paused || isOurs(e)) return;
        if (e.type === 'keydown' && (e.key === 'p' || e.key === 'P' || e.key === 'Escape')) { setPaused(false); e.preventDefault(); e.stopImmediatePropagation(); return; }
        e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
      }, true);
    });
    /* stop page scroll from arrows/space; P toggles pause when the game itself does not use P */
    _ael.call(W, 'keydown', function (e) {
      var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      if (e.key === ' ' || (e.key && e.key.indexOf('Arrow') === 0)) { if (e.cancelable) e.preventDefault(); }
      if ((e.key === 'p' || e.key === 'P') && !e.__pn && detect.letters.indexOf('p') < 0 && !paused) { setPaused(true); }
    }, true);
    /* games that read keys before their 'start' screen set their state up can throw on a key event; never let that spam the console/bridge */
    _ael.call(W, 'error', function (e) { if (synth) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    /* particles + focus + audio unlock */
    _ael.call(W, 'pointerdown', safe(function (e) {
      if (isOurs(e)) return;
      try { W.focus(); } catch (x) {}
      unlockAudio();
      if (e.isPrimary !== false) burst(e.clientX, e.clientY);
    }), { capture: true, passive: true });
    _ael.call(W, 'keydown', unlockAudio, { capture: true, passive: true });
    /* auto-pause when tab hidden */
    _ael.call(D, 'visibilitychange', function () { if (D.hidden) setPaused(true); });
    /* block long-press menu & gesture zoom */
    _ael.call(D, 'contextmenu', function (e) { var t = e.target; if (!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'))) e.preventDefault(); });
    ['gesturestart', 'gesturechange'].forEach(function (t) { _ael.call(D, t, function (e) { e.preventDefault(); }); });
    /* resize / orientation / fullscreen fixes: make games re-measure */
    function pokeResize() { fxSize(); _st(function () { try { W.dispatchEvent(new W.Event('resize')); } catch (e) {} }, 180); }
    _ael.call(W, 'orientationchange', pokeResize);
    _ael.call(D, 'fullscreenchange', pokeResize);
    _ael.call(D, 'webkitfullscreenchange', pokeResize);
    _ael.call(W, 'resize', safe(fxSize));
    _ael.call(W, 'blur', function () { releaseAllKeys(); });
    _ael.call(W, 'pagehide', releaseAllKeys);
  }


  /* ---------- PREMIUM THEME (v5): per-game accent, aurora background, glow, glass, win/lose juice ---------- */
  var accent = '#6c8cff', isLight = false;
  function parseRGB(str) {
    var out = [], re = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/g, m;
    while ((m = re.exec(str || ''))) { if (m[4] !== undefined && +m[4] < .2) continue; out.push([+m[1], +m[2], +m[3]]); }
    return out;
  }
  function sat(c) { var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]); return mx ? (mx - mn) / mx : 0; }
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function pickAccent() {
    try {
      var b = D.body, gs = W.getComputedStyle(b), cols = parseRGB(gs.backgroundImage + ' ' + gs.backgroundColor);
      var h1 = D.querySelector('h1,h2'), hc = h1 ? parseRGB(W.getComputedStyle(h1).color)[0] : null;
      var base = cols.length ? cols[0] : [20, 24, 40];
      isLight = lum(base) > .62;
      var cand = (hc ? [hc] : []).concat(cols).filter(function (c) { return sat(c) > .25 && lum(c) > .18; });
      var best = cand.sort(function (a, c) { return sat(c) - sat(a); })[0] || [108, 140, 255];
      if (lum(best) < .42) { var k = .5; best = [Math.round(best[0] + (255 - best[0]) * k), Math.round(best[1] + (255 - best[1]) * k), Math.round(best[2] + (255 - best[2]) * k)]; }
      accent = 'rgb(' + best[0] + ',' + best[1] + ',' + best[2] + ')';
    } catch (e) {}
  }
  function applyPremium() {
    pickAccent();
    var a = accent, dk = !isLight, st = D.getElementById('pn-prem') || D.createElement('style'); st.id = 'pn-prem';
    st.textContent =
      ':root{--pn-a:' + a + '}' +
      'body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:' + (dk ? .34 : .16) + ';' +
      'background:radial-gradient(40% 35% at 18% 22%,' + a + ',transparent 70%),radial-gradient(36% 32% at 82% 30%,rgba(120,90,255,.9),transparent 70%),radial-gradient(45% 40% at 55% 88%,rgba(40,200,200,.8),transparent 72%);' +
      '}' +
            'canvas{border-radius:16px;box-shadow:0 0 0 1px rgba(255,255,255,' + (dk ? .09 : .5) + '),0 14px 44px rgba(0,0,0,' + (dk ? .5 : .22) + '),0 0 36px -10px ' + a + '!important}' +
      'button:not(:disabled){box-shadow:0 6px 16px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.38),inset 0 -2px 0 rgba(0,0,0,.14)}' +
      'h1,h2{letter-spacing:.6px;text-shadow:0 2px 18px ' + a.replace('rgb', 'rgba').replace(')', ',.38)') + '}' +
            '#hud>*,.hud>*,#stats>*,.stats>*{background:rgba(' + (dk ? '255,255,255,.07' : '0,0,0,.05') + ');border:1px solid rgba(' + (dk ? '255,255,255,.12' : '0,0,0,.08') + ');border-radius:999px;padding:3px 12px}' +
      'input[type=text],input:not([type]){border-radius:12px;transition:box-shadow .2s,border-color .2s}' +
      'input[type=text]:focus,input:not([type]):focus{box-shadow:0 0 0 3px ' + a.replace('rgb', 'rgba').replace(')', ',.4)') + ';outline:none}' +
      '@keyframes pnShake{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}' +
      '@keyframes pnFlash{0%{opacity:.55}100%{opacity:0}}' +
      '.pn-shake{animation:pnShake .42s ease both!important}' +
      '@media (prefers-reduced-motion:reduce){.pn-shake{animation:none!important}}';
    (D.head || D.documentElement).appendChild(st);
  }

  /* synth chimes through the (muted-aware) master gain */
  function chime(kind) {
    try {
      var A = W.AudioContext || W.webkitAudioContext; if (!A || muted) return;
      var c = ctxs[0] || new A(); if (c.state === 'suspended') c.resume();
      var notes = kind === 'win' ? [523.25, 659.25, 783.99, 1046.5] : [220, 174.6, 130.8];
      notes.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * (kind === 'win' ? .09 : .14);
        o.type = kind === 'win' ? 'triangle' : 'sawtooth'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'win' ? .16 : .1, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .36);
      });
    } catch (e) {}
  }
  var lastFx = 0;
  function celebrate() {
    if (Date.now() - lastFx < 3000) return; lastFx = Date.now();
    buzz(25); chime('win');
    if (reduced || !fxCtx) return;
    for (var i = 0; i < 70; i++) {
      parts.push({ x: Math.random() * W.innerWidth, y: -10 - Math.random() * 60, vx: (Math.random() - .5) * 3, vy: 1 + Math.random() * 3.2, r: 2.5 + Math.random() * 3, life: 1.6, c: PAL[(Math.random() * PAL.length) | 0] });
    }
    if (!fxRun) { fxRun = true; _raf(fxLoop); }
  }
  function defeat() {
    if (Date.now() - lastFx < 3000) return; lastFx = Date.now();
    buzz([40, 30, 60]); chime('lose');
    if (D.body && !reduced) { D.body.classList.add('pn-shake'); _st(function () { D.body.classList.remove('pn-shake'); }, 480); }
  }
  var WIN_RE = /(you\s+win|victory|you\s+won|level\s+(complete|cleared|up)|congrat|well\s+done|puzzle\s+solved|all\s+solved|perfect!|stage\s+clear|mission\s+complete|you\s+made\s+it|escaped!|success!)/i;
  var LOSE_RE = /(game\s*over|you\s+lose|you\s+lost|defeat|you\s+died|you're\s+dead|crashed|time'?s\s+up|out\s+of\s+moves|failed)/i;
  var mo = null, moT = 0, pendTxt = '';
  function watchOutcome() {
    if (!W.MutationObserver || !D.body) return;
    mo = new W.MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') pendTxt += ' ' + (m.target.nodeValue || '').slice(0, 200);
        else [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && n.id !== 'pn-ui') pendTxt += ' ' + (n.textContent || '').slice(0, 300); else if (n.nodeType === 3) pendTxt += ' ' + (n.nodeValue || '').slice(0, 200); });
        if (m.type === 'attributes' && m.target.nodeType === 1 && m.target.id !== 'pn-ui') pendTxt += ' ' + (m.target.textContent || '').slice(0, 200);
      });
      if (moT) return;
      moT = _st(function () {
        moT = 0; var t = pendTxt; pendTxt = '';
        if (t.length > 1200) t = t.slice(0, 1200);
        if (WIN_RE.test(t)) celebrate(); else if (LOSE_RE.test(t)) defeat();
      }, 220);
    });
    mo.observe(D.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  }

  /* ---------- boot ---------- */
  function boot() {
    try { injectCSS(); } catch (e) {}
    try { buildUI(); fxSize(); applyMute(); } catch (e) {}
    try { applyPremium(); _st(applyPremium, 700); watchOutcome(); } catch (e) {}
    try { scanGame(); } catch (e) {}
    try { initPad(); } catch (e) {}
    try { renderUI(); } catch (e) {}
    try { _raf(gpLoop); } catch (e) {}
  }
  installHooks();
  if (D.readyState === 'loading') _ael.call(D, 'DOMContentLoaded', safe(boot)); else boot();
  /* late scripts may register key listeners after DOMContentLoaded: re-check once the page is fully loaded */
  _ael.call(W, 'load', safe(function () { _st(function () { if (!padBuilt && ui) { initPad(); } }, 400); }));
})();
