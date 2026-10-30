import { kotoportContent as content, type KotoportPlan } from "./kotoport-content";
import { calculatePlanEstimate } from "./kotoport-pricing";

export type SimulationValues = {
  dailyCalls: number;
  averageCallMinutes: number;
  daysPerMonth: number;
  aiCoveragePercent: number;
  reviewMinutesPerAiCall: number;
  hourlyWageYen: number;
};

type SimulationInputDefinition = {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number | "any";
  integer: boolean;
  defaultValue: number;
};

export const simulationInputDefinitions = {
  dailyCalls: { label: "1日の電話件数", unit: "件／日", min: 0, max: 1000, step: 1, integer: true, defaultValue: 30 },
  averageCallMinutes: { label: "1件の平均通話時間", unit: "分／件", min: 0.1, max: 120, step: 0.1, integer: false, defaultValue: 5 },
  daysPerMonth: { label: "月の稼働日数", unit: "日／月", min: 1, max: 31, step: 1, integer: true, defaultValue: 20 },
  aiCoveragePercent: { label: "AIに任せる電話の割合", unit: "%", min: 0, max: 100, step: 1, integer: true, defaultValue: 60 },
  reviewMinutesPerAiCall: { label: "AI対応後に人が確認する時間", unit: "分／件", min: 0, max: 120, step: 0.1, integer: false, defaultValue: 0.5 },
  hourlyWageYen: { label: "人の対応時間を換算する時給", unit: "円／時間", min: 1, max: 100000, step: "any", integer: false, defaultValue: 1500 },
} satisfies Record<keyof SimulationValues, SimulationInputDefinition>;

export const aiMonthlyQuoteBounds = { min: 0, max: 100000000 } as const;

export function isValidAiMonthlyQuoteYen(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= aiMonthlyQuoteBounds.min && value <= aiMonthlyQuoteBounds.max;
}

export function simulateKotoport(values: SimulationValues, plan: KotoportPlan, aiMonthlyQuoteYen: number | null = null) {
  for (const field of Object.keys(simulationInputDefinitions) as (keyof SimulationValues)[]) {
    const value = values[field];
    const definition = simulationInputDefinitions[field];
    if (!Number.isFinite(value) || value < definition.min || value > definition.max || (definition.integer && !Number.isInteger(value))) return null;
  }

  const monthlyCalls = values.dailyCalls * values.daysPerMonth;
  const monthlyMinutes = monthlyCalls * values.averageCallMinutes;
  const aiCalls = monthlyCalls * values.aiCoveragePercent / 100;
  const directHumanCalls = monthlyCalls - aiCalls;
  const aiMinutes = aiCalls * values.averageCallMinutes;
  const directHumanMinutes = directHumanCalls * values.averageCallMinutes;
  const reviewMinutes = aiCalls * values.reviewMinutesPerAiCall;
  const beforeHumanHours = monthlyMinutes / 60;
  const afterHumanHours = (directHumanMinutes + reviewMinutes) / 60;
  const freedHours = beforeHumanHours - afterHumanHours;
  const beforeLaborYen = beforeHumanHours * values.hourlyWageYen;
  const afterLaborYen = afterHumanHours * values.hourlyWageYen;
  const aiFeeYen = isValidAiMonthlyQuoteYen(aiMonthlyQuoteYen) ? aiMonthlyQuoteYen : null;
  const afterComparableYen = aiFeeYen === null ? null : afterLaborYen + aiFeeYen;

  return {
    monthlyCalls,
    monthlyMinutes,
    aiCalls,
    directHumanCalls,
    aiMinutes,
    directHumanMinutes,
    reviewMinutes,
    beforeHumanHours,
    afterHumanHours,
    freedHours,
    freedPercent: beforeHumanHours > 0 ? freedHours / beforeHumanHours * 100 : 0,
    beforeLaborYen,
    afterLaborYen,
    aiFeeYen,
    afterComparableYen,
    differenceYen: afterComparableYen === null ? null : beforeLaborYen - afterComparableYen,
    firstMonthAiYen: aiFeeYen === null ? null : aiFeeYen + plan.initialFeeYen,
    requiresVolumeReview: aiMinutes > content.pricing.calculator.referenceMinutesThreshold,
  };
}

export type StaffingValues = { staffingCount: number; staffingHoursPerDay: number };
export type StaffingPricing = { mode: "reference" } | { mode: "quote"; monthlyQuoteYen: number | null };
export const staffingInputDefinitions = {
  staffingCount: { label: "専任で配置する人数", unit: "人", min: 1, max: 1000, step: 1, integer: true, defaultValue: 1 },
  staffingHoursPerDay: { label: "1人の配置時間", unit: "時間／日", min: 0.1, max: 24, step: 0.1, integer: false, defaultValue: 8 },
} satisfies Record<keyof StaffingValues, SimulationInputDefinition>;

/** Compare a new dedicated staffing allocation with AI for the same AI-target work. */
export function compareKotoportStaffing(values: SimulationValues, plan: KotoportPlan, staffing: StaffingValues, pricing: StaffingPricing) {
  const workload = simulateKotoport(values, plan);
  if (workload === null) return null;
  for (const field of Object.keys(staffingInputDefinitions) as (keyof StaffingValues)[]) {
    const value = staffing[field];
    const definition = staffingInputDefinitions[field];
    if (!Number.isFinite(value) || value < definition.min || value > definition.max || (definition.integer && !Number.isInteger(value))) return null;
  }
  const staffingHours = staffing.staffingCount * staffing.staffingHoursPerDay * values.daysPerMonth;
  const hasCapacity = staffingHours >= workload.aiMinutes / 60;
  const staffingLaborYen = staffingHours * values.hourlyWageYen;
  const reviewLaborYen = workload.reviewMinutes / 60 * values.hourlyWageYen;
  const referenceEstimate = pricing.mode === "reference" ? calculatePlanEstimate(plan, workload.aiMinutes) : null;
  const aiFeeYen = referenceEstimate?.monthlySubtotalYen ?? (pricing.mode === "quote" && isValidAiMonthlyQuoteYen(pricing.monthlyQuoteYen) ? pricing.monthlyQuoteYen : null);
  const monthlyAiYen = aiFeeYen === null ? null : aiFeeYen + reviewLaborYen;
  const monthlyDifferenceYen = hasCapacity && workload.aiCalls > 0 && monthlyAiYen !== null ? staffingLaborYen - monthlyAiYen : null;
  const unitCosts = (denominator: number) => monthlyDifferenceYen === null || monthlyAiYen === null || denominator <= 0 ? null : {
    humanYen: staffingLaborYen / denominator,
    aiYen: monthlyAiYen / denominator,
    differenceYen: monthlyDifferenceYen / denominator,
  };
  return {
    aiCalls: workload.aiCalls,
    aiMinutes: workload.aiMinutes,
    staffingHours,
    nonCallHours: Math.max(staffingHours - workload.aiMinutes / 60, 0),
    hasCapacity,
    staffingLaborYen,
    reviewHours: workload.reviewMinutes / 60,
    reviewLaborYen,
    aiFeeYen,
    monthlyAiYen,
    monthlyDifferenceYen,
    differencePercent: monthlyDifferenceYen === null ? null : monthlyDifferenceYen * 100 / staffingLaborYen,
    perCall: unitCosts(workload.aiCalls),
    perMinute: unitCosts(workload.aiMinutes),
    referenceEstimate,
  };
}
