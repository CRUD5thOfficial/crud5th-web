/* Motion belongs to section backgrounds and a readable technology list. */
(() => {
  'use strict';
  if (window.__crud5thCyberFlow) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const status = { fields: 0, activeFields: 0, techRows: 0, paused: false, hidden: document.hidden, reduced: reduced.matches };
  let paused = false;
  try { paused = localStorage.getItem('crud5th-flow-paused') === 'true'; } catch (_) {}
  const targets = new Set();
  const visible = new Set();
  const selector = '.crud5th-light-opening,.home_about,.home_works,.home_service,.home_awards,.home_recruit,.footer,.pageHead,.about_mission,.about_vision,.about_value,.about_outline,.service_businessFiled,.service_solution,.service_faq,.works_detail_header,.works_detail_content,.works_detail_footer_back,.recruit_message,.recruit_positions';
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'crud5th-flow-toggle';
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('crud5th-flow-paused', String(paused)); } catch (_) {}
    update();
  });
  // The existing SVG is the shape/color source. Only its decorative control points deform.
  const waves = new Map();
  const waveStatus = { frames: 0, instances: 0, running: false, time: 0 };
  let waveSource, waveFrame = 0, waveLast = 0, waveTime = 0;
  function source() {
    if (!waveSource) waveSource = fetch('/assets/local/crud5th-intro-caustics.svg')
      .then(r => { if (!r.ok) throw Error('intro-glass-source'); return r.text(); })
      .then(text => {
        const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
        return [...svg.querySelectorAll('g path')].map((p, index) => {
          const parts = p.getAttribute('d').match(/[MCLZ]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
          return { parts, side: index < 5 ? 0 : 1, layer: index % 5 % 3,
            edge: p.getAttribute('fill') === 'none', alpha: Number(p.getAttribute('opacity') || 1),
            line: Number(p.getAttribute('stroke-width') || 1) };
        });
      }).catch(() => null);
    return waveSource;
  }
  function deform(x, y, shape, time) {
    const phase = shape.side * 2.4 + shape.layer * 1.7;
    const speed = .56 + shape.layer * .12 + shape.side * .045;
    const bend = Math.sin(y * .0075 - time * speed + phase) * (39 - shape.layer * 6)
      + Math.sin(y * .017 + time * .38 + phase * 1.3) * 15;
    return [x + bend, y + Math.sin(y * .006 + time * .41 + phase) * 9];
  }
  function trace(ctx, shape, time) {
    let i = 0;
    ctx.beginPath();
    while (i < shape.parts.length) {
      const command = shape.parts[i++].toUpperCase();
      if (command === 'Z') { ctx.closePath(); continue; }
      const count = command === 'C' ? 3 : 1, points = [];
      for (let n = 0; n < count; n++) points.push(...deform(Number(shape.parts[i++]), Number(shape.parts[i++]), shape, time));
      if (command === 'M') ctx.moveTo(...points);
      else if (command === 'L') ctx.lineTo(...points);
      else ctx.bezierCurveTo(...points);
    }
  }
  function paint(wave) {
    const { canvas, ctx, field, shapes } = wave;
    const rect = field.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(rect.width * 1.06 * ratio));
    const height = Math.max(1, Math.round(rect.height * 1.14 * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(width / 1440, 0, 0, height / 900, 0, 0);
    ctx.clearRect(0, 0, 1440, 900);
    for (const side of [0, 1]) {
      const glow = ctx.createRadialGradient(side ? 1380 : 95, 450, 5, side ? 1380 : 95, 450, 560);
      glow.addColorStop(0, side ? 'rgba(102,96,237,.16)' : 'rgba(23,211,237,.12)');
      glow.addColorStop(1, 'rgba(4,11,26,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1440, 900);
    }
    for (const shape of shapes) {
      trace(ctx, shape, waveTime);
      const phase = waveTime * (.35 + shape.layer * .07) + shape.side * 1.7 + shape.layer;
      const reflect = .79 + .21 * Math.sin(phase);
      ctx.globalAlpha = shape.alpha;
      if (shape.edge) {
        const shift = Math.sin(phase) * 115;
        const edge = ctx.createLinearGradient(0, -100 + shift, 0, 1000 + shift);
        edge.addColorStop(0, 'rgba(126,247,255,0)');
        edge.addColorStop(.22, shape.side ? `rgba(154,149,255,${.46 * reflect})` : `rgba(152,252,255,${.75 * reflect})`);
        edge.addColorStop(.5, shape.side ? `rgba(167,233,255,${.78 * reflect})` : 'rgba(55,213,236,.16)');
        edge.addColorStop(.77, shape.side ? 'rgba(120,117,255,.28)' : `rgba(180,253,255,${.72 * reflect})`);
        edge.addColorStop(1, 'rgba(76,186,255,0)');
        ctx.strokeStyle = edge; ctx.lineWidth = shape.line; ctx.stroke();
      } else {
        const shift = Math.sin(phase) * 35;
        const glass = ctx.createLinearGradient(shape.side ? 1560 + shift : -120 + shift, 0, shape.side ? 1150 + shift : 350 + shift, 145);
        glass.addColorStop(0, 'rgba(6,18,37,0)');
        glass.addColorStop(.32, shape.side ? 'rgba(40,70,175,.12)' : 'rgba(16,87,102,.16)');
        glass.addColorStop(.58, shape.side ? 'rgba(101,89,231,.32)' : 'rgba(36,190,211,.28)');
        glass.addColorStop(.8, shape.side ? 'rgba(106,141,255,.08)' : 'rgba(58,232,241,.09)');
        glass.addColorStop(.95, shape.side ? `rgba(173,200,255,${.65 * reflect})` : `rgba(155,252,255,${.68 * reflect})`);
        glass.addColorStop(1, 'rgba(37,138,238,0)'); ctx.fillStyle = glass; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    field.dataset.waveReady = 'true';
    waveStatus.frames++; waveStatus.time = waveTime;
  }
  function runningWave() {
    return !paused && !reduced.matches && !document.hidden && [...waves.keys()].some(e => e.isConnected && visible.has(e));
  }
  function tickWave(now) {
    waveFrame = 0;
    if (!runningWave()) { waveLast = 0; waveStatus.running = false; return; }
    // Limit work to 30 fps. Hidden, paused, reduced, and offscreen time is never accumulated.
    if (!waveLast || now - waveLast >= 32) {
      if (waveLast) waveTime += Math.min(now - waveLast, 70) / 1000;
      waveLast = now;
      for (const [field, wave] of waves) if (wave.shapes && field.isConnected && visible.has(field)) paint(wave);
    }
    waveStatus.running = true;
    waveFrame = requestAnimationFrame(tickWave);
  }
  function updateWaves() {
    if (runningWave()) {
      if (!waveFrame) { waveLast = 0; waveFrame = requestAnimationFrame(tickWave); }
    } else {
      cancelAnimationFrame(waveFrame); waveFrame = 0; waveLast = 0; waveStatus.running = false;
    }
  }
  function syncWaves() {
    for (const [field] of waves) if (!field.isConnected) waves.delete(field);
    for (const field of document.querySelectorAll('.home_kv--light + .home_about > .crud5th-flow-field')) {
      if (waves.has(field)) continue;
      const canvas = document.createElement('canvas'); canvas.className = 'crud5th-intro-wave';
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) continue;
      const wave = { field, canvas, ctx, shapes: null }; waves.set(field, wave);
      source().then(shapes => {
        if (!shapes || !field.isConnected) { waves.delete(field); return; }
        wave.shapes = shapes; field.prepend(canvas); paint(wave); updateWaves();
      });
    }
    waveStatus.instances = waves.size;
  }

  function updateDock() {
    const remaining = document.documentElement.scrollHeight - scrollY - innerHeight;
    toggle.dataset.dock = remaining < 130 ? 'footer' : 'normal';
  }
  function update() {
    const stopped = paused || reduced.matches || document.hidden;
    document.body.dataset.crud5thFlow = stopped ? 'paused' : 'running';
    updateWaves();
    status.paused = paused; status.hidden = document.hidden; status.reduced = reduced.matches;
    status.activeFields = [...visible].filter(e => e.isConnected && e.classList.contains('crud5th-flow-field')).length;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.disabled = reduced.matches;
    const label = reduced.matches ? 'MOTION REDUCED' : paused ? 'MOTION PLAY' : 'MOTION PAUSE';
    if (toggle.textContent !== label) toggle.textContent = label;
    toggle.setAttribute('aria-label', reduced.matches ? '動きの軽減設定に従っています' : paused ? '背景の光と技術リストの動きを再開' : '背景の光と技術リストの動きを停止');
  }
  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.dataset.flowActive = String(entry.isIntersecting);
      if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
    }
    update();
  }, { rootMargin: '80px' });
  function sync() {
    if (!toggle.isConnected) document.body.append(toggle);
    for (const target of targets) {
      if (!target.isConnected) { intersection.unobserve(target); targets.delete(target); visible.delete(target); }
    }
    for (const section of document.querySelectorAll(selector)) {
      let field = [...section.children].find(e => e.classList.contains('crud5th-flow-field'));
      if (!field) {
        field = document.createElement('div'); field.className = 'crud5th-flow-field'; field.setAttribute('aria-hidden', 'true');
        section.prepend(field);
      }
      if (!targets.has(field)) { targets.add(field); intersection.observe(field); }
    }
    for (const tech of document.querySelectorAll('.crud5th-tech')) {
      if (!targets.has(tech)) { targets.add(tech); intersection.observe(tech); }
    }
    syncWaves();
    status.fields = document.querySelectorAll('.crud5th-flow-field').length;
    status.techRows = document.querySelectorAll('.crud5th-tech-row').length;
    updateDock();
    update();
  }
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('scroll', updateDock, { passive: true });
  window.addEventListener('resize', () => { updateDock(); for (const wave of waves.values()) if (wave.shapes) paint(wave); }, { passive: true });
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  window.__crud5thCyberFlow = { status, sync, waveStatus };
  sync();
})();
