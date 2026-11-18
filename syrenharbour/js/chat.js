/* Ask Syren: client-side FAQ helper. Knowledge base lives in js/kb.json (no external API).
   VIDEO SLOTS: set an entry's "video" to a filename in media/faq/ (e.g. "jerk.mp4") and optionally
   "captions" to a .vtt file; the answer will then play that clip inline. */
(function () {
  var KB = null, base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/js\/chat\.js.*$/, '') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STOP = { the:1, a:1, an:1, is:1, are:1, do:1, does:1, you:1, your:1, we:1, i:1, me:1, my:1, of:1, to:1, for:1, and:1, or:1, on:1, in:1, it:1, what:1, whats:1, can:1, have:1, has:1, any:1, about:1, tell:1, there:1, with:1, at:1, be:1, this:1, that:1, how:1, much:1, get:1, please:1, us:1 };
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var prev = [], cur, i, j; for (j = 0; j <= b.length; j++) prev.push(j);
    for (i = 1; i <= a.length; i++) { cur = [i]; for (j = 1; j <= b.length; j++) cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))); prev = cur; }
    return prev[b.length];
  }
  function tokMatch(t, k) {
    if (t === k) return 3;
    if (k.length >= 4 && t.length >= 4 && (t.indexOf(k) === 0 || k.indexOf(t) === 0)) return 2;
    if (k.length >= 5) { var d = lev(t, k); if (d <= 1 || (k.length >= 8 && d <= 2)) return 2; }
    return 0;
  }
  function score(q, e) {
    var nq = ' ' + norm(q) + ' ', toks = norm(q).split(' ').filter(function (t) { return t && !STOP[t]; }), s = 0;
    (e._kw || (e._kw = e.keywords.map(norm))).forEach(function (k) {
      if (k.indexOf(' ') > -1) { if (nq.indexOf(' ' + k + ' ') > -1) s += 4; return; }
      var best = 0; toks.forEach(function (t) { best = Math.max(best, tokMatch(t, k)); }); s += best;
    });
    return s;
  }
  function find(q) {
    var best = null, bs = 0, ranked = [];
    KB.entries.forEach(function (e) { var s = score(q, e); if (s > 0) ranked.push({ e: e, s: s }); if (s > bs) { bs = s; best = e; } });
    ranked.sort(function (a, b) { return b.s - a.s; });
    return { entry: bs >= 3 ? best : null, related: ranked.slice(1, 3).filter(function (r) { return r.s >= 3; }).map(function (r) { return r.e; }) };
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  var root = el('div', 'ask'); root.id = 'askSyren';
  var fab = el('button', 'ask-fab'); fab.type = 'button'; fab.setAttribute('aria-label', 'Ask Syren, our chat helper'); fab.setAttribute('aria-expanded', 'false');
  var av = el('img'); av.src = base + 'img/avatar.webp'; av.alt = ''; av.width = 64; av.height = 64; fab.appendChild(av); fab.appendChild(el('span', 'ask-fab-label', 'Ask Syren'));
  var panel = el('div', 'ask-panel'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Ask Syren chat'); panel.hidden = true;
  var head = el('div', 'ask-head'); var hav = el('img'); hav.src = base + 'img/avatar.webp'; hav.alt = ''; hav.width = 40; hav.height = 40;
  var ht = el('div', 'ask-title'); ht.appendChild(el('b', null, 'Ask Syren')); ht.appendChild(el('small', null, 'Syren Harbour helper'));
  var close = el('button', 'ask-close', '\u00d7'); close.type = 'button'; close.setAttribute('aria-label', 'Close chat');
  head.appendChild(hav); head.appendChild(ht); head.appendChild(close);
  var log = el('div', 'ask-log'); log.setAttribute('aria-live', 'polite');
  var chips = el('div', 'ask-chips');
  var form = el('form', 'ask-form'); var input = el('input'); input.type = 'text'; input.placeholder = 'Ask about the menu, jerk, reservations...'; input.setAttribute('aria-label', 'Your question'); input.maxLength = 200;
  var send = el('button', null, 'Send'); send.type = 'submit'; form.appendChild(input); form.appendChild(send);
  panel.appendChild(head); panel.appendChild(log); panel.appendChild(chips); panel.appendChild(form);
  root.appendChild(panel); root.appendChild(fab); document.body.appendChild(root);

  function scroll() { log.scrollTop = log.scrollHeight; }
  function userMsg(t) { log.appendChild(el('div', 'msg me', t)); scroll(); }
  function botMsg(entry, text) {
    var m = el('div', 'msg bot');
    if (entry && entry.video) {
      var v = el('video', 'ask-vid'); v.src = base + KB.videoBase + entry.video; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      if (!reduce) v.autoplay = true;
      if (entry.captions) { var tr = el('track'); tr.kind = 'captions'; tr.srclang = 'en'; tr.label = 'English'; tr.default = true; tr.src = base + KB.videoBase + entry.captions; v.appendChild(tr); }
      m.appendChild(v);
    }
    m.appendChild(el('p', null, text || entry.answer));
    if (entry && entry.link) { var a = el('a', 'ask-link', entry.link.label); a.href = entry.link.href; if (/^https?:/.test(entry.link.href)) { a.target = '_blank'; a.rel = 'noopener'; } m.appendChild(a); }
    log.appendChild(m); scroll();
  }
  function related(list) {
    if (!list.length) return; var w = el('div', 'ask-rel'); w.appendChild(el('span', null, 'Related:'));
    list.forEach(function (e) { var c = el('button', 'chip', e.title); c.type = 'button'; c.addEventListener('click', function () { ask(e.title, e); }); w.appendChild(c); });
    log.appendChild(w); scroll();
  }
  function typing(cb) { var t = el('div', 'msg bot typing'); t.appendChild(el('i')); t.appendChild(el('i')); t.appendChild(el('i')); log.appendChild(t); scroll(); setTimeout(function () { t.remove(); cb(); }, reduce ? 0 : 450); }
  function ask(q, forced) {
    q = (q || '').trim(); if (!q) return; userMsg(q);
    typing(function () {
      if (forced) { botMsg(forced); return; }
      var r = find(q);
      if (r.entry) { botMsg(r.entry); related(r.related); }
      else botMsg({ answer: KB.fallback, link: { href: 'tel:+15088015444', label: 'Call 508-801-5444' } });
    });
  }
  var started = false;
  function open() {
    panel.hidden = false; root.classList.add('open'); fab.setAttribute('aria-expanded', 'true');
    if (!started && KB) {
      started = true; var w = KB.entries.filter(function (e) { return e.id === 'welcome'; })[0]; botMsg(w);
      KB.chips.forEach(function (c) { var b = el('button', 'chip', c); b.type = 'button'; b.addEventListener('click', function () { ask(c); }); chips.appendChild(b); });
    }
    setTimeout(function () { input.focus(); }, 50);
  }
  function shut() { panel.hidden = true; root.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
  fab.addEventListener('click', function () { panel.hidden ? open() : shut(); });
  close.addEventListener('click', shut);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) shut(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); var q = input.value; input.value = ''; ask(q); });
  fetch(base + 'js/kb.json').then(function (r) { return r.json(); }).then(function (j) { KB = j; window.AskSyren = { ask: function (q) { if (panel.hidden) open(); ask(q); }, open: open, kb: j }; });
})();
