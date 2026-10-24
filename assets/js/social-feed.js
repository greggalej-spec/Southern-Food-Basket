/* Social feed: renders into every <section class="sfeed" data-social-feed> on a page.
   1. Asks /api/social-feed for live posts (Instagram Graph API and TikTok Display API, once the store connects its accounts).
   2. Until then, shows the posts already on the site: the Try Me deals from the company's Instagram, the same ones the
      store admin edits (read through SFBStore when the page loads it, else the published seed).
   Include with: <script src="assets/js/social-feed.js" data-root="" defer></script> (data-root: path to the site root). */
(function () {
  'use strict';
  const me = document.currentScript;
  const ROOT = (me && me.getAttribute('data-root')) || '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = iso => { const p = String(iso || '').slice(0, 10).split('-').map(Number); return p.length === 3 && p[1] ? p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0] : ''; };
  // only https links, or the site's own images, ever reach an href or src
  const safeUrl = u => { u = String(u || ''); return /^https:\/\//i.test(u) || (u.startsWith(ROOT + 'assets/') && !/[:\\]/.test(u.slice(ROOT.length))) ? u : ''; };
  const money = v => '$' + Number(v).toFixed(2);
  const ICON = {
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg>',
    tt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 3c.4 2.2 1.8 3.6 4 3.9v3.2c-1.5 0-2.9-.4-4-1.2v6.2a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.3a2.8 2.8 0 1 0 1.8 2.6V3h3.2z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    stack: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h11a2 2 0 0 1 2 2v11M4 7h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  };
  const SCALLOP = (() => { const n = 18, rIn = 41, rOut = 53, c = 50, st = Math.PI * 2 / n; let d = ''; for (let i = 0; i < n; i++) { const a0 = i * st - Math.PI / 2, a1 = (i + 1) * st - Math.PI / 2, am = (i + .5) * st - Math.PI / 2; if (!i) d += 'M' + (c + rIn * Math.cos(a0)).toFixed(2) + ' ' + (c + rIn * Math.sin(a0)).toFixed(2); d += 'Q' + (c + rOut * Math.cos(am)).toFixed(2) + ' ' + (c + rOut * Math.sin(am)).toFixed(2) + ' ' + (c + rIn * Math.cos(a1)).toFixed(2) + ' ' + (c + rIn * Math.sin(a1)).toFixed(2); } return d + 'Z'; })();

  const siteData = () => (window.SFBStore && window.SFBStore.load ? window.SFBStore.load() : window.SFB_DATA) || {};
  function accounts(d) {
    const s = d.settings || {}, ig = s.instagram || {};
    const tiktokUrl = s.tiktok || '';
    const tiktokUser = (tiktokUrl.match(/@([A-Za-z0-9_.]+)/) || [])[1] || '';
    return { igUrl: ig.url || '', igHandle: ig.handle || '', ttUrl: tiktokUrl, ttUser: tiktokUser };
  }
  // the posts already on the site: Try Me deals as posted on Instagram, newest first
  function sitePosts(d, acc) {
    const dept = id => (d.departments || []).find(x => x.id === id);
    return (d.specials || []).slice().sort((a, b) => String(b.posted || '').localeCompare(String(a.posted || ''))).slice(0, 18).map(sp => {
      const dp = dept(sp.dept);
      const caption = sp.name + (sp.price != null ? ', 1 for ' + money(sp.price) + '. Try me!' : '.') + (dp ? '\n' + dp.name + '.' : '');
      return { id: sp.id, type: 'image', image: ROOT + 'assets/img/photos/' + sp.img + '.webp', alt: sp.alt || sp.name, title: sp.name,
        caption, price: sp.price, date: sp.posted, isNew: !!sp.isNew, permalink: acc.igUrl };
    });
  }
  async function livePosts() {
    if (location.protocol === 'file:') return null;
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 2500);
    try {
      const r = await fetch(ROOT + 'api/social-feed', { signal: ctl.signal, headers: { accept: 'application/json' } });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null;
      return await r.json();
    } catch (e) { return null; } finally { clearTimeout(t); }
  }

  let uid = 0;
  function mount(host, d, live) {
    const n = ++uid, acc = accounts(d);
    const liveIg = live && live.instagram && live.instagram.connected && (live.instagram.posts || []).length ? live.instagram.posts : null;
    const liveTt = live && live.tiktok && live.tiktok.connected && (live.tiktok.videos || []).length ? live.tiktok.videos : null;
    const posts = liveIg || sitePosts(d, acc);
    host.setAttribute('aria-labelledby', 'sfeed-title-' + n);

    const card = (p, i) => {
      const date = fmtDate(p.date);
      const badge = p.type === 'video' ? ICON.play : p.type === 'carousel' ? ICON.stack : '';
      const seal = p.price != null ? '<span class="sfeed-seal" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="' + SCALLOP + '" fill="#D3202D"/></svg><span><small>1 FOR</small><b>' + esc(money(p.price)) + '</b></span></span>' : '';
      return '<li><button class="sfeed-post" type="button" data-i="' + i + '" aria-label="' + esc('Open post: ' + p.title + (date ? ', posted ' + date : '')) + '">' +
        '<span class="sfeed-media"><img src="' + esc(safeUrl(p.image)) + '" alt="' + esc(p.alt || p.title) + '" loading="lazy" decoding="async" width="400" height="500">' +
        (p.isNew ? '<span class="sfeed-new">NEW</span>' : '') + (badge ? '<span class="sfeed-type" aria-hidden="true">' + badge + '</span>' : '') + seal + '</span>' +
        '<span class="sfeed-meta"><b>' + esc(p.title) + '</b>' + (date ? '<span>' + esc(date) + '</span>' : '') + '</span></button></li>';
    };

    host.innerHTML =
      '<div class="sfeed-in">' +
        '<header class="sfeed-head"><p class="sfeed-kicker">' + ICON.ig + 'Instagram and TikTok</p>' +
        '<h2 id="sfeed-title-' + n + '">Fresh from our feed</h2>' +
        '<p class="sfeed-lede">The deals and news we post on Instagram and TikTok, right here on the site. Tap a post to see it full size.</p></header>' +
        '<div class="sfeed-bar"><div class="sfeed-tabs" role="tablist" aria-label="Choose a feed"><span class="sfeed-tab-ink" aria-hidden="true"></span>' +
          '<button class="sfeed-tab" type="button" role="tab" id="sfeed-tab-ig-' + n + '" aria-controls="sfeed-ig-' + n + '" aria-selected="true">' + ICON.ig + 'Instagram</button>' +
          (acc.ttUser ? '<button class="sfeed-tab" type="button" role="tab" id="sfeed-tab-tt-' + n + '" aria-controls="sfeed-tt-' + n + '" aria-selected="false" tabindex="-1">' + ICON.tt + 'TikTok</button>' : '') +
        '</div>' +
        (acc.igUrl ? '<a class="sfeed-follow" href="' + esc(acc.igUrl) + '" target="_blank" rel="noopener" data-follow>' + ICON.ig + '<span>Follow ' + esc(acc.igHandle) + '</span><span class="visually-hidden"> (opens Instagram)</span></a>' : '') + '</div>' +
        '<div class="sfeed-panel" role="tabpanel" id="sfeed-ig-' + n + '" aria-labelledby="sfeed-tab-ig-' + n + '">' +
          '<div class="sfeed-stage"><button class="sfeed-nav sfeed-prev" type="button" aria-label="Previous posts" disabled>' + ICON.prev + '</button>' +
          '<ul class="sfeed-track" tabindex="0" aria-label="Instagram posts, scroll sideways">' + posts.map(card).join('') + '</ul>' +
          '<button class="sfeed-nav sfeed-next" type="button" aria-label="More posts">' + ICON.next + '</button></div>' +
          '<div class="sfeed-progress" aria-hidden="true"><span></span></div>' +
          '<p class="sfeed-source' + (liveIg ? ' is-live' : '') + '"><i aria-hidden="true"></i><span>' + (liveIg
            ? 'Live from Instagram ' + esc(acc.igHandle) + ', refreshed every 15 minutes.'
            : 'These are the Try Me posts from our Instagram that are already on the site. Once the store connects its Instagram account, every new post appears here by itself.') + '</span></p>' +
        '</div>' +
        (acc.ttUser ? '<div class="sfeed-panel" role="tabpanel" id="sfeed-tt-' + n + '" aria-labelledby="sfeed-tab-tt-' + n + '" hidden>' +
          '<div class="sfeed-tt" data-tt></div>' +
          '<p class="sfeed-source' + ' is-live' + '"><i aria-hidden="true"></i><span>' + (liveTt
            ? 'Live from TikTok @' + esc(acc.ttUser) + ', refreshed every 15 minutes.'
            : 'TikTok’s own feed of our latest videos, live from @' + esc(acc.ttUser) + '.') + '</span></p></div>' : '') +
      '</div>';

    /* ---------- tabs ---------- */
    const tabs = [...host.querySelectorAll('.sfeed-tab')], ink = host.querySelector('.sfeed-tab-ink'), follow = host.querySelector('[data-follow]');
    const moveInk = t => { ink.style.width = t.offsetWidth + 'px'; ink.style.transform = 'translateX(' + t.offsetLeft + 'px)'; };
    function select(t, focus) {
      tabs.forEach(x => {
        const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        host.querySelector('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      moveInk(t); if (focus) t.focus();
      const isTt = /tt/.test(t.id);
      if (follow) {
        follow.href = isTt ? acc.ttUrl : acc.igUrl;
        follow.innerHTML = (isTt ? ICON.tt : ICON.ig) + '<span>Follow ' + esc(isTt ? '@' + acc.ttUser : acc.igHandle) + '</span><span class="visually-hidden"> (opens ' + (isTt ? 'TikTok' : 'Instagram') + ')</span>';
      }
      if (isTt) loadTikTok();
      else updateTrack();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const k = e.key; let j = null;
        if (k === 'ArrowRight') j = (i + 1) % tabs.length; else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length; else if (k === 'Home') j = 0; else if (k === 'End') j = tabs.length - 1;
        if (j != null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    requestAnimationFrame(() => moveInk(tabs[0]));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInk(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]));
    window.addEventListener('resize', () => moveInk(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]));

    /* ---------- carousel ---------- */
    const track = host.querySelector('.sfeed-track'), prev = host.querySelector('.sfeed-prev'), next = host.querySelector('.sfeed-next'), bar = host.querySelector('.sfeed-progress span');
    function updateTrack() {
      const max = track.scrollWidth - track.clientWidth;
      const vis = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
      bar.style.width = Math.max(12, vis * 100) + '%';
      bar.style.transform = 'translateX(' + (max > 0 ? (track.scrollLeft / max) * ((1 / Math.max(vis, .12)) - 1) * 100 : 0) + '%)';
      prev.disabled = track.scrollLeft <= 4; next.disabled = track.scrollLeft >= max - 4;
    }
    const page = dir => track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: reduce.matches ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => page(-1)); next.addEventListener('click', () => page(1));
    track.addEventListener('scroll', updateTrack, { passive: true });
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); page(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); page(-1); } });
    window.addEventListener('resize', updateTrack);
    requestAnimationFrame(updateTrack);
    track.addEventListener('click', e => { const b = e.target.closest('.sfeed-post'); if (b) openViewer(posts, Number(b.getAttribute('data-i')), b, 'ig'); });

    /* ---------- TikTok: connected videos, or TikTok's own live creator feed ---------- */
    let ttDone = false;
    function loadTikTok() {
      if (ttDone) return; ttDone = true;
      const box = host.querySelector('[data-tt]');
      if (liveTt) {
        const vids = liveTt.map(v => ({ id: v.id, type: 'video', image: v.cover, alt: v.title || 'TikTok video', title: v.title || 'TikTok video', caption: v.title || '', date: v.date, permalink: v.permalink, embed: 'https://www.tiktok.com/player/v1/' + encodeURIComponent(v.id) }));
        box.innerHTML = '<ul class="sfeed-track" tabindex="0" aria-label="TikTok videos, scroll sideways">' + vids.map(card).join('') + '</ul>';
        box.querySelector('.sfeed-track').addEventListener('click', e => { const b = e.target.closest('.sfeed-post'); if (b) openViewer(vids, Number(b.getAttribute('data-i')), b, 'tt'); });
        return;
      }
      box.innerHTML = '<div class="sfeed-tt-wait">' + ICON.tt + '<p>Loading our TikTok…</p><p><a href="' + esc(acc.ttUrl) + '" target="_blank" rel="noopener">Watch on TikTok<span class="visually-hidden"> (opens TikTok)</span></a></p></div>';
      const bq = document.createElement('blockquote');
      bq.className = 'tiktok-embed'; bq.setAttribute('cite', acc.ttUrl); bq.setAttribute('data-unique-id', acc.ttUser); bq.setAttribute('data-embed-type', 'creator');
      bq.style.cssText = 'max-width:780px;min-width:288px;';
      const sec = document.createElement('section'), a = document.createElement('a');
      a.href = acc.ttUrl + '?refer=creator_embed'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '@' + acc.ttUser;
      sec.appendChild(a); bq.appendChild(sec);
      const wait = box.firstChild;
      box.appendChild(bq);
      const s = document.createElement('script');
      s.async = true; s.src = 'https://www.tiktok.com/embed.js';
      s.onload = () => { const obs = new MutationObserver(() => { if (bq.querySelector('iframe') || box.querySelector('iframe')) { wait.remove(); obs.disconnect(); } }); obs.observe(box, { childList: true, subtree: true }); setTimeout(() => { if (box.querySelector('iframe')) wait.remove(); }, 4000); };
      s.onerror = () => { wait.querySelector('p').textContent = 'The TikTok feed could not load here.'; bq.remove(); };
      document.body.appendChild(s);
    }
  }

  /* ---------- full-size viewer (one per page) ---------- */
  let lb = null, list = [], at = 0, opener = null, kind = 'ig', accNow = null;
  function viewer() {
    if (lb) return lb;
    lb = document.createElement('dialog');
    lb.className = 'sfeed-lb'; lb.setAttribute('aria-labelledby', 'sfeed-lb-title');
    lb.innerHTML = '<div class="sfeed-lb-card"><figure class="sfeed-lb-media"><div data-media></div>' +
      '<button class="sfeed-lb-prev" type="button" aria-label="Previous post">' + ICON.prev + '</button><button class="sfeed-lb-next" type="button" aria-label="Next post">' + ICON.next + '</button></figure>' +
      '<div class="sfeed-lb-text"><p class="sfeed-lb-handle" data-handle></p><h3 id="sfeed-lb-title"></h3><p class="sfeed-lb-caption" data-caption></p><p class="sfeed-lb-date" data-date></p>' +
      '<a class="sfeed-lb-open" data-open target="_blank" rel="noopener"></a><p class="sfeed-lb-count" data-count aria-live="polite"></p></div>' +
      '<button class="sfeed-lb-close" type="button" aria-label="Close">' + ICON.close + '</button></div>';
    document.body.appendChild(lb);
    lb.querySelector('.sfeed-lb-close').addEventListener('click', () => lb.close());
    lb.querySelector('.sfeed-lb-prev').addEventListener('click', () => show(at - 1));
    lb.querySelector('.sfeed-lb-next').addEventListener('click', () => show(at + 1));
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); }); // backdrop
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(at + 1); if (e.key === 'ArrowLeft') show(at - 1); });
    lb.addEventListener('close', () => { lb.querySelector('[data-media]').innerHTML = ''; if (opener && document.contains(opener)) opener.focus(); });
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); });
    return lb;
  }
  function show(i) {
    if (i < 0 || i >= list.length) return;
    at = i; const p = list[i], box = lb.querySelector('[data-media]'), fig = lb.querySelector('.sfeed-lb-media');
    if (safeUrl(p.embed)) box.innerHTML = '<iframe src="' + esc(safeUrl(p.embed)) + '" title="' + esc(p.title) + '" allow="autoplay; encrypted-media; fullscreen" loading="lazy"></iframe>';
    else box.innerHTML = '<img src="' + esc(safeUrl(p.image)) + '" alt="' + esc(p.alt || p.title) + '">';
    fig.classList.remove('swap'); void fig.offsetWidth; fig.classList.add('swap');
    const isTt = kind === 'tt';
    lb.querySelector('[data-handle]').innerHTML = (isTt ? ICON.tt : ICON.ig) + esc(isTt ? '@' + accNow.ttUser : accNow.igHandle);
    lb.querySelector('#sfeed-lb-title').textContent = p.title;
    lb.querySelector('[data-caption]').textContent = p.caption || '';
    const date = fmtDate(p.date); lb.querySelector('[data-date]').textContent = date ? 'Posted ' + date : '';
    const open = lb.querySelector('[data-open]'), href = safeUrl(p.permalink) || safeUrl(isTt ? accNow.ttUrl : accNow.igUrl);
    open.hidden = !href; if (href) open.href = href;
    open.innerHTML = (isTt ? 'Watch on TikTok' : 'View on Instagram') + ICON.out;
    lb.querySelector('[data-count]').textContent = (i + 1) + ' of ' + list.length;
    lb.querySelector('.sfeed-lb-prev').disabled = i === 0; lb.querySelector('.sfeed-lb-next').disabled = i === list.length - 1;
  }
  function openViewer(items, i, from, k) {
    viewer(); list = items; opener = from; kind = k; accNow = accounts(siteData());
    show(i);
    if (!lb.open) lb.showModal();
  }

  async function init() {
    const hosts = [...document.querySelectorAll('[data-social-feed]')];
    if (!hosts.length) return;
    const d = siteData();
    const live = await livePosts();
    hosts.forEach(h => mount(h, d, live));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
