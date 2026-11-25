'use strict';

const menuDialog = document.querySelector('#site-menu');
const menuToggle = document.querySelector('.menu-toggle');
const contentDialog = document.querySelector('#content-dialog');
let dialogTrigger = null;

function closeMenu() {
  menuDialog.close();
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'メニューを開く');
}

menuToggle.addEventListener('click', () => {
  menuDialog.showModal();
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'メニューを閉じる');
});
document.querySelector('.menu-close').addEventListener('click', closeMenu);
menuDialog.addEventListener('close', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'メニューを開く');
});
menuDialog.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

function activatePanel(panel, siblings) {
  siblings.forEach(sibling => {
    const active = sibling === panel;
    sibling.classList.toggle('is-active', active);
    sibling.setAttribute('aria-expanded', String(active));
  });
}

document.querySelectorAll('.photo-accordion, .service-accordion').forEach(accordion => {
  const panels = [...accordion.querySelectorAll(':scope > button')];
  panels.forEach(panel => {
    panel.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') activatePanel(panel, panels);
    });
    panel.addEventListener('focus', () => activatePanel(panel, panels));
    panel.addEventListener('click', () => activatePanel(panel, panels));
    panel.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const nextIndex = (panels.indexOf(panel) + (forward ? 1 : -1) + panels.length) % panels.length;
      panels[nextIndex].focus();
    });
  });
});

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    document.querySelectorAll('.preparation-card').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    });
  });
});

// 容量ごとの月額・事故時の取出し・返却の見積例（税抜）。
const PLANS = Object.freeze({
  2: Object.freeze({ monthly: 60000, incident: 146000, exit: 40968 }),
  5: Object.freeze({ monthly: 80000, incident: 155000, exit: 54418 }),
  10: Object.freeze({ monthly: 120000, incident: 170000, exit: 76836 }),
  15: Object.freeze({ monthly: 160000, incident: 185000, exit: 99254 }),
  20: Object.freeze({ monthly: 200000, incident: 200000, exit: 121672 })
});
const INITIAL_EXAMPLE = 60000;
const TAX_RATE = 0.1;
const yenNumber = new Intl.NumberFormat('ja-JP');
const yen = value => `${yenNumber.format(value)}円`;

function setupCalculator(root) {
  if (!root.querySelector('[data-calculator]')) return;
  const state = { capacity: 5, months: 6 };
  const output = (name, value) => root.querySelectorAll(`[data-out="${name}"]`).forEach(node => { node.textContent = value; });
  const render = () => {
    const plan = PLANS[state.capacity];
    const base = INITIAL_EXAMPLE + plan.monthly * state.months;
    const exitTotal = base + plan.exit;
    const incidentTotal = exitTotal + plan.incident;
    output('formula', `はじめに${yen(INITIAL_EXAMPLE)} ＋ 月額${yen(plan.monthly)} × ${state.months}か月`);
    output('base', yenNumber.format(base));
    output('base-in-tax', yen(Math.round(base * (1 + TAX_RATE))));
    output('exit-total', yenNumber.format(exitTotal));
    output('exit-in-tax', yen(Math.round(exitTotal * (1 + TAX_RATE))));
    output('incident-total', yenNumber.format(incidentTotal));
    output('incident-in-tax', yen(Math.round(incidentTotal * (1 + TAX_RATE))));
    output('incident', yenNumber.format(plan.incident));
    output('exit', yenNumber.format(plan.exit));
    root.querySelector('[data-out="warning"]').hidden = state.capacity <= 5;
    root.querySelectorAll('[data-capacity]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.capacity) === state.capacity)));
    root.querySelectorAll('[data-months]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.months) === state.months)));
  };
  root.querySelectorAll('[data-capacity]').forEach(button => button.addEventListener('click', () => {
    state.capacity = Number(button.dataset.capacity);
    render();
  }));
  root.querySelectorAll('[data-months]').forEach(button => button.addEventListener('click', () => {
    state.months = Number(button.dataset.months);
    render();
  }));
  render();
}

let restoreFocus = true;

function openContentDialog(id, trigger) {
  const template = document.getElementById(id);
  if (!template) return;
  const content = contentDialog.querySelector('.dialog-content');
  content.replaceChildren(template.content.cloneNode(true));
  const heading = content.querySelector('h2');
  heading.id = 'content-dialog-title';
  heading.tabIndex = -1;
  setupCalculator(content);
  if (contentDialog.open) {
    contentDialog.scrollTop = 0;
    heading.focus({ preventScroll: true });
    return;
  }
  dialogTrigger = trigger;
  contentDialog.showModal();
  contentDialog.scrollTop = 0;
}

// 窓の中のボタンからも別の窓へ移れるよう、押された場所から探す。
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-dialog]');
  if (trigger) openContentDialog(trigger.dataset.dialog, trigger);
});

document.querySelector('.dialog-close').addEventListener('click', () => contentDialog.close());
contentDialog.addEventListener('click', event => {
  const pageLink = event.target.closest('a[data-close-dialog]');
  if (pageLink) {
    // 相談欄などページ内へ移るときは、元のボタンへ戻らずに移った先へ進む。
    restoreFocus = false;
    contentDialog.close();
    const destination = document.querySelector(pageLink.getAttribute('href'));
    if (destination) {
      destination.tabIndex = -1;
      setTimeout(() => destination.focus({ preventScroll: true }), 0);
    }
    return;
  }
  // 窓の外（背景）を押したときだけ閉じる。キーボードで押したボタンは座標が0になるため、押された要素で見分ける。
  if (event.target !== contentDialog) return;
  const bounds = contentDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) contentDialog.close();
});
contentDialog.addEventListener('close', () => {
  if (restoreFocus) dialogTrigger?.focus();
  restoreFocus = true;
});

// 印刷・PDF保存のときは、説明の窓の中身もページの末尾に載せる。
const PRINT_DIALOGS = ['card-0', 'card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6', 'card-7', 'faq-0', 'faq-1', 'faq-2', 'faq-3', 'faq-4', 'faq-5', 'plan-0', 'proof-0'];
window.addEventListener('beforeprint', () => {
  if (document.querySelector('.print-appendix')) return;
  const appendix = document.createElement('section');
  appendix.className = 'print-appendix section-wrap';
  appendix.setAttribute('aria-hidden', 'true');
  PRINT_DIALOGS.forEach(id => {
    const template = document.getElementById(id);
    if (!template) return;
    const block = document.createElement('div');
    block.className = 'dialog-content print-dialog';
    block.append(template.content.cloneNode(true));
    appendix.append(block);
  });
  document.querySelector('.site-footer').before(appendix);
});
window.addEventListener('afterprint', () => document.querySelector('.print-appendix')?.remove());
document.querySelectorAll('.print-action').forEach(button => button.addEventListener('click', () => window.print()));

const canvas = document.querySelector('#waves');
const context = canvas.getContext('2d');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let waveFrame = null;
let waveWidth = 0;
let waveHeight = 0;

function resizeWaves() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  waveWidth = canvas.clientWidth;
  waveHeight = canvas.clientHeight;
  canvas.width = waveWidth * scale;
  canvas.height = waveHeight * scale;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  drawWaves(0);
}

function drawWaves(time) {
  context.clearRect(0, 0, waveWidth, waveHeight);
  const mobile = waveWidth <= 700;
  const baseline = mobile ? 0.55 : 0.48;
  const sineAmplitude = mobile ? 0.045 : 0.08;
  const cosineAmplitude = mobile ? 0.015 : 0.02;
  for (let layer = 0; layer < 2; layer += 1) {
    const phase = motionQuery.matches ? layer * 2 : time * 0.00011 + layer * 2;
    context.beginPath();
    context.moveTo(0, waveHeight);
    for (let x = 0; x <= waveWidth + 12; x += 12) {
      const y = waveHeight * baseline + Math.sin(x / waveWidth * Math.PI * 2 + phase) * waveHeight * sineAmplitude + Math.cos(x / waveWidth * Math.PI * 2 + phase * 0.8) * waveHeight * cosineAmplitude;
      context.lineTo(x, y + layer * 35);
    }
    context.lineTo(waveWidth, waveHeight);
    context.closePath();
    context.fillStyle = layer === 0 ? 'rgba(255,255,255,0.43)' : 'rgba(255,255,255,0.37)';
    context.fill();
  }
}

function animateWaves(time) {
  drawWaves(time);
  if (!motionQuery.matches) waveFrame = requestAnimationFrame(animateWaves);
}

function updateWaveMotion() {
  if (waveFrame !== null) cancelAnimationFrame(waveFrame);
  waveFrame = null;
  if (motionQuery.matches) drawWaves(0);
  else waveFrame = requestAnimationFrame(animateWaves);
}
window.addEventListener('resize', resizeWaves, { passive: true });
motionQuery.addEventListener('change', updateWaveMotion);
resizeWaves();
updateWaveMotion();
