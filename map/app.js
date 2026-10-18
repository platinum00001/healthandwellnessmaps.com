(function () {
  'use strict';
  var sb = window.sb, side = document.getElementById('side'), nav = document.getElementById('nav');
  var S = { user: null, admin: false, cats: [], places: [], ratings: [], filter: { q: '', cat: '', free: false }, markers: {}, pickMarker: null, picking: false, tab: 'list' };

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function stars(n) { n = Math.round(n || 0); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function msg(el, t, ok) { el.textContent = t; el.className = 'msg ' + (ok ? 'ok' : 'err'); }
  function $(s) { return side.querySelector(s); }
  function cat(slug) { return S.cats.find(function (c) { return c.slug === slug; }) || { name: slug, color: '#0f766e' }; }
  function ratingOf(id) { var r = S.ratings.filter(function (x) { return x.place_id === id; }); return { n: r.length, avg: r.length ? r.reduce(function (a, x) { return a + x.rating; }, 0) / r.length : 0 }; }

  // ---------- map ----------
  var map = L.map('map', { zoomControl: true }).setView([41.58, -70.55], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
  function icon(color) { return L.divIcon({ className: '', html: '<div class="pin" style="background:' + h(color) + '"></div>', iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24] }); }
  map.on('click', function (e) { if (S.picking) setPick(e.latlng.lat, e.latlng.lng); });
  function setPick(lat, lng) {
    if (S.pickMarker) S.pickMarker.setLatLng([lat, lng]); else S.pickMarker = L.marker([lat, lng], { draggable: true }).addTo(map).on('dragend', function (e) { var p = e.target.getLatLng(); setPick(p.lat, p.lng); });
    var la = $('#s_lat'), ln = $('#s_lng'); if (la) { la.value = lat.toFixed(6); ln.value = lng.toFixed(6); }
  }
  function clearPick() { S.picking = false; if (S.pickMarker) { map.removeLayer(S.pickMarker); S.pickMarker = null; } }

  function visible() {
    var q = S.filter.q.toLowerCase();
    return S.places.filter(function (p) {
      if (p.status !== 'approved') return false;
      if (S.filter.cat && p.category !== S.filter.cat) return false;
      if (S.filter.free && !p.is_free) return false;
      return !q || (p.name + ' ' + (p.description || '') + ' ' + (p.town || '') + ' ' + (p.address || '') + ' ' + cat(p.category).name).toLowerCase().indexOf(q) >= 0;
    });
  }
  function drawMarkers() {
    Object.keys(S.markers).forEach(function (k) { map.removeLayer(S.markers[k]); }); S.markers = {};
    visible().forEach(function (p) {
      var m = L.marker([p.lat, p.lng], { icon: icon(cat(p.category).color), title: p.name }).addTo(map);
      m.bindPopup('<b>' + h(p.name) + '</b><br><span class="small">' + h(cat(p.category).name) + '</span><br><a href="#" data-open="' + h(p.id) + '">Details</a>');
      m.on('popupopen', function (e) { var a = e.popup.getElement().querySelector('[data-open]'); if (a) a.onclick = function (ev) { ev.preventDefault(); showPlace(p.id); }; });
      m.on('click', function () { showPlace(p.id, true); });
      S.markers[p.id] = m;
    });
  }

  async function load() {
    var c = await sb.from('wellness_categories').select('*').order('sort');
    var p = await sb.from('wellness_places').select('*').order('name');
    var r = await sb.from('wellness_reviews').select('place_id,rating');
    S.cats = c.data || []; S.places = p.data || []; S.ratings = r.data || [];
    drawMarkers();
  }
  async function refreshUser() {
    var r = await sb.auth.getUser(); S.user = r.data && r.data.user || null; S.admin = false;
    if (S.user) { var a = await sb.rpc('is_admin'); S.admin = a.data === true; }
    renderNav();
  }
  function renderNav() {
    var tabs = [['list', 'Explore'], ['submit', 'Suggest a place'], ['account', S.user ? 'Account' : 'Log in']];
    if (S.admin) tabs.push(['admin', 'Admin']);
    nav.innerHTML = tabs.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('');
    nav.querySelectorAll('button').forEach(function (b) { b.onclick = function () { go(b.dataset.tab); }; });
  }
  function go(tab) { S.tab = tab; renderNav(); if (tab !== 'submit') clearPick(); ({ list: showList, submit: showSubmit, account: showAccount, admin: showAdmin })[tab](); }

  // ---------- list ----------
  function showList() {
    side.innerHTML = '<h2 style="font-size:1.2rem">Find wellness resources &amp; free food</h2>' +
      '<input id="q" placeholder="Search by name, town or need" value="' + h(S.filter.q) + '" style="margin-top:10px">' +
      '<div class="chips"><button class="chip ' + (!S.filter.cat ? 'on' : '') + '" data-c="">All</button>' + S.cats.map(function (c) { return '<button class="chip ' + (S.filter.cat === c.slug ? 'on' : '') + '" data-c="' + h(c.slug) + '"><i style="background:' + h(c.color) + '"></i>' + h(c.name) + '</button>'; }).join('') + '</div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:4px 0 6px"><input type="checkbox" id="free" style="width:auto"' + (S.filter.free ? ' checked' : '') + '> Free only</label><div id="items"></div>';
    function items() {
      var v = visible();
      $('#items').innerHTML = v.length ? v.map(function (p) { var r = ratingOf(p.id); return '<div class="item" data-id="' + h(p.id) + '"><b>' + h(p.name) + (p.is_free ? '<span class="free">FREE</span>' : '') + '</b><span class="small muted">' + h(cat(p.category).name) + ' · ' + h(p.town || '') + '</span>' + (r.n ? ' <span class="small stars">' + stars(r.avg) + '</span>' : '') + '</div>'; }).join('') : '<p class="muted small" style="margin-top:10px">Nothing matches yet. Know a place? <a href="#" id="sugg">Suggest it</a>.</p>';
      side.querySelectorAll('.item').forEach(function (d) { d.onclick = function () { showPlace(d.dataset.id, true); }; });
      var sg = $('#sugg'); if (sg) sg.onclick = function (e) { e.preventDefault(); go('submit'); };
    }
    $('#q').oninput = function () { S.filter.q = this.value; drawMarkers(); items(); };
    $('#free').onchange = function () { S.filter.free = this.checked; drawMarkers(); items(); };
    side.querySelectorAll('.chip').forEach(function (b) { b.onclick = function () { S.filter.cat = b.dataset.c; drawMarkers(); showList(); }; });
    items();
  }

  // ---------- place detail ----------
  async function showPlace(id, fly) {
    var p = S.places.find(function (x) { return x.id === id; }); if (!p) return;
    if (fly) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 14), { duration: .6 });
    S.tab = 'list'; renderNav();
    var c = cat(p.category), web = safeUrl(p.website);
    var dir = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(p.lat + ',' + p.lng);
    side.innerHTML = '<p class="small"><a href="#" id="back">← Back to list</a></p><h2 style="font-size:1.3rem;margin-top:8px">' + h(p.name) + (p.is_free ? '<span class="free">FREE</span>' : '') + '</h2>' +
      '<p class="small"><span class="pill" style="background:' + h(c.color) + ';color:#fff">' + h(c.name) + '</span></p>' +
      (p.description ? '<p style="margin-top:8px;white-space:pre-line">' + h(p.description) + '</p>' : '') +
      '<div class="box small">' + (p.address ? '<div><b>Address:</b> ' + h(p.address) + (p.town ? ', ' + h(p.town) : '') + '</div>' : '') +
      (p.hours ? '<div><b>Hours:</b> ' + h(p.hours) + '</div>' : '') + (p.phone ? '<div><b>Phone:</b> <a href="tel:' + h(p.phone.replace(/[^0-9+]/g, '')) + '">' + h(p.phone) + '</a></div>' : '') +
      (web ? '<div><a href="' + h(web) + '" target="_blank" rel="noopener">Website ↗</a></div>' : '') + '<div style="margin-top:6px"><a class="btn sm" href="' + dir + '" target="_blank" rel="noopener">Directions</a></div></div>' +
      '<h3 style="margin-top:14px">Ratings &amp; comments</h3><div id="rf"></div><div id="rl" class="small muted">Loading…</div>';
    $('#back').onclick = function (e) { e.preventDefault(); showList(); };
    var rv = await sb.from('wellness_reviews').select('*').eq('place_id', id).order('created_at', { ascending: false });
    var all = rv.data || [], shown = all.filter(function (r) { return !r.hidden; });
    var mine = S.user && all.find(function (r) { return r.user_id === S.user.id; });
    $('#rl').className = ''; $('#rl').innerHTML = shown.length ? shown.map(function (r) { return '<div class="review"><div class="row"><span class="stars">' + stars(r.rating) + '</span><b class="small">' + h(r.reviewer_name) + '</b><span class="small muted">' + new Date(r.created_at).toLocaleDateString() + '</span>' + (S.user && r.user_id !== S.user.id ? '<button class="btn ghost sm flag" data-id="' + h(r.id) + '">Report</button>' : '') + '</div>' + (r.body ? '<p class="small" style="white-space:pre-line">' + h(r.body) + '</p>' : '') + '</div>'; }).join('') : '<p class="small muted">No comments yet.</p>';
    side.querySelectorAll('.flag').forEach(function (b) { b.onclick = async function () { var r = await sb.rpc('flag_review', { p_kind: 'wellness', p_id: b.dataset.id }); b.textContent = r.error ? 'Error' : 'Reported'; b.disabled = true; }; });
    if (p.status !== 'approved') { $('#rf').innerHTML = '<p class="small"><span class="pill ' + h(p.status) + '">' + h(p.status) + '</span></p>'; return; }
    if (!S.user) { $('#rf').innerHTML = '<p class="small muted"><a href="#" id="li">Log in</a> to rate or comment.</p>'; $('#li').onclick = function (e) { e.preventDefault(); go('account'); }; return; }
    var pick = mine ? mine.rating : 5;
    $('#rf').innerHTML = '<div class="box"><b class="small">' + (mine ? 'Edit your rating' : 'Rate this place') + '</b><div class="starpick" id="sp"></div><label>Name shown</label><input id="rn" maxlength="80" value="' + h(mine ? mine.reviewer_name : (S.user.email || '').split('@')[0]) + '"><label>Comment (optional)</label><textarea id="rb" rows="2" maxlength="2000">' + h(mine ? mine.body : '') + '</textarea><br><br><button class="btn sm" id="rs">' + (mine ? 'Update' : 'Post') + '</button>' + (mine ? ' <button class="btn ghost sm" id="rd">Delete</button>' : '') + '<div class="msg" id="rm"></div></div>';
    function ds() { $('#sp').innerHTML = [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-v="' + i + '" class="' + (i <= pick ? 'on' : '') + '" aria-label="' + i + ' stars">★</button>'; }).join(''); $('#sp').querySelectorAll('button').forEach(function (b) { b.onclick = function () { pick = +b.dataset.v; ds(); }; }); }
    ds();
    $('#rs').onclick = async function () {
      var row = { place_id: id, user_id: S.user.id, rating: pick, reviewer_name: $('#rn').value.trim() || 'Neighbor', body: $('#rb').value.trim() || null };
      var r = mine ? await sb.from('wellness_reviews').update(row).eq('id', mine.id) : await sb.from('wellness_reviews').insert(row);
      if (r.error) return msg($('#rm'), r.error.message);
      await load(); showPlace(id);
    };
    if (mine) $('#rd').onclick = async function () { await sb.from('wellness_reviews').delete().eq('id', mine.id); await load(); showPlace(id); };
  }

  // ---------- submit ----------
  function showSubmit() {
    if (!S.user) { side.innerHTML = '<h2 style="font-size:1.2rem">Suggest a place</h2><p class="muted" style="margin-top:8px">Please log in or create a free account to suggest a resource. Every suggestion is reviewed before it appears on the map.</p><br><button class="btn" id="li">Log in / Sign up</button>'; $('#li').onclick = function () { go('account'); }; return; }
    S.picking = true;
    side.innerHTML = '<h2 style="font-size:1.2rem">Suggest a place</h2><p class="small muted">Suggestions are reviewed before they appear on the map.</p><form id="sf">' +
      '<label>Name *</label><input id="s_name" required maxlength="160"><label>Category *</label><select id="s_cat">' + S.cats.map(function (c) { return '<option value="' + h(c.slug) + '">' + h(c.name) + '</option>'; }).join('') + '</select>' +
      '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="s_free" style="width:auto"> This is free</label>' +
      '<label>Street address</label><input id="s_addr" maxlength="300"><label>Town</label><input id="s_town" maxlength="100" value="Falmouth">' +
      '<div class="row" style="margin-top:8px"><button type="button" class="btn ghost sm" id="geo">Find address on map</button><span class="small muted">or click the map to drop a pin</span></div>' +
      '<div class="row"><div style="flex:1"><label>Latitude *</label><input id="s_lat" required inputmode="decimal"></div><div style="flex:1"><label>Longitude *</label><input id="s_lng" required inputmode="decimal"></div></div>' +
      '<label>Hours</label><input id="s_hours" maxlength="500" placeholder="Mon–Fri 9am–5pm"><label>Phone</label><input id="s_phone" maxlength="40"><label>Website</label><input id="s_web" type="url" placeholder="https://">' +
      '<label>Description</label><textarea id="s_desc" rows="3" maxlength="3000"></textarea><br><br><button class="btn">Submit for review</button><div class="msg" id="sm"></div></form><div id="mine"></div>';
    $('#geo').onclick = async function () {
      var q = [$('#s_addr').value, $('#s_town').value, 'MA'].filter(Boolean).join(', ');
      msg($('#sm'), 'Looking up address…', true);
      try {
        var res = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=' + encodeURIComponent(q), { headers: { 'Accept': 'application/json' } });
        var d = await res.json(); if (!d.length) return msg($('#sm'), 'Address not found. Click the map to drop a pin instead.');
        setPick(+d[0].lat, +d[0].lon); map.flyTo([+d[0].lat, +d[0].lon], 16); msg($('#sm'), 'Found it. Drag the pin if it needs adjusting.', true);
      } catch (e) { msg($('#sm'), 'Address lookup failed. Click the map to drop a pin.'); }
    };
    $('#s_lat').onchange = $('#s_lng').onchange = function () { var a = parseFloat($('#s_lat').value), b = parseFloat($('#s_lng').value); if (isFinite(a) && isFinite(b)) setPick(a, b); };
    $('#sf').onsubmit = async function (e) {
      e.preventDefault();
      var lat = parseFloat($('#s_lat').value), lng = parseFloat($('#s_lng').value);
      if (!isFinite(lat) || !isFinite(lng)) return msg($('#sm'), 'Please set the location (find the address or click the map).');
      var web = $('#s_web').value.trim(); if (web && !/^https?:\/\//i.test(web)) return msg($('#sm'), 'Website must start with https://');
      var row = { name: $('#s_name').value.trim(), category: $('#s_cat').value, is_free: $('#s_free').checked, address: $('#s_addr').value.trim() || null, town: $('#s_town').value.trim() || null, lat: lat, lng: lng, hours: $('#s_hours').value.trim() || null, phone: $('#s_phone').value.trim() || null, website: web || null, description: $('#s_desc').value.trim() || null, submitted_by: S.user.id };
      var r = await sb.from('wellness_places').insert(row);
      if (r.error) return msg($('#sm'), r.error.message);
      clearPick(); await load(); showSubmit(); msg($('#sm'), 'Thank you! Your suggestion was sent for review.', true);
    };
    var mine = S.places.filter(function (p) { return p.submitted_by === S.user.id; });
    if (mine.length) $('#mine').innerHTML = '<h3 style="margin-top:18px;font-size:1rem">Your suggestions</h3>' + mine.map(function (p) { return '<div class="item small" style="cursor:default">' + h(p.name) + ' <span class="pill ' + h(p.status) + '">' + h(p.status) + '</span></div>'; }).join('');
  }

  // ---------- account ----------
  function showAccount() {
    if (S.user) {
      side.innerHTML = '<h2 style="font-size:1.2rem">Your account</h2><p class="muted">' + h(S.user.email) + (S.admin ? ' · <b>Admin</b>' : '') + '</p><br><button class="btn ghost" id="lo">Log out</button>';
      $('#lo').onclick = async function () { await sb.auth.signOut(); await refreshUser(); await load(); go('list'); }; return;
    }
    side.innerHTML = '<h2 style="font-size:1.2rem">Log in or sign up</h2><p class="small muted">A free account lets you suggest places and leave ratings.</p><div class="row" style="margin-top:10px"><button class="btn sm" id="tin">Log in</button><button class="btn ghost sm" id="tup">Create account</button></div>' +
      '<form id="af"><label>Email</label><input id="ae" type="email" required autocomplete="email"><label>Password</label><input id="ap" type="password" minlength="8" required autocomplete="current-password"><br><br><button class="btn" id="ago">Log in</button> <a href="#" id="fg" class="small">Forgot password?</a><div class="msg" id="am"></div></form>';
    var mode = 'in';
    function sm(m) { mode = m; $('#ago').textContent = m === 'in' ? 'Log in' : 'Create account'; $('#tin').className = 'btn sm' + (m === 'in' ? '' : ' ghost'); $('#tup').className = 'btn sm' + (m === 'up' ? '' : ' ghost'); }
    $('#tin').onclick = function () { sm('in'); }; $('#tup').onclick = function () { sm('up'); };
    $('#fg').onclick = async function (e) { e.preventDefault(); var em = $('#ae').value.trim(); if (!em) return msg($('#am'), 'Enter your email first.'); var r = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/map/' }); msg($('#am'), r.error ? r.error.message : 'Check your email for a reset link.', !r.error); };
    $('#af').onsubmit = async function (e) {
      e.preventDefault(); var em = $('#ae').value.trim(), pw = $('#ap').value;
      var r = mode === 'in' ? await sb.auth.signInWithPassword({ email: em, password: pw }) : await sb.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: location.origin + '/map/' } });
      if (r.error) return msg($('#am'), r.error.message);
      if (mode === 'up' && !r.data.session) return msg($('#am'), 'Check your email and click the confirmation link, then log in.', true);
      await refreshUser(); await load(); go('list');
    };
  }

  // ---------- admin ----------
  async function showAdmin() {
    if (!S.admin) return go('list');
    await load();
    var rv = await sb.from('wellness_reviews').select('*, wellness_places(name)').order('flagged', { ascending: false }).order('created_at', { ascending: false });
    var pend = S.places.filter(function (p) { return p.status === 'pending'; });
    side.innerHTML = '<h2 style="font-size:1.2rem">Admin</h2><h3 style="margin-top:12px;font-size:1rem">Pending places (' + pend.length + ')</h3>' +
      (pend.length ? pend.map(function (p) { return '<div class="box small"><b>' + h(p.name) + '</b> · ' + h(cat(p.category).name) + (p.is_free ? ' · free' : '') + '<div>' + h(p.address || '') + ' ' + h(p.town || '') + '</div><div class="muted">' + h(p.hours || '') + '</div><div>' + h(p.description || '') + '</div><div class="row" style="margin-top:6px"><button class="btn sm pa" data-id="' + h(p.id) + '" data-v="approved">Approve</button><button class="btn ghost sm pa" data-id="' + h(p.id) + '" data-v="rejected">Reject</button><button class="btn ghost sm pz" data-lat="' + p.lat + '" data-lng="' + p.lng + '">Show on map</button></div></div>'; }).join('') : '<p class="small muted">Nothing waiting.</p>') +
      '<h3 style="margin-top:14px;font-size:1rem">Live places (' + S.places.filter(function (p) { return p.status === 'approved'; }).length + ')</h3>' + S.places.filter(function (p) { return p.status === 'approved'; }).map(function (p) { return '<div class="row small" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:5px 0"><span>' + h(p.name) + '</span><button class="btn ghost sm pa" data-id="' + h(p.id) + '" data-v="rejected">Unpublish</button></div>'; }).join('') +
      '<h3 style="margin-top:14px;font-size:1rem">Comments (' + (rv.data || []).filter(function (r) { return r.flagged; }).length + ' reported)</h3>' +
      ((rv.data || []).map(function (r) { return '<div class="review small"><span class="stars">' + stars(r.rating) + '</span> <b>' + h(r.reviewer_name) + '</b> on ' + h(r.wellness_places ? r.wellness_places.name : '') + (r.flagged ? ' <span class="pill rejected">reported</span>' : '') + (r.hidden ? ' <span class="pill">hidden</span>' : '') + '<div>' + h(r.body || '') + '</div><div class="row"><button class="btn ghost sm rh" data-id="' + h(r.id) + '" data-h="' + (!r.hidden) + '">' + (r.hidden ? 'Unhide' : 'Hide') + '</button>' + (r.flagged ? '<button class="btn ghost sm rc" data-id="' + h(r.id) + '">Clear report</button>' : '') + '</div></div>'; }).join('') || '<p class="small muted">No comments yet.</p>');
    side.querySelectorAll('.pa').forEach(function (b) { b.onclick = async function () { b.disabled = true; var r = await sb.from('wellness_places').update({ status: b.dataset.v }).eq('id', b.dataset.id); if (r.error) alert(r.error.message); showAdmin(); }; });
    side.querySelectorAll('.pz').forEach(function (b) { b.onclick = function () { map.flyTo([+b.dataset.lat, +b.dataset.lng], 16); clearPick(); S.pickMarker = L.marker([+b.dataset.lat, +b.dataset.lng]).addTo(map); }; });
    side.querySelectorAll('.rh').forEach(function (b) { b.onclick = async function () { await sb.from('wellness_reviews').update({ hidden: b.dataset.h === 'true', flagged: false }).eq('id', b.dataset.id); showAdmin(); }; });
    side.querySelectorAll('.rc').forEach(function (b) { b.onclick = async function () { await sb.from('wellness_reviews').update({ flagged: false }).eq('id', b.dataset.id); showAdmin(); }; });
  }

  sb.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') { var p = prompt('Choose a new password (8+ characters)'); if (p) sb.auth.updateUser({ password: p }).then(function (r) { alert(r.error ? r.error.message : 'Password updated.'); }); } });
  refreshUser().then(load).then(function () { go(location.hash === '#suggest' ? 'submit' : 'list'); });
})();
