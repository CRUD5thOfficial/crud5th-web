import assert from "node:assert/strict";
import test from "node:test";
import { kotoportContent as content, type KotoportPlan } from "./kotoport-content";
import { simulationInputDefinitions, simulateKotoport, type SimulationValues } from "./kotoport-simulation";

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
