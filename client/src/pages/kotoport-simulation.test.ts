import assert from "node:assert/strict";
import test from "node:test";
import { kotoportContent as content, type KotoportPlan } from "./kotoport-content";
import { compareKotoportStaffing, simulationInputDefinitions, simulateKotoport, staffingInputDefinitions, type SimulationValues, type StaffingValues, type StaffingPricing } from "./kotoport-simulation";

const mediumPlan = content.pricing.plans.find(plan => plan.id === "medium")!;
const fixture: SimulationValues = {
  dailyCalls: 30,
  averageCallMinutes: 5,
  daysPerMonth: 20,
  aiCoveragePercent: 60,
  reviewMinutesPerAiCall: 0.5,
  hourlyWageYen: 1500,
};

function result(values: Partial<SimulationValues> = {}, quoteYen: number | null = null, plan: KotoportPlan = mediumPlan) {
  const estimate = simulateKotoport({ ...fixture, ...values }, plan, quoteYen);
  assert.notEqual(estimate, null);
  return estimate!;
}

function close(actual: number | null, expected: number) {
  assert.ok(actual !== null && Math.abs(actual - expected) < 1e-8, `${actual} should equal ${expected}`);
}

function noCostComparison(estimate: NonNullable<ReturnType<typeof simulateKotoport>>) {
  for (const key of ["aiFeeYen", "afterComparableYen", "differenceYen", "firstMonthAiYen"] as const) {
    assert.equal(estimate[key], null, key);
  }
}

test("input definitions retain the six agreed assumptions and defaults", () => {
  assert.deepEqual(Object.keys(simulationInputDefinitions).sort(), Object.keys(fixture).sort());
  assert.deepEqual(Object.fromEntries(Object.entries(simulationInputDefinitions).map(([key, definition]) => [key, definition.defaultValue])), fixture);
  for (const definition of Object.values(simulationInputDefinitions)) {
    assert.ok(definition.label.length > 0 && definition.unit.length > 0);
    assert.ok(definition.defaultValue >= definition.min && definition.defaultValue <= definition.max);
  }
});

test("default workload preserves time value without applying a reference monthly fee", () => {
  const estimate = simulateKotoport(fixture, mediumPlan)!;
  assert.deepEqual(estimate, {
    monthlyCalls: 600,
    monthlyMinutes: 3000,
    aiCalls: 360,
    directHumanCalls: 240,
    aiMinutes: 1800,
    directHumanMinutes: 1200,
    reviewMinutes: 180,
    beforeHumanHours: 50,
    afterHumanHours: 23,
    freedHours: 27,
    freedPercent: 54,
    beforeLaborYen: 75000,
    afterLaborYen: 34500,
    aiFeeYen: null,
    afterComparableYen: null,
    differenceYen: null,
    firstMonthAiYen: null,
    requiresVolumeReview: false,
  });
  assert.equal(estimate.beforeLaborYen - estimate.afterLaborYen, 40500);
  const quoted = result({}, 30000);
  assert.equal(quoted.afterComparableYen, 64500);
  assert.equal(quoted.differenceYen, 10500);
});

test("reported 200-call workload compares only an explicitly supplied monthly quote", () => {
  const values = { dailyCalls: 200, aiCoveragePercent: 80 };
  const unquoted = result(values);
  close(unquoted.beforeHumanHours, 333.3333333333333);
  close(unquoted.afterHumanHours, 93.33333333333333);
  close(unquoted.freedHours, 240);
  close(unquoted.beforeLaborYen - unquoted.afterLaborYen, 360000);
  noCostComparison(unquoted);

  const quoted = result(values, 100000);
  close(quoted.beforeLaborYen, 500000);
  close(quoted.afterLaborYen, 140000);
  assert.equal(quoted.aiFeeYen, 100000);
  close(quoted.afterComparableYen, 240000);
  close(quoted.differenceYen, 260000);
  assert.equal(quoted.firstMonthAiYen, 150000);

  close(result(values, 600000).afterComparableYen, 740000);
  close(result(values, 600000).differenceYen, -240000);
  close(result(values, 0).afterComparableYen, 140000);
  close(result(values, 0).differenceYen, 360000);
});

test("missing or invalid quotes preserve workload and do not fall back to zero or reference fees", () => {
  for (const quote of [null, NaN, Infinity, -Infinity, -0.01, 100000000.01, "", "100000", undefined] as const) {
    const estimate = result({ dailyCalls: 200, aiCoveragePercent: 80 }, quote as number | null);
    close(estimate.freedHours, 240);
    noCostComparison(estimate);
  }
  for (const quote of [0, 0.25, 100000000]) {
    const estimate = result({}, quote);
    assert.equal(estimate.aiFeeYen, quote);
    assert.equal(estimate.firstMonthAiYen, quote + mediumPlan.initialFeeYen);
  }
  noCostComparison(result());
  assert.equal(result({}, 100000).aiFeeYen, 100000);
});

test("zero calls retain no workload while a supplied quote and selected initial fee remain explicit", () => {
  const unquoted = result({ dailyCalls: 0 });
  for (const key of ["monthlyCalls", "monthlyMinutes", "aiCalls", "directHumanCalls", "aiMinutes", "directHumanMinutes", "reviewMinutes", "beforeHumanHours", "afterHumanHours", "freedHours", "freedPercent", "beforeLaborYen", "afterLaborYen"] as const) {
    assert.equal(unquoted[key], 0, key);
  }
  noCostComparison(unquoted);
  for (const plan of content.pricing.plans) {
    const estimate = result({ dailyCalls: 0 }, 10000, plan);
    assert.equal(estimate.afterComparableYen, 10000);
    assert.equal(estimate.differenceYen, -10000);
    assert.equal(estimate.firstMonthAiYen, 10000 + plan.initialFeeYen);
  }
});

test("AI coverage endpoints preserve direct and review responsibilities independently of quote", () => {
  const noAi = result({ aiCoveragePercent: 0 }, 10000);
  assert.equal(noAi.directHumanCalls, 600);
  assert.equal(noAi.afterHumanHours, 50);
  assert.equal(noAi.reviewMinutes, 0);
  assert.equal(noAi.freedHours, 0);
  assert.equal(noAi.differenceYen, -10000);

  const allAi = result({ aiCoveragePercent: 100 });
  assert.equal(allAi.directHumanCalls, 0);
  assert.equal(allAi.directHumanMinutes, 0);
  assert.equal(allAi.reviewMinutes, 300);
  assert.equal(allAi.afterHumanHours, 5);
  assert.equal(allAi.freedHours, 45);
  noCostComparison(allAi);

  const noReview = result({ aiCoveragePercent: 100, reviewMinutesPerAiCall: 0 });
  assert.equal(noReview.afterHumanHours, 0);
  assert.equal(noReview.freedPercent, 100);
});

test("longer review time and a high quote retain signed increases", () => {
  const equal = result({ reviewMinutesPerAiCall: 5 }, 10000);
  assert.equal(equal.afterHumanHours, 50);
  assert.equal(equal.freedHours, 0);
  assert.equal(equal.differenceYen, -10000);

  const longer = result({ reviewMinutesPerAiCall: 6 });
  assert.equal(longer.afterHumanHours, 56);
  assert.equal(longer.freedHours, -6);
  assert.equal(longer.freedPercent, -12);
  assert.equal(longer.beforeLaborYen - longer.afterLaborYen, -9000);
  noCostComparison(longer);
  assert.equal(result({ reviewMinutesPerAiCall: 6 }, 10000).differenceYen, -19000);
  assert.equal(result({}, 100000).freedHours, 27);
  assert.equal(result({}, 100000).differenceYen, -59500);
});

test("fractional calls, times and quote amounts are not rounded during calculation", () => {
  const estimate = result({ dailyCalls: 3, daysPerMonth: 1, averageCallMinutes: 100.05, aiCoveragePercent: 100, reviewMinutesPerAiCall: 0.25 }, 30000.25);
  close(estimate.aiMinutes, 300.15);
  close(estimate.afterHumanHours, 0.0125);
  assert.equal(estimate.aiFeeYen, 30000.25);
  assert.equal(estimate.firstMonthAiYen, 80000.25);

  const fractionalCalls = result({ dailyCalls: 1, daysPerMonth: 1, aiCoveragePercent: 33 });
  close(fractionalCalls.aiCalls, 0.33);
  close(fractionalCalls.directHumanCalls, 0.67);
  close(fractionalCalls.reviewMinutes, 0.165);
});

test("every basic field rejects invalid runtime inputs and recovers at valid boundaries", () => {
  for (const [field, definition] of Object.entries(simulationInputDefinitions)) {
    const invalidValues: unknown[] = [NaN, Infinity, -Infinity, definition.min - 0.1, definition.max + 0.1, undefined, null, ""];
    if (definition.integer) invalidValues.push(definition.min + 0.5);
    for (const value of invalidValues) {
      assert.equal(simulateKotoport({ ...fixture, [field]: value } as SimulationValues, mediumPlan, 100000), null, `${field}=${String(value)}`);
    }
    assert.notEqual(simulateKotoport({ ...fixture, [field]: definition.min }, mediumPlan, 100000), null, `${field} minimum`);
    assert.notEqual(simulateKotoport({ ...fixture, [field]: definition.max }, mediumPlan, 100000), null, `${field} maximum`);
  }
});

test("volume review uses the existing workload threshold without extrapolating a fee", () => {
  assert.equal(result({ aiCoveragePercent: 100 }).requiresVolumeReview, false);
  assert.equal(result({ aiCoveragePercent: 100, averageCallMinutes: 5.001 }).requiresVolumeReview, true);
  assert.equal(result({ dailyCalls: 1000, aiCoveragePercent: 0 }).requiresVolumeReview, false);
  noCostComparison(result({ dailyCalls: 1000, aiCoveragePercent: 100 }));
});

const staffingFixture: StaffingValues = { staffingCount: 1, staffingHoursPerDay: 8 };
function staffingResult(values: Partial<SimulationValues> = {}, staffing: Partial<StaffingValues> = {}, pricing: StaffingPricing = { mode: "reference" }, plan = mediumPlan) {
  const estimate = compareKotoportStaffing({ ...fixture, ...values }, plan, { ...staffingFixture, ...staffing }, pricing);
  assert.notEqual(estimate, null);
  return estimate!;
}

test("dedicated staffing includes the paid time around the same AI workload", () => {
  const estimate = staffingResult();
  assert.equal(estimate.aiCalls, 360);
  assert.equal(estimate.aiMinutes, 1800);
  assert.equal(estimate.staffingHours, 160);
  assert.equal(estimate.nonCallHours, 130);
  assert.equal(estimate.staffingLaborYen, 240000);
  assert.equal(estimate.reviewLaborYen, 4500);
  assert.equal(estimate.aiFeeYen, 82500);
  assert.equal(estimate.monthlyAiYen, 87000);
  assert.equal(estimate.monthlyDifferenceYen, 153000);
  assert.equal(estimate.differencePercent, 63.75);
  close(estimate.perCall!.humanYen, 240000 / 360);
  close(estimate.perCall!.aiYen, 87000 / 360);
  close(estimate.perCall!.differenceYen, 425);
  close(estimate.perMinute!.humanYen, 240000 / 1800);
  close(estimate.perMinute!.aiYen, 87000 / 1800);
  assert.deepEqual(estimate.referenceEstimate, { overageMinutes: 1500, overageFeeYen: 52500, monthlySubtotalYen: 82500, firstMonthSubtotalYen: 132500 });
  assert.equal(estimate.hasCapacity, true);
});

test("base fee covers included minutes and only excess minutes incur usage", () => {
  assert.equal(staffingResult({ dailyCalls: 1, daysPerMonth: 1, aiCoveragePercent: 100, averageCallMinutes: 120 }).aiFeeYen, 30000);
  assert.equal(staffingResult({ dailyCalls: 3, daysPerMonth: 1, aiCoveragePercent: 100, averageCallMinutes: 100 }).aiFeeYen, 30000);
  close(staffingResult({ dailyCalls: 3, daysPerMonth: 1, aiCoveragePercent: 100, averageCallMinutes: 100.05 }).aiFeeYen, 30005.25);
  const small = content.pricing.plans.find(plan => plan.id === "small")!;
  assert.equal(staffingResult({}, {}, { mode: "reference" }, small).aiFeeYen, 113300);
});

test("quote mode replaces reference subtotal and retains increases and explicit zero", () => {
  const quoted = staffingResult({}, {}, { mode: "quote", monthlyQuoteYen: 100000 });
  assert.equal(quoted.referenceEstimate, null);
  assert.equal(quoted.monthlyAiYen, 104500);
  assert.equal(quoted.monthlyDifferenceYen, 135500);
  assert.equal(staffingResult({}, {}, { mode: "quote", monthlyQuoteYen: 300000 }).monthlyDifferenceYen, -64500);
  assert.equal(staffingResult({}, {}, { mode: "quote", monthlyQuoteYen: 0 }).monthlyAiYen, 4500);
  assert.equal(staffingResult({}, {}, { mode: "quote", monthlyQuoteYen: 0 }).monthlyDifferenceYen, 235500);
});

test("missing or invalid quotes have no reference fallback and keep workload and staffing", () => {
  for (const quote of [null, NaN, Infinity, -1, 100000001, "", "100000", undefined]) {
    const estimate = staffingResult({}, {}, { mode: "quote", monthlyQuoteYen: quote as number | null });
    assert.equal(estimate.aiCalls, 360);
    assert.equal(estimate.staffingLaborYen, 240000);
    for (const key of ["aiFeeYen", "monthlyAiYen", "monthlyDifferenceYen", "differencePercent", "perCall", "perMinute", "referenceEstimate"] as const) assert.equal(estimate[key], null, key);
  }
  assert.equal(staffingResult({}, {}, { mode: "quote", monthlyQuoteYen: 100000000 }).aiFeeYen, 100000000);
});

test("zero calls and zero coverage retain the reference base but never divide by zero", () => {
  for (const values of [{ dailyCalls: 0 }, { aiCoveragePercent: 0 }]) {
    const estimate = staffingResult(values);
    assert.equal(estimate.aiCalls, 0);
    assert.equal(estimate.aiMinutes, 0);
    assert.equal(estimate.aiFeeYen, 30000);
    assert.equal(estimate.reviewLaborYen, 0);
    assert.equal(estimate.monthlyAiYen, 30000);
    assert.equal(estimate.perCall, null);
    assert.equal(estimate.perMinute, null);
    assert.equal(estimate.monthlyDifferenceYen, null);
    assert.equal(estimate.differencePercent, null);
  }
});

test("insufficient staffing does not auto increase people or claim a saving", () => {
  const insufficient = staffingResult({}, { staffingHoursPerDay: 1 });
  assert.equal(insufficient.staffingHours, 20);
  assert.equal(insufficient.staffingLaborYen, 30000);
  assert.equal(insufficient.nonCallHours, 0);
  assert.equal(insufficient.hasCapacity, false);
  assert.equal(insufficient.aiFeeYen, 82500);
  assert.equal(insufficient.monthlyAiYen, 87000);
  for (const key of ["monthlyDifferenceYen", "differencePercent", "perCall", "perMinute"] as const) assert.equal(insufficient[key], null, key);
  const boundary = staffingResult({}, { staffingHoursPerDay: 1.5 });
  assert.equal(boundary.hasCapacity, true);
  assert.equal(boundary.nonCallHours, 0);
  assert.equal(boundary.monthlyDifferenceYen, -42000);
  const highVolume = staffingResult({ dailyCalls: 200, aiCoveragePercent: 80 });
  assert.equal(highVolume.hasCapacity, false);
  assert.equal(highVolume.monthlyDifferenceYen, null);
  const twoStaff = staffingResult({ dailyCalls: 200, aiCoveragePercent: 80 }, { staffingCount: 2 });
  assert.equal(twoStaff.hasCapacity, true);
  assert.equal(twoStaff.staffingLaborYen, 480000);
  assert.equal(twoStaff.monthlyAiYen, 619500);
  assert.equal(twoStaff.monthlyDifferenceYen, -139500);
});

test("units use AI cases and minutes while staffing and review remain independent", () => {
  const partial = staffingResult({ dailyCalls: 1, daysPerMonth: 1, aiCoveragePercent: 33, reviewMinutesPerAiCall: 0.25 });
  close(partial.aiCalls, 0.33);
  close(partial.aiMinutes, 1.65);
  close(partial.perCall!.humanYen, 12000 / 0.33);
  close(partial.perCall!.aiYen, (30000 + 0.33 * 0.25 / 60 * 1500) / 0.33);
  close(partial.perMinute!.aiYen * partial.aiMinutes, partial.monthlyAiYen!);
  const higherReview = staffingResult({ reviewMinutesPerAiCall: 30 });
  assert.equal(higherReview.monthlyAiYen, 352500);
  assert.equal(higherReview.monthlyDifferenceYen, -112500);
  assert.equal(higherReview.staffingLaborYen, 240000);
  assert.equal(staffingResult({}, { staffingCount: 2 }).staffingLaborYen, 480000);
});

test("staffing inputs reject empty or invalid runtime values and accept defined boundaries", () => {
  for (const [field, definition] of Object.entries(staffingInputDefinitions)) {
    for (const value of [null, undefined, "", NaN, Infinity, definition.min - 0.1, definition.max + 0.1, ...(definition.integer ? [1.5] : [])]) {
      assert.equal(compareKotoportStaffing(fixture, mediumPlan, { ...staffingFixture, [field]: value } as StaffingValues, { mode: "reference" }), null, `${field}=${String(value)}`);
    }
    for (const value of [definition.min, definition.max]) assert.notEqual(compareKotoportStaffing(fixture, mediumPlan, { ...staffingFixture, [field]: value }, { mode: "reference" }), null);
  }
  assert.equal(compareKotoportStaffing({ ...fixture, dailyCalls: NaN }, mediumPlan, staffingFixture, { mode: "reference" }), null);
});
