import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultSimulatorConditions, readSimulatorConditions, resetSimulatorConditions, saveSimulatorConditions, simulatorStorageKey, type SimulatorConditions } from "./kotoport-simulator-storage";

function memoryStorage() {
  const values = new Map<string, string>();
  const operations: string[] = [];
  return {
    values,
    operations,
    getItem(key: string) { operations.push(`get:${key}`); return values.get(key) ?? null; },
    setItem(key: string, value: string) { operations.push(`set:${key}`); values.set(key, value); },
    removeItem(key: string) { operations.push(`remove:${key}`); values.delete(key); },
  };
}

function changedConditions(): SimulatorConditions {
  return {
    rawValues: { dailyCalls: "200", averageCallMinutes: "3.5", daysPerMonth: "26", aiCoveragePercent: "28", reviewMinutesPerAiCall: "1.25", hourlyWageYen: "1800", staffingCount: "3", staffingHoursPerDay: "7" },
    rawMonthlyQuote: "123456.75",
    planId: "small",
    feeMode: "quote",
    unit: "minute",
  };
}

test("missing storage and windowless execution use independent default conditions without writing", () => {
  const storage = memoryStorage();
  const defaults = readSimulatorConditions(storage);
  assert.deepEqual(defaults, createDefaultSimulatorConditions());
  assert.deepEqual(readSimulatorConditions(null), defaults);
  assert.deepEqual(readSimulatorConditions(), defaults);
  assert.ok(storage.operations.every(operation => operation.startsWith("get:")));
  defaults.rawValues.dailyCalls = "999";
  assert.notEqual(createDefaultSimulatorConditions().rawValues.dailyCalls, "999");
});

test("all input conditions roundtrip and initial restore never replaces saved input with defaults", () => {
  const storage = memoryStorage();
  const conditions = changedConditions();
  assert.equal(saveSimulatorConditions(conditions, storage), true);
  const saved = storage.values.get(simulatorStorageKey);
  storage.operations.length = 0;
  assert.deepEqual(readSimulatorConditions(storage), conditions);
  assert.deepEqual(readSimulatorConditions(storage), conditions, "repeat initialization is safe in StrictMode");
  assert.equal(storage.values.get(simulatorStorageKey), saved);
  assert.ok(storage.operations.every(operation => operation.startsWith("get:")));
  const payload = JSON.parse(saved!);
  assert.deepEqual(Object.keys(payload).sort(), ["feeMode", "planId", "rawMonthlyQuote", "rawValues", "unit", "version"]);
  assert.equal(payload.version, 1);
  for (const unit of ["call", "month", "time"] as const) {
    saveSimulatorConditions({ ...conditions, unit, feeMode: "reference", planId: "medium" }, storage);
    assert.equal(readSimulatorConditions(storage).unit, unit);
  }
});

test("empty and numerically invalid range inputs remain raw rather than becoming zero or reference fees", () => {
  const storage = memoryStorage();
  const conditions = changedConditions();
  conditions.rawValues.dailyCalls = "";
  conditions.rawValues.aiCoveragePercent = "101";
  conditions.rawValues.staffingCount = "-1";
  conditions.rawMonthlyQuote = "";
  saveSimulatorConditions(conditions, storage);
  assert.deepEqual(readSimulatorConditions(storage), conditions);
  conditions.rawMonthlyQuote = "100000000.01";
  saveSimulatorConditions(conditions, storage);
  assert.deepEqual(readSimulatorConditions(storage), conditions);
});

test("corrupted, incompatible and untrusted persisted payloads recover to defaults", () => {
  const storage = memoryStorage();
  const conditions = changedConditions();
  const payload = { version: 1, ...conditions };
  const invalidPayloads = [
    "{", "null", "[]", JSON.stringify({}),
    JSON.stringify({ ...payload, version: 2 }),
    JSON.stringify({ ...payload, unit: "year" }),
    JSON.stringify({ ...payload, feeMode: "free" }),
    JSON.stringify({ ...payload, planId: "unknown" }),
    JSON.stringify({ ...payload, rawMonthlyQuote: 0 }),
    JSON.stringify({ ...payload, rawMonthlyQuote: "Infinity" }),
    JSON.stringify({ ...payload, rawMonthlyQuote: "0x10" }),
    JSON.stringify({ ...payload, rawMonthlyQuote: "1e999" }),
    JSON.stringify({ ...payload, rawMonthlyQuote: "1".repeat(129) }),
    JSON.stringify({ ...payload, rawValues: { ...conditions.rawValues, dailyCalls: false } }),
    JSON.stringify({ ...payload, rawValues: { ...conditions.rawValues, dailyCalls: {} } }),
    JSON.stringify({ ...payload, rawValues: { ...conditions.rawValues, dailyCalls: "NaN" } }),
    JSON.stringify({ ...payload, rawValues: { ...conditions.rawValues, unknown: "1" } }),
    JSON.stringify({ ...payload, rawValues: { dailyCalls: "1" } }),
    JSON.stringify({ ...payload, authorization: "untrusted" }),
    " ".repeat(4097),
  ];
  for (const value of invalidPayloads) {
    storage.values.set(simulatorStorageKey, value);
    assert.deepEqual(readSimulatorConditions(storage), createDefaultSimulatorConditions(), value.slice(0, 120));
  }
});

test("reset removes only the simulator key, saves defaults and cannot restore old conditions on reopen", () => {
  const storage = memoryStorage();
  storage.values.set("another-feature", "keep");
  saveSimulatorConditions(changedConditions(), storage);
  storage.operations.length = 0;
  const defaults = resetSimulatorConditions(storage);
  assert.deepEqual(defaults, createDefaultSimulatorConditions());
  assert.deepEqual(storage.operations, [`remove:${simulatorStorageKey}`, `set:${simulatorStorageKey}`]);
  assert.equal(storage.values.get("another-feature"), "keep");
  assert.deepEqual(readSimulatorConditions(storage), defaults);
  assert.equal(JSON.parse(storage.values.get(simulatorStorageKey)!).rawValues.aiCoveragePercent, "60");
});

test("storage get, set and remove failures do not escape and reset attempts each available operation", () => {
  const unavailable = {
    getItem() { throw new Error("blocked read"); },
    setItem() { throw new Error("quota exceeded"); },
    removeItem() { throw new Error("blocked removal"); },
  };
  assert.deepEqual(readSimulatorConditions(unavailable), createDefaultSimulatorConditions());
  assert.equal(saveSimulatorConditions(changedConditions(), unavailable), false);
  assert.deepEqual(resetSimulatorConditions(unavailable), createDefaultSimulatorConditions());
  assert.equal(saveSimulatorConditions(changedConditions(), null), false);

  const storage = memoryStorage();
  saveSimulatorConditions(changedConditions(), storage);
  resetSimulatorConditions({ ...storage, removeItem: unavailable.removeItem });
  assert.deepEqual(readSimulatorConditions(storage), createDefaultSimulatorConditions(), "set still overwrites if removal fails");
  saveSimulatorConditions(changedConditions(), storage);
  resetSimulatorConditions({ ...storage, setItem: unavailable.setItem });
  assert.equal(storage.values.has(simulatorStorageKey), false, "successful removal prevents old values returning when set fails");
});

test("accessing window.localStorage may throw without preventing defaults or reset", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { get localStorage() { throw new Error("SecurityError"); } } });
  try {
    assert.deepEqual(readSimulatorConditions(), createDefaultSimulatorConditions());
    assert.equal(saveSimulatorConditions(changedConditions()), false);
    assert.deepEqual(resetSimulatorConditions(), createDefaultSimulatorConditions());
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
