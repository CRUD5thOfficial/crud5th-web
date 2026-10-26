'use strict';

(() => {
  const PLANS = Object.freeze({
    2: Object.freeze({ monthly: 60000, incident: 146000, exit: 40968 }),
    5: Object.freeze({ monthly: 80000, incident: 155000, exit: 54418 }),
    10: Object.freeze({ monthly: 120000, incident: 170000, exit: 76836 }),
    15: Object.freeze({ monthly: 160000, incident: 185000, exit: 99254 }),
    20: Object.freeze({ monthly: 200000, incident: 200000, exit: 121672 })
  });
  const INITIAL_EXAMPLE = 60000;
  const TAX_RATE = 0.1;
  const priceState = { capacity: 5, months: 6 };
  const number = new Intl.NumberFormat('ja-JP');
  const yen = (value) => `${number.format(value)}円`;
  const byId = (id) => document.getElementById(id);
  const text = (id, value) => { byId(id).textContent = value; };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function calculateBudget(capacity, months) {
    const plan = PLANS[capacity];
    const base = INITIAL_EXAMPLE + plan.monthly * months;
    const exitTotal = base + plan.exit;
    return { plan, base, exitTotal, incidentTotal: exitTotal + plan.incident };
  }

  function renderPrices(animate = false) {
    const { capacity, months } = priceState;
    const { plan, base, exitTotal, incidentTotal } = calculateBudget(capacity, months);
    text('monthly-price', number.format(plan.monthly));
    text('monthly-in-tax', `税込参考 ${yen(Math.round(plan.monthly * (1 + TAX_RATE)))}`);
    text('base-total', number.format(base));
    text('base-tax', yen(Math.round(base * TAX_RATE)));
    text('base-in-tax', yen(Math.round(base * (1 + TAX_RATE))));
    text('total-formula', `はじめに${yen(INITIAL_EXAMPLE)} ＋ 月額${yen(plan.monthly)} × ${months}か月`);
    text('exit-total', number.format(exitTotal));
    text('exit-in-tax', `税込参考${yen(Math.round(exitTotal * (1 + TAX_RATE)))}`);
    text('incident-total', number.format(incidentTotal));
    text('incident-in-tax', `税込参考${yen(Math.round(incidentTotal * (1 + TAX_RATE)))}`);
    byId('capacity-warning').hidden = capacity <= 5;
    document.querySelectorAll('[data-capacity]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.capacity) === capacity));
    });
    document.querySelectorAll('[data-months]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.months) === months));
    });
    document.querySelectorAll('.dynamic-incident').forEach((node) => { node.textContent = number.format(plan.incident); });
    document.querySelectorAll('.dynamic-exit').forEach((node) => { node.textContent = number.format(plan.exit); });
    if (animate && !reducedMotion.matches) {
      document.querySelectorAll('.calculator-output, .scenario-examples, .selected-monthly').forEach((node) => {
        node.classList.remove('price-change');
        void node.offsetWidth;
        node.classList.add('price-change');
      });
    }
  }

  document.querySelectorAll('[data-capacity]').forEach((button) => {
    button.addEventListener('click', () => {
      const capacity = Number(button.dataset.capacity);
      if (!Object.hasOwn(PLANS, capacity) || capacity === priceState.capacity) return;
      priceState.capacity = capacity;
      renderPrices(true);
      enqueue('pricing_change', { capacity_tb: capacity, months: priceState.months });
    });
  });
  document.querySelectorAll('[data-months]').forEach((button) => {
    button.addEventListener('click', () => {
      const months = Number(button.dataset.months);
      if (![6, 12].includes(months) || months === priceState.months) return;
      priceState.months = months;
      renderPrices(true);
      enqueue('pricing_change', { capacity_tb: priceState.capacity, months });
    });
  });

  // Entry motion is progressive enhancement: content is visible without JS.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion.matches) entry.target.classList.add('is-entering');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach((node) => revealObserver.observe(node));
  }

  // Bounded, in-memory viewing notes only. No identifiers, cookies, storage or transport.
  // Active time indicates an opportunity to read, never proof of understanding.
  const sections = [...document.querySelectorAll('[data-section]')];
  const activeMs = Object.create(null);
  const queue = [];
  const sequence = [];
  const startedAt = performance.now();
  let lastInteraction = startedAt;
  let lastTick = startedAt;
  let currentSection = null;
  let lastQueuedSection = null;
  let closed = false;
  let scrollScheduled = false;
  let lastPointerUpdate = 0;
  function enqueue(type, details = {}) {
    if (queue.length >= 200) queue.shift();
    queue.push({ type, at_ms: Math.round(performance.now() - startedAt), ...details });
  }
  function settleTime(now = performance.now()) {
    const elapsed = Math.min(Math.max(now - lastTick, 0), 1500);
    if (!closed && document.visibilityState === 'visible' && document.hasFocus() && now - lastInteraction < 30000 && currentSection) {
      activeMs[currentSection] = (activeMs[currentSection] || 0) + elapsed;
      if (lastQueuedSection !== currentSection) {
        if (sequence.length >= 100) sequence.shift();
        sequence.push(currentSection);
        enqueue('section_enter', { section: currentSection });
        lastQueuedSection = currentSection;
      }
    }
    lastTick = now;
  }
  function findCurrentSection() {
    settleTime();
    const line = innerHeight * .4;
    const section = sections.find((node) => {
      const box = node.getBoundingClientRect();
      return box.top <= line && box.bottom > line;
    });
    currentSection = section ? section.dataset.section : null;
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.dataset.nav === currentSection) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function noteInteraction() { settleTime(); lastInteraction = performance.now(); }
  window.addEventListener('scroll', () => {
    noteInteraction();
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => { findCurrentSection(); scrollScheduled = false; });
  }, { passive: true });
  window.addEventListener('resize', findCurrentSection, { passive: true });
  document.addEventListener('pointerdown', noteInteraction, { passive: true });
  document.addEventListener('keydown', noteInteraction);
  document.addEventListener('pointermove', () => {
    const now = performance.now();
    if (now - lastPointerUpdate < 1000) return;
    lastPointerUpdate = now;
    noteInteraction();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { settleTime(); lastTick = performance.now(); });
  window.addEventListener('blur', () => { settleTime(); lastTick = performance.now(); });
  window.addEventListener('focus', () => { lastTick = performance.now(); findCurrentSection(); });
  window.addEventListener('pagehide', () => { settleTime(); closed = true; });
  window.addEventListener('pageshow', () => { closed = false; lastTick = performance.now(); findCurrentSection(); });
  setInterval(settleTime, 1000);
  Object.defineProperty(window, '__miakashiMetrics', {
    value: Object.freeze({
      snapshot() {
        settleTime();
        return {
          mode: 'local-memory-only', idle_after_ms: 30000,
          section_active_ms: Object.fromEntries(Object.entries(activeMs).map(([key, value]) => [key, Math.round(value)])),
          section_sequence: [...sequence], queue: queue.map((item) => ({ ...item }))
        };
      },
      clear() {
        queue.length = 0;
        sequence.length = 0;
        Object.keys(activeMs).forEach((key) => { delete activeMs[key]; });
        lastQueuedSection = null;
        lastTick = performance.now();
      }
    }), writable: false, configurable: false
  });
  renderPrices();
  findCurrentSection();
})();
