import type { KotoportPlan } from "./kotoport-content";

export function calculatePlanEstimate(plan: KotoportPlan, monthlyMinutes: number) {
  const overageMinutes = Math.max(monthlyMinutes - plan.includedMinutes, 0);
  const overageFeeYen = overageMinutes * plan.overageYenPerMinute;
  const monthlySubtotalYen = plan.monthlyFeeYen + overageFeeYen;
  return { overageMinutes, overageFeeYen, monthlySubtotalYen, firstMonthSubtotalYen: monthlySubtotalYen + plan.initialFeeYen };
}
