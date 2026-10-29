/* Five refracting light streams, drawn locally without textures or external dependencies. */
(() => {
  'use strict';
  if (window.__crud5thLightOpening) return;
  const status = { mounts: 0, disposals: 0, active: false, raf: false, liquidMounts: 0, liquidDisposals: 0, liquidFrames: 0, liquidTime: 0, liquidRunning: false, liquidSize: [0, 0], liquidFallback: false };
  const liquidImageUrl = new URL('./liquid-metal-mint.webp', document.currentScript.src).href;
  let current = null, liquid = null;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = v => 1 - Math.pow(1 - clamp(v), 3);
  function createLiquidRenderer(host) {
    const canvas = document.createElement('canvas');
    canvas.className = 'crud5th-liquid-canvas'; canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) { status.liquidFallback = true; return { dispose() {} }; }
    const abort = new AbortController();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let disposed = false, loaded = false, lost = false, frame = 0, last = 0, elapsed = 0;
    let width = 1, height = 1;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const vertexSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() { vUv = aPosition * .5 + .5; gl_Position = vec4(aPosition, 0., 1.); }
    `;
    const fragmentSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uImage;
      uniform vec2 uView;
      uniform vec2 uImageSize;
      uniform vec2 uPointer;
      uniform float uTime;
      vec2 cover(vec2 uv) {
        float viewAspect = uView.x / uView.y;
        float imageAspect = uImageSize.x / uImageSize.y;
        vec2 scale = vec2(min(viewAspect / imageAspect, 1.), min(imageAspect / viewAspect, 1.));
        return .5 + (uv - .5) * scale;
      }
      vec3 environment(vec2 uv) { return texture2D(uImage, clamp(uv, .002, .998)).rgb; }
      float centerline(float x) {
        return .77 + .105 * sin(x * 4.7 - uTime * .23) + .035 * sin(x * 8.2 + uTime * .17);
      }
      void main() {
        vec2 uv = vec2(vUv.x, 1. - vUv.y);
        float time = uTime;
        // Two broad counter-currents deform the outer material, leaving the reading plane calm.
        float outer = smoothstep(.19, .63, length((uv - vec2(.52,.39)) * vec2(1.,1.2)));
        vec2 flow = vec2(sin(uv.y * 5.6 + time * .19 + sin(uv.x * 4.1 - time * .11)),
                         cos(uv.x * 4.8 - time * .16 + sin(uv.y * 4.3 + time * .13)));
        vec2 warped = uv + flow * vec2(.048,.04) * outer + uPointer * .007 * outer;
        vec3 color = environment(cover(warped));
        // The foreground is a changing curved liquid volume: its silhouette and reflections
        // share the same centerline, thickness and surface normal, rather than a moving bitmap.
        float center = centerline(uv.x) + uPointer.y * .008;
        float thickness = .072 + .018 * sin(uv.x * 5.4 + time * .21) + .01 * cos(uv.x * 9. - time * .14);
        float crossSection = (uv.y - center) / thickness;
        float silhouette = 1. - smoothstep(.96, 1., abs(crossSection));
        float slope = (centerline(uv.x + .003) - centerline(uv.x - .003)) / .006;
        float z = sqrt(max(.002, 1. - crossSection * crossSection));
        vec3 normal = normalize(vec3(-slope * crossSection, crossSection, z * 1.35));
        vec2 reflectedUv = vec2(.5 + normal.x * .49 + sin(uv.x * 3. + time * .12) * .12,
                                .57 + normal.y * .39 + time * .009);
        vec3 reflected = environment(vec2(clamp(reflectedUv.x,.01,.99), fract(reflectedUv.y)));
        float fresnel = pow(1. - max(normal.z, 0.), 2.);
        float gleam = pow(max(0., dot(normal, normalize(vec3(-.35,-.6,1.)))), 24.);
        vec3 silver = mix(reflected, vec3(.93,.95,.96), .2);
        silver = mix(silver, vec3(.42,.75,.66), .12 + .1 * z);
        silver = mix(silver, vec3(.97,.98,.99), fresnel * .62 + gleam * .58);
        color = mix(color, silver, silhouette * .96);
        gl_FragColor = vec4(color, 1.);
      }
    `;
    const shaders = [];
    const program = gl.createProgram();
    let buffer = null, texture = null, released = false;
    function release() {
      if (released) return;
      released = true;
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    }
    function fallback() {
      loaded = false; status.liquidFallback = true; status.liquidRunning = false;
      cancelAnimationFrame(frame); frame = 0; last = 0;
      delete host.dataset.liquidReady;
      canvas.style.visibility = 'hidden';
    }
    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexSource), fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!program || !vertex || !fragment) { release(); fallback(); return { dispose() {} }; }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { release(); fallback(); return { dispose() {} }; }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) { release(); fallback(); return { dispose() {} }; }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    if (!texture) { release(); fallback(); return { dispose() {} }; }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const uniforms = Object.fromEntries(['uImage','uView','uImageSize','uPointer','uTime'].map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform1i(uniforms.uImage, 0);
    function paint() {
      if (!loaded || disposed || lost) return;
      gl.uniform2f(uniforms.uView, width, height);
      gl.uniform2f(uniforms.uPointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.uTime, motion.matches ? 0 : elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      status.liquidFrames++; status.liquidTime = elapsed;
    }
    function canRun() { return loaded && !disposed && !lost && !document.hidden && !motion.matches && host.isConnected; }
    function tick(now) {
      frame = 0;
      if (!canRun()) { last = 0; status.liquidRunning = false; return; }
      if (!last || now - last >= 1000 / 30) {
        if (last) elapsed += Math.min(now - last, 70) / 1000;
        last = now;
        pointer.x += (pointer.targetX - pointer.x) * .1; pointer.y += (pointer.targetY - pointer.y) * .1;
        paint();
      }
      status.liquidRunning = true; frame = requestAnimationFrame(tick);
    }
    function update() {
      if (canRun()) { if (!frame) frame = requestAnimationFrame(tick); }
      else {
        cancelAnimationFrame(frame); frame = 0; last = 0; status.liquidRunning = false;
        if (!document.hidden) paint();
      }
    }
    function resize() {
      width = Math.max(1, host.clientWidth); height = Math.max(1, host.clientHeight);
      const maxWidth = width < 768 ? 560 : 1280;
      const ratio = Math.min(1, maxWidth / width, Math.sqrt(1000000 / (width * height)));
      canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height); status.liquidSize = [canvas.width, canvas.height];
      if (!document.hidden) paint(); update();
    }
    function neutralPointer() { pointer.targetX = 0; pointer.targetY = 0; }
    window.addEventListener('pointermove', event => {
      if (!finePointer.matches || event.pointerType === 'touch' || motion.matches) return;
      pointer.targetX = clamp(event.clientX / width * 2 - 1, -1, 1);
      pointer.targetY = clamp(event.clientY / height * 2 - 1, -1, 1);
    }, { passive: true, signal: abort.signal });
    document.documentElement.addEventListener('pointerleave', neutralPointer, { passive: true, signal: abort.signal });
    window.addEventListener('blur', neutralPointer, { signal: abort.signal });
    finePointer.addEventListener('change', neutralPointer, { signal: abort.signal });
    motion.addEventListener('change', () => { neutralPointer(); pointer.x = 0; pointer.y = 0; update(); }, { signal: abort.signal });
    window.addEventListener('resize', resize, { passive: true, signal: abort.signal });
    document.addEventListener('visibilitychange', update, { signal: abort.signal });
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; fallback(); }, { signal: abort.signal });
    host.append(canvas);
    const image = new Image();
    image.onload = () => {
      if (disposed || lost) return;
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        if (gl.getError() !== gl.NO_ERROR) { release(); fallback(); return; }
        gl.uniform2f(uniforms.uImageSize, image.naturalWidth, image.naturalHeight);
        loaded = true; status.liquidFallback = false; host.dataset.liquidReady = 'true'; resize();
      } catch { release(); fallback(); }
    };
    image.onerror = fallback; image.src = liquidImageUrl;
    return { dispose() {
      disposed = true; abort.abort(); cancelAnimationFrame(frame);
      image.onload = null; image.onerror = null; release(); canvas.remove();
      delete host.dataset.liquidReady; status.liquidRunning = false;
    } };
  }
  function createLiquidStage(home) {
    const stage = document.createElement('div');
    stage.className = 'crud5th-liquid-stage'; stage.setAttribute('aria-hidden', 'true');
    document.body.prepend(stage);
    const renderer = createLiquidRenderer(stage);
    status.liquidMounts++;
    return { home, dispose() {
      renderer.dispose(); stage.remove(); status.liquidDisposals++;
    } };
  }
  function create(host) {
    const canvas = host.querySelector('.crud5th-light-canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return { host, dispose() {} };
    const abort = new AbortController();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, raf = 0, started = performance.now(), complete = false, disposed = false;
    let scrollProgress = 0;
    status.mounts++; status.active = true;
    function drawReflections(time) {
      if (time <= .05 || time >= 3.2) return;
      const envelope = ease((time - .05) / .55) * (1 - ease((time - 2.25) / .95));
      const reach = width + height * .65;
      const progress = clamp((time - .1) / 2.9);
      const sweep = reach * (-.35 + 1.7 * progress * progress * (3 - 2 * progress));
      const band = Math.max(width * .2, 130);
      // Unequal, broad facets only become visible where the single reflection passes.
      const facets = [
        [[-.12, .03], [.22, -.12], [.37, .49], [-.03, .66]],
        [[.29, -.18], [.66, -.04], [.53, .43], [.18, .28]],
        [[.76, -.08], [1.13, .12], [.91, .75], [.61, .52]],
        [[-.12, .76], [.33, .53], [.55, 1.14], [.04, 1.2]],
        [[.66, .65], [1.12, .46], [1.18, 1.18], [.49, 1.09]]
      ];
      context.save();
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = envelope;
      facets.forEach((facet, index) => {
        context.beginPath();
        facet.forEach(([x, y], point) => point ? context.lineTo(x * width, y * height) : context.moveTo(x * width, y * height));
        context.closePath();
        const reflection = context.createLinearGradient(sweep - band, 0, sweep + band, height * .65);
        reflection.addColorStop(0, 'rgba(74,40,124,0)');
        reflection.addColorStop(.35, 'rgba(130,93,189,.025)');
        reflection.addColorStop(.49, `rgba(198,181,248,${index % 2 ? .13 : .19})`);
        reflection.addColorStop(.55, 'rgba(253,254,253,.07)');
        reflection.addColorStop(.76, 'rgba(74,40,124,.025)');
        reflection.addColorStop(1, 'rgba(74,40,124,0)');
        context.fillStyle = reflection;
        context.fill();
        const edge = context.createLinearGradient(sweep - band, 0, sweep + band, height * .65);
        edge.addColorStop(0, 'rgba(176,144,235,0)');
        edge.addColorStop(.4, 'rgba(176,144,235,0)');
        edge.addColorStop(.5, 'rgba(253,254,253,.34)');
        edge.addColorStop(.64, 'rgba(176,144,235,.05)');
        edge.addColorStop(1, 'rgba(176,144,235,0)');
        context.strokeStyle = edge;
        context.lineWidth = .8;
        context.stroke();
      });
      // Keep both the title and the Japanese claim clear while reflections cross behind them.
      context.globalCompositeOperation = 'destination-out';
      context.globalAlpha = 1;
      context.translate(width * .5, height * .43);
      context.scale(width * .52, height * .3);
      const readable = context.createRadialGradient(0, 0, 0, 0, 0, 1);
      readable.addColorStop(0, 'rgba(0,0,0,.96)');
      readable.addColorStop(.66, 'rgba(0,0,0,.9)');
      readable.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = readable;
      context.fillRect(-1, -1, 2, 2);
      context.restore();
    }
    function draw(now) {
      raf = 0; status.raf = false;
      if (disposed || !host.isConnected) return;
      const time = motion.matches ? 3.2 : (now - started) / 1000;
      const arrival = ease((time - .05) / 1.65);
      const settle = ease((time - 1.2) / 1.9);
      const spread = Math.max(settle * .66, scrollProgress);
      const cx = width * .5, cy = height * (.66 + spread * .14);
      context.clearRect(0, 0, width, height);
      drawReflections(time);
      context.globalCompositeOperation = 'source-over';
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
        gradient.addColorStop(0, 'rgba(74,40,124,0)'); gradient.addColorStop(.32, 'rgba(74,40,124,.3)');
        gradient.addColorStop(.62, 'rgba(74,40,124,.8)'); gradient.addColorStop(.82, 'rgba(198,181,248,.8)'); gradient.addColorStop(1, 'rgba(74,40,124,0)');
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
          flare.addColorStop(0, 'rgba(253,254,253,.85)'); flare.addColorStop(.15, 'rgba(74,40,124,.65)'); flare.addColorStop(1, 'rgba(74,40,124,0)');
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
        if (copyright) copyright.style.color = '#171717';
      } else if (heroRect.bottom > 100) {
        document.body.dataset.crud5thOpeningSurface = 'hero';
        if (menu) menu.dataset.type = 'white';
        if (copyright) copyright.style.color = '#171717';
      } else delete document.body.dataset.crud5thOpeningSurface;
      schedule();
    }
    function changed() { if (motion.matches) host.dataset.phase = 'settled'; schedule(); }
    function skip() {
      complete = true; started = performance.now() - 3200; host.dataset.phase = 'settled';
      host.querySelectorAll('.crud5th-light-heading > *, .crud5th-motion-letter').forEach(e => { e.style.animation = 'none'; });
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
    if (liquid?.home !== host) {
      liquid?.dispose(); liquid = host ? createLiquidStage(host) : null;
    }
    if (current?.host === host) return;
    current?.dispose(); current = host ? create(host) : null;
  }
  // Swup swaps #swup without re-executing persistent head scripts.
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  window.__crud5thLightOpening = { status, sync };
  sync();
})();
