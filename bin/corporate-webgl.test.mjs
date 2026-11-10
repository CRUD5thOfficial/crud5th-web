import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const projectRoot = process.env.CORPORATE_SOURCE_ROOT || process.cwd();
const entry = readFileSync(path.join(projectRoot, 'corporate-site/assets/scripts/entry-hoisted.3B9NS3AY.js'), 'utf8');
const controllerSource = entry.match(/class K_\{[\s\S]*?\}\}const Yr=/)?.[0].replace(/const Yr=$/, '');
assert.ok(controllerSource, 'the published WebGL controller must be available');

function createController(Renderer) {
  const warnings = [];
  const events = [];
  const context = vm.createContext({
    qh: class { add() {} },
    Kl: class {},
    dn: class {
      position = { set() {} };
      lookAt() {}
      updateProjectionMatrix() {}
    },
    Xh: Renderer,
    Y_: { fov: 45, width: 1280, height: 720, near: .1, far: 1000, position: { x: 0, y: 0, z: 5 } },
    $_: { alpha: true, antialias: true },
    window: { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 3 },
    console: { warn: (...args) => warnings.push(args) },
  });
  vm.runInContext(`${controllerSource}; globalThis.Controller = K_;`, context);
  const canvas = { addEventListener: (name, listener) => events.push({ name, listener }) };
  return { controller: new context.Controller({ canvas }), warnings, events };
}

test('WebGL unavailable keeps the controller usable for page initialization', () => {
  const failure = new Error('Error creating WebGL context.');
  const { controller, warnings } = createController(class { constructor() { throw failure; } });
  assert.equal(controller.renderer, null);
  assert.ok(controller.scene);
  assert.ok(controller.perspectiveCamera);
  assert.doesNotThrow(() => controller.render());
  assert.doesNotThrow(() => controller.onResize());
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0][1], failure);
});

test('WebGL initialization failure releases a partially created renderer', () => {
  let disposals = 0;
  const failure = new Error('GPU resource allocation failed');
  const { controller, warnings } = createController(class {
    setPixelRatio() {}
    setSize() { throw failure; }
    dispose() { disposals++; }
  });
  assert.equal(controller.renderer, null);
  assert.equal(disposals, 1);
  assert.equal(warnings[0][1], failure);
});

test('WebGL available preserves renderer settings and resize behavior', () => {
  class Renderer {
    ratios = [];
    sizes = [];
    renders = 0;
    setPixelRatio(value) { this.ratios.push(value); }
    setSize(...value) { this.sizes.push(value); }
    render() { this.renders++; }
  }
  const { controller, warnings } = createController(Renderer);
  assert.ok(controller.renderer instanceof Renderer);
  assert.deepEqual(controller.renderer.ratios, [2]);
  assert.deepEqual(controller.renderer.sizes, [[1280, 720]]);
  controller.onResize();
  controller.render();
  assert.deepEqual(controller.renderer.sizes, [[1280, 720], [1280, 720]]);
  assert.equal(controller.renderer.renders, 1);
  assert.equal(warnings.length, 0);
});
