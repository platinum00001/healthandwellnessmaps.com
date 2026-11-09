(function () {
  'use strict';

  var CATS = [
    { id: 'seafood', name: 'Seafood & Clam Shacks', color: '#0284c7' },
    { id: 'cafe', name: 'Cafés & Breakfast', color: '#ca8a04' },
    { id: 'healthy', name: 'Healthy & Plant-Forward', color: '#16a34a' },
    { id: 'casual', name: 'Pizza & Casual', color: '#dc2626' },
    { id: 'fine', name: 'Fine Dining', color: '#7c3aed' },
    { id: 'bakery', name: 'Bakeries & Sweets', color: '#db2777' },
    { id: 'farm', name: 'Farms/Markets & Farm Stands', color: '#65a30d' },
    { id: 'brew', name: 'Breweries/Wineries', color: '#b45309' }
  ];

  // Real Falmouth-area places only. Coordinates from Nominatim (OpenStreetMap).
  // No invented hours, phones, or ratings.
  var PLACES = [
    { id: 'cape-island', name: 'Cape Island Café', cat: 'healthy', area: 'Homeport · Gifford St', lat: 41.562274, lng: -70.611104, web: 'https://capeislandcafe.com/', quest: true, trail: false },
    { id: 'seafood-sams', name: "Seafood Sam's", cat: 'seafood', area: 'Teaticket · Palmer Ave', lat: 41.562638, lng: -70.619480, web: 'https://www.seafoodsams.com/' },
    { id: 'raw-bar', name: 'Falmouth Raw Bar', cat: 'seafood', area: 'Harbor · Scranton Ave', lat: 41.552044, lng: -70.602432, web: 'http://www.falmouthrawbar.com/' },
    { id: 'flying-bridge', name: 'The Flying Bridge', cat: 'seafood', area: 'Harbor · Scranton Ave', lat: 41.547691, lng: -70.603983, web: 'https://www.flyingbridgerestaurant.com/' },
    { id: 'landfall', name: 'Landfall Restaurant', cat: 'seafood', area: 'Woods Hole', lat: 41.523682, lng: -70.670159, web: 'https://www.landfallwoodshole.com/' },
    { id: 'fishmonger', name: 'Fishmonger Café', cat: 'seafood', area: 'Woods Hole', lat: 41.524119, lng: -70.670154, web: '' },
    { id: 'pickle-jar', name: 'Pickle Jar Kitchen', cat: 'cafe', area: 'Main Street', lat: 41.552727, lng: -70.617084, web: '', trail: true, trailN: 2 },
    { id: 'coffee-obsession', name: 'Coffee Obsession', cat: 'cafe', area: 'Palmer Ave', lat: 41.570011, lng: -70.618011, web: 'https://www.coffeeobsession.com/' },
    { id: 'cape-cod-bagel', name: 'Cape Cod Bagel Co.', cat: 'cafe', area: 'Palmer Ave', lat: 41.565632, lng: -70.618142, web: '' },
    { id: 'crabapples', name: "Crabapple's", cat: 'cafe', area: 'Palmer Ave', lat: 41.567526, lng: -70.617085, web: '' },
    { id: 'black-dog', name: 'The Black Dog Heights Café', cat: 'cafe', area: 'Falmouth Heights', lat: 41.545521, lng: -70.601589, web: 'https://www.theblackdog.com/' },
    { id: 'maison', name: 'Maison Villatte', cat: 'bakery', area: 'Main Street', lat: 41.551983, lng: -70.615015, web: '', trail: true, trailN: 4 },
    { id: 'mary-ellen', name: "Mary Ellen's Portuguese Bakery", cat: 'bakery', area: 'Main Street / Teaticket', lat: 41.554265, lng: -70.600929, web: '' },
    { id: 'bean-cod', name: 'Bean & Cod', cat: 'bakery', area: 'Main Street', lat: 41.552839, lng: -70.617654, web: '', trail: true, trailN: 1 },
    { id: 'bourbon-butter', name: 'Bourbon & Butter Sugar Shed', cat: 'bakery', area: 'Main Street', lat: 41.554443, lng: -70.620812, web: '' },
    { id: 'pie-sky', name: 'Pie in the Sky', cat: 'bakery', area: 'Woods Hole', lat: 41.523363, lng: -70.668856, web: '' },
    { id: 'anejo', name: 'Añejo Mexican Bistro', cat: 'casual', area: 'Main Street', lat: 41.552576, lng: -70.616772, web: 'https://www.anejo.cc/', trail: true, trailN: 3 },
    { id: 'liam', name: "Liam Maguire's Irish Pub", cat: 'casual', area: 'Main Street', lat: 41.551931, lng: -70.614676, web: 'http://www.liammaguire.com/', trail: true, trailN: 5 },
    { id: 'quarterdeck', name: 'Quarterdeck Restaurant', cat: 'casual', area: 'Main Street', lat: 41.552747, lng: -70.617217, web: '' },
    { id: 'osteria', name: 'Osteria La Civetta', cat: 'fine', area: 'Main Street', lat: 41.552800, lng: -70.617596, web: 'https://www.osterialacivetta.com/' },
    { id: 'cucina', name: 'La Cucina Sul Mare', cat: 'fine', area: 'Main Street', lat: 41.552029, lng: -70.614613, web: 'https://www.lacucinasulmare.com/' },
    { id: 'glass-onion', name: 'The Glass Onion', cat: 'fine', area: 'North Main Street', lat: 41.555757, lng: -70.621735, web: '' },
    { id: 'siena', name: 'Siena Italian Restaurant', cat: 'fine', area: 'Highfield / Main area', lat: 41.557070, lng: -70.625558, web: '' },
    { id: 'coonamessett', name: 'Coonamessett Farm', cat: 'farm', area: 'East Falmouth · Hatchville', lat: 41.616722, lng: -70.578890, web: 'https://coonamessettfarm.com/' },
    { id: 'windfall', name: 'Windfall Market', cat: 'farm', area: 'Harbor · Scranton Ave', lat: 41.551452, lng: -70.603742, web: 'https://www.windfallmarket.com/' },
    { id: 'bad-martha', name: "Bad Martha Farmer's Brewery", cat: 'brew', area: 'East Falmouth', lat: 41.579182, lng: -70.542494, web: 'https://www.badmarthabeer.com/falmouth-brewery/' },
    { id: 'aquatic', name: 'Aquatic Brewing', cat: 'brew', area: 'Falmouth Village', lat: 41.552128, lng: -70.604851, web: 'https://www.aquaticbrewing.com/' },
    { id: 'syren-harbour', name: 'Syren Harbour', cat: 'seafood', area: 'Woods Hole (approx.)', lat: 41.5238, lng: -70.6698, web: '', websiteNote: 'Website coming soon', approx: true }
  ];

  // Verified recurring / annual Falmouth & Upper Cape food-related events.
  var EVENTS = [
    { id: 'ffm-thu', name: 'Falmouth Farmers Market (Thursday)', when: 'May–October · Thursdays', where: 'Marine Park, Scranton Ave', lat: 41.549114, lng: -70.603238, web: 'https://falmouthfarmersmarket.com/', note: 'Summer market overlooking Falmouth Harbor.' },
    { id: 'ffm-sun', name: 'Falmouth Farmers Market (Sunday)', when: 'August–November · Sundays', where: 'Mullen-Hall School lot', lat: 41.553982, lng: -70.613771, web: 'https://falmouthfarmersmarket.com/', note: 'Weekend pop-up market.' },
    { id: 'ffm-winter', name: 'Falmouth Winter Farmers Market', when: 'January–March · Sundays', where: 'Mullen-Hall School', lat: 41.553982, lng: -70.613771, web: 'https://falmouthfarmersmarket.com/', note: 'Indoor winter market.' },
    { id: 'food-truck-fest', name: 'Cape Cod Food Truck & Craft Beverage Festival', when: 'September', where: 'Cape Cod Fairgrounds, East Falmouth', lat: 41.618861, lng: -70.534272, web: 'https://www.foodtruckfestivalsofamerica.com/cape-cod', note: 'Annual food trucks and craft beverages at the fairgrounds.' },
    { id: 'taste-cape', name: 'Taste of Cape Cod', when: 'November', where: 'Sea Crest Beach Resort, North Falmouth', lat: 41.626003, lng: -70.639291, web: 'https://friendsofnobska.org/taste-of-cape-cod', note: 'Annual culinary fundraiser for Friends of Nobska Light.' },
    { id: 'oyster-sushi', name: 'Oyster & Sushi Festival', when: 'November', where: 'Flying Bridge Restaurant', lat: 41.547691, lng: -70.603983, web: 'https://www.flyingbridgerestaurant.com/', note: 'Annual oyster and sushi tasting on the harbor.' },
    { id: 'holidays-sea', name: 'Falmouth Holidays by the Sea · Village Holiday Stroll', when: 'Early December', where: 'Main Street & Queen’s Buy Way', lat: 41.5525, lng: -70.6165, web: 'https://www.capecodchamber.org/falmouth-chamber/events/falmouth-holidays-by-the-sea/', note: 'Festive dining and Main Street stroll during Holidays by the Sea weekend.' }
  ];

  // Food-focused things to do (verified).
  var ACTIVITIES = [
    { id: 'act-farm', name: 'Coonamessett Farm (visit & pick-your-own)', when: 'Seasonal', where: '277 Hatchville Rd, East Falmouth', lat: 41.616722, lng: -70.578890, web: 'https://coonamessettfarm.com/', note: 'Working farm, store, and seasonal pick-your-own.' },
    { id: 'act-market', name: 'Shop the Falmouth Farmers Market', when: 'Seasonal · see Events', where: 'Marine Park / Mullen-Hall', lat: 41.549114, lng: -70.603238, web: 'https://falmouthfarmersmarket.com/', note: 'Local produce, seafood, baked goods, and prepared foods.' },
    { id: 'act-fish', name: 'Patriot Party Boats (fishing charters)', when: 'Seasonal trips', where: 'Falmouth Harbor / Clinton Ave', lat: 41.543899, lng: -70.607105, web: 'https://www.patriotpartyboats.com/', note: 'Public fishing trips from Falmouth Harbor.' },
    { id: 'act-highfield', name: 'Highfield Hall culinary programs', when: 'Check calendar', where: '56 Highfield Drive', lat: 41.556960, lng: -70.626812, web: 'https://highfieldhallandgardens.org/events/category/culinary/list/', note: 'Occasional culinary classes and food programs.' },
    { id: 'act-windfall', name: 'Windfall Market (specialty foods)', when: 'Year-round retail', where: '77 Scranton Ave', lat: 41.551452, lng: -70.603742, web: 'https://www.windfallmarket.com/', note: 'Local specialty grocery and prepared foods near the harbor.' }
  ];

  var TRAIL = PLACES.filter(function (p) { return p.trail; }).sort(function (a, b) { return (a.trailN || 0) - (b.trailN || 0); });
  var LS_KEY = 'cq_passport_v1';

  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cat(id) { return CATS.find(function (c) { return c.id === id; }) || { name: id, color: '#b45309' }; }
  function loadStamps() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveStamps(o) { try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {} }

  var S = {
    cat: '',
    q: '',
    layers: { restaurants: true, events: true, activities: true },
    markers: {},
    stamps: loadStamps()
  };

  var map = L.map('map', { zoomControl: true }).setView([41.555, -70.615], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  function pinIcon(color, star) {
    if (star) {
      return L.divIcon({
        className: '',
        html: '<div class="pin star" style="background:' + h(color) + '">★</div>',
        iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14]
      });
    }
    return L.divIcon({
      className: '',
      html: '<div class="pin" style="background:' + h(color) + '"></div>',
      iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24]
    });
  }

  function visiblePlaces() {
    var q = S.q.toLowerCase();
    return PLACES.filter(function (p) {
      if (S.cat && p.cat !== S.cat) return false;
      if (!q) return true;
      return (p.name + ' ' + p.area + ' ' + cat(p.cat).name).toLowerCase().indexOf(q) >= 0;
    });
  }

  function popupPlace(p) {
    var c = cat(p.cat);
    var bits = '<b>' + h(p.name) + '</b>';
    if (p.quest) bits += ' <span style="color:#b45309;font-weight:800">· Quest Stop #1</span>';
    bits += '<br><span style="color:#78716c">' + h(c.name) + ' · ' + h(p.area) + '</span>';
    if (p.web) bits += '<br><a href="' + h(p.web) + '" target="_blank" rel="noopener">Website ↗</a>';
    else if (p.websiteNote) bits += '<br><span style="color:#78716c">' + h(p.websiteNote) + '</span>';
    if (p.approx) bits += '<br><span style="font-size:11px;color:#a8a29e">Pin approximate</span>';
    bits += '<br><span style="font-size:11px;color:#a8a29e">Preview listing — details being verified</span>';
    return bits;
  }
  function popupEvent(e) {
    return '<b>' + h(e.name) + '</b><br><span style="color:#b45309;font-weight:700">' + h(e.when) + '</span><br>' +
      h(e.where) + '<br><span style="color:#78716c">' + h(e.note) + '</span>' +
      (e.web ? '<br><a href="' + h(e.web) + '" target="_blank" rel="noopener">Event info ↗</a>' : '');
  }
  function popupAct(a) {
    return '<b>' + h(a.name) + '</b><br><span style="color:#0f766e;font-weight:700">' + h(a.when) + '</span><br>' +
      h(a.where) + '<br><span style="color:#78716c">' + h(a.note) + '</span>' +
      (a.web ? '<br><a href="' + h(a.web) + '" target="_blank" rel="noopener">Learn more ↗</a>' : '');
  }

  function clearMarkers() {
    Object.keys(S.markers).forEach(function (k) { map.removeLayer(S.markers[k]); });
    S.markers = {};
  }

  function drawMarkers() {
    clearMarkers();
    if (S.layers.restaurants) {
      visiblePlaces().forEach(function (p) {
        var m = L.marker([p.lat, p.lng], {
          icon: pinIcon(cat(p.cat).color, !!p.quest),
          title: p.name,
          zIndexOffset: p.quest ? 1000 : 0
        }).addTo(map);
        m.bindPopup(popupPlace(p));
        m.on('click', function () { focusPlace(p.id, false); });
        S.markers['p:' + p.id] = m;
      });
    }
    if (S.layers.events) {
      EVENTS.forEach(function (e) {
        var m = L.marker([e.lat, e.lng], {
          icon: pinIcon('#7c2d12', false),
          title: e.name
        }).addTo(map);
        m.bindPopup(popupEvent(e));
        S.markers['e:' + e.id] = m;
      });
    }
    if (S.layers.activities) {
      ACTIVITIES.forEach(function (a) {
        var m = L.marker([a.lat, a.lng], {
          icon: pinIcon('#0f766e', false),
          title: a.name
        }).addTo(map);
        m.bindPopup(popupAct(a));
        S.markers['a:' + a.id] = m;
      });
    }
  }

  function focusPlace(id, fly) {
    var p = PLACES.find(function (x) { return x.id === id; });
    if (!p) return;
    var key = 'p:' + id;
    if (fly !== false) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 15), { duration: 0.55 });
    if (S.markers[key]) S.markers[key].openPopup();
    // highlight in list
    var el = document.querySelector('[data-place="' + id + '"]');
    if (el) {
      document.querySelectorAll('[data-place]').forEach(function (n) { n.style.background = ''; });
      el.style.background = '#ffedd5';
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function renderPassport() {
    var stamps = S.stamps;
    var got = TRAIL.filter(function (p) { return stamps[p.id]; }).length;
    return '<div class="quest-box" id="passport">' +
      '<h3>Quest passport · Main Street Lunch Trail</h3>' +
      '<p class="small muted">5 stops · mock check-in (QR demo). Stamps stay on this device only.</p>' +
      '<div class="stamps">' + TRAIL.map(function (p) {
        var on = !!stamps[p.id];
        return '<div class="stamp ' + (on ? 'got' : '') + '" title="' + h(p.name) + '"><span class="n">' + (on ? '✓' : p.trailN) + '</span>' + h(p.name.split(' ')[0]) + '</div>';
      }).join('') + '</div>' +
      '<p class="small" style="margin:6px 0 10px"><b>' + got + ' / 5</b> stamps collected</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
      '<button type="button" class="btn sm" id="mock-checkin">Mock / QR check-in</button>' +
      '<button type="button" class="btn ghost sm" id="reset-stamps">Reset stamps</button>' +
      '</div>' +
      '<p class="small muted" style="margin-top:8px">Demo only — no real check-ins yet. Featured stop: <a href="#" id="goto-cape">Cape Island Café · Quest Stop #1</a>.</p>' +
      '</div>';
  }

  function renderPartner() {
    return '<div class="partner-box">' +
      '<h3>Restaurant Exchange Program</h3>' +
      '<p class="small muted">Coming soon — partner with us to swap staff meals, feature on Culinary Quest trails, and reach more Falmouth diners.</p>' +
      '<p style="margin-top:10px"><a class="btn sm teal" href="mailto:healthandwellnessmapllc@gmail.com?subject=Restaurant%20Exchange%20Program%20-%20partner%20interest">Partner with us</a></p>' +
      '</div>';
  }

  function render() {
    var panel = document.getElementById('panel');
    var v = visiblePlaces();
    panel.innerHTML =
      '<h1>Culinary Quest — Falmouth\'s Food Map</h1>' +
      '<p class="tagline">Eat. Explore. Earn stamps.</p>' +
      '<div class="note"><strong>Preview.</strong> Restaurant listings are being verified. We show name, category, area, and a website when confirmed — not hours, phones, or ratings.</div>' +
      renderPassport() +
      renderPartner() +
      '<div class="section-label">Layers</div>' +
      '<div class="layer-toggles">' +
      '<button type="button" class="layer ' + (S.layers.restaurants ? 'on' : '') + '" data-layer="restaurants">Restaurants (' + PLACES.length + ')</button>' +
      '<button type="button" class="layer ' + (S.layers.events ? 'on' : '') + '" data-layer="events">Festivals &amp; events (' + EVENTS.length + ')</button>' +
      '<button type="button" class="layer ' + (S.layers.activities ? 'on' : '') + '" data-layer="activities">Things to do (' + ACTIVITIES.length + ')</button>' +
      '</div>' +
      '<div class="section-label">Categories</div>' +
      '<div class="chips"><button type="button" class="chip ' + (!S.cat ? 'on' : '') + '" data-c="">All</button>' +
      CATS.map(function (c) {
        var n = PLACES.filter(function (p) { return p.cat === c.id; }).length;
        return '<button type="button" class="chip ' + (S.cat === c.id ? 'on' : '') + '" data-c="' + h(c.id) + '"><i style="background:' + h(c.color) + '"></i>' + h(c.name) + ' (' + n + ')</button>';
      }).join('') + '</div>' +
      '<input class="search" id="q" placeholder="Search restaurants…" value="' + h(S.q) + '" aria-label="Search restaurants">' +
      '<div class="section-label">Restaurants · ' + v.length + '</div>' +
      '<div id="list">' + (v.length ? v.map(function (p) {
        var c = cat(p.cat);
        return '<div class="item" data-place="' + h(p.id) + '"><b>' + h(p.name) +
          (p.quest ? '<span class="badge">Quest #1</span>' : '') +
          (p.trail ? '<span class="badge" style="background:#78716c">Trail ' + p.trailN + '</span>' : '') +
          '</b><div class="meta"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + h(c.color) + ';margin-right:4px"></i>' +
          h(c.name) + ' · ' + h(p.area) + (p.web ? ' · <a href="' + h(p.web) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">site</a>' : (p.websiteNote ? ' · ' + h(p.websiteNote) : '')) +
          '</div></div>';
      }).join('') : '<p class="muted small" style="margin-top:8px">No restaurants match.</p>') + '</div>' +
      '<div class="section-label">Festivals &amp; events</div>' +
      EVENTS.map(function (e) {
        return '<div class="item" data-event="' + h(e.id) + '"><b>' + h(e.name) + '</b><div class="meta">' + h(e.when) + ' · ' + h(e.where) + '</div></div>';
      }).join('') +
      '<div class="section-label">Things to do with food</div>' +
      ACTIVITIES.map(function (a) {
        return '<div class="item" data-act="' + h(a.id) + '"><b>' + h(a.name) + '</b><div class="meta">' + h(a.when) + ' · ' + h(a.where) + '</div></div>';
      }).join('');

    // wire filters
    panel.querySelectorAll('.chip').forEach(function (b) {
      b.onclick = function () { S.cat = b.dataset.c; drawMarkers(); render(); };
    });
    panel.querySelectorAll('.layer').forEach(function (b) {
      b.onclick = function () {
        S.layers[b.dataset.layer] = !S.layers[b.dataset.layer];
        drawMarkers(); render();
      };
    });
    var q = document.getElementById('q');
    q.oninput = function () { S.q = q.value; drawMarkers(); renderKeepFocus(q); };
    panel.querySelectorAll('[data-place]').forEach(function (el) {
      el.onclick = function () { focusPlace(el.dataset.place, true); };
    });
    panel.querySelectorAll('[data-event]').forEach(function (el) {
      el.onclick = function () {
        var e = EVENTS.find(function (x) { return x.id === el.dataset.event; });
        if (!e) return;
        map.flyTo([e.lat, e.lng], 15, { duration: 0.5 });
        if (S.markers['e:' + e.id]) S.markers['e:' + e.id].openPopup();
      };
    });
    panel.querySelectorAll('[data-act]').forEach(function (el) {
      el.onclick = function () {
        var a = ACTIVITIES.find(function (x) { return x.id === el.dataset.act; });
        if (!a) return;
        map.flyTo([a.lat, a.lng], 15, { duration: 0.5 });
        if (S.markers['a:' + a.id]) S.markers['a:' + a.id].openPopup();
      };
    });

    var gc = document.getElementById('goto-cape');
    if (gc) gc.onclick = function (ev) { ev.preventDefault(); focusPlace('cape-island', true); };

    var check = document.getElementById('mock-checkin');
    if (check) check.onclick = function () {
      var next = TRAIL.find(function (p) { return !S.stamps[p.id]; });
      if (!next) {
        alert('Trail complete — all 5 Main Street Lunch Trail stamps are on this device. Reset to try again.');
        return;
      }
      if (!confirm('Mock / QR check-in at:\n\n' + next.name + '\n\nThis is a demo. No real visit is recorded. Add stamp #' + next.trailN + '?')) return;
      S.stamps[next.id] = Date.now();
      saveStamps(S.stamps);
      focusPlace(next.id, true);
      render();
    };
    var reset = document.getElementById('reset-stamps');
    if (reset) reset.onclick = function () {
      if (!confirm('Clear all stamps on this device?')) return;
      S.stamps = {}; saveStamps(S.stamps); render();
    };
  }

  function renderKeepFocus(input) {
    var val = input.value, start = input.selectionStart;
    render();
    var q2 = document.getElementById('q');
    if (q2) { q2.focus(); q2.setSelectionRange(start, start); }
  }

  // mobile bottom sheet
  var side = document.getElementById('side');
  var toggle = document.getElementById('sheet-toggle');
  function setSheet(open) {
    side.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setSheet(!side.classList.contains('open')); });
  toggle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheet(!side.classList.contains('open')); }
  });
  document.getElementById('nav-passport').onclick = function () {
    setSheet(true);
    var p = document.getElementById('passport');
    if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  drawMarkers();
  render();
  var pts = PLACES.map(function (p) { return [p.lat, p.lng]; });
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
})();
