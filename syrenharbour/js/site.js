/* Syren Harbour site interactions: nav, scroll reveal, feature video sound, gallery carousel */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nt = document.getElementById('nt');
  document.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', function () { if (nt) nt.checked = false; }); });

  var nav = document.querySelector('.nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var sel = 'section h2, section .eyebrow, .lead, .food-grid article, .card, .pizza-grid > *, .near li, .visit-grid > *, .cgrid > *, .product, .about-txt, .feature, .slide';
  var els = Array.prototype.filter.call(document.querySelectorAll(sel), function (el) { return !el.closest('.hero'); });
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el, i) { el.classList.add('reveal'); el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });
  }

  var v = document.getElementById('featVid'), b = document.getElementById('featSnd');
  if (v && b) {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
    b.addEventListener('click', function () {
      v.muted = !v.muted;
      if (!v.muted) { v.currentTime = 0; v.play(); }
      b.setAttribute('aria-pressed', String(!v.muted));
      b.querySelector('span').textContent = v.muted ? 'Tap for sound' : 'Sound on';
      b.classList.toggle('on', !v.muted);
    });
  }

  var track = document.querySelector('.slides');
  if (track) {
    function step(dir) {
      var s = track.querySelector('.slide'); var w = s ? s.getBoundingClientRect().width + 18 : 300;
      track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
    }
    var p = document.querySelector('.car-prev'), n = document.querySelector('.car-next');
    if (p) p.addEventListener('click', function () { step(-1); });
    if (n) n.addEventListener('click', function () { step(1); });
  }
})();
