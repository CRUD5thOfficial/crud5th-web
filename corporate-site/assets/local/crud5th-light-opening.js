/* Five refracting light streams, drawn locally without textures or external dependencies. */
(() => {
  'use strict';
  if (window.__crud5thLightOpening) return;
  const status = { mounts: 0, disposals: 0, active: false, raf: false };
  let current = null;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = v => 1 - Math.pow(1 - clamp(v), 3);
  function create(host) {
    const canvas = host.querySelector('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return { host, dispose() {} };
    const abort = new AbortController();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, raf = 0, started = performance.now(), complete = false, disposed = false;
    let scrollProgress = 0;
    status.mounts++; status.active = true;
    function draw(now) {
      raf = 0; status.raf = false;
      if (disposed || !host.isConnected) return;
      const time = motion.matches ? 3.2 : (now - started) / 1000;
      const arrival = ease((time - .05) / 1.65);
      const settle = ease((time - 1.2) / 1.9);
      const spread = Math.max(settle * .66, scrollProgress);
      const cx = width * .5, cy = height * (.66 + spread * .14);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';
      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, width * .55);
      glow.addColorStop(0, `rgba(48,209,224,${.19 * arrival * (1 - spread * .6)})`);
      glow.addColorStop(.35, 'rgba(21,121,162,.055)'); glow.addColorStop(1, 'rgba(0,30,52,0)');
      context.fillStyle = glow; context.fillRect(0, 0, width, height);
      for (let line = 0; line < 5; line++) {
        const phase = line * .31;
        const side = line % 2 ? -1 : 1;
        const travel = clamp((time - line * .095) / 1.6);
        const start = 1 - ease(travel);
        const vertices = [];
        for (let step = 0; step <= 100; step++) {
          const u = start + (1 - start) * step / 100;
          const reach = (1 - u) * (1 - u);
          const x = cx + side * (width * (.73 + line * .06) * reach + spread * width * (.09 + line * .055) * Math.sin(u * Math.PI));
          const y = cy + (height * (.38 + line * .085) * (1 - u)) - Math.sin(u * Math.PI) * height * (.22 + line * .034 + spread * .26);
          vertices.push([x, y]);
        }
        const gradient = context.createLinearGradient(0, height, width, height * .3);
        gradient.addColorStop(0, 'rgba(18,112,158,0)'); gradient.addColorStop(.32, 'rgba(30,142,188,.3)');
        gradient.addColorStop(.62, 'rgba(56,232,241,.8)'); gradient.addColorStop(.82, 'rgba(215,253,255,.8)'); gradient.addColorStop(1, 'rgba(56,232,241,0)');
        function stroke(offset, lineWidth, alpha) {
          context.beginPath(); vertices.forEach(([x, y], i) => i ? context.lineTo(x, y + offset * Math.sin(i / 100 * Math.PI)) : context.moveTo(x, y));
          context.strokeStyle = gradient; context.lineWidth = lineWidth; context.globalAlpha = alpha * arrival; context.stroke();
        }
        stroke(0, width > 700 ? 18 : 12, .055);
        stroke(0, 6, .12);
        stroke(0, line === 2 ? 2.2 : 1.2, .84);
        stroke(7 + line * 2, .7, .2);
        if (!complete && time < 2.7) {
          const tip = clamp((time * (.65 + phase) - phase) % 1);
          const index = Math.floor(tip * (vertices.length - 1));
          const [x, y] = vertices[index];
          const flare = context.createRadialGradient(x, y, 0, x, y, 16);
          flare.addColorStop(0, 'rgba(226,255,255,.85)'); flare.addColorStop(.15, 'rgba(56,232,241,.65)'); flare.addColorStop(1, 'rgba(56,232,241,0)');
          context.globalAlpha = .55; context.fillStyle = flare; context.fillRect(x - 16, y - 16, 32, 32);
        }
      }
      context.globalAlpha = 1; context.globalCompositeOperation = 'source-over';
      if (time < 3.2 && !motion.matches && !document.hidden && host.getBoundingClientRect().bottom > 0) schedule();
      else { complete = true; host.dataset.phase = 'settled'; }
    }
    function schedule() { if (!raf && !disposed) { raf = requestAnimationFrame(draw); status.raf = true; } }
    function resize() {
      width = host.clientWidth; height = host.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0);
      updateScroll();
    }
    function updateScroll() {
      const heroRect = host.getBoundingClientRect();
      scrollProgress = clamp(-heroRect.top / Math.max(height * .8, 1));
      const about = document.querySelector('.home_about');
      const aboutRect = about?.getBoundingClientRect();
      const menu = document.querySelector('.menu');
      const copyright = document.querySelector('.copyright_text');
      if (aboutRect && aboutRect.top <= 100 && aboutRect.bottom > 100) {
        document.body.dataset.crud5thOpeningSurface = 'about';
        if (menu) menu.dataset.type = 'black';
        if (copyright) copyright.style.color = '#07151f';
      } else if (heroRect.bottom > 100) {
        document.body.dataset.crud5thOpeningSurface = 'hero';
        if (menu) menu.dataset.type = 'white';
        if (copyright) copyright.style.color = '#f6f9fc';
      } else delete document.body.dataset.crud5thOpeningSurface;
      schedule();
    }
    function changed() { if (motion.matches) host.dataset.phase = 'settled'; schedule(); }
    function skip() {
      complete = true; started = performance.now() - 3200; host.dataset.phase = 'settled';
      host.querySelectorAll('.crud5th-light-heading > *').forEach(e => { e.style.animation = 'none'; });
      const about = document.querySelector('.home_about');
      if (about) {
        const scrollToAbout = host.closest('.home_kv')?.__crud5thOpeningScrollTo;
        if (scrollToAbout) scrollToAbout(about);
        else window.scrollTo({ top: about.getBoundingClientRect().top + scrollY, behavior: 'instant' });
      }
      schedule();
    }
    window.addEventListener('resize', resize, { signal: abort.signal, passive: true });
    window.addEventListener('scroll', updateScroll, { signal: abort.signal, passive: true });
    document.addEventListener('visibilitychange', changed, { signal: abort.signal });
    motion.addEventListener('change', changed, { signal: abort.signal });
    host.querySelector('button').addEventListener('click', skip, { signal: abort.signal });
    resize();
    return { host, dispose() { disposed = true; abort.abort(); cancelAnimationFrame(raf); raf = 0; delete document.body.dataset.crud5thOpeningSurface; status.raf = false; status.active = false; status.disposals++; } };
  }
  function sync() {
    const host = document.querySelector('.crud5th-light-opening');
    if (current?.host === host) return;
    current?.dispose(); current = host ? create(host) : null;
  }
  // Swup swaps #swup without re-executing persistent head scripts.
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  window.__crud5thLightOpening = { status, sync };
  sync();
})();
