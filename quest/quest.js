(function () {
  'use strict';
  var LS = 'cq_passport_v1';
  var zoom = 1, face = 'downtown', data = null, catFilter = '', popupId = null;

  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function stamps() { try { return JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { return {}; } }
  function saveStamps(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function cat(id) {
    return (data.categories || []).find(function (c) { return c.id === id; }) || { id: id, name: id, color: '#b45309' };
  }
  function trailStops() {
    return data.places.filter(function (p) { return p.trail; }).sort(function (a, b) { return (a.trailN || 0) - (b.trailN || 0); });
  }
  function asset(path) {
    path = String(path || '');
    var q = '', qi = path.indexOf('?');
    if (qi >= 0) { q = path.slice(qi); path = path.slice(0, qi); }
    if (path.indexOf('/quest/') === 0) return path + q;
    if (path.indexOf('assets/') === 0) return '/quest/' + path + q;
    return '/quest/assets/' + path.replace(/^.*\//, '') + q;
  }

  function setFace(f) {
    face = f;
    var meta = data.faces[f];
    var pic = document.getElementById('map-pic');
    var img = document.getElementById('map-img');
    var webp = asset(meta.webp);
    var jpg = asset(meta.src);
    var src = pic.querySelector('source');
    if (src) src.srcset = webp;
    img.src = jpg;
    img.alt = 'Falmouth Culinary Quest map — ' + meta.title;
    document.getElementById('side-label').textContent = (f === 'downtown' ? 'Front · ' : 'Back · ') + meta.title;
    document.getElementById('btn-flip').textContent = f === 'downtown' ? 'Flip to Woods Hole side' : 'Flip to Downtown side';
    popupId = null;
    document.getElementById('popup-host').innerHTML = '';
    drawPins();
    renderSide();
  }

  function applyZoom() {
    document.getElementById('sheet-wrap').style.setProperty('--z', zoom);
    document.getElementById('zoom-level').textContent = Math.round(zoom * 100) + '%';
  }

  function visiblePlaces() {
    return data.places.filter(function (p) {
      if (p.side !== face) return false;
      if (p.ghost) return false;
      if (catFilter && p.cat !== catFilter) return false;
      return true;
    });
  }

  function drawPins() {
    var host = document.getElementById('pins');
    host.innerHTML = '';
    visiblePlaces().forEach(function (p) {
      var c = cat(p.cat);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pin' + (p.quest ? ' quest' : '');
      btn.style.left = (p.x * 100) + '%';
      btn.style.top = (p.y * 100) + '%';
      btn.dataset.id = p.id;
      btn.setAttribute('aria-label', p.name + (p.quest ? ', Quest Stop 1' : ''));
      btn.innerHTML = '<span class="label">' + h(p.name) + '</span>' +
        '<span class="dot" style="background:' + h(c.color) + '"><span>' + (p.quest ? '★' : String(p.n || '')) + '</span></span>';
      btn.addEventListener('click', function (e) { e.stopPropagation(); openPopup(p.id); });
      host.appendChild(btn);
    });
    data.events.filter(function (e) { return e.side === face; }).forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pin event';
      b.style.left = (e.x * 100) + '%';
      b.style.top = (e.y * 100) + '%';
      b.setAttribute('aria-label', e.name);
      b.innerHTML = '<span class="label">' + h(e.name) + '</span><span class="dot" style="background:#7c2d12"><span>E</span></span>';
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        document.getElementById('popup-host').innerHTML =
          '<div class="popup" style="left:' + (e.x * 100) + '%;top:' + (e.y * 100) + '%"><b>' + h(e.name) +
          '</b><div class="meta"><strong>' + h(e.when) + '</strong><br>' + h(e.where) + '</div></div>';
      });
      host.appendChild(b);
    });
  }

  function openPopup(id) {
    var p = data.places.find(function (x) { return x.id === id; });
    if (!p) return;
    popupId = id;
    document.querySelectorAll('.pin').forEach(function (el) { el.classList.toggle('is-on', el.dataset.id === id); });
    var c = cat(p.cat);
    var html = '<div class="popup" style="left:' + (p.x * 100) + '%;top:' + (p.y * 100) + '%">';
    if (p.quest) html += '<span class="quest-tag">Quest Stop #1</span>';
    html += '<b>' + h(p.name) + '</b><div class="meta">' + h(c.name) + ' · ' + h(p.area);
    if (p.approx) html += '<br>Pin approximate';
    if (p.addressNote) html += '<br>' + h(p.addressNote);
    if (p.web) html += '<br><a href="' + h(p.web) + '" target="_blank" rel="noopener">Website ↗</a>';
    else if (p.websiteNote) html += '<br>' + h(p.websiteNote);
    html += '</div></div>';
    document.getElementById('popup-host').innerHTML = html;
    var viewer = document.getElementById('viewer');
    var sheet = document.getElementById('sheet');
    viewer.scrollTo({
      left: Math.max(0, sheet.offsetLeft + sheet.offsetWidth * p.x - viewer.clientWidth / 2),
      top: Math.max(0, sheet.offsetTop + sheet.offsetHeight * p.y - viewer.clientHeight / 2),
      behavior: 'smooth'
    });
  }

  function renderSide() {
    var st = stamps();
    var trail = trailStops();
    var got = trail.filter(function (p) { return st[p.id]; }).length;
    var placesAll = data.places.filter(function (p) { return !p.ghost; });
    var list = placesAll.filter(function (p) { return !catFilter || p.cat === catFilter; });

    document.getElementById('panel').innerHTML =
      '<h1>Culinary Quest — Falmouth Food Map</h1>' +
      '<p class="tagline">Eat. Explore. Earn stamps.</p>' +
      '<div class="note"><strong>Preview.</strong> Food-themed illustrated map. Listings are being verified — no hours, phones, or ratings.</div>' +
      '<div class="box passport" id="passport">' +
      '<h2>Quest passport · Main Street Lunch Trail</h2>' +
      '<p style="font-size:.8rem;color:#78716c;margin:0 0 6px">5 stops · mock / QR check-in. Stamps stay on this device.</p>' +
      '<div class="stamps">' + trail.map(function (p) {
        var on = !!st[p.id];
        return '<div class="stamp ' + (on ? 'got' : '') + '"><span class="n">' + (on ? '✓' : p.trailN) + '</span>' + h((p.name || '').split(' ')[0]) + '</div>';
      }).join('') + '</div>' +
      '<p style="font-size:.82rem;margin:6px 0 8px"><b>' + got + ' / 5</b> stamps</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
      '<button type="button" class="btn sm" id="mock-checkin">Mock / QR check-in</button>' +
      '<button type="button" class="btn ghost sm" id="reset-stamps">Reset</button>' +
      '<button type="button" class="btn ghost sm" id="goto-quest1">Quest Stop #1</button>' +
      '</div></div>' +
      '<div class="box partner">' +
      '<h2>Restaurant Exchange Program</h2>' +
      '<p style="font-size:.82rem;color:#5c564e;margin:0 0 8px">Coming soon — partner with us to swap staff meals and appear on Culinary Quest trails.</p>' +
      '<a class="btn sm teal" href="mailto:healthandwellnessmapllc@gmail.com?subject=Restaurant%20Exchange%20Program">Partner with us</a>' +
      '</div>' +
      '<div class="box events">' +
      '<h2>Food Festival &amp; Event Dates</h2>' +
      '<ul class="elist">' + data.events.map(function (e) {
        return '<li><b>' + h(e.name) + '</b><span>' + h(e.when) + ' · ' + h(e.where) + '</span></li>';
      }).join('') + '</ul></div>' +
      '<div class="box">' +
      '<h2>Map key · restaurant categories</h2>' +
      '<div class="key">' + data.categories.map(function (c) {
        var n = placesAll.filter(function (p) { return p.cat === c.id; }).length;
        return '<div><i style="background:' + h(c.color) + '"></i>' + h(c.name) + ' <span style="color:#78716c">(' + n + ')</span></div>';
      }).join('') +
      '<div><i style="background:#7c2d12;border-radius:2px"></i>Festival / event</div>' +
      '<div><i style="background:#16a34a"></i>Quest Stop #1 ★</div>' +
      '</div></div>' +
      '<div class="box">' +
      '<h2>Border ad tiles</h2>' +
      '<p style="font-size:.8rem;color:#5c564e;margin:0 0 8px">Verified restaurants on the border; open slots say Become a partner. No invented phone numbers.</p>' +
      '<div class="ads">' +
      '<div class="ad feat"><strong>Cape Island Café</strong>Quest Stop #1 · featured</div>' +
      '<div class="ad"><strong>Your ad here</strong>Become a partner</div>' +
      '<div class="ad"><strong>Your ad here</strong>Become a partner</div>' +
      '<div class="ad"><strong>Your ad here</strong>Become a partner</div>' +
      '</div>' +
      '<p style="margin-top:8px"><a class="btn ghost sm" href="mailto:healthandwellnessmapllc@gmail.com?subject=Culinary%20Quest%20ad%20tile">Reserve a tile</a></p>' +
      '</div>' +
      '<div class="box">' +
      '<h2>Restaurants (' + placesAll.length + ')</h2>' +
      '<div class="chips"><button type="button" class="chip ' + (!catFilter ? 'on' : '') + '" data-c="">All</button>' +
      data.categories.map(function (c) {
        return '<button type="button" class="chip ' + (catFilter === c.id ? 'on' : '') + '" data-c="' + h(c.id) + '">' + h(c.name.split('&')[0].trim()) + '</button>';
      }).join('') + '</div>' +
      '<div class="rlist">' + list.map(function (p) {
        var c = cat(p.cat);
        return '<div class="item" data-id="' + h(p.id) + '" data-side="' + h(p.side) + '"><b>' + h(p.name) +
          (p.quest ? ' · ★' : '') + '</b><div class="meta">' + h(c.name) + ' · ' + h(p.area) +
          (p.websiteNote ? ' · ' + h(p.websiteNote) : '') +
          (p.side !== face ? ' · on ' + (p.side === 'downtown' ? 'Downtown' : 'Woods Hole') + ' side' : '') +
          '</div></div>';
      }).join('') + '</div></div>' +
      '<p style="font-size:.75rem;color:#78716c;margin-top:8px">' + h(data.credits || '') + '</p>';

    document.querySelectorAll('.chip').forEach(function (b) {
      b.onclick = function () { catFilter = b.dataset.c; drawPins(); renderSide(); };
    });
    document.querySelectorAll('.rlist .item').forEach(function (el) {
      el.onclick = function () {
        if (el.dataset.side !== face) setFace(el.dataset.side);
        openPopup(el.dataset.id);
        if (window.matchMedia('(max-width:900px)').matches) setSheet(false);
      };
    });
    document.getElementById('goto-quest1').onclick = function () {
      var p = data.places.find(function (x) { return x.quest; });
      if (!p) return;
      if (p.side !== face) setFace(p.side);
      openPopup(p.id);
    };
    document.getElementById('mock-checkin').onclick = function () {
      var next = trail.find(function (p) { return !st[p.id]; });
      if (!next) { alert('Trail complete on this device. Reset to try again.'); return; }
      if (!confirm('Mock / QR check-in at:\n\n' + next.name + '\n\nDemo only. Add stamp #' + next.trailN + '?')) return;
      st[next.id] = Date.now(); saveStamps(st);
      if (next.side !== face) setFace(next.side); else renderSide();
      openPopup(next.id);
    };
    document.getElementById('reset-stamps').onclick = function () {
      if (!confirm('Clear stamps on this device?')) return;
      saveStamps({}); renderSide();
    };
  }

  function setSheet(open) {
    var side = document.getElementById('side');
    side.classList.toggle('open', open);
    document.getElementById('sheet-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function boot(d) {
    data = d;
    data.credits = 'Food-themed illustrated base generated for Culinary Quest; restaurant pins and border tiles are Health & Wellness Maps overlays. Facts verified; no invented phones.';
    setFace('downtown');
    applyZoom();
    document.getElementById('btn-zoom-in').onclick = function () { zoom = Math.min(3, zoom + 0.25); applyZoom(); };
    document.getElementById('btn-zoom-out').onclick = function () { zoom = Math.max(0.75, zoom - 0.25); applyZoom(); };
    document.getElementById('btn-flip').onclick = function () { setFace(face === 'downtown' ? 'woodshole' : 'downtown'); };
    document.getElementById('btn-png').onclick = function () {
      var img = document.getElementById('map-img');
      var a = document.createElement('a');
      a.href = img.currentSrc || img.src;
      a.download = 'culinary-quest-' + face + '.jpg';
      a.click();
    };
    document.getElementById('btn-full').onclick = function () {
      var el = document.querySelector('.stage');
      if (!document.fullscreenElement) el.requestFullscreen().catch(function () {});
      else document.exitFullscreen();
    };
    document.getElementById('sheet').addEventListener('click', function () {
      popupId = null;
      document.getElementById('popup-host').innerHTML = '';
      document.querySelectorAll('.pin').forEach(function (el) { el.classList.remove('is-on'); });
    });
    var tog = document.getElementById('sheet-toggle');
    tog.onclick = function () { setSheet(!document.getElementById('side').classList.contains('open')); };
  }

  // Prefer inline JSON if present (faster first paint), else fetch
  var inline = document.getElementById('cq-data');
  if (inline && inline.textContent.trim()) {
    try { boot(JSON.parse(inline.textContent)); return; } catch (e) { console.error(e); }
  }
  fetch('/quest/assets/culinary-quest.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(boot)
    .catch(function (e) {
      document.getElementById('panel').innerHTML = '<p class="note"><strong>Could not load map data.</strong> ' + h(String(e)) + '</p>';
      console.error(e);
    });
})();
