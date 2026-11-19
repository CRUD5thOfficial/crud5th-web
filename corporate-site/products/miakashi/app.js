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

document.querySelectorAll('[data-dialog]').forEach(button => {
  button.addEventListener('click', () => {
    dialogTrigger = button;
    const content = document.querySelector('.dialog-content');
    content.replaceChildren(document.getElementById(button.dataset.dialog).content.cloneNode(true));
    content.querySelector('h2').id = 'content-dialog-title';
    contentDialog.showModal();
  });
});

document.querySelector('.dialog-close').addEventListener('click', () => contentDialog.close());
contentDialog.addEventListener('click', event => {
  const bounds = contentDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) contentDialog.close();
});
contentDialog.addEventListener('close', () => dialogTrigger?.focus());
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
