(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = id => document.getElementById(id);

  // Mobile menu
  const mb = $('menuBtn'), menu = $('menu');
  if (mb && menu) {
    mb.addEventListener('click', () => mb.setAttribute('aria-expanded', menu.classList.toggle('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); mb.setAttribute('aria-expanded', false); }));
  }

  // Words that light up as you scroll
  const say = $('say');
  let words = [];
  if (say) {
    say.innerHTML = say.dataset.text.split(' ').map(w => '<span class="w' + (w.startsWith('*') ? ' hot' : '') + '">' + w.replace(/\*/g, '') + '</span>').join(' ');
    words = [...say.querySelectorAll('.w')];
  }

  // Scroll-linked progress: --p goes from 0 to 1 as an element crosses the screen
  const pEls = [...document.querySelectorAll('[data-p]')];
  let ticking = false;
  function update(){
    ticking = false;
    const vh = innerHeight;
    pEls.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = el.classList.contains('stage') ? clamp(-r.top / (r.height * .9)) : clamp((vh - r.top) / (vh * .9));
      el.style.setProperty('--p', p.toFixed(3));
    });
    if (say) {
      const r = say.getBoundingClientRect();
      const n = Math.round(clamp((vh * .8 - r.top) / (r.height + vh * .3)) * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
  }
  if (reduce) {
    words.forEach(w => w.classList.add('on'));
    pEls.forEach(el => el.style.setProperty('--p', el.classList.contains('stage') ? 0 : 1));
  } else {
    update();
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, {passive:true});
    addEventListener('resize', update);
  }

  // Lift-in (content is visible at rest, it only rises into place)
  const rises = document.querySelectorAll('.rise');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.1});
    rises.forEach(el => io.observe(el));
  } else rises.forEach(el => el.classList.add('in'));

  // Pinned story on the About page
  const viz = $('viz');
  if (viz) {
    const vNum = $('vizNum'), tags = [...viz.querySelectorAll('.tags span')], steps = [...document.querySelectorAll('.step')];
    const looks = [
      {g:'rgba(245,192,87,.6)', t:'none'},
      {g:'rgba(184,50,63,.65)', t:'translateX(-8%) rotate(-8deg) scale(.92)'},
      {g:'rgba(255,138,92,.55)', t:'translateY(-4%) rotate(6deg) scale(1.06)'}
    ];
    const setStep = i => {
      steps.forEach((s, j) => s.classList.toggle('active', j === i));
      tags.forEach((s, j) => s.classList.toggle('on', j === i));
      vNum.textContent = '0' + (i + 1);
      viz.style.setProperty('--g', looks[i].g); viz.style.setProperty('--t', looks[i].t);
    };
    setStep(0);
    if ('IntersectionObserver' in window) {
      const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), {rootMargin:'-45% 0px -45% 0px'});
      steps.forEach(s => so.observe(s));
    }
  }

  // Player bars and November calendar on the Episodes page
  const bars = $('bars');
  if (bars) for (let i = 0; i < 40; i++) { const b = document.createElement('i'); b.style.height = (22 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * .41)) * 78) + '%'; bars.appendChild(b); }
  const cal = $('cal');
  if (cal) {
    // November 1, 2026 is a Sunday, so the month starts in the first column.
    const today = new Date();
    const mark = today.getFullYear() === 2026 && today.getMonth() === 10 ? today.getDate() : 0;
    let html = ['S','M','T','W','T','F','S'].map(d => '<span class="hd">' + d + '</span>').join('');
    for (let d = 1; d <= 30; d++) html += '<span' + (d === mark ? ' class="now"' : '') + '>' + d + '</span>';
    cal.innerHTML = html;
  }

  // Team gallery arrows
  const gal = $('gallery');
  if (gal) {
    const step = () => gal.querySelector('.card').getBoundingClientRect().width + 20;
    $('prev').addEventListener('click', () => gal.scrollBy({left:-step(), behavior:'smooth'}));
    $('next').addEventListener('click', () => gal.scrollBy({left:step(), behavior:'smooth'}));
  }

  // Copy subject lines
  const toast = $('toast');
  const show = m => { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(show.t); show.t = setTimeout(() => toast.classList.remove('show'), 1800); };
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); show('Subject line copied'); }
    catch (e) { show('Copy didn’t work. Select the text instead.'); }
  }));


  // Reading progress bar
  const bar = document.querySelector('.progress');
  if (bar) {
    const sp = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--sp', h > 0 ? (scrollY / h).toFixed(4) : 0); };
    sp(); addEventListener('scroll', sp, {passive:true}); addEventListener('resize', sp);
  }

  // 3D tilt and spotlight on team cards
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        el.style.transition = 'transform .15s ease-out';
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(1000px) rotateX(${(.5 - y) * 7}deg) rotateY(${(x - .5) * 9}deg) translateY(-4px)`;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 600); });
    });
  }


  // Hero follows the mouse
  const stage = document.querySelector('.stage');
  if (stage && !reduce && matchMedia('(hover: hover)').matches) {
    const hero = stage.closest('.hero');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      stage.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => { stage.style.setProperty('--mx', 0); stage.style.setProperty('--my', 0); });
  }

  // Custom cursor ring and magnetic buttons (mouse only)
  const cur = document.querySelector('.cursor');
  if (cur && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    (function loop(){ cx += (tx - cx) * .2; cy += (ty - cy) * .2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
    document.querySelectorAll('a, button, summary, .tilt').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('big'));
      el.addEventListener('pointerleave', () => cur.classList.remove('big'));
    });
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }


  // Episode chapters: jump the video to a moment
  document.querySelectorAll('.feature, .ep-card').forEach(card => {
    const frame = card.querySelector('iframe');
    if (!frame) return;
    const base = frame.src.split('&start=')[0];
    card.querySelectorAll('.chap').forEach(b => b.addEventListener('click', () => {
      frame.src = base + '&start=' + b.dataset.t + '&autoplay=1';
      card.querySelectorAll('.chap').forEach(x => x.classList.toggle('on', x === b));
      frame.closest('.player-frame').scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
    }));
  });


  // Episode switcher: a floating dropdown on the Episodes page, built from the episode cards
  const eps = [...document.querySelectorAll('#episodes .feature[id]')];
  if (eps.length > 1) {
    const sw = document.createElement('nav');
    sw.className = 'ep-switch';
    sw.setAttribute('aria-label', 'Jump to an episode');
    const info = eps.map(el => {
      const num = (el.querySelector('.live')?.textContent.match(/\d{3}/) || [''])[0];
      return { el, num, name: el.querySelector('h2')?.textContent.trim() || el.id, latest: !!el.querySelector('.live i') };
    });
    sw.innerHTML =
      '<button type="button" class="es-btn" aria-expanded="false" aria-controls="esList">' +
        '<span class="es-k">Episode</span><span class="es-cur">' + info[0].num + '</span><span class="es-chev" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="es-panel" id="esList"><span class="es-title">All episodes</span><ul>' +
        info.map((e, i) => '<li><button type="button" data-i="' + i + '"><span class="es-num">' + e.num + '</span><span class="es-name">' + e.name +
          '</span>' + (e.latest ? '<span class="es-new">New</span>' : '') + '</button></li>').join('') +
      '</ul></div>';
    document.body.appendChild(sw);
    const btn = sw.querySelector('.es-btn'), cur = sw.querySelector('.es-cur'), items = [...sw.querySelectorAll('li button')];
    const setOpen = o => { sw.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
    btn.addEventListener('click', e => { e.stopPropagation(); setOpen(!sw.classList.contains('open')); });
    document.addEventListener('click', e => { if (!sw.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setOpen(false); btn.focus(); } });
    items.forEach(b => b.addEventListener('click', () => {
      info[+b.dataset.i].el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setOpen(false);
    }));
    const mark = i => { cur.textContent = info[i].num; items.forEach((b, k) => b.classList.toggle('on', k === i)); };
    mark(0);
    // show once the visitor reaches the episodes, follow along as they scroll
    const section = document.getElementById('episodes');
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      sw.classList.toggle('show', r.top < innerHeight * .6 && r.bottom > innerHeight * .4);
      let best = 0;
      info.forEach((e, i) => { if (e.el.getBoundingClientRect().top < innerHeight * .45) best = i; });
      mark(best);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Interviewer bio pop-up
  const pop = $('bioPop');
  if (pop) {
    const fill = id => {
      const b = document.querySelector('[data-bio="' + id + '"]'); if (!b) return false;
      $('bioName').textContent = b.dataset.name;
      $('bioRole').innerHTML = b.dataset.role || '';
      $('bioText').innerHTML = b.innerHTML;
      const av = $('bioAv');
      if (b.dataset.photo) { av.style.backgroundImage = "url('" + b.dataset.photo + "')"; av.textContent = ''; }
      else { av.style.backgroundImage = ''; av.textContent = b.dataset.name.split(' ').map(w => w[0]).join('').slice(0, 2); }
      const ig = $('bioIg');
      if (b.dataset.instagram) { ig.hidden = false; ig.href = 'https://www.instagram.com/' + b.dataset.instagram + '/'; $('bioIgText').textContent = '@' + b.dataset.instagram; }
      else ig.hidden = true;
      return true;
    };
    let opener = null;
    document.querySelectorAll('.person-btn, .open-bio').forEach(btn => btn.addEventListener('click', () => {
      if (!fill(btn.dataset.person)) return;
      opener = btn;
      if (pop.showModal) pop.showModal(); else pop.setAttribute('open', '');
    }));
    const close = () => { if (pop.close) pop.close(); else pop.removeAttribute('open'); };
    $('bioClose').addEventListener('click', close);
    pop.addEventListener('click', e => { if (e.target === pop) close(); });
    pop.addEventListener('close', () => { if (opener && opener.tabIndex !== -1) opener.focus(); });
  }

  // Home: a voice waveform that becomes a heartbeat
  const cv = $('wave');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d,0,0,d,0,0); };
  size(); addEventListener('resize', size);
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const g = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  const ecg = p => .12 * g(p,.18,.025) - .12 * g(p,.36,.008) + g(p,.40,.009) - .28 * g(p,.44,.01) + .26 * g(p,.64,.04);
  let visible = true, running = false;
  function frame(ts){
    running = false;
    const t = (ts || 0) / 1000;
    ctx.clearRect(0, 0, W, H);
    const mid = H * .6, amp = H * .44, small = 8, big = 40;
    for (let x = 0; x <= W; x += small) {
      const a = sm(.35, .85, x / W); if (!a) continue;
      ctx.strokeStyle = `rgba(245,192,87,${(x % big ? .035 : .1) * a})`;
      ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += small) {
      const gr = ctx.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(.35, 'rgba(245,192,87,0)'); gr.addColorStop(.85, `rgba(245,192,87,${y % big ? .035 : .1})`);
      ctx.strokeStyle = gr; ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke();
    }
    const period = Math.max(220, W * .2), speed = 90, pts = [];
    for (let x = 0; x <= W; x += 2) {
      const b = sm(.38, .62, x / W);
      const env = .35 + .65 * Math.abs(Math.sin(x * .011 - t * 1.3) * Math.sin(x * .0037 + t * .7));
      const voice = env * (Math.sin(x * .19 + t * 9) * .55 + Math.sin(x * .07 - t * 5) * .35 + Math.sin(x * .43 + t * 13) * .18) * .55;
      const p = ((((x - t * speed) % period) + period) % period) / period;
      pts.push([x, mid - (voice * (1 - b) + ecg(p) * b) * amp]);
    }
    const st = ctx.createLinearGradient(0, 0, W, 0);
    st.addColorStop(0, 'rgba(245,192,87,.2)'); st.addColorStop(.4, '#f5c057'); st.addColorStop(.65, '#ff8a5c'); st.addColorStop(1, '#e0405f');
    ctx.lineJoin = ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(255,138,92,.7)'; ctx.shadowBlur = 16;
    ctx.strokeStyle = st; ctx.lineWidth = 2.4;
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    const hp = pts[Math.min(pts.length - 1, Math.round((W * .62 + (t * speed * 1.6) % (W * .38)) / 2))];
    if (hp) { ctx.fillStyle = '#fff'; ctx.shadowColor = '#ff8a5c'; ctx.shadowBlur = 22; ctx.beginPath(); ctx.arc(hp[0], hp[1], 3.5, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
    if (!reduce && visible) { running = true; requestAnimationFrame(frame); }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !reduce && !running) { running = true; requestAnimationFrame(frame); } }).observe(cv);
  frame(0);
})();
