(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = s => { try { const u = new URL(s, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const initial = n => (n || 'F').trim()[0].toUpperCase();
const base = () => location.origin + location.pathname;
const profileUrl = e => base() + '?id=' + encodeURIComponent(e.id);
const digits = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? '91' + d : d; };

let employees = [];
let qrEmployee = null;
let heroIndex = 0, heroTimer = null;

/* ---------- Shared pieces ---------- */
function photo(e) {
  const parts = Array.isArray(e.photoParts) ? e.photoParts.filter(x => typeof x === 'string' && x.trim()) : [];
  if (parts.length) return `<img data-photo-parts="${esc(JSON.stringify(parts))}" data-fallback-initial="${esc(initial(e.name))}" alt="${esc(e.name)}" loading="lazy" decoding="async">`;
  const p = e.photo ? safeUrl(e.photo) : '';
  return p ? `<img src="${esc(p)}" alt="${esc(e.name)}" loading="lazy" decoding="async">`
           : `<div class="ph" role="img" aria-label="${esc(e.name)}"><span>${esc(initial(e.name))}</span></div>`;
}
async function hydratePhotoParts(root = document) {
  const imgs = $$('img[data-photo-parts]', root);
  await Promise.all(imgs.map(async img => {
    if (img.dataset.hydrating === '1') return;
    img.dataset.hydrating = '1';
    try {
      const paths = JSON.parse(img.dataset.photoParts || '[]');
      if (!Array.isArray(paths) || !paths.length) throw new Error('Missing image parts');
      const chunks = await Promise.all(paths.map(async path => {
        const url = new URL(path, location.href);
        if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) throw new Error('Image asset must be same-origin');
        const response = await fetch(url.href, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Image part unavailable: ${path}`);
        return response.text();
      }));
      const base64 = chunks.join('').replace(/\s/g, '');
      const mime = base64.startsWith('UklGR') ? 'image/webp' : base64.startsWith('/9j/') ? 'image/jpeg' : '';
      if (!mime || base64.length < 1000) throw new Error('Incomplete or unsupported image data');
      img.src = `data:${mime};base64,${base64}`;
      if (img.decode) await img.decode();
      img.removeAttribute('data-photo-parts');
      img.classList.add('is-loaded');
    } catch (err) {
      console.error('FYND ADZ image could not load:', err);
      const initialText = img.dataset.fallbackInitial;
      if (initialText) {
        const fallback = document.createElement('div');
        fallback.className = 'ph'; fallback.setAttribute('role', 'img');
        fallback.setAttribute('aria-label', img.alt || 'Employee portrait');
        const letter = document.createElement('span'); letter.textContent = initialText;
        fallback.appendChild(letter); img.replaceWith(fallback);
      } else {
        img.style.visibility = 'hidden';
      }
    }
  }));
}
function bars(id) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let out = '';
  for (let i = 0; i < 34; i++) { h = (h * 1664525 + 1013904223) >>> 0; out += `<i style="height:${6 + (h % 13)}px;width:${1 + (h >> 8) % 3}px"></i>`; }
  return out;
}
function idCard(e, big) {
  return `<div class="idc-tilt${big ? ' idc-lg' : ''}" tabindex="0" role="button" aria-label="ID card of ${esc(e.name)}. Press to flip.">
    <div class="idc-flip">
      <div class="idc-face front">
        <div class="idc-top"><img src="./assets/brand/fynd-adz-symbol.png" alt=""><span>Team member</span></div>
        <div class="idc-photo">${photo(e)}<span class="idc-scan"></span></div>
        <div class="idc-info">
          <div class="idc-name">${esc(e.name)}</div>
          <div class="idc-role">${esc(e.role)}</div>
          <div class="idc-id"><span>${esc(e.id)}</span><span class="idc-bars">${bars(e.id)}</span></div>
        </div>
        <div class="idc-holo"></div>
      </div>
      <div class="idc-face back">
        <div class="idc-qr" data-qr="${esc(profileUrl(e))}"></div>
        <div class="back-id">${esc(e.id)}</div>
        <p class="back-note">Scan to open ${esc(e.name.split(' ')[0])}’s profile</p>
        <div class="idc-holo"></div>
      </div>
    </div>
  </div>`;
}
function makeQR(el, text, size = 200) {
  if (!el) return false;
  el.innerHTML = '';
  if (typeof QRCode === 'undefined') { el.innerHTML = '<span style="color:#222;font:13px sans-serif;line-height:1.4;display:block;padding:20px">QR needs an internet connection.</span>'; return false; }
  new QRCode(el, { text, width: size, height: size, colorDark: '#0a0612', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
  return true;
}
function fillQrs(root) { $$('[data-qr]', root).forEach(el => { if (!el.firstChild) makeQR(el, el.dataset.qr, 380); }); }

/* ---------- Motion helpers ---------- */
function tilt(el, max = 12) {
  if (!fine || reduce) return;
  el.addEventListener('pointermove', ev => {
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    el.style.setProperty('--ry', ((x - .5) * 2 * max).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((.5 - y) * 2 * max).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    el.classList.add('is-tilt');
  });
  el.addEventListener('pointerleave', () => {
    el.classList.remove('is-tilt');
    ['--rx', '--ry'].forEach(p => el.style.setProperty(p, '0deg'));
    el.style.setProperty('--mx', '50%'); el.style.setProperty('--my', '30%');
  });
}
function magnet(el) {
  if (!fine || reduce) return;
  el.addEventListener('pointermove', ev => {
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - (r.left + r.width / 2)) * .22, y = (ev.clientY - (r.top + r.height / 2)) * .3;
    el.style.transform = `translate(${x}px,${y}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}
let io;
function reveal(root = document) {
  const items = $$('.rv:not(.in)', root);
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('in')); return; }
  io = io || new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(i => io.observe(i));
}
function splitChars(el) {
  const t = el.textContent; el.textContent = '';
  [...t].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); });
}
function letterField(zone) {
  if (!fine || reduce) return;
  const chars = $$('.ch', zone);
  let mx = -999, my = -999, raf = 0;
  const frame = () => {
    raf = 0;
    chars.forEach(c => {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
      const p = clamp(1 - d / 170, 0, 1);
      c.style.setProperty('--p', p.toFixed(2));
    });
  };
  zone.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(frame); });
  zone.addEventListener('pointerleave', () => { mx = my = -999; frame(); });
}
function wipeTo(cb) {
  const w = $('#wipe');
  if (reduce || !w.animate) { cb(); return; }
  w.animate([{ transform: 'translateX(-120%) skewX(-14deg)' }, { transform: 'translateX(0) skewX(-14deg)' }], { duration: 520, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' })
    .finished.then(() => {
      cb();
      return w.animate([{ transform: 'translateX(0) skewX(-14deg)' }, { transform: 'translateX(120%) skewX(-14deg)' }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
    }).then(() => { w.getAnimations().forEach(a => a.cancel()); });
}

/* ---------- Intro ---------- */
function intro(skip) {
  const el = $('#intro');
  const go = () => { document.body.classList.remove('is-loading'); document.body.classList.add('ready'); };
  if (skip || reduce) { el.remove(); go(); return; }
  const out = $('#introCount'); const t0 = performance.now(), dur = 1500;
  const tick = now => {
    const p = clamp((now - t0) / dur, 0, 1);
    out.textContent = Math.round(1 - Math.pow(1 - p, 3) === 1 ? 100 : (1 - Math.pow(1 - p, 3)) * 100);
    if (p < 1) requestAnimationFrame(tick);
    else { el.classList.add('done'); go(); setTimeout(() => el.remove(), 1300); }
  };
  requestAnimationFrame(tick);
}

/* ---------- Hero ---------- */
function heroCard(i, first) {
  const e = employees[i]; if (!e) return;
  const holder = $('#heroCard');
  holder.innerHTML = idCard(e);
  hydratePhotoParts(holder);
  const card = $('.idc-tilt', holder);
  if (!first) card.classList.add('swap');
  tilt(card, 14);
  const photoH = $('.idc-photo', card); if (photoH) card.style.setProperty('--h', photoH.offsetHeight + 'px');
  fillQrs(card);
  card.addEventListener('click', () => { card.classList.toggle('flipped'); $('#stageHint').textContent = card.classList.contains('flipped') ? 'Tap again to flip back' : 'Tap the card to flip it'; });
  card.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); card.click(); } });
  card.addEventListener('pointerenter', () => clearInterval(heroTimer));
  card.addEventListener('pointerleave', startHeroCycle);
}
function startHeroCycle() {
  clearInterval(heroTimer);
  if (reduce || employees.length < 2) return;
  heroTimer = setInterval(() => {
    const c = $('#heroCard .idc-tilt');
    if (c && c.classList.contains('flipped')) return;
    heroIndex = (heroIndex + 1) % employees.length; heroCard(heroIndex);
  }, 4200);
}

/* ---------- Marquees ---------- */
const WORDS = ['Creative minds', 'Digital thinkers', 'Bold ideas', 'Meaningful impact', 'Made to be found'];
function marquees() {
  const make = el => { const t = $('.mtrack', el); const html = WORDS.map(w => `<span>${w}</span>`).join(''); t.innerHTML = html + html + html + html; return t; };
  const rows = [{ el: $('#m1'), dir: 1, x: 0 }, { el: $('#m2'), dir: -1, x: 0 }].map(r => { r.t = make(r.el); r.w = 0; return r; });
  const measure = () => rows.forEach(r => { r.w = r.t.scrollWidth / 2; if (r.dir < 0) r.x = -r.w / 2; });
  measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure);
  if (reduce) return;
  let last = scrollY, vel = 0;
  const loop = () => {
    const dy = scrollY - last; last = scrollY; vel += (dy - vel) * .12;
    rows.forEach(r => {
      r.x -= r.dir * (1.1 + Math.abs(vel) * .35);
      if (r.x <= -r.w) r.x += r.w; if (r.x > 0) r.x -= r.w;
      r.t.style.transform = `translate3d(${r.x}px,0,0) skewX(${clamp(-vel * .35, -12, 12)}deg)`;
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- Directory ---------- */
let dept = '';
function active() { return employees.filter(e => (e.status || 'Active') !== 'Inactive'); }
function renderChips() {
  const deps = [...new Set(active().map(e => e.department).filter(Boolean))].sort();
  $('#chips').innerHTML = ['All', ...deps].map(d => `<button class="chip" type="button" aria-pressed="${(d === 'All' ? '' : d) === dept}" data-d="${esc(d === 'All' ? '' : d)}">${esc(d)}</button>`).join('');
  $$('#chips .chip').forEach(b => b.onclick = () => { dept = b.dataset.d; renderChips(); renderGrid(); });
}
function renderGrid() {
  const q = $('#searchInput').value.trim().toLowerCase();
  const list = active().filter(e => (!dept || e.department === dept) && [e.name, e.role, e.id, e.department].join(' ').toLowerCase().includes(q));
  $('#countNum').textContent = list.length;
  $('#countLabel').textContent = list.length === 1 ? 'team member' : 'team members';
  const grid = $('#grid');
  if (!list.length) { grid.innerHTML = '<p class="empty">No one matches that search. Clear it or pick another department.</p>'; return; }
  grid.innerHTML = list.map((e, i) => `
    <div class="tcard" style="--d:${i * 110}ms" data-id="${esc(e.id)}">
      <div class="tcard-inner">
        <div class="tcard-media">${photo(e)}</div>
        <div class="tcard-glare"></div>
        <span class="tcard-id">${esc(e.id)}</span>
        <div class="tcard-info"><h3 class="tcard-name">${esc(e.name)}</h3><p class="tcard-role">${esc(e.role)}</p><span class="tcard-dept">${esc(e.department || 'FYND ADZ')}</span></div>
        <span class="tcard-go" aria-hidden="true">↗</span>
        <a class="tcard-link" href="?id=${encodeURIComponent(e.id)}" data-open="${esc(e.id)}" data-cur="View" aria-label="Open profile of ${esc(e.name)}"></a>
      </div>
      <button class="tcard-qr" type="button" data-qr-open="${esc(e.id)}" aria-label="Show QR code for ${esc(e.name)}">QR code</button>
    </div>`).join('');
  hydratePhotoParts(grid);
  $$('.tcard', grid).forEach(c => tilt(c, 9));
  $$('[data-qr-open]', grid).forEach(b => b.onclick = ev => { ev.stopPropagation(); openQr(b.dataset.qrOpen); });
  revealCards(grid);
  bindCursor(grid);
}
function revealCards(grid) {
  const cards = $$('.tcard', grid);
  const show = () => cards.forEach(c => c.classList.add('in'));
  if (reduce || !('IntersectionObserver' in window)) { show(); return; }
  if (grid.getBoundingClientRect().top < innerHeight * .85) { requestAnimationFrame(() => requestAnimationFrame(show)); return; }
  const o = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { show(); o.disconnect(); } }, { threshold: .08 });
  o.observe(grid);
}

/* ---------- Profile ---------- */
function showProfile(id, push = true) {
  const e = employees.find(x => x.id === id);
  const apply = () => {
    $('#home').classList.add('hidden');
    const v = $('#profileView'); v.classList.remove('hidden');
    document.body.classList.add('ready');
    renderProfile(e, id);
    scrollTo(0, 0);
    if (push) history.pushState({ id }, '', '?id=' + encodeURIComponent(id));
    document.title = (e ? e.name + ' | ' : '') + 'FYND ADZ';
    clearInterval(heroTimer);
  };
  push ? wipeTo(apply) : apply();
}
function renderProfile(e, id) {
  const v = $('#profileView');
  if (!e) {
    v.innerHTML = `<div class="notfound"><h2>Profile not found</h2><p>No team member has the ID ${esc(id)}. Check the link or go back to the team.</p><a class="btn btn-solid" href="./" data-home>Back to the team</a></div>`;
    bindNav(v); return;
  }
  const list = active(); const idx = list.findIndex(x => x.id === e.id);
  const prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
  const wa = digits(e.phone);
  const rows = [['ID', esc(e.id)], ['Department', esc(e.department)],
    e.phone && ['Phone', `<a href="tel:+${wa}">${esc(e.phone)}</a>`],
    e.email && ['Email', `<a href="mailto:${esc(e.email)}">${esc(e.email)}</a>`],
    e.website && safeUrl(e.website) && ['Website', `<a href="${esc(safeUrl(e.website))}" target="_blank" rel="noopener">${esc(e.website.replace(/^https?:\/\//, ''))}</a>`],
    e.instagram && safeUrl(e.instagram) && ['Instagram', `<a href="${esc(safeUrl(e.instagram))}" target="_blank" rel="noopener">${esc(e.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/[/?].*$/, ''))}</a>`],
    e.linkedin && safeUrl(e.linkedin) && ['LinkedIn', `<a href="${esc(safeUrl(e.linkedin))}" target="_blank" rel="noopener">View profile</a>`]
  ].filter(r => r && r[1]);
  const acts = [];
  if (e.phone) { acts.push(`<a class="btn btn-solid mag" href="tel:+${wa}">Call</a>`); acts.push(`<a class="btn btn-ghost mag" target="_blank" rel="noopener" href="https://wa.me/${wa}">WhatsApp</a>`); }
  if (e.email) acts.push(`<a class="btn btn-ghost mag" href="mailto:${esc(e.email)}">Email</a>`);
  acts.push(`<button class="btn btn-ghost mag" id="saveContact" type="button">Save contact</button>`);
  acts.push(`<button class="btn btn-ghost mag" id="profileQr" type="button">QR code</button>`);
  v.innerHTML = `
    <a class="back" href="./" data-home>← All team members</a>
    <div class="pgrid">
      <div class="pcard-col p-enter">${idCard(e, true)}<p class="hint">Tap the card to flip it and see the QR code</p></div>
      <div class="pinfo">
        <p class="p-role p-enter" style="animation-delay:.2s">${esc(e.role)}${e.department ? ' · ' + esc(e.department) : ''}</p>
        <h1 class="p-name"><span class="line"><span class="line-in">${esc(e.name)}</span></span></h1>
        ${e.bio ? `<p class="p-bio p-enter" style="animation-delay:.35s">${esc(e.bio)}</p>` : ''}
        <dl class="p-list p-enter" style="animation-delay:.45s">${rows.map(r => `<div class="p-row"><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>
        <div class="p-actions p-enter" style="animation-delay:.55s">${acts.join('')}</div>
      </div>
    </div>
    ${list.length > 1 ? `<nav class="p-next" aria-label="Other team members">
      <a href="?id=${encodeURIComponent(prev.id)}" data-open="${esc(prev.id)}">← Previous<b>${esc(prev.name)}</b></a>
      <a class="nx" href="?id=${encodeURIComponent(next.id)}" data-open="${esc(next.id)}">Next →<b>${esc(next.name)}</b></a></nav>` : ''}`;
  hydratePhotoParts(v);
  const card = $('.idc-tilt', v);
  tilt(card, 12);
  const ph = $('.idc-photo', card); card.style.setProperty('--h', (ph ? ph.offsetHeight : 300) + 'px');
  fillQrs(card);
  card.addEventListener('click', () => card.classList.toggle('flipped'));
  card.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); card.click(); } });
  requestAnimationFrame(() => requestAnimationFrame(() => $('.p-name', v).classList.add('go')));
  $('#saveContact', v).onclick = () => downloadVCard(e);
  $('#profileQr', v).onclick = () => openQr(e.id);
  $$('.mag', v).forEach(magnet);
  bindNav(v); bindCursor(v);
}
function goHome(push = true, section) {
  const apply = () => {
    $('#profileView').classList.add('hidden'); $('#home').classList.remove('hidden');
    document.title = 'FYND ADZ | Meet the team';
    if (push) history.pushState({}, '', location.pathname);
    scrollTo(0, 0);
    if (section) setTimeout(() => $('#' + section)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 60);
    heroCard(heroIndex, true); startHeroCycle(); reveal();
  };
  const onProfile = !$('#profileView').classList.contains('hidden');
  onProfile ? wipeTo(apply) : apply();
}
function bindNav(root) {
  $$('[data-home]', root).forEach(a => a.onclick = ev => { ev.preventDefault(); goHome(); });
  $$('[data-open]', root).forEach(a => a.onclick = ev => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); showProfile(a.dataset.open); });
}

/* ---------- QR modal + vCard ---------- */
function openQr(id) {
  const e = employees.find(x => x.id === id); if (!e) return;
  qrEmployee = e;
  $('#qrTitle').textContent = e.name;
  $('#qrLink').textContent = profileUrl(e);
  makeQR($('#qrStage'), profileUrl(e), 460);
  const m = $('#qrModal'); m.hidden = false; $('#qrClose').focus();
}
function closeQr() { $('#qrModal').hidden = true; }
function downloadQr() {
  const c = $('#qrStage canvas'), i = $('#qrStage img');
  const url = c ? c.toDataURL('image/png') : i && i.src; if (!url) return;
  const a = document.createElement('a'); a.href = url; a.download = (qrEmployee?.id || 'employee') + '-QR.png'; a.click();
}
async function copyQr() {
  const s = $('#qrLink').textContent, b = $('#copyQr');
  try { await navigator.clipboard.writeText(s); b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy profile link', 1600); } catch { prompt('Copy profile link:', s); }
}
function downloadVCard(e) {
  const c = s => String(s || '').replace(/[\r\n;]/g, ' ');
  const v = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + c(e.name), 'ORG:FYND ADZ', 'TITLE:' + c(e.role),
    e.phone ? 'TEL;TYPE=CELL:+' + digits(e.phone) : '', e.email ? 'EMAIL:' + c(e.email) : '',
    'URL:' + profileUrl(e), 'END:VCARD'].filter(Boolean).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([v], { type: 'text/vcard' }));
  a.download = e.id + '.vcf'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

/* ---------- Cursor ---------- */
let cursorReady = false;
function bindCursor(root = document) {
  if (!fine || reduce) return;
  const cur = $('#cursor'), lab = $('#cursorLabel');
  if (!cursorReady) {
    cursorReady = true;
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('show'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('show'));
    (function loop() { x += (tx - x) * .2; y += (ty - y) * .2; cur.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop); })();
  }
  $$('[data-cur]', root).forEach(el => { el.onpointerenter = () => { lab.textContent = el.dataset.cur; cur.classList.add('big'); }; el.onpointerleave = () => cur.classList.remove('big'); });
  $$('a,button,.idc-tilt', root).forEach(el => { if (el.hasAttribute('data-cur')) return; el.addEventListener('pointerenter', () => cur.classList.add('link')); el.addEventListener('pointerleave', () => cur.classList.remove('link')); });
}

/* ---------- Boot ---------- */
async function init() {
  const params = new URLSearchParams(location.search);
  const wantId = params.get('id');
  await hydratePhotoParts(document);
  intro(!!wantId);
  $('#year').textContent = new Date().getFullYear();
  $$('[data-split]').forEach(splitChars);
  letterField($('.hero-copy'));
  marquees();
  $$('.mag').forEach(magnet);
  reveal();

  /* nav behaviour */
  const nav = $('#nav'); let ly = 0;
  addEventListener('scroll', () => {
    const y = scrollY; nav.classList.toggle('scrolled', y > 40); nav.classList.toggle('hide', y > ly && y > 420); ly = y;
    document.documentElement.style.setProperty('--sy', (-y * .08).toFixed(1) + 'px');
    $$('.slab').forEach((s, i) => s.style.setProperty('--sy', (-y * (.05 + i * .04)).toFixed(1) + 'px'));
  }, { passive: true });
  $('#logoLink').onclick = ev => { ev.preventDefault(); if (!$('#profileView').classList.contains('hidden')) goHome(); else scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); };
  $$('[data-go]').forEach(a => a.onclick = ev => {
    ev.preventDefault();
    if (!$('#profileView').classList.contains('hidden')) goHome(true, a.dataset.go);
    else $('#' + a.dataset.go).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  $('#searchInput').addEventListener('input', renderGrid);
  $('#qrClose').onclick = closeQr; $('#downloadQr').onclick = downloadQr; $('#copyQr').onclick = copyQr;
  $('#qrModal').addEventListener('click', ev => { if (ev.target.id === 'qrModal') closeQr(); });
  addEventListener('keydown', ev => { if (ev.key === 'Escape') closeQr(); });
  addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get('id');
    if (id) showProfile(id, false); else goHome(false);
  });
  bindCursor(document);

  try {
    const r = await fetch('./employees.json', { cache: 'no-store' });
    if (!r.ok) throw Error('bad response');
    const d = await r.json(); employees = Array.isArray(d) ? d : [];
  } catch (err) {
    employees = [];
    $('#grid').innerHTML = '<p class="empty">The team list could not load. Refresh the page. If it keeps failing, check that employees.json is valid JSON.</p>';
  }
  renderChips(); if (employees.length) renderGrid();
  const act = active();
  if (act.length) {
    heroCard(0, true); startHeroCycle();
    const demo = act[act.length - 1];
    makeQR($('#demoQr'), profileUrl(demo), 420);
    $('#demoCap').textContent = `Try it: scan this to open ${demo.name}’s profile`;
  }
  if (wantId) { showProfile(wantId, false); }
  if (typeof QRCode === 'undefined') addEventListener('load', () => { fillQrs(document); if (act.length) makeQR($('#demoQr'), profileUrl(act[act.length - 1]), 420); });
}
init();
})();
