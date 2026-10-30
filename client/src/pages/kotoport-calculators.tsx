import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { kotoportContent as content, type KotoportPlan } from "./kotoport-content";
import { calculatePlanEstimate } from "./kotoport-pricing";

function formatYen(amountYen: number) {
  return `${amountYen.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}円`;
}

function parseMonthlyMinutes(input: string) {
  if (input.trim() === "") return null;
  const minutes = Number(input);
  const { minMinutes, maxMinutes } = content.pricing.calculator;
  return Number.isFinite(minutes) && minutes >= minMinutes && minutes <= maxMinutes ? minutes : null;
}

type EconomicsInputId = keyof typeof content.economics.inputs;
type EconomicsInputState = { value: string; hasBadInput: boolean };
type EconomicsInputs = Record<EconomicsInputId, EconomicsInputState>;
type EconomicsValues = Record<EconomicsInputId, number>;

function parseEconomicsInput(input: EconomicsInputState, field: EconomicsInputId) {
  const definition = content.economics.inputs[field];
  if (input.hasBadInput || input.value.trim() === "") return null;
  const value = Number(input.value);
  return Number.isFinite(value) && value >= definition.min && value <= definition.max && (!definition.integer || Number.isInteger(value)) ? value : null;
}

function parseEconomicsInputs(inputs: EconomicsInputs): EconomicsValues | null {
  const dailyMinutes = parseEconomicsInput(inputs.dailyMinutes, "dailyMinutes");
  const aiCoveragePercent = parseEconomicsInput(inputs.aiCoveragePercent, "aiCoveragePercent");
  const hourlyWageYen = parseEconomicsInput(inputs.hourlyWageYen, "hourlyWageYen");
  const remainingOperators = parseEconomicsInput(inputs.remainingOperators, "remainingOperators");
  const currentOperators = parseEconomicsInput(inputs.currentOperators, "currentOperators");
  const hoursPerDay = parseEconomicsInput(inputs.hoursPerDay, "hoursPerDay");
  const daysPerMonth = parseEconomicsInput(inputs.daysPerMonth, "daysPerMonth");
  const averageCallMinutes = parseEconomicsInput(inputs.averageCallMinutes, "averageCallMinutes");
  if (dailyMinutes === null || aiCoveragePercent === null || hourlyWageYen === null || remainingOperators === null || currentOperators === null || hoursPerDay === null || daysPerMonth === null || averageCallMinutes === null) return null;
  return { dailyMinutes, aiCoveragePercent, hourlyWageYen, remainingOperators, currentOperators, hoursPerDay, daysPerMonth, averageCallMinutes };
}

function calculateEconomicsEstimate(values: EconomicsValues, plan: KotoportPlan) {
  const currentHours = values.currentOperators * values.hoursPerDay * values.daysPerMonth;
  const remainingHours = values.remainingOperators * values.hoursPerDay * values.daysPerMonth;
  const monthlyMinutes = values.dailyMinutes * values.daysPerMonth;
  const aiMinutes = monthlyMinutes * values.aiCoveragePercent / 100;
  const aiFeeYen = calculatePlanEstimate(plan, aiMinutes).monthlySubtotalYen;
  const currentWagesYen = currentHours * values.hourlyWageYen;
  const remainingWagesYen = remainingHours * values.hourlyWageYen;
  const afterCostYen = remainingWagesYen + aiFeeYen;
  const differenceYen = currentWagesYen - afterCostYen;
  const aiCallCount = aiMinutes / values.averageCallMinutes;
  return {
    currentHours, remainingHours, monthlyMinutes, aiMinutes, aiFeeYen, currentWagesYen, remainingWagesYen, afterCostYen, differenceYen,
    breakEvenHours: aiFeeYen / values.hourlyWageYen,
    perCallYen: aiCallCount > 0 ? aiFeeYen / aiCallCount : null,
  };
}

function formatQuantity(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

export function EconomicsCalculator() {
  const economics = content.economics;
  const definitions = economics.inputs;
  const [inputs, setInputs] = useState<EconomicsInputs>(() => ({
    dailyMinutes: { value: String(definitions.dailyMinutes.defaultValue), hasBadInput: false },
    aiCoveragePercent: { value: String(definitions.aiCoveragePercent.defaultValue), hasBadInput: false },
    hourlyWageYen: { value: String(definitions.hourlyWageYen.defaultValue), hasBadInput: false },
    remainingOperators: { value: String(definitions.remainingOperators.defaultValue), hasBadInput: false },
    currentOperators: { value: String(definitions.currentOperators.defaultValue), hasBadInput: false },
    hoursPerDay: { value: String(definitions.hoursPerDay.defaultValue), hasBadInput: false },
    daysPerMonth: { value: String(definitions.daysPerMonth.defaultValue), hasBadInput: false },
    averageCallMinutes: { value: String(definitions.averageCallMinutes.defaultValue), hasBadInput: false },
  }));
  const [planId, setPlanId] = useState(economics.defaultPlanId);
  const plan = content.pricing.plans.find(candidate => candidate.id === planId);
  const values = parseEconomicsInputs(inputs);
  const estimate = values !== null && plan ? calculateEconomicsEstimate(values, plan) : null;
  const fields: EconomicsInputId[] = ["dailyMinutes", "aiCoveragePercent", "hourlyWageYen", "remainingOperators", "currentOperators", "hoursPerDay", "daysPerMonth", "averageCallMinutes"];
  const hasInvalidInput = fields.some(field => inputs[field].hasBadInput || (inputs[field].value.trim() !== "" && parseEconomicsInput(inputs[field], field) === null));

  function renderInput(field: EconomicsInputId) {
    const definition = definitions[field];
    const input = inputs[field];
    const isInvalid = input.hasBadInput || (input.value.trim() !== "" && parseEconomicsInput(input, field) === null);
    const inputId = `kotoport-economics-${field}`;
    return <div className="kp-economics-field" key={field}>
      <label htmlFor={inputId}>{definition.label}</label>
      <div><input id={inputId} type="number" inputMode={definition.integer ? "numeric" : "decimal"} min={definition.min} max={definition.max} step={definition.step} value={input.value} aria-invalid={isInvalid} aria-describedby={`${inputId}-help`} onChange={event => {
        const updated = { value: event.currentTarget.value, hasBadInput: event.currentTarget.validity.badInput };
        setInputs(previous => ({ ...previous, [field]: updated }));
      }} /><span>{definition.unit}</span></div>
      <p id={`${inputId}-help`} className={isInvalid ? "kp-input-error" : "kp-small"}>{isInvalid ? economics.inputError : `${definition.min.toLocaleString("ja-JP")}〜${definition.max.toLocaleString("ja-JP")}${definition.integer ? "・整数" : ""}`}</p>
    </div>;
  }

  return <section className="kp-section kp-container kp-economics" id="kotoport-economics" aria-labelledby="kotoport-economics-title" data-motion-section>
    <div className="kp-section-heading"><h2 id="kotoport-economics-title">{economics.title}</h2></div>
    <div className="kp-economics-form" data-analytics-calculator="economics">
      <div className="kp-economics-inputs">{renderInput("dailyMinutes")}{renderInput("aiCoveragePercent")}{renderInput("hourlyWageYen")}{renderInput("remainingOperators")}</div>
      <details className="kp-economics-details"><summary>{economics.detailsLabel}</summary>
        <div className="kp-economics-inputs">{renderInput("currentOperators")}{renderInput("hoursPerDay")}{renderInput("daysPerMonth")}{renderInput("averageCallMinutes")}
          <div className="kp-economics-field"><label htmlFor="kotoport-economics-plan">{economics.planLabel}</label><select id="kotoport-economics-plan" value={planId} onChange={event => setPlanId(event.currentTarget.value)} aria-describedby="kotoport-economics-plan-help">{content.pricing.plans.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select><p id="kotoport-economics-plan-help" className="kp-small">{economics.planHelp}</p></div>
        </div>
        <p className="kp-small kp-wage-source"><a href={economics.source.url} target="_blank" rel="noopener noreferrer">{economics.source.label}<ArrowRight aria-hidden="true" /></a>{economics.source.description}</p>
      </details>
      <p className="kp-economics-assumption">{economics.assumption}</p>
    </div>
    <div className="kp-economics-output" aria-live="polite" aria-atomic="true">
      {values !== null && estimate !== null && plan ? <>
        <figure className="kp-cost-bars"><figcaption>同じ目盛りで月の小計を比較</figcaption>
          <div><span>{economics.beforeLabel}<small>{formatQuantity(values.currentOperators)}人</small></span><div className="kp-cost-track" aria-hidden="true"><span className="kp-cost-wage" style={{ width: `${estimate.currentWagesYen / Math.max(estimate.currentWagesYen, estimate.afterCostYen, 1) * 100}%` }} /></div><strong>{formatYen(estimate.currentWagesYen)}<small>{economics.monthlyUnit}</small></strong></div>
          <div><span>{economics.afterLabel}<small>{formatQuantity(values.remainingOperators)}人＋AI</small></span><div className="kp-cost-track" aria-hidden="true"><span className="kp-cost-wage" style={{ width: `${estimate.remainingWagesYen / Math.max(estimate.currentWagesYen, estimate.afterCostYen, 1) * 100}%` }} /><span className="kp-cost-ai" style={{ width: `${estimate.aiFeeYen / Math.max(estimate.currentWagesYen, estimate.afterCostYen, 1) * 100}%` }} /></div><strong>{formatYen(estimate.afterCostYen)}<small>{economics.monthlyUnit}</small></strong></div>

        </figure>
        <div className="kp-cost-result"><dl><div><dt>{economics.wageLabel}</dt><dd>{formatYen(estimate.remainingWagesYen)}</dd></div><div><dt>{economics.aiLabel}</dt><dd>{formatYen(estimate.aiFeeYen)}</dd></div></dl><div className="kp-cost-difference"><p>{estimate.differenceYen > 0 ? economics.differenceLabel : estimate.differenceYen < 0 ? economics.increaseLabel : economics.equalLabel}</p><strong>{formatYen(Math.abs(estimate.differenceYen))}<small>{economics.monthlyUnit}</small></strong></div></div>
        <p className="kp-economics-unchanged">{economics.noStaffingChange}</p>
        <details className="kp-economics-details kp-economics-breakdown"><summary>{economics.breakdownLabel}</summary>
          <p>現在の{formatQuantity(values.currentOperators)}人を維持する場合：月{formatYen(estimate.aiFeeYen)}の費用増。</p>
          <p>比較の前提：{formatQuantity(values.currentOperators)}人→{formatQuantity(values.remainingOperators)}人、1人1日{formatQuantity(values.hoursPerDay)}時間、月{values.daysPerMonth}日。電話は1日{formatQuantity(values.dailyMinutes)}分のうち{formatQuantity(values.aiCoveragePercent)}%をAIへ。</p>
          <p>AIの通話は月{formatQuantity(estimate.aiMinutes / 60)}時間。人の有給勤務枠は{formatQuantity(estimate.currentHours)}時間から{formatQuantity(estimate.remainingHours)}時間へ見直す別の仮定です。</p>
          <ul className="kp-economics-notes">{economics.caveats.map(note => <li key={note}>{note}</li>)}</ul>
          <dl><div><dt>月間の通話時間→AIの対象時間</dt><dd>{formatQuantity(estimate.monthlyMinutes)}分→{formatQuantity(estimate.aiMinutes)}分（{formatQuantity(estimate.aiMinutes / 60)}時間）</dd></div><div><dt>配置の有給勤務時間の差（別の仮定）</dt><dd>{formatQuantity(estimate.currentHours - estimate.remainingHours)}時間／月</dd></div><div><dt>AI料金をまかなうために減らす勤務時間</dt><dd>{formatQuantity(estimate.breakEvenHours)}時間／月（AI料金÷時給）</dd></div><div><dt>基本料を含むAI1件あたりの概算</dt><dd>{estimate.perCallYen === null ? "AI通話0分のため計算しません" : `${formatYen(estimate.perCallYen)}／件（平均${formatQuantity(values.averageCallMinutes)}分）`}</dd></div></dl>
        <p className="kp-unit-cost-note">実通話だけなら、時給換算は{formatYen(values.hourlyWageYen / 60)}／分、AIの超過単価は{formatYen(plan.overageYenPerMinute)}／分です。AI超過分{formatQuantity(values.averageCallMinutes)}分は{formatYen(plan.overageYenPerMinute * values.averageCallMinutes)}ですが、基本料込みの1件平均とは異なります。通話時間だけで安くなると決めず、待機を含め何時間の勤務を見直せるかで判断します。</p>
        <div className="kp-volume-comparison"><h3>{economics.volumeTitle}</h3><p className="kp-small">{economics.volumeNote}</p><table><caption>{plan.name}・月{values.daysPerMonth}日・AI割合{formatQuantity(values.aiCoveragePercent)}%の条件</caption><thead><tr><th scope="col">通話時間／日</th><th scope="col">AI時間／月</th><th scope="col">AI料金／月</th><th scope="col">AI料金分に相当する勤務時間</th></tr></thead><tbody>{economics.volumeDailyMinutes.map(dailyMinutes => {
          const scenario = calculateEconomicsEstimate({ ...values, dailyMinutes }, plan);
          return <tr key={dailyMinutes}><th scope="row">{formatQuantity(dailyMinutes)}分</th><td>{formatQuantity(scenario.aiMinutes)}分</td><td>{formatYen(scenario.aiFeeYen)}</td><td>{formatQuantity(scenario.breakEvenHours)}時間</td></tr>;
        })}</tbody></table></div>
        </details>
        {estimate.aiMinutes > content.pricing.calculator.referenceMinutesThreshold && <p className="kp-reference-note">{content.pricing.calculator.highUsageNote}</p>}
      </> : <p className={hasInvalidInput ? "kp-input-error" : "kp-economics-empty"}>{hasInvalidInput ? economics.invalidMessage : economics.emptyMessage}</p>}
    </div>
    <p className="kp-small kp-exclusions">{economics.exclusionsNote}</p>
  </section>;
}

export function PricingCalculator() {
  const calculator = content.pricing.calculator;
  const [monthlyMinutesInput, setMonthlyMinutesInput] = useState({ value: String(calculator.defaultMinutes), hasBadInput: false });
  const monthlyMinutes = parseMonthlyMinutes(monthlyMinutesInput.value);
  const hasInputError = monthlyMinutesInput.hasBadInput || (monthlyMinutesInput.value !== "" && monthlyMinutes === null);

  return (
    <div className="kp-calculator" data-analytics-calculator="pricing" aria-labelledby="kotoport-calculator-title">
      <div className="kp-calculator-heading"><h3 id="kotoport-calculator-title">{calculator.title}</h3></div>
      <div className="kp-minutes-field">
        <label htmlFor="kotoport-monthly-minutes">{calculator.inputLabel}</label>
        <div><input id="kotoport-monthly-minutes" type="number" inputMode="decimal" min={calculator.minMinutes} max={calculator.maxMinutes} step="any" value={monthlyMinutesInput.value} onChange={event => setMonthlyMinutesInput({ value: event.currentTarget.value, hasBadInput: event.currentTarget.validity.badInput })} aria-invalid={hasInputError} aria-describedby="kotoport-minutes-help kotoport-minutes-status" /><span>{calculator.inputUnit}</span></div>
        <p id="kotoport-minutes-help" className="kp-small">{calculator.inputHelp}（{calculator.minMinutes.toLocaleString("ja-JP")}〜{calculator.maxMinutes.toLocaleString("ja-JP")}{calculator.inputUnit}）</p>
        <p id="kotoport-minutes-status" className={hasInputError ? "kp-input-error" : "kp-small"} aria-live="polite">{hasInputError ? (monthlyMinutesInput.hasBadInput || !Number.isFinite(Number(monthlyMinutesInput.value)) ? calculator.invalidMessage : calculator.rangeMessage) : monthlyMinutes === null ? calculator.emptyMessage : ""}</p>
      </div>
      <div className="kp-estimates" aria-live="polite" aria-atomic="true">
        {!hasInputError && monthlyMinutes !== null && content.pricing.plans.map(plan => {
          const estimate = calculatePlanEstimate(plan, monthlyMinutes);
          return <div className="kp-estimate" key={plan.id}>
            <h4>{plan.name}</h4>
            <p className="kp-estimate-label">{calculator.monthlyLabel}</p><p className="kp-estimate-amount">{formatYen(estimate.monthlySubtotalYen)}<span>／月・税別</span></p>

            <details className="kp-estimate-details"><summary>{calculator.detailsLabel}</summary><dl className="kp-estimate-breakdown">
              <div><dt>{calculator.detailLabels.base}</dt><dd>{formatYen(plan.monthlyFeeYen)}</dd></div>
              <div><dt>{calculator.overageLabel}</dt><dd>{estimate.overageMinutes.toLocaleString("ja-JP", { maximumFractionDigits: 4 })}{calculator.inputUnit}</dd></div>
              <div><dt>{calculator.detailLabels.overage}</dt><dd>{formatYen(estimate.overageFeeYen)}</dd></div>
            </dl>
            <div className="kp-first-month"><span>{calculator.firstMonthLabel}</span><strong>{formatYen(estimate.firstMonthSubtotalYen)}</strong><p>{calculator.firstMonthFormula}（{calculator.detailLabels.initial}：{formatYen(plan.initialFeeYen)}）</p></div></details>
          </div>;
        })}
      </div>
      <div className="kp-calculator-notes"><p>{content.pricing.subtotalNote}</p>{monthlyMinutes !== null && monthlyMinutes > calculator.referenceMinutesThreshold && <p className="kp-reference-note" role="status">{calculator.highUsageNote}</p>}</div>
    </div>
  );
}

