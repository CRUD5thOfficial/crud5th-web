/* Leaf motion stays separate from the scene's GSAP transforms and 3D parents. */
(() => {
  'use strict';
  if (window.__crud5thElementMotion) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let cinemaSection = null, cinemaFrame = 0, cinemaProgress = -1;
  function requestCinemaUpdate() {
    if (!document.hidden && !cinemaFrame) cinemaFrame = requestAnimationFrame(updateCinemaDimming);
  }
  function updateCinemaDimming() {
    cinemaFrame = 0;
    if (!cinemaSection?.isConnected) return;
    const scrollArea = cinemaSection.querySelector('.home_recruit_scrollArea');
    if (!scrollArea) return;
    const sectionTop = cinemaSection.getBoundingClientRect().top;
    const areaTop = scrollArea.getBoundingClientRect().top;
    // Dim the room as the existing pinned card approaches its viewing area.
    const distance = Math.max(areaTop - sectionTop - innerHeight * .25, innerHeight * .3);
    const progress = reduced.matches ? 0 : Math.max(0, Math.min(1, -sectionTop / distance));
    if (Math.abs(progress - cinemaProgress) < .0001) return;
    cinemaProgress = progress;
    const from = progress < .65 ? [198, 181, 248] : [41, 27, 59];
    const to = progress < .65 ? [41, 27, 59] : [13, 12, 16];
    const amount = progress < .65 ? progress / .65 : (progress - .65) / .35;
    const color = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
    const linear = color.map(channel => {
      const value = channel / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    const luminance = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    // Interpolating opposing text/background colors would lose contrast halfway.
    cinemaSection.style.setProperty('--cinema-ink', luminance < .179 ? '#fff' : '#000');
    cinemaSection.style.setProperty('--cinema-stage', `rgb(${color.join(',')})`);
    cinemaSection.style.setProperty('--cinema-highlight', .6 * Math.max(0, 1 - progress / .2) ** 2);
    cinemaSection.style.setProperty('--cinema-vignette', Math.max(0, (progress - .4) / .6) * .45);
    cinemaSection.style.setProperty('--cinema-ornament', Math.max(0, 1 - progress / .25));
    cinemaSection.dataset.cinemaReady = 'true';
  }
  function syncMotionVisibility() {
    document.documentElement.dataset.crud5thMotionPaused = String(document.hidden);
    if (document.hidden) { cancelAnimationFrame(cinemaFrame); cinemaFrame = 0; }
    else requestCinemaUpdate();
  }
  document.addEventListener('visibilitychange', syncMotionVisibility);
  syncMotionVisibility();
  const observed = new Set();
  const revealSelector = '.catalog-section-intro,.catalog-service-intro,.crud5th-tech-eyebrow,.crud5th-tech-intro,.crud5th-tech-category,.pageHead_text,.sectionTitle_ja';
  const reveal = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.dataset.crud5thReveal = 'visible';
      reveal.unobserve(target);
      observed.delete(target);
    }
  }, { threshold: .12, rootMargin: '0px 0px -4% 0px' });
  const scenes = [
    ['.crud5th-light-opening', '01', 'HOME'],
    ['.home_kv--light + .home_about', '02', 'ABOUT'],
    ['.home_works', '03', 'PRODUCTS'],
    ['.home_service', '04', 'SERVICES'],
    ['.home_awards', '05', 'METHOD'],
    ['.home_member', '06', 'MEMBER'],
    ['.home_recruit', '07', 'PRODUCTS']
  ];
  function createGearSeam(width, teeth) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const compact = width < 768;
    svg.setAttribute('viewBox', `0 0 ${width} ${compact ? 76 : 144}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('focusable', 'false');
    svg.dataset.seamSize = compact ? 'compact' : 'wide';
    const radius = width * 1.14;
    const halfChord = width / 4;
    const angle = Math.asin(halfChord / radius);
    const baseline = compact ? 34 : 66;
    const depth = compact ? 7 : 16;
    const rise = Math.sqrt(radius ** 2 - halfChord ** 2);
    const edges = [], tracks = [], ticks = [];
    for (let side = 0; side < 2; side++) {
      const centerX = width * (side ? .75 : .25);
      const centerY = baseline + (side ? rise : -rise);
      const start = (side ? -Math.PI / 2 : Math.PI / 2) + (side ? -angle : angle);
      const sweep = (side ? 2 : -2) * angle;
      const point = (fraction, offset = 0) => {
        const theta = start + sweep * fraction;
        return `${(centerX + (radius + offset) * Math.cos(theta)).toFixed(2)},${(centerY + (radius + offset) * Math.sin(theta)).toFixed(2)}`;
      };
      // Radial flanks and broad tooth tips follow two opposing wheel arcs.
      for (let tooth = 0; tooth < teeth; tooth++) {
        for (const [step, offset] of [[0, 0], [.22, depth], [.62, depth], [.84, 0]]) {
          edges.push(point((tooth + step) / teeth, offset));
        }
        const fraction = (tooth + .42) / teeth;
        const inset = side ? 1 : -1;
        ticks.push(`M${point(fraction, inset * depth * 1.9)}L${point(fraction, inset * depth * 2.35)}`);
      }
      edges.push(point(1));
      const inset = (side ? 1 : -1) * depth * 1.35;
      tracks.push(`M${point(0, inset)}A${radius + inset},${radius + inset} 0 0 ${side ? 1 : 0} ${point(1, inset)}`);
    }
    const edge = `M${edges.join('L')}`;
    for (const [name, d] of [['surface', `M0,-2H${width}V${baseline}L${edges.slice().reverse().join('L')}Z`], ['edge', edge], ['track', tracks.join('')], ['ticks', ticks.join('')]]) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', `crud5th-gear-${name}`);
      path.setAttribute('d', d);
      svg.append(path);
    }
    return svg;
  }
  function syncSceneStructure() {
    for (const [selector, number, label] of scenes) {
      const section = document.querySelector(selector);
      if (!section || section.querySelector(':scope > .crud5th-scene-heading')) continue;
      const heading = document.createElement('div');
      heading.className = 'crud5th-scene-heading';
      heading.setAttribute('aria-hidden', 'true');
      const numeral = document.createElement('span'); numeral.className = 'crud5th-scene-number'; numeral.textContent = number;
      const strap = document.createElement('span'); strap.className = 'crud5th-scene-strap'; strap.textContent = label;
      heading.append(numeral, strap); section.append(heading);
    }
    for (const selector of ['.home_works', '.home_service', '.home_awards', '.home_member', '.home_recruit']) {
      const section = document.querySelector(selector);
      if (!section || section.querySelector(':scope > .crud5th-gear-seam')) continue;
      const seam = document.createElement('div');
      seam.className = 'crud5th-gear-seam';
      seam.setAttribute('aria-hidden', 'true');
      seam.append(createGearSeam(1440, 16), createGearSeam(390, 7));
      section.prepend(seam);
      section.dataset.gearSeam = 'true';
    }
    const hero = document.querySelector('.crud5th-light-opening');
    if (hero && !hero.querySelector('.crud5th-scene-plates')) {
      const plates = document.createElement('div'); plates.className = 'crud5th-scene-plates'; plates.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 3; index++) {
        const plate = document.createElement('div'); plate.className = 'crud5th-scene-plate'; plates.append(plate);
      }
      hero.prepend(plates);
    }
  }
  let memberAnchorPending = location.pathname === '/' && location.hash === '#member';
  function syncMemberAnchor() {
    if (!memberAnchorPending || location.pathname !== '/' || location.hash !== '#member') return;
    const member = document.getElementById('member');
    const menu = document.querySelector('.menu');
    // HOME finishes texture loading before constructing all seven-layer titles.
    const titles = [...document.querySelectorAll('main [data-rep-txt]')];
    if (!titles.length || !titles.every(title => title.classList.contains('text-repeat')
      && title.querySelectorAll(':scope > [data-rep-txt-item]').length === 7)) return;
    // Lenis resumes after the menu has closed and the page's pins are measured.
    if (!member || document.body.dataset.transitioned !== 'true'
      || document.documentElement.dataset.hidden === 'true'
      || menu?.dataset.menuOpen === 'true' || menu?.dataset.menuActive === 'true') return;
    memberAnchorPending = false;
    const scrollTo = document.querySelector('.home_kv--light')?.__crud5thOpeningScrollTo;
    if (scrollTo) scrollTo(member);
    else member.scrollIntoView({ block: 'start', behavior: 'instant' });
    member.focus({ preventScroll: true });
  }
  document.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(anchor.href, location.href);
    if (destination.origin !== location.origin || destination.pathname !== '/' || destination.hash !== '#member' || location.pathname !== '/') return;
    event.preventDefault();
    memberAnchorPending = true;
    const menu = anchor.closest('.menu');
    if (anchor.closest('.menu_nav') && (menu?.dataset.menuOpen === 'true' || menu?.dataset.menuActive === 'true')) {
      menu.querySelector('.menu_btn')?.click();
    }
    if (location.hash !== '#member') location.hash = '#member';
    else syncMemberAnchor();
  }, true);
  window.addEventListener('hashchange', () => {
    memberAnchorPending = location.pathname === '/' && location.hash === '#member';
    syncNavigation();
  });
  window.addEventListener('pageshow', syncMemberAnchor);
  function syncNavigation() {
    document.querySelectorAll('.crud5th-route-rail').forEach(rail => rail.remove());
    const menu = document.querySelector('.menu');
    const button = menu?.querySelector('.menu_btn');
    const panel = menu?.querySelector('.menu_nav');
    if (button && panel) {
      const isOpen = menu.getAttribute('data-menu-active') === 'true';
      const attributes = { 'aria-label': isOpen ? 'メニューを閉じる' : 'メニューを開く', 'aria-expanded': String(isOpen), 'aria-controls': 'crud5th-site-menu', type: 'button' };
      if (panel.id !== 'crud5th-site-menu') panel.id = 'crud5th-site-menu';
      for (const [name, value] of Object.entries(attributes)) if (button.getAttribute(name) !== value) button.setAttribute(name, value);
    }
    const inner = document.querySelector('.nav_inner');
    if (inner && !inner.querySelector('.crud5th-nav-brand')) {
      const brand = document.createElement('span');
      brand.className = 'crud5th-nav-brand'; brand.textContent = 'CRUD5th'; brand.setAttribute('aria-hidden', 'true');
      inner.prepend(brand);
    }
    const path = location.pathname.replace(/\/$/, '') || '/';
    for (const link of document.querySelectorAll('.nav_list .nav_item_link')) {
      const destination = new URL(link.href, location.href);
      const href = destination.pathname.replace(/\/$/, '') || '/';
      const current = destination.hash
        ? path === href && location.hash === destination.hash
        : path === href || (href !== '/' && path.startsWith(`${href}/`));
      const currentType = destination.hash ? 'location' : 'page';
      if (current && link.getAttribute('aria-current') !== currentType) link.setAttribute('aria-current', currentType);
      else if (!current && link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
    }
    syncMemberAnchor();
  }
  function syncCursorLabels() {
    for (const [type, label] of [['scroll_down', 'SCROLL DOWN'], ['more_detail', 'VIEW DETAILS']]) {
      for (const text of document.querySelectorAll(`.circleCursor textPath[data-text="${type}"] tspan[data-type="text"]`)) {
        if (text.textContent !== label) text.textContent = label;
      }
    }
  }
  function sync() {
    syncSceneStructure();
    syncNavigation();
    syncCursorLabels();
    const section = document.querySelector('.home_recruit');
    if (section !== cinemaSection) { cinemaSection = section; cinemaProgress = -1; }
    requestCinemaUpdate();
    for (const target of observed) {
      if (!target.isConnected) { reveal.unobserve(target); observed.delete(target); }
    }
    for (const heading of document.querySelectorAll('.crud5th-light-heading h1')) {
      if (heading.querySelector('.crud5th-motion-letter')) continue;
      const text = heading.textContent;
      heading.setAttribute('aria-label', text);
      heading.replaceChildren(...[...text].map((letter, index) => {
        const span = document.createElement('span');
        span.className = 'crud5th-motion-letter';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--letter-index', index);
        span.textContent = letter;
        return span;
      }));
    }
    for (const target of document.querySelectorAll(revealSelector)) {
      if (target.dataset.crud5thReveal) continue;
      target.dataset.crud5thReveal = reduced.matches ? 'visible' : 'waiting';
      if (!reduced.matches) { reveal.observe(target); observed.add(target); }
    }
  }
  reduced.addEventListener('change', () => {
    requestCinemaUpdate();
    if (reduced.matches) {
      for (const target of observed) { target.dataset.crud5thReveal = 'visible'; reveal.unobserve(target); }
      observed.clear();
    }
  });
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-transitioned'] });
  const menu = document.querySelector('.menu');
  if (menu) new MutationObserver(syncNavigation).observe(menu, { attributes: true, attributeFilter: ['data-menu-active', 'data-menu-open'] });
  window.addEventListener('scroll', requestCinemaUpdate, { passive: true });
  window.addEventListener('resize', requestCinemaUpdate, { passive: true });
  window.addEventListener('load', requestCinemaUpdate, { once: true });
  window.addEventListener('pageshow', requestCinemaUpdate);
  window.__crud5thElementMotion = { sync };
  sync();
})();
