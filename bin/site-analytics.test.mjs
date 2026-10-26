import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const trackerPath = new URL("../client/public/site-analytics.js", import.meta.url);
// A site without the new tracker is a valid baseline, with no analytics events.
const source = existsSync(trackerPath) ? readFileSync(trackerPath, "utf8") : "";

function startTracker({ url = "https://crud5th.com/services/kotoport?email=private@example.test&utm_source=private#pricing", measurementId = "G-TESTONLY", doNotTrack = "0", iframe = false, referrer = "https://example.test/private?email=private@example.test" } = {}) {
  const listeners = new Map();
  const windowListeners = new Map();
  const scripts = [];
  const observers = [];
  class Element {
    constructor(dataset = {}) { this.dataset = dataset; }
    closest(selector) {
      if (selector === "[data-analytics-contact]") return this.contact || null;
      if (selector === "[data-analytics-calculator]") return this.calculator || null;
      return null;
    }
  }
  const pricing = new Element({ analyticsView: "kotoport_pricing_view" });
  const document = {
    currentScript: { dataset: { measurementId, pagePaths: JSON.stringify(["/", "/about", "/contact", "/services/kotoport"]) } },
    readyState: "complete", referrer,
    head: { appendChild(script) { scripts.push(script); } },
    createElement() { return { setAttribute(name, value) { this[name] = value; } }; },
    querySelectorAll() { return [pricing]; },
    addEventListener(name, listener) { listeners.set(name, [...(listeners.get(name) || []), listener]); },
  };
  const window = { location: new URL(url), addEventListener(name, listener) { windowListeners.set(name, listener); } };
  window.self = window;
  window.top = iframe ? {} : window;
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  vm.runInNewContext(source, { window, document, navigator: { doNotTrack }, URL, Element, IntersectionObserver, Set });
  function commands() { return Array.from(window.dataLayer || [], command => Array.from(command)); }
  function events(name) { return commands().filter(command => command[0] === "event" && command[1] === name); }
  function emit(name, event = {}) { for (const listener of listeners.get(name) || []) listener(event); }
  function visit(path, name = "site-analytics:page-view") { window.location = new URL(path, window.location); emit(name); }
  return { window, document, scripts, commands, events, emit, visit, observers, pricing, Element, windowListeners };
}

test("both navigation sources count each page once and drop URL query, hash and private referrer path", () => {
  const browser = startTracker();
  assert.equal(browser.events("page_view").length, 1, "initial page_view must be present");
  browser.emit("site-analytics:page-view");
  browser.emit("swup:page:view");
  browser.visit("#next");
  assert.equal(browser.events("page_view").length, 1);
  browser.visit("/about?email=private@example.test", "swup:page:view");
  browser.visit("/services/kotoport", "swup:page:view");
  assert.equal(browser.events("page_view").length, 3);
  browser.visit("/private-customer-id?email=private@example.test");
  assert.equal(browser.events("page_view").at(-1)[2].page_path, "/404");
  const serialized = JSON.stringify(browser.commands());
  assert.ok(!serialized.includes("private"));
  assert.ok(!serialized.includes("utm_"));
  assert.ok(!serialized.includes("#"));
  assert.equal(browser.window.gtag, undefined, "leave inherited template's gtag hook inactive");
  const config = browser.commands().find(command => command[0] === "config")[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const initialFields = browser.commands().find(command => command[0] === "set")[1];
  assert.equal(initialFields.page_location, "https://crud5th.com/services/kotoport");
  assert.equal(initialFields.page_referrer, "https://example.test/");
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.scripts[0]["data-swup-ignore-script"], "");
});

test("missing or malformed IDs, local/preview hosts, HTTP and DNT never load Google", () => {
  for (const options of [{ measurementId: "" }, { measurementId: "bad-id" }, { url: "http://localhost:5173/" }, { url: "https://preview--crud5th.com/" }, { url: "http://crud5th.com/" }, { doNotTrack: "1" }, { iframe: true }, { url: "https://crud5th.netlify.app/" }]) {
    const browser = startTracker(options);
    assert.equal(browser.scripts.length, 0);
    assert.equal(browser.commands().length, 0);
  }
});

test("meaning events accept fixed labels and never include input or custom event data", () => {
  const browser = startTracker();
  browser.observers[0]?.callback([{ target: browser.pricing, isIntersecting: true }]);
  browser.observers[0]?.callback([{ target: browser.pricing, isIntersecting: true }]);
  assert.equal(browser.events("kotoport_pricing_view").length, 1);
  const input = new browser.Element();
  input.value = "123456";
  input.validity = { valid: true };
  input.calculator = new browser.Element({ analyticsCalculator: "pricing" });
  browser.emit("change", { target: input });
  browser.emit("change", { target: input });
  input.calculator.dataset.analyticsCalculator = "economics";
  browser.emit("change", { target: input });
  input.calculator.dataset.analyticsCalculator = "private@example.test";
  browser.emit("change", { target: input });
  assert.equal(browser.events("kotoport_calculator_use").length, 2);
  const link = new browser.Element();
  link.contact = new browser.Element({ analyticsContact: "true" });
  browser.emit("click", { target: link });
  browser.emit("site-analytics:contact-success", { detail: { email: "private@example.test" } });
  assert.equal(browser.events("kotoport_contact_click").length, 1);
  assert.equal(browser.events("generate_lead").length, 1);
  assert.ok(!JSON.stringify(browser.commands()).includes("123456"));
  assert.ok(!JSON.stringify(browser.commands()).includes("private"));
  browser.visit("/about");
  browser.visit("/services/kotoport");
  input.calculator.dataset.analyticsCalculator = "pricing";
  browser.emit("change", { target: input });
  assert.equal(browser.events("kotoport_calculator_use").length, 3);
});

test("built-in browser back/forward cache restoration counts a new page view", () => {
  const browser = startTracker();
  browser.windowListeners.get("pageshow")?.({ persisted: true });
  assert.equal(browser.events("page_view").length, 2);
});


test("built tags keep the tracker and its Google loader out of Swup script re-execution", () => {
  const entry = readFileSync(new URL("../dist/public/index.html", import.meta.url), "utf8");
  const legacy = readFileSync(new URL("../dist/public/legacy-app.html", import.meta.url), "utf8");
  for (const html of [entry, legacy]) {
    const tags = html.match(/<script[^>]+src="\/site-analytics\.js"[^>]*>/g) || [];
    assert.equal(tags.length, 1);
    assert.ok(tags[0].includes("data-swup-ignore-script"), "Swup must not re-execute the shared tracker");
    assert.ok(tags[0].includes(`data-measurement-id="${process.env.GA4_MEASUREMENT_ID || ""}"`), "built tag matches the configured measurement ID");
  }
});

test("contact success follows an OK response and never forwards contact fields", async () => {
  const { build } = await import("esbuild");
  const names = ["Mail", "Phone", "MapPin", "Twitter", "Github", "Button", "Input", "Textarea", "Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue", "Form", "FormControl", "FormField", "FormItem", "FormLabel", "FormMessage", "AnimatedUnderline"];
  const stub = `${names.map(name => `export const ${name}=()=>null;`).join("\n")}
    export const motion = new Proxy({}, { get:()=>()=>null });
    export const jsx = ()=>null; export const jsxs = jsx; export const Fragment = jsx;
    export const useScrollAnimation = ()=>({ref:null,isVisible:true});
    export const useToast = ()=>({toast:()=>{}});
    export const useForm = ()=>({control:{},handleSubmit:()=>()=>{},reset:()=>{}});
    export const zodResolver = ()=>()=>{}; export const insertContactSchema = {};
    export const useMutation = options => {globalThis.contactMutation = options;return {isPending:false};};`;
  const compiled = await build({
    entryPoints: [new URL("../client/src/components/sections/contact.tsx", import.meta.url).pathname],
    bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic",
    plugins: [{ name: "contact-test-boundaries", setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => args.kind === "entry-point" ? undefined : { path: args.path, namespace: "test-boundary" });
      builder.onLoad({ filter: /.*/, namespace: "test-boundary" }, () => ({ contents: stub, loader: "js" }));
    } }],
  });
  const emitted = [];
  const requests = [];
  let responseOk = true;
  const context = {
    module: { exports: {} }, URLSearchParams, Event,
    document: { dispatchEvent(event) { emitted.push(event); } },
    fetch: async (url, options) => { requests.push({ url, options }); return { ok: responseOk }; },
  };
  vm.runInNewContext(compiled.outputFiles[0].text, context);
  context.module.exports.default();
  const fields = { name: "Private Test", email: "private@example.test", type: "その他", message: "private test body" };
  await context.contactMutation.mutationFn(fields);
  context.contactMutation.onSuccess();
  assert.equal(requests[0].url, "/");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(new URLSearchParams(requests[0].options.body).get("form-name"), "contact");
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].type, "site-analytics:contact-success");
  assert.equal(emitted[0].detail, undefined);
  responseOk = false;
  await assert.rejects(context.contactMutation.mutationFn(fields), /送信に失敗しました/);
  assert.equal(emitted.length, 1, "failed POST must not emit contact success");
});

test("automatic engagement follows the current page under config-over-set parameter precedence", () => {
  const browser = startTracker();
  browser.visit("/about?email=private@example.test#section");
  const globalFields = {};
  const configFields = {};
  const automaticPages = [];
  for (const [command, nameOrFields, parameters] of browser.commands()) {
    if (command === "set") Object.assign(globalFields, nameOrFields);
    if (command === "config") Object.assign(configFields, parameters);
    if (command === "event" && nameOrFields === "page_view") {
      // Automatic events have no event-scoped page override: config wins over set.
      automaticPages.push({ ...globalFields, ...configFields });
    }
  }
  assert.deepEqual(automaticPages.map(page => page.page_location), [
    "https://crud5th.com/services/kotoport",
    "https://crud5th.com/about",
  ], "automatic engagement must leave the initial page after navigation");
  assert.equal(automaticPages[0].page_referrer, "https://example.test/");
  assert.equal(automaticPages[1].page_referrer, "https://crud5th.com/services/kotoport");
  assert.ok(!JSON.stringify(automaticPages).includes("private"));
  assert.ok(!JSON.stringify(automaticPages).includes("#"));
});
