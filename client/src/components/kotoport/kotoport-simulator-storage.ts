import { kotoportContent as content } from "@/pages/kotoport-content";
import { simulationInputDefinitions, staffingInputDefinitions, type SimulationValues, type StaffingValues } from "@/pages/kotoport-simulation";

export type FieldKey = keyof SimulationValues | keyof StaffingValues;
type RawValues = Record<FieldKey, string>;
export type ResultUnit = "call" | "minute" | "month" | "time";
export type SimulatorConditions = {
  rawValues: RawValues;
  rawMonthlyQuote: string;
  planId: string;
  feeMode: "reference" | "quote";
  unit: ResultUnit;
};
type SimulatorStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const simulatorStorageKey = "kotoport:effect-simulator:v1";
const inputDefinitions = { ...simulationInputDefinitions, ...staffingInputDefinitions };
const fieldKeys = Object.keys(inputDefinitions);
const payloadKeys = ["version", "rawValues", "rawMonthlyQuote", "planId", "feeMode", "unit"];
const maxRawLength = 128;
const maxPayloadLength = 4096;

export function createDefaultSimulatorConditions(): SimulatorConditions {
  return {
    rawValues: Object.fromEntries(Object.entries(inputDefinitions).map(([key, definition]) => [key, String(definition.defaultValue)])) as RawValues,
    rawMonthlyQuote: "",
    planId: "medium",
    feeMode: "reference",
    unit: "call",
  };
}

function browserStorage(): SimulatorStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRawNumber(value: unknown): value is string {
  if (typeof value !== "string" || value.length > maxRawLength) return false;
  if (value.trim() === "") return true;
  return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value) && Number.isFinite(Number(value));
}

function isRawValues(value: unknown): value is RawValues {
  return isRecord(value) && Object.keys(value).length === fieldKeys.length && fieldKeys.every(key => isRawNumber(value[key]));
}

export function readSimulatorConditions(storage: SimulatorStorage | null = browserStorage()): SimulatorConditions {
  try {
    const saved = storage?.getItem(simulatorStorageKey);
    if (!saved || saved.length > maxPayloadLength) return createDefaultSimulatorConditions();
    const payload: unknown = JSON.parse(saved);
    if (isRecord(payload)
      && Object.keys(payload).length === payloadKeys.length
      && payloadKeys.every(key => Object.hasOwn(payload, key))
      && payload.version === 1
      && isRawValues(payload.rawValues)
      && isRawNumber(payload.rawMonthlyQuote)
      && typeof payload.planId === "string"
      && content.pricing.plans.some(plan => plan.id === payload.planId)
      && (payload.feeMode === "reference" || payload.feeMode === "quote")
      && (payload.unit === "call" || payload.unit === "minute" || payload.unit === "month" || payload.unit === "time")) {
      return { rawValues: payload.rawValues, rawMonthlyQuote: payload.rawMonthlyQuote, planId: payload.planId, feeMode: payload.feeMode, unit: payload.unit };
    }
  } catch {
    // Unavailable storage and invalid JSON must not prevent an in-memory calculation.
  }
  return createDefaultSimulatorConditions();
}

export function saveSimulatorConditions(conditions: SimulatorConditions, storage: SimulatorStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    const { rawValues, rawMonthlyQuote, planId, feeMode, unit } = conditions;
    storage.setItem(simulatorStorageKey, JSON.stringify({ version: 1, rawValues, rawMonthlyQuote, planId, feeMode, unit }));
    return true;
  } catch {
    return false;
  }
}

export function resetSimulatorConditions(storage: SimulatorStorage | null = browserStorage()): SimulatorConditions {
  const defaults = createDefaultSimulatorConditions();
  try {
    storage?.removeItem(simulatorStorageKey);
  } catch {
    // Still try to replace the old value if removal alone is unavailable.
  }
  saveSimulatorConditions(defaults, storage);
  return defaults;
}
