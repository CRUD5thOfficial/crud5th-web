import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import vm from 'node:vm';

const source = readFileSync(path.join(process.env.CORPORATE_SOURCE_ROOT || process.cwd(), 'corporate-site/assets/local/crud5th-cyber-flow.js'), 'utf8');
function startPage() {
  const listeners = new Map();
  const observers = [];
  const mutations = [];
  const videos = [];
  const warnings = [];
  const reduced = { matches: false, addEventListener(name, listener) { this.change = listener; } };
  const document = {
    hidden: false, body: { dataset: {} },
    querySelectorAll(selector) { return selector === 'video[data-deferred-src]' ? videos.filter(video => video.isConnected) : []; },
    addEventListener(name, listener) { listeners.set(name, listener); },
  };
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    unobserve(target) { this.removed = target; }
  }
  class MutationObserver {
    constructor(callback) { mutations.push(callback); }
    observe() {}
  }
  const window = { addEventListener() {} };
  vm.runInNewContext(source, { document, window, matchMedia: () => reduced, innerHeight: 900,
    IntersectionObserver, MutationObserver, requestAnimationFrame() {}, cancelAnimationFrame() {},
    console: { warn: (...args) => warnings.push(args) } });
  function addVideo() {
    const video = { dataset: { deferredSrc: '/assets/images/home/junni_is.mp4' }, isConnected: true,
      src: '', plays: 0, pauses: 0, getAttribute() { return this.src; },
      play() { this.plays++; return Promise.resolve(); }, pause() { this.pauses++; } };
    videos.push(video); mutations[0](); return video;
  }
  function intersect(video, isIntersecting) { observers[0].callback([{ target: video, isIntersecting }]); }
  return { document, reduced, addVideo, intersect, listeners, mutations, warnings, observers };
}

test('below-fold video fetches only near the viewport, pauses outside it and resumes on return', () => {
  const page = startPage(), video = page.addVideo();
  assert.equal(video.src, ''); assert.equal(video.plays, 0);
  page.intersect(video, true);
  assert.equal(video.src, video.dataset.deferredSrc); assert.equal(video.plays, 1);
  page.mutations[0](); assert.equal(video.plays, 1, 'DOM updates must not duplicate play requests');
  page.intersect(video, false); assert.equal(video.pauses, 1);
  page.intersect(video, true); assert.equal(video.plays, 2);
});

test('hidden and reduced-motion pages stop video and do not fetch until motion is allowed', () => {
  const page = startPage(); page.reduced.matches = true;
  const video = page.addVideo(); page.intersect(video, true);
  assert.equal(video.src, ''); assert.equal(video.plays, 0);
  page.reduced.matches = false; page.reduced.change(); assert.equal(video.plays, 1);
  page.document.hidden = true; page.listeners.get('visibilitychange')(); assert.equal(video.pauses, 1);
  page.document.hidden = false; page.listeners.get('visibilitychange')(); assert.equal(video.plays, 2);
  page.reduced.matches = true; page.reduced.change(); assert.equal(video.pauses, 2);
});

test('Swup replacement pauses and unobserves departed video, then initializes the new page video', () => {
  const page = startPage(), oldVideo = page.addVideo(); page.intersect(oldVideo, true);
  oldVideo.isConnected = false; page.mutations[0]();
  assert.equal(oldVideo.pauses, 1); assert.equal(page.observers[0].removed, oldVideo);
  const nextVideo = page.addVideo(); assert.equal(nextVideo.src, '');
  page.intersect(nextVideo, true); assert.equal(nextVideo.plays, 1);
  assert.equal(oldVideo.plays, 1);
});


test('denied and stale play promises keep the latest request stable until visibility changes', async () => {
  const page = startPage(), video = page.addVideo(), requests = [];
  video.play = function () {
    this.plays++;
    return new Promise((resolve, reject) => requests.push({ resolve, reject }));
  };
  page.intersect(video, true);
  page.intersect(video, false);
  page.intersect(video, true);
  assert.equal(video.plays, 2);
  requests[0].reject({ name: 'AbortError' });
  await Promise.resolve();
  page.mutations[0]();
  assert.equal(video.plays, 2, 'an older rejection must not reset the current request');
  requests[1].reject({ name: 'NotAllowedError' });
  await Promise.resolve();
  page.mutations[0]();
  assert.equal(video.plays, 2, 'autoplay denial must not create a retry loop');
  assert.equal(page.warnings.length, 0);
  page.intersect(video, false);
  page.intersect(video, true);
  assert.equal(video.plays, 3, 'a new visibility cycle may retry playback');
  requests[2].resolve();
  await Promise.resolve();
  page.mutations[0]();
  assert.equal(video.plays, 3);
});
