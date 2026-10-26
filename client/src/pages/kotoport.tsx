import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowRight, Check, Clock3, FileText, ListChecks, Phone, PhoneIncoming, PhoneOutgoing, UserRound, UsersRound } from "lucide-react";
import { kotoportContent as content, type CallDirection, type KotoportPlan } from "./kotoport-content";
import "./kotoport.css";

function formatYen(amountYen: number) {
  return `${amountYen.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}円`;
}

function parseMonthlyMinutes(input: string) {
  if (input.trim() === "") return null;
  const minutes = Number(input);
  const { minMinutes, maxMinutes } = content.pricing.calculator;
  return Number.isFinite(minutes) && minutes >= minMinutes && minutes <= maxMinutes ? minutes : null;
}

function calculatePlanEstimate(plan: KotoportPlan, monthlyMinutes: number) {
  const overageMinutes = Math.max(monthlyMinutes - plan.includedMinutes, 0);
  const overageFeeYen = overageMinutes * plan.overageYenPerMinute;
  const monthlySubtotalYen = plan.monthlyFeeYen + overageFeeYen;
  return { overageMinutes, overageFeeYen, monthlySubtotalYen, firstMonthSubtotalYen: monthlySubtotalYen + plan.initialFeeYen };
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

function EconomicsCalculator() {
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
    <div className="kp-economics-form">
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

function PricingCalculator() {
  const calculator = content.pricing.calculator;
  const [monthlyMinutesInput, setMonthlyMinutesInput] = useState({ value: String(calculator.defaultMinutes), hasBadInput: false });
  const monthlyMinutes = parseMonthlyMinutes(monthlyMinutesInput.value);
  const hasInputError = monthlyMinutesInput.hasBadInput || (monthlyMinutesInput.value !== "" && monthlyMinutes === null);

  return (
    <div className="kp-calculator" aria-labelledby="kotoport-calculator-title">
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

function CallOverview({ direction }: { direction: CallDirection }) {
  const call = content.uses.directions[direction];
  const isInbound = direction === "inbound";

  return (
    <figure className="kp-use-flow" aria-label={`${content.uses.exampleLabel} / ${call.label}`}>
      <div className="kp-use-flow-line">
        <div className="kp-flow-person">
          {isInbound ? <UserRound aria-hidden="true" /> : <UsersRound aria-hidden="true" />}
          <strong>{call.source}</strong>
        </div>
        <div className="kp-flow-connector">
          {isInbound ? <ArrowRight aria-hidden="true" /> : <ArrowLeftRight aria-hidden="true" />}
          <span>{call.firstAction}</span>
        </div>
        <div className="kp-flow-person kp-flow-person-accent">
          <Phone aria-hidden="true" />
          <strong>{content.hero.diagram.center}</strong>
          <span>{call.aiAction}</span>
        </div>
        <div className="kp-flow-connector"><ArrowRight aria-hidden="true" /><span>{call.secondAction}</span></div>
        <div className="kp-flow-person">
          <UserRound aria-hidden="true" />
          <strong>{call.destination}</strong>
          <span>{call.humanAction}</span>
        </div>
      </div>
    </figure>
  );
}

function HeroConversation() {
  return <figure className="kp-hero-conversation">
    <figcaption>{content.hero.conversationCaption}</figcaption>
    <div className="kp-dialogue">
      {content.hero.conversation.map((line, index) => <div className={`kp-dialogue-row${index === 0 ? " kp-dialogue-caller" : ""}`} key={line}>
        <span className="kp-dialogue-icon" aria-hidden="true">{index === 0 ? <UserRound /> : <Phone />}</span>
        <p><span className="kp-dialogue-speaker">{index === 0 ? content.uses.directions.inbound.source : content.hero.diagram.center}</span>{line}</p>
      </div>)}
    </div>
    <div className="kp-conversation-handoff"><FileText aria-hidden="true" /><p>{content.hero.conversationNote}</p><ArrowRight aria-hidden="true" /><UserRound aria-hidden="true" /></div>
  </figure>;
}

function HeroFlow() {
  const diagram = content.hero.diagram;
  return <figure className="kp-hero-flow" aria-label={diagram.caption}>
    <div className="kp-hero-flow-grid">
      <div className="kp-flow-stage kp-flow-inputs"><div><PhoneIncoming aria-hidden="true" /><strong>{diagram.inbound}</strong></div><div><PhoneOutgoing aria-hidden="true" /><strong>{diagram.outbound}</strong></div></div>
      <ArrowRight className="kp-flow-stage kp-flow-arrow kp-flow-arrow-in" aria-hidden="true" />
      <div className="kp-flow-stage kp-flow-center"><div className="kp-flow-arch" aria-hidden="true"><span /></div><strong>{diagram.brand}</strong><span>{diagram.center}</span></div>
      <ArrowRight className="kp-flow-stage kp-flow-arrow kp-flow-arrow-out" aria-hidden="true" />
      <div className="kp-flow-stage kp-flow-outputs"><div><FileText aria-hidden="true" /><strong>{diagram.summary}</strong></div><div><UsersRound aria-hidden="true" /><strong>{diagram.handoff}</strong></div></div>
    </div>
  </figure>;
}

export default function Kotoport() {
  const [callDirection, setCallDirection] = useState<CallDirection>("inbound");
  const pageRef = useRef<HTMLDivElement>(null);
  const selectedCall = content.uses.directions[callDirection];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = content.meta.title;
    const metaTags = [
      { attribute: "name", key: "description", value: content.meta.description },
      { attribute: "property", key: "og:title", value: content.meta.title },
      { attribute: "property", key: "og:description", value: content.meta.description },
      { attribute: "property", key: "og:type", value: "website" },
    ];
    const restoreMeta = metaTags.map(({ attribute, key, value }) => {
      const existing = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const previousContent = existing?.getAttribute("content");
      const element = existing ?? document.createElement("meta");
      element.setAttribute(attribute, key);
      element.setAttribute("content", value);
      if (!existing) document.head.appendChild(element);
      return () => {
        if (!existing) element.remove();
        else if (previousContent == null) element.removeAttribute("content");
        else element.setAttribute("content", previousContent);
      };
    });
    return () => {
      document.title = previousTitle;
      restoreMeta.forEach(restore => restore());
    };
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function updateMotionSuspension() {
      if (!page) return;
      page.dataset.motionSuspended = String(document.hidden || motionPreference.matches);
      page.dataset.motionReduced = String(motionPreference.matches);
    }
    updateMotionSuspension();
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const section = entry.target as HTMLElement;
        section.dataset.inView = String(entry.isIntersecting);
        if (entry.isIntersecting) section.dataset.revealed = "true";
      }
    }, { threshold: 0.08 });
    const motionSections = page.querySelectorAll<HTMLElement>("[data-motion-section]");
    motionSections.forEach(section => { section.dataset.inView = "false"; });
    motionSections.forEach(section => sectionObserver.observe(section));
    page.dataset.motionEnabled = "true";
    motionPreference.addEventListener("change", updateMotionSuspension);
    document.addEventListener("visibilitychange", updateMotionSuspension);
    return () => {
      sectionObserver.disconnect();
      motionPreference.removeEventListener("change", updateMotionSuspension);
      document.removeEventListener("visibilitychange", updateMotionSuspension);
      delete page.dataset.motionEnabled;
    };
  }, []);

  return <div className="kotoport-page" id="kotoport-top" ref={pageRef}>
    <a className="kp-skip" href="#kotoport-main">{content.navigation.skip}</a>
    <header className="kp-header"><div className="kp-container kp-header-inner">
      <a className="kp-brand" href="#kotoport-top" aria-label={`${content.name} / ${content.englishName}`}>{content.name}</a>
      <nav className="kp-nav" aria-label={content.name}><a href="#kotoport-uses">{content.navigation.uses}</a><a href="#kotoport-approach">{content.navigation.approach}</a><a href="#kotoport-pricing">{content.navigation.pricing}</a><a href="#kotoport-onboarding">{content.navigation.process}</a></nav>
      <a className="kp-button kp-header-contact" href={content.contactHref}>{content.navigation.contact}<ArrowRight aria-hidden="true" /></a>
    </div></header>
    <main id="kotoport-main">
      <section className="kp-hero kp-container" aria-labelledby="kotoport-title" data-motion-section>
        <div className="kp-hero-copy"><h1 id="kotoport-title">{content.hero.title.map(line => <span key={line}>{line}</span>)}</h1><p className="kp-lead">{content.hero.description}</p><div className="kp-actions"><a className="kp-button" href={content.contactHref}>{content.navigation.contact}<ArrowRight aria-hidden="true" /></a></div></div>
        <HeroFlow />
      </section>
      <section className="kp-section kp-value" aria-labelledby="kotoport-value-title" data-motion-section><div className="kp-container">
        <div className="kp-section-heading"><h2 id="kotoport-value-title">{content.value.title}</h2></div>
        <ol className="kp-burdens">{content.value.burdens.map((burden, index) => <li key={burden}><span className="kp-burden-icon">{index === 0 ? <Clock3 aria-hidden="true" /> : index === 1 ? <ListChecks aria-hidden="true" /> : <PhoneIncoming aria-hidden="true" />}</span><span className="kp-open-number">{String(index + 1).padStart(2, "0")}</span><h3>{burden}</h3></li>)}</ol>
        <p className="kp-value-outcome">{content.value.outcome}<ArrowDown aria-hidden="true" /></p>
      </div></section>
      <section className="kp-section kp-container kp-uses" id="kotoport-uses" aria-labelledby="kotoport-uses-title" data-motion-section>
        <div className="kp-section-heading"><h2 id="kotoport-uses-title">{content.uses.title}</h2></div>
        <div className="kp-use-selector" role="group" aria-label={content.uses.selectorLabel}>{(["inbound", "outbound"] as const).map(direction => { const call = content.uses.directions[direction]; return <button key={direction} type="button" aria-pressed={callDirection === direction} aria-controls="kotoport-use-detail" onClick={() => setCallDirection(direction)}>{direction === "inbound" ? <PhoneIncoming aria-hidden="true" /> : <PhoneOutgoing aria-hidden="true" />}<strong>{call.label}</strong><span>{call.summary}</span></button>; })}</div>
        <div id="kotoport-use-detail" className="kp-use-detail" aria-live="polite" aria-atomic="true"><div className="kp-use-copy"><h3>{selectedCall.title}</h3><ul>{selectedCall.examples.map(example => <li key={example}><Check aria-hidden="true" />{example}</li>)}</ul></div><CallOverview direction={callDirection} /></div>
        <p className="kp-use-note">{content.uses.note}</p><p className="kp-industry-caption">{content.uses.industryCaption}</p>
        <details className="kp-details"><summary>{content.uses.detailsLabel}</summary><dl className="kp-operational-details">{(["preparation", "handoff", "exception"] as const).map(key => <div key={key}><dt>{content.uses.detailLabels[key]}</dt><dd>{selectedCall[key]}</dd></div>)}</dl><p>{content.uses.industry.description}</p><HeroConversation /></details>
      </section>
      <section className="kp-section kp-approach" id="kotoport-approach" aria-labelledby="kotoport-approach-title" data-motion-section><div className="kp-container">
        <div className="kp-section-heading"><h2 id="kotoport-approach-title">{content.approach.title}</h2></div>
        <ol className="kp-reasons">{content.approach.reasons.map((reason, index) => <li key={reason.title}><span className="kp-reason-number">{String(index + 1).padStart(2, "0")}</span><h3>{reason.title}</h3><p>{reason.description}</p></li>)}</ol>
        <ol className="kp-role-flow">{content.approach.roles.map((role, index) => <li key={`${role.title}-${index}`}><span>{role.title}</span><strong>{role.description}</strong>{index < content.approach.roles.length - 1 && <ArrowRight aria-hidden="true" />}</li>)}</ol>
        <div className="kp-division">{content.approach.divisionLabels.map(label => <p key={label}>{label}</p>)}</div>
        <details className="kp-details kp-setup-details"><summary>{content.approach.detailsLabel}</summary>
          <section className="kp-setup-block" aria-labelledby="kotoport-setup-title">
            <h3 id="kotoport-setup-title">{content.approach.setupTitle}</h3>
            <dl className="kp-setup">{content.approach.setup.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.example}</dd></div>)}</dl>
            <p>{content.approach.setupDescription}</p>
          </section>
          <section className="kp-setup-block" aria-labelledby="kotoport-responsibility-title">
            <h3 id="kotoport-responsibility-title">{content.approach.responsibilityTitle}</h3>
            <div className="kp-responsibility-grid">{content.approach.responsibilities.map(role => <div key={role.title}><h4>{role.title}</h4><p>{role.subtitle}</p><ul>{role.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div>
            <p>{content.approach.responsibilityNote}</p>
          </section>
          <section className="kp-setup-block" aria-labelledby="kotoport-maintenance-title">
            <h3 id="kotoport-maintenance-title">{content.approach.maintenanceTitle}</h3>
            <ol className="kp-maintenance-flow">{content.approach.maintenanceSteps.map((step, index) => <li key={step.title}><span>{step.owner}</span><h4>{step.title}</h4><p>{step.description}</p>{index < content.approach.maintenanceSteps.length - 1 && <ArrowRight aria-hidden="true" />}</li>)}</ol>
            <p>{content.approach.maintenanceNote}</p>
          </section>
        </details>
      </div></section>
      <EconomicsCalculator />
      <section className="kp-section kp-pricing" id="kotoport-pricing" aria-labelledby="kotoport-pricing-title" data-motion-section><div className="kp-container">
        <div className="kp-section-heading"><h2 id="kotoport-pricing-title">{content.pricing.title}</h2><p>{content.pricing.description}</p></div>
        <p className="kp-price-qualification">{content.pricing.qualification}</p>
        <div className="kp-plans">{content.pricing.plans.map(plan => <article className="kp-plan" key={plan.id}><div className="kp-plan-heading"><h3>{plan.name}</h3><p>{plan.scopeSummary}</p></div><div className="kp-plan-body"><div className="kp-plan-price"><span>{content.pricing.labels.monthly}</span><strong>{plan.monthlyFeeYen.toLocaleString("ja-JP")}<small>{content.pricing.feeUnit}</small></strong></div><dl><div><dt>{content.pricing.labels.initial}</dt><dd>{formatYen(plan.initialFeeYen)}</dd></div><div><dt>{content.pricing.labels.included}</dt><dd>{plan.includedMinutes}{content.pricing.minuteUnit}</dd></div><div><dt>{content.pricing.labels.overage}</dt><dd>{plan.overageYenPerMinute}{content.pricing.overageUnit}</dd></div></dl></div></article>)}</div>
        <p className="kp-plan-selection">{content.pricing.planSelection}</p><PricingCalculator />
        <details className="kp-details kp-price-details"><summary>{content.pricing.detailsLabel}</summary><p>{content.pricing.selectionDetails}</p>
          <div className="kp-table-wrap"><table className="kp-price-table"><caption>{content.pricing.tableCaption}</caption><thead><tr><th scope="col">{content.pricing.description}</th>{content.pricing.plans.map(plan => <th key={plan.id} scope="col">{plan.name}</th>)}</tr></thead><tbody><tr><th scope="row">{content.pricing.labels.onboarding}</th>{content.pricing.plans.map(plan => <td key={plan.id}>{plan.onboardingHours}{content.pricing.hourUnit}</td>)}</tr><tr><th scope="row">{content.pricing.labels.support}</th>{content.pricing.plans.map(plan => <td key={plan.id}>{plan.supportHours}{content.pricing.supportUnit}</td>)}</tr><tr><th scope="row">{content.pricing.labels.locations}</th>{content.pricing.plans.map(plan => <td key={plan.id}>{plan.locationCount}{content.pricing.locationUnit}</td>)}</tr></tbody></table></div>
          <div className="kp-scope-comparison"><div><h3>{content.scope.includedTitle}</h3><dl>{content.scope.included.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.description}</dd></div>)}</dl></div><div><h3>{content.scope.additionalTitle}</h3><dl>{content.scope.additional.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.description}</dd></div>)}</dl></div></div>
          <p>{content.pricing.supportNote}</p><p>{content.pricing.calculator.description}</p><p>{content.pricing.calculator.firstMonthNote}</p><p>{content.pricing.communicationNote}</p><p>{content.pricing.calculator.roundingNote}</p><p>{content.pricing.comparison}</p><h3>{content.scope.humanTitle}</h3><p>{content.scope.humanDescription}</p>
        </details>
      </div></section>
      <section className="kp-section kp-onboarding" id="kotoport-onboarding" aria-labelledby="kotoport-onboarding-title" data-motion-section><div className="kp-container">
        <div className="kp-section-heading"><h2 id="kotoport-onboarding-title">{content.onboarding.title}</h2></div>
        <ol className="kp-onboarding-steps">{content.onboarding.steps.map((step, index) => <li key={step.title}><div><span className="kp-step-number">{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3></div><p>{step.description}</p>{index < content.onboarding.steps.length - 1 && <ArrowRight aria-hidden="true" />}</li>)}</ol>
        <p className="kp-onboarding-note">{content.onboarding.timelineNote}</p>
        <details className="kp-details"><summary>{content.onboarding.detailsLabel}</summary><div className="kp-operation-labels">{content.onboarding.roleLabels.map(role => <p key={role}>{role}</p>)}</div><h3>{content.onboarding.preparationTitle}</h3><p>{content.onboarding.preparationDescription}</p><dl className="kp-preparations">{content.onboarding.preparations.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.description}</dd></div>)}</dl><dl className="kp-operation-roles">{content.onboarding.responsibilities.map(role => <div key={role.title}><dt>{role.title}</dt><dd>{role.description}</dd></div>)}</dl><p>{content.onboarding.acceptanceNote}</p></details>
      </div></section>
      <section className="kp-section kp-faq" aria-labelledby="kotoport-faq-title" data-motion-section><div className="kp-container kp-faq-layout"><div className="kp-section-heading"><h2 id="kotoport-faq-title">{content.faq.title}</h2></div><div className="kp-faq-items">{content.faq.items.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>
      <section className="kp-section kp-consultation" aria-labelledby="kotoport-consultation-title" data-motion-section><div className="kp-container kp-consultation-layout"><div className="kp-section-heading"><h2 id="kotoport-consultation-title">{content.consultation.title}</h2><p>{content.consultation.description}</p><ul className="kp-starting-points">{content.consultation.startingPoints.map(point => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul><a className="kp-button" href={content.contactHref}>{content.navigation.contact}<ArrowRight aria-hidden="true" /></a><p className="kp-small">{content.consultation.contactNote}</p></div><div className="kp-provider"><p className="kp-provider-name">{content.provider}</p><p>{content.consultation.providerDescription}</p><address>{content.consultation.signature.map(line => <span key={line}>{line}</span>)}<span className="kp-provider-website">ホームページ：<a href={content.consultation.homepageHref}>{content.consultation.homepageHref}</a></span></address></div></div></section>
    </main>
    <footer className="kp-footer kp-container"><a href="/"><ArrowLeft aria-hidden="true" />{content.navigation.home}</a><span>{content.name} / {content.englishName}</span><a href="#kotoport-top">{content.navigation.back}<ArrowDown className="kp-arrow-up" aria-hidden="true" /></a></footer>
  </div>;
}
