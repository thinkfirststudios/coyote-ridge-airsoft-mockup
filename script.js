// Coyote Ridge Airsoft — spec mockup
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // ---------- game days: rendered from game-days.js (one data block) ----------
  const fmtTime = '9:00 AM – 4:00 PM';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tbc = s => `<span class="tbc">[${esc(s)}]</span>`;
  const data = window.CR_GAME_DAYS || { upcoming: [], past: [] };
  $$('[data-gamedays]').forEach(list => {
    const which = list.dataset.gamedays;              // "upcoming" | "past"
    const limit = parseInt(list.dataset.limit || '99', 10);
    const rows = (data[which] || []).slice(0, limit);
    if (!rows.length) { list.innerHTML = `<li class="day day--past"><span class="day__name">${tbc('PAST EVENTS — ARCHIVE BUILDS AS GAME DAYS ARE RUN, CONFIRM')}</span></li>`; return; }
    list.innerHTML = rows.map(d => `
      <li class="day${which === 'past' ? ' day--past' : ''}">
        <div class="day__date">${d.date ? esc(d.date) : 'TBC'}${d.dateNote ? tbc(d.dateNote) : ''}</div>
        <div class="day__meta">
          <span class="day__name">${d.name ? esc(d.name) : ''}${d.nameNote ? ' ' + tbc(d.nameNote) : ''}</span>
          <span class="day__time">Scheduled game day · ${fmtTime}</span>
          ${d.note ? `<span class="tbc">${esc(d.note)}</span>` : ''}
        </div>
        ${which === 'upcoming' ? `<div class="day__act">
          <a class="btn btn--sm" href="#" data-todo="[RESERVE DESTINATION — CONFIRM]">Reserve <span class="arr">↑</span></a>
          <span class="price">[ADMISSION / EVENT ENTRY — NOT PUBLISHED, CLIENT TO SUPPLY]</span>
        </div>` : ''}
      </li>`).join('');
  });

  // ---------- header condense + header elevation strip progress ----------
  const head = $('.site-head');
  const strip = $('.head-strip .done');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    head && head.classList.toggle('is-condensed', y > 24);
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, y / max);
    if (strip) strip.style.strokeDashoffset = String(1 - p);
    if (!reduce) $$('[data-parallax]').forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      el.style.setProperty('--px', ((r.top + r.height / 2 - innerHeight / 2) * -0.08).toFixed(1) + 'px');
    });
    climb && climb(p);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // ---------- drawer ----------
  const drawer = $('#drawer');
  const setDrawer = open => {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('locked', open);
    $$('[aria-controls="drawer"]').forEach(b => b.setAttribute('aria-expanded', String(open)));
    if (open) $('.menu-btn', drawer).focus();
  };
  $$('[data-drawer-open]').forEach(b => b.addEventListener('click', () => setDrawer(true)));
  $$('[data-drawer-close]').forEach(b => b.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

  // ---------- reveals: rise and settle ----------
  const io = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add(en.target.classList.contains('profile') ? 'is-drawn' : 'is-in');
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }) : null;
  $$('.rise, .profile').forEach(el => io ? io.observe(el) : el.classList.add('is-in', 'is-drawn'));

  // ---------- desktop scroll indicator: a climbing marker on a vertical profile ----------
  let climb = null;
  const meter = $('.climbmeter');
  if (meter) {
    const secs = $$('[data-climb]');
    const pts = $$('.pt', meter);
    const me = $('.me', meter);
    const ln = $('.ln', meter);
    const L = ln.getTotalLength();
    climb = p => {
      const at = ln.getPointAtLength(L * (1 - p));       // bottom of the page = top of the ridge
      me.setAttribute('cx', at.x); me.setAttribute('cy', at.y);
      secs.forEach((s, i) => pts[i] && pts[i].classList.toggle('is-passed', s.getBoundingClientRect().top < innerHeight * 0.5));
    };
  }

  // ---------- rules: active section in the index (120ms, a reading aid) ----------
  const toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map(toc.map(a => [a.getAttribute('href').slice(1), a]));
    const tio = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { toc.forEach(a => a.classList.remove('is-active')); map.get(en.target.id)?.classList.add('is-active'); }
    }), { rootMargin: '-30% 0px -60% 0px' });
    $$('.rule-sec').forEach(s => tio.observe(s));
  }
  const jump = $('#jump');
  jump && jump.addEventListener('change', () => { if (jump.value) location.hash = jump.value; });

  // ---------- map: click to load (no third-party request until asked) ----------
  $$('[data-map]').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.map');
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(btn.dataset.map) + '&output=embed';
    f.title = 'Map: ' + btn.dataset.map; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    box.appendChild(f);
    btn.closest('.map__card').remove();
  }));

  // ---------- toast for mock links/forms ----------
  let t, tt;
  const toast = msg => {
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('is-on'), 3400);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-todo]');
    if (a) { e.preventDefault(); toast('Mockup — ' + a.dataset.todo); }
  });
  $$('form[data-mock]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); toast(f.dataset.mock); }));

  onScroll();
})();
