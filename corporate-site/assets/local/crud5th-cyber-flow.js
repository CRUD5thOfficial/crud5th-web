/* One background clock drives the peripheral orbits; scene/3D transforms stay owned by GSAP. */
(() => {
  'use strict';
  if (window.__crud5thCyberFlow) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const status = { fields: 0, activeFields: 0, techRows: 0, hidden: document.hidden, reduced: reduced.matches };
  const targets = new Set();
  const visible = new Set();
  const fields = new Map();
  const waveStatus = { frames: 0, instances: 0, running: false, time: 0 };
  const selector = '.crud5th-light-opening,.home_about,.home_works,.home_service,.home_awards,.home_member,.home_recruit,.footer_content,.pageHead,.about_mission,.about_vision,.about_value,.about_outline,.service_businessFiled,.service_solution,.service_faq,.works_detail_header,.works_detail_content,.works_detail_footer_back,.recruit_message,.recruit_positions';
  let frame = 0, last = 0, elapsed = 0;
  const view = { height: innerHeight };
  function paintHeroBezel(ctx, width, height) {
    const small = width < 768;
    const radius = Math.min(width * (small ? .55 : .33), height * .46);
    const turn = Math.PI * 2;
    ctx.save();
    ctx.translate(width * (small ? .67 : .62), height * (small ? .37 : .46));
    ctx.strokeStyle = 'rgba(74,40,124,.24)'; ctx.lineWidth = .7;
    for (const ratio of [.72, .91, 1]) {
      ctx.beginPath(); ctx.arc(0, 0, radius * ratio, 0, turn); ctx.stroke();
    }

    ctx.save(); ctx.rotate(elapsed * turn / 120);
    for (let tick = 0; tick < 96; tick++) {
      const angle = tick * turn / 96;
      const major = tick % 8 === 0;
      const inner = radius * (major ? .927 : .956);
      const outer = radius * .985;
      ctx.strokeStyle = `rgba(74,40,124,${major ? .53 : .32})`;
      ctx.lineWidth = major ? 1.5 : .7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(23,23,23,.33)'; ctx.lineWidth = 2;
    for (let arc = 0; arc < 3; arc++) {
      const start = arc * turn / 3 + .12;
      ctx.beginPath(); ctx.arc(0, 0, radius * 1.014, start, start + .82); ctx.stroke();
    }
    ctx.restore();

    ctx.save(); ctx.rotate(-elapsed * turn / 180 + .34);
    ctx.strokeStyle = 'rgba(74,40,124,.32)'; ctx.lineWidth = 1.1;
    for (let arc = 0; arc < 4; arc++) {
      const start = arc * turn / 4;
      ctx.beginPath(); ctx.arc(0, 0, radius * .84, start, start + 1.08); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, radius * .825, start + .1, start + .65); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(74,40,124,.16)'; ctx.lineWidth = .65;
    ctx.beginPath();
    for (let corner = 0; corner <= 6; corner++) {
      const angle = corner * turn / 6;
      const x = Math.cos(angle) * radius * .58, y = Math.sin(angle) * radius * .58;
      if (!corner) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();

    ctx.save(); ctx.rotate(elapsed * turn / 240 - .2);
    for (let marker = 0; marker < 4; marker++) {
      ctx.save(); ctx.rotate(marker * turn / 4); ctx.translate(radius * .875, 0);
      ctx.strokeStyle = 'rgba(74,40,124,.58)'; ctx.fillStyle = 'rgba(248,249,250,.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(23,23,23,.3)';
      ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.stroke();
      ctx.restore();
    }
    ctx.restore(); ctx.restore();
  }
  function paintGear(ctx, x, y, radius, teeth, rotation, ink, opacity) {
    const turn = Math.PI * 2, pitch = turn / teeth;
    const depth = radius / teeth * 1.7;
    const root = radius - depth * .55, tip = radius + depth * .45;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(${ink},${opacity})`; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let tooth = 0; tooth < teeth; tooth++) {
      for (const [part, r] of [[-.5, root], [-.31, root], [-.19, tip], [.19, tip], [.31, root], [.5, root]]) {
        const angle = (tooth + part) * pitch;
        const px = Math.cos(angle) * r, py = Math.sin(angle) * r;
        if (!tooth && part === -.5) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = `rgba(${ink},${opacity * .55})`; ctx.lineWidth = .7;
    for (const ratio of [.85, .78, .2]) {
      ctx.beginPath(); ctx.arc(0, 0, radius * ratio, 0, turn); ctx.stroke();
    }
    for (let spoke = 0; spoke < 4; spoke++) {
      const angle = spoke * turn / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * .22, Math.sin(angle) * radius * .22);
      ctx.lineTo(Math.cos(angle) * radius * .76, Math.sin(angle) * radius * .76); ctx.stroke();
    }
    ctx.restore();
  }
  function paintGearPair(ctx, x, y, radius, bearing, ink, opacity) {
    const turn = Math.PI * 2;
    // Equal tooth size and pitch-line speed keep the 32:20 pair mechanically linked.
    const mateRadius = radius * 20 / 32;
    paintGear(ctx, x, y, radius, 32, bearing + elapsed * turn / 120, ink, opacity);
    paintGear(ctx, x + Math.cos(bearing) * (radius + mateRadius), y + Math.sin(bearing) * (radius + mateRadius),
      mateRadius, 20, bearing + Math.PI + Math.PI / 20 - elapsed * turn / 75, ink, opacity);
  }
  function paintGears(ctx, width, height, dark, hero) {
    const small = width < 768, ink = dark ? '198,181,248' : '74,40,124';
    const radius = Math.min(width * (small ? .57 : .25), height * .43);
    paintGearPair(ctx, width * (small ? 1.16 : 1.025), height * (hero ? .3 : .58), radius, -2.25, ink, dark ? .52 : .43);
    if (!small) paintGearPair(ctx, -width * .08, height * .78, radius * .72, -.64, ink, dark ? .37 : .3);
  }
  function paintOrbits(field, ornament) {
    const { canvas, context: ctx, dark, hero } = ornament;
    // Keep one viewport-sized leaf inside a long section, without stretching its circles.
    const ratio = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.25 : 1.5);
    const width = Math.max(1, field.clientWidth), height = Math.max(1, Math.min(field.clientHeight, view.height * 1.25));
    const pixelWidth = Math.round(width * ratio), pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth; canvas.height = pixelHeight; canvas.style.height = `${height}px`;
    }
    const canvasOffset = field.clientHeight > height ? Math.max(0, Math.min(field.clientHeight - height, -field.getBoundingClientRect().top)) : 0;
    if (ornament.canvasOffset !== canvasOffset) {
      ornament.canvasOffset = canvasOffset; canvas.style.transform = `translateY(${canvasOffset}px)`;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
    if (hero) paintHeroBezel(ctx, width, height);
    paintGears(ctx, width, height, dark, hero);
    waveStatus.frames++; waveStatus.time = elapsed;
  }
  function canRun() { return !reduced.matches && !document.hidden && [...fields.keys()].some(field => visible.has(field)); }
  function tick(now) {
    frame = 0;
    if (!canRun()) { last = 0; waveStatus.running = false; return; }
    if (!last || now - last >= 32) {
      if (last) elapsed += Math.min(now - last, 70) / 1000;
      last = now;
      for (const [field, ornament] of fields) if (visible.has(field)) paintOrbits(field, ornament);
    }
    waveStatus.running = true; frame = requestAnimationFrame(tick);
  }
  function update() {
    const stopped = reduced.matches || document.hidden;
    document.body.dataset.crud5thFlow = stopped ? 'paused' : 'running';
    status.hidden = document.hidden; status.reduced = reduced.matches;
    status.activeFields = [...visible].filter(field => field.isConnected && fields.has(field)).length;
    if (canRun()) { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
    else { cancelAnimationFrame(frame); frame = 0; last = 0; waveStatus.running = false; }
  }
  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.dataset.flowActive = String(entry.isIntersecting);
      if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      const ornament = fields.get(entry.target);
      if (entry.isIntersecting && ornament && reduced.matches) paintOrbits(entry.target, ornament);
    }
    update();
  }, { rootMargin: '80px' });
  function sync() {
    for (const target of targets) {
      if (!target.isConnected) { intersection.unobserve(target); targets.delete(target); visible.delete(target); fields.delete(target); }
    }
    for (const section of document.querySelectorAll(selector)) {
      let field = [...section.children].find(child => child.classList.contains('crud5th-flow-field'));
      if (!field) { field = document.createElement('div'); field.className = 'crud5th-flow-field'; field.setAttribute('aria-hidden', 'true'); section.prepend(field); }
      if (!targets.has(field)) {
        const canvas = document.createElement('canvas'); canvas.className = 'crud5th-orbit-canvas'; canvas.setAttribute('aria-hidden', 'true');
        const context = canvas.getContext('2d', { alpha: true });
        if (context) {
          const ornament = { canvas, context, dark: section.matches('.home_about,.home_service,.home_awards,.home_member,.footer_content,.works_detail_header,.works_detail_footer_back,.about_mission,.about_value,.service_businessFiled,.service_faq,.recruit_message,.recruit_positions'), hero: section.matches('.crud5th-light-opening') };
          field.append(canvas); fields.set(field, ornament);
        }
        targets.add(field); intersection.observe(field);
      }
    }
    for (const tech of document.querySelectorAll('.crud5th-tech')) if (!targets.has(tech)) { targets.add(tech); intersection.observe(tech); }
    waveStatus.instances = fields.size; status.fields = fields.size;
    status.techRows = document.querySelectorAll('.crud5th-tech-row').length; update();
  }
  reduced.addEventListener('change', () => { if (reduced.matches) for (const [field, ornament] of fields) if (visible.has(field)) paintOrbits(field, ornament); update(); });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('scroll', () => {
    if (reduced.matches && !document.hidden) for (const [field, ornament] of fields) if (visible.has(field)) paintOrbits(field, ornament);
  }, { passive: true });
  window.addEventListener('resize', () => { view.height = innerHeight; for (const [field, ornament] of fields) if (visible.has(field)) paintOrbits(field, ornament); }, { passive: true });
  const observer = new MutationObserver(sync); observer.observe(document.body, { childList: true, subtree: true });
  window.__crud5thCyberFlow = { status, sync, waveStatus };
  sync();
})();
