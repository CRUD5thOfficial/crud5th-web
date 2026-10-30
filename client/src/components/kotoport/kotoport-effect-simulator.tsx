import { useId, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowRight, Calculator, CalendarDays, ChevronDown, Clock3, Coins, Headphones, Phone, RotateCcw, SlidersHorizontal, UserRound, type LucideIcon } from "lucide-react";
import { kotoportContent as content, type KotoportPlan } from "@/pages/kotoport-content";
import { aiMonthlyQuoteBounds, compareKotoportStaffing, isValidAiMonthlyQuoteYen, simulateKotoport, simulationInputDefinitions, staffingInputDefinitions, type SimulationValues, type StaffingValues } from "@/pages/kotoport-simulation";
import { readSimulatorConditions, resetSimulatorConditions, saveSimulatorConditions, type FieldKey, type ResultUnit, type SimulatorConditions } from "./kotoport-simulator-storage";
import "./kotoport-effect-simulator.css";

type SimulationResult = NonNullable<ReturnType<typeof simulateKotoport>>;
type StaffingResult = NonNullable<ReturnType<typeof compareKotoportStaffing>>;
const inputDefinitions = { ...simulationInputDefinitions, ...staffingInputDefinitions };
const fieldKeys = Object.keys(inputDefinitions) as FieldKey[];
const workloadKeys = Object.keys(simulationInputDefinitions) as (keyof SimulationValues)[];
const staffingKeys = Object.keys(staffingInputDefinitions) as (keyof StaffingValues)[];
const secondaryKeys: FieldKey[] = ["reviewMinutesPerAiCall", "hourlyWageYen"];
const fieldPresentation: Record<FieldKey, { label: string; icon: LucideIcon }> = {
  dailyCalls: { label: "電話件数", icon: Phone },
  averageCallMinutes: { label: "平均通話", icon: Clock3 },
  daysPerMonth: { label: "稼働日数", icon: CalendarDays },
  aiCoveragePercent: { label: "AIに任せる割合", icon: Headphones },
  reviewMinutesPerAiCall: { label: "AI後の確認時間", icon: UserRound },
  hourlyWageYen: { label: "換算する時給", icon: Coins },
  staffingCount: { label: "専任の人数", icon: UserRound },
  staffingHoursPerDay: { label: "1人の配置時間", icon: Clock3 },
};
const numberFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 });
const yenFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const format = (value: number) => numberFormat.format(value);
const yen = (value: number) => yenFormat.format(value);

function parseField(key: FieldKey, raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  const definition = inputDefinitions[key];
  return Number.isFinite(value) && value >= definition.min && value <= definition.max && (!definition.integer || Number.isInteger(value)) ? value : null;
}

function ComparisonChart({ title, before, afterParts, unit, formatValue, beforeLabel = "導入前", afterLabel = "導入後" }: {
  title: string;
  before: number;
  afterParts: { label: string; value: number; color: "human" | "review" | "ai" }[];
  unit: string;
  formatValue: (value: number) => string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const after = afterParts.reduce((total, part) => total + part.value, 0);
  const scale = Math.max(before, after, 1);
  return <figure className="kp-sim-chart">
    <figcaption>{title}<span>{unit}</span></figcaption>
    <div className="kp-sim-chart-row">
      <div className="kp-sim-chart-label"><span>{beforeLabel}</span><strong>{formatValue(before)}<small>{unit}</small></strong></div>
      <div className="kp-sim-chart-track" aria-hidden="true"><span className="kp-sim-bar kp-sim-bar-before" style={{ width: `${before / scale * 100}%` }} /></div>
    </div>
    <div className="kp-sim-chart-row">
      <div className="kp-sim-chart-label"><span>{afterLabel}</span><strong>{formatValue(after)}<small>{unit}</small></strong></div>
      <div className="kp-sim-chart-track" aria-hidden="true">{afterParts.map(part => <span key={part.label} className={`kp-sim-bar kp-sim-bar-${part.color}`} style={{ width: `${part.value / scale * 100}%` }} />)}</div>
    </div>
    <ul className="kp-sim-chart-legend">{afterParts.map(part => <li key={part.label}><i className={`kp-sim-swatch kp-sim-bar-${part.color}`} aria-hidden="true" /><span>{part.label}</span><strong>{formatValue(part.value)}{unit}</strong></li>)}</ul>
  </figure>;
}

function WorkFlow({ result }: { result: SimulationResult }) {
  return <figure className="kp-sim-workflow">
    <figcaption><span className="kp-sim-eyebrow">電話の流れ</span><h3>AIと人で、こう分担。</h3></figcaption>
    <div className="kp-sim-flow-source"><Phone aria-hidden="true" /><span>御社の電話<strong>月{format(result.monthlyCalls)}<small>件</small></strong></span></div>
    <div className="kp-sim-flow-branches">
      <div className="kp-sim-flow-branch kp-sim-flow-ai">
        <ArrowDown className="kp-sim-flow-arrow" aria-hidden="true" />
        <div className="kp-sim-flow-node"><span className="kp-sim-flow-icon"><Headphones aria-hidden="true" /></span><h4>AIが受け持つ</h4><strong>{format(result.aiCalls)}<small>件／月</small></strong><p>AIの通話：{format(result.aiMinutes / 60)}時間</p></div>
        <ArrowDown className="kp-sim-flow-arrow" aria-hidden="true" />
        <div className="kp-sim-flow-review"><UserRound aria-hidden="true" /><span>人が内容を確認<strong>{format(result.reviewMinutes / 60)}時間／月</strong></span></div>
      </div>
      <div className="kp-sim-flow-branch kp-sim-flow-direct">
        <ArrowDown className="kp-sim-flow-arrow" aria-hidden="true" />
        <div className="kp-sim-flow-node"><span className="kp-sim-flow-icon"><UserRound aria-hidden="true" /></span><h4>担当者が直接対応</h4><strong>{format(result.directHumanCalls)}<small>件／月</small></strong><p>人の通話：{format(result.directHumanMinutes / 60)}時間</p></div>
        <p className="kp-sim-flow-direct-note">AIに任せない電話は、<br />担当者がそのまま対応。</p>
      </div>
    </div>
    <div className="kp-sim-flow-destination"><ArrowDown aria-hidden="true" /><div><UserRound aria-hidden="true" /><span>担当者が判断する<strong>人の対応は合計{format(result.afterHumanHours)}時間／月</strong></span></div><p>直接の通話＋AI後の確認。AIの通話時間は含めません。</p></div>
  </figure>;
}

function CostResults({ comparison, plan, unit, feeMode, onEdit }: {
  comparison: StaffingResult;
  plan: KotoportPlan;
  unit: Exclude<ResultUnit, "time">;
  feeMode: "reference" | "quote";
  onEdit: () => void;
}) {
  const divisor = unit === "call" ? comparison.aiCalls : unit === "minute" ? comparison.aiMinutes : 1;
  const unitLabel = unit === "call" ? "円／通話" : unit === "minute" ? "円／分" : "円／月";
  const humanCost = comparison.staffingLaborYen / divisor;
  const aiCost = comparison.monthlyAiYen === null ? null : comparison.monthlyAiYen / divisor;
  const difference = comparison.monthlyDifferenceYen === null ? null : comparison.monthlyDifferenceYen / divisor;
  const comparable = difference !== null && aiCost !== null;
  const increasing = difference !== null && difference < 0;
  const scale = Math.max(humanCost, aiCost ?? 0, 1);
  return <>
    {comparable ? <figure className={`kp-sim-cost-board${increasing ? " kp-sim-cost-board-increase" : difference === 0 ? " kp-sim-cost-board-equal" : ""}`}>
      <figcaption><strong>{unit === "call" ? "1通話あたりの費用" : unit === "minute" ? "通話1分あたりの費用" : "月の費用"}</strong><span>同じ目盛り／斜線は差額</span></figcaption>
      <div className="kp-sim-cost-rows">
        <div className="kp-sim-cost-row kp-sim-cost-row-human">
          <div className="kp-sim-cost-row-label"><span><UserRound aria-hidden="true" />人を配置した場合</span><strong>{format(humanCost)}<small>{unitLabel}</small></strong></div>
          <div className="kp-sim-cost-track" aria-hidden="true"><span className="kp-sim-cost-bar" style={{ width: `${humanCost / scale * 100}%` }} />{increasing && <span className="kp-sim-cost-gap" style={{ width: `${Math.abs(difference) / scale * 100}%` }} />}</div>
        </div>
        <div className="kp-sim-cost-row kp-sim-cost-row-ai">
          <div className="kp-sim-cost-row-label"><span><Headphones aria-hidden="true" />コトポート＋内容確認</span><strong>{format(aiCost)}<small>{unitLabel}</small></strong></div>
          <div className="kp-sim-cost-track" aria-hidden="true"><span className="kp-sim-cost-bar" style={{ width: `${aiCost / scale * 100}%` }} />{difference > 0 && <span className="kp-sim-cost-gap" style={{ width: `${difference / scale * 100}%` }} />}</div>
        </div>
      </div>
      <div className="kp-sim-cost-gap-result"><span>{difference === 0 ? "人を配置した場合と同じ費用" : "人を配置した場合より"}</span><div><strong>{format(Math.abs(difference))}<small>{unitLabel}</small><em>{difference === 0 ? "差なし" : increasing ? "増" : "減"}</em></strong>{comparison.differencePercent !== null && difference !== 0 && <span>{format(Math.abs(comparison.differencePercent))}%{increasing ? "増" : "減"}</span>}</div></div>
    </figure> : <div className="kp-sim-empty kp-sim-cost-empty" role="status"><AlertCircle aria-hidden="true" /><h4>{!comparison.hasCapacity ? "入力した配置枠では\n通話時間が足りません" : comparison.aiCalls === 0 ? "AI対象の電話が0件です" : "月額見積額を入力してください"}</h4><p>{!comparison.hasCapacity ? `通話は月${format(comparison.aiMinutes / 60)}時間、配置枠は${format(comparison.staffingHours)}時間。人数か1日の配置時間を見直してください。` : comparison.aiCalls === 0 ? "1通話・1分あたりの費用と差は算出しません。AIの月額料金は下に表示しています。" : "基本料と従量料金を含む、月額小計を入力すると比較できます。"}</p>{comparison.aiCalls > 0 && <button type="button" onClick={onEdit}>条件を確認する<ArrowRight aria-hidden="true" /></button>}</div>}
    <details className="kp-sim-fee-details" open={!comparable}>
      <summary>月額料金の内訳<ChevronDown aria-hidden="true" /></summary>
      <div className="kp-sim-fee-breakdown" aria-label="月のAI料金と内容確認費の内訳">
        <p>{feeMode === "reference" ? `月の内訳・参考料金（${plan.name}）` : "月の内訳・入力した見積額"}</p>
        <div>
          {comparison.referenceEstimate ? <><span>基本料<strong>{yen(plan.monthlyFeeYen)}円</strong><small>{format(plan.includedMinutes)}分込み</small></span><i aria-hidden="true">＋</i><span>超過通話<strong>{format(comparison.referenceEstimate.overageFeeYen)}円</strong><small>{format(comparison.referenceEstimate.overageMinutes)}分×{yen(plan.overageYenPerMinute)}円</small></span></> : <span>AI月額見積<strong>{comparison.aiFeeYen === null ? "未入力・範囲外" : `${format(comparison.aiFeeYen)}円`}</strong><small>基本料＋従量料金を含む</small></span>}
          <i aria-hidden="true">＋</i><span>内容確認<strong>{format(comparison.reviewLaborYen)}円</strong><small>人が月{format(comparison.reviewHours)}時間</small></span>
        </div>
        <p className="kp-sim-fee-total">AI＋内容確認 <strong>{comparison.monthlyAiYen === null ? "未算定" : `${format(comparison.monthlyAiYen)}円／月`}</strong></p>
      </div>
    </details>
    <p className="kp-sim-money-note">AI対象の業務へ、新たに専任担当者を置く場合との比較です。既存社員の給与削減額ではありません。{unit !== "month" && "基本料込みの平均単価です。超過通話の従量単価とは異なります。"}</p>
  </>;
}

export function KotoportEffectSimulator() {
  const id = useId();
  const [conditions, setConditions] = useState(() => readSimulatorConditions());
  const { rawValues, rawMonthlyQuote, planId, feeMode, unit } = conditions;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const quoteRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const plan = content.pricing.plans.find(item => item.id === planId) ?? content.pricing.plans[0];
  const parsedValues = Object.fromEntries(fieldKeys.map(key => [key, parseField(key, rawValues[key])])) as Record<FieldKey, number | null>;
  const workloadValid = workloadKeys.every(key => parsedValues[key] !== null);
  const staffingValid = staffingKeys.every(key => parsedValues[key] !== null);
  const quoteInputId = `${id}-aiMonthlyQuoteYen`;
  const detailsId = `${id}-details`;
  const parsedQuote = rawMonthlyQuote.trim() === "" ? null : Number(rawMonthlyQuote);
  const quoteInvalid = feeMode === "quote" && !isValidAiMonthlyQuoteYen(parsedQuote);
  const detailsInvalid = secondaryKeys.some(key => parsedValues[key] === null) || !staffingValid || quoteInvalid;
  const result = workloadValid ? simulateKotoport(parsedValues as SimulationValues, plan) : null;
  const comparison = workloadValid && staffingValid ? compareKotoportStaffing(parsedValues as SimulationValues, plan, parsedValues as StaffingValues, feeMode === "reference" ? { mode: "reference" } : { mode: "quote", monthlyQuoteYen: parsedQuote }) : null;
  const hasEmptyField = workloadKeys.some(key => rawValues[key].trim() === "");
  const coverage = parsedValues.aiCoveragePercent;
  const updateConditions = (changes: Partial<SimulatorConditions>) => {
    const next = { ...conditions, ...changes };
    // Save in the input event; a later effect could lose the last edit on navigation.
    saveSimulatorConditions(next);
    setConditions(next);
  };
  const change = (key: FieldKey, value: string) => updateConditions({ rawValues: { ...rawValues, [key]: value } });
  const reset = () => { setConditions(resetSimulatorConditions()); setDetailsOpen(false); };

  function openDetails(focus: "invalid" | "quote" | "staffing" = "invalid") {
    setDetailsOpen(true);
    requestAnimationFrame(() => {
      const target = focus === "quote" && feeMode === "quote" ? quoteRef.current : focus === "staffing" ? detailsRef.current?.querySelector<HTMLInputElement>(`[id="${id}-staffingCount"]`) : detailsRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]') ?? detailsRef.current?.querySelector<HTMLInputElement>("input");
      target?.focus();
    });
  }

  function field(key: FieldKey) {
    const definition = inputDefinitions[key];
    const { label, icon: Icon } = fieldPresentation[key];
    const inputId = `${id}-${key}`;
    const invalid = parsedValues[key] === null;
    return <div className={`kp-sim-field${invalid ? " kp-sim-field-invalid" : ""}`} key={key}>
      <label htmlFor={inputId}><Icon aria-hidden="true" />{label}</label>
      <div className="kp-sim-input-wrap">
        <input id={inputId} type="number" inputMode={definition.integer ? "numeric" : "decimal"} min={definition.min} max={definition.max} step={definition.step} value={rawValues[key]} onChange={event => change(key, event.target.value)} aria-invalid={invalid || undefined} aria-describedby={`${inputId}-unit${invalid ? ` ${inputId}-error` : ""}`} />
        <span id={`${inputId}-unit`}>{definition.unit}</span>
      </div>
      {invalid && <p className="kp-sim-field-error" id={`${inputId}-error`}>{rawValues[key].trim() === "" ? "入力してください。" : `${format(definition.min)}〜${format(definition.max)}${definition.integer ? "の整数" : "の数値"}で入力してください。`}</p>}
    </div>;
  }

  const resultSummary = !result ? "入力を確認してください。結果は表示していません。" : unit === "time" ? `月の人の対応は導入前${format(result.beforeHumanHours)}時間、導入後${format(result.afterHumanHours)}時間。${format(Math.abs(result.freedHours))}時間${result.freedHours >= 0 ? "減" : "増"}の試算です。` : !comparison ? "専任配置の詳細条件を確認してください。" : !comparison.hasCapacity ? "入力した配置枠では通話時間が足りません。費用差は未算定です。" : comparison.aiCalls === 0 ? `AI対象の電話は0件です。AIの月額料金は${comparison.aiFeeYen === null ? "未算定" : `${format(comparison.aiFeeYen)}円`}。1通話・1分単価と費用差は算出しません。` : comparison.monthlyDifferenceYen === null ? "月額見積額を確認してください。費用差は未算定です。" : `AI対象は月${format(comparison.aiCalls)}件、${format(comparison.aiMinutes)}分。専任配置は月${format(comparison.staffingLaborYen)}円、AIと内容確認は月${format(comparison.monthlyAiYen!)}円。差は月${format(Math.abs(comparison.monthlyDifferenceYen))}円${comparison.monthlyDifferenceYen >= 0 ? "減" : "増"}。${feeMode === "reference" ? "参考料金" : "入力した見積額"}による試算です。`;

  return <section className="kp-sim-section kp-motion-zone" id="effect-simulator" aria-labelledby="kp-sim-title">
    <div className="kp-container">
      <div className="kp-sim-heading"><span className="kp-sim-eyebrow"><Calculator aria-hidden="true" />導入シミュレーション</span><h2 id="kp-sim-title">御社の電話で、<br className="kp-mobile-break" />どれくらい変わるか。</h2><p>人を配置する費用と、AIに任せる費用を比べてみましょう。</p></div>
      <div className="kp-sim-layout">
        <div className="kp-sim-controls">
          <div className="kp-sim-panel-title"><h3>いつもの電話</h3><button type="button" onClick={reset} aria-label="初期値に戻す" title="初期値に戻す"><RotateCcw aria-hidden="true" /></button></div>
          <div className="kp-sim-main-fields">{field("dailyCalls")}{field("averageCallMinutes")}{field("daysPerMonth")}</div>
          <div className="kp-sim-coverage">
            {field("aiCoveragePercent")}
            <input className="kp-sim-slider" type="range" min={simulationInputDefinitions.aiCoveragePercent.min} max={simulationInputDefinitions.aiCoveragePercent.max} step={simulationInputDefinitions.aiCoveragePercent.step} value={coverage ?? 0} onChange={event => change("aiCoveragePercent", event.target.value)} aria-label="AIに任せる割合をスライダーで変更" aria-invalid={coverage === null || undefined} aria-describedby={`${id}-coverage-note${coverage === null ? ` ${id}-aiCoveragePercent-error` : ""}`} />
            <div className="kp-sim-slider-labels" aria-hidden="true"><span>0%</span><span>100%</span></div>
            <p className="sr-only" id={`${id}-coverage-note`}>AIに任せたい電話の範囲の仮定です。達成率や精度ではありません。</p>
          </div>
          <div className="kp-sim-details">
            <button type="button" className="kp-sim-details-toggle" onClick={() => setDetailsOpen(previous => !previous)} aria-expanded={detailsOpen} aria-controls={detailsId}>
              <span><SlidersHorizontal aria-hidden="true" />配置・料金などの詳細</span>
              <span>{detailsInvalid && <span className="kp-sim-details-error"><AlertCircle aria-hidden="true" />入力を確認</span>}<ChevronDown aria-hidden="true" /></span>
            </button>
            <div id={detailsId} className="kp-sim-details-body" ref={detailsRef} hidden={!detailsOpen}>
              <div className="kp-sim-secondary-fields">{field("staffingCount")}{field("staffingHoursPerDay")}</div>
              <p className="kp-sim-field-help">AI対象の電話業務へ、新たに専任担当者を置く仮定です。</p>
              <div className="kp-sim-secondary-fields kp-sim-review-fields">{field("reviewMinutesPerAiCall")}{field("hourlyWageYen")}</div>
              <p className="kp-sim-field-help">確認時間はAIが受けた1件あたり。時給は配置時間と内容確認の換算に使います。</p>
              <div className="kp-sim-plan"><label htmlFor={`${id}-fee-mode`}>料金の条件</label><select id={`${id}-fee-mode`} value={feeMode} onChange={event => updateConditions({ feeMode: event.target.value as "reference" | "quote" })}><option value="reference">参考料金で試算</option><option value="quote">月額見積額で試算</option></select></div>
              <div className="kp-sim-plan"><label htmlFor={`${id}-plan`}>{feeMode === "reference" ? "参考プラン" : "初期費用の参考プラン"}</label><select id={`${id}-plan`} value={planId} onChange={event => updateConditions({ planId: event.target.value })}>{content.pricing.plans.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              {feeMode === "quote" ? <div className={`kp-sim-field kp-sim-quote${quoteInvalid ? " kp-sim-field-invalid" : ""}`}>
                <label htmlFor={quoteInputId}><Coins aria-hidden="true" />AIの月額見積額<span className="kp-sim-optional">税別</span></label>
                <div className="kp-sim-input-wrap"><input ref={quoteRef} id={quoteInputId} type="number" inputMode="decimal" min={aiMonthlyQuoteBounds.min} max={aiMonthlyQuoteBounds.max} step="any" value={rawMonthlyQuote} placeholder="見積額を入力" onChange={event => updateConditions({ rawMonthlyQuote: event.target.value })} aria-invalid={quoteInvalid || undefined} aria-describedby={`${quoteInputId}-help${quoteInvalid ? ` ${quoteInputId}-error` : ""}`} /><span>円／月</span></div>
                <p className="kp-sim-field-help" id={`${quoteInputId}-help`}>基本料と従量料金を含む月額小計です。参考料金へ加算しません。未入力なら費用比較は未算定です。</p>
                {quoteInvalid && <p className="kp-sim-field-error" id={`${quoteInputId}-error`}>{rawMonthlyQuote.trim() === "" ? "月額見積額を入力してください。" : `${format(aiMonthlyQuoteBounds.min)}〜${format(aiMonthlyQuoteBounds.max)}円で入力してください。`}</p>}
              </div> : <p className="kp-sim-field-help">参考条件：基本{yen(plan.monthlyFeeYen)}円（{format(plan.includedMinutes)}分込み）＋超過1分{yen(plan.overageYenPerMinute)}円。実際の料金は見積で確認します。</p>}
              <div className="kp-sim-initial-fee"><span>参考プランの初期費用<strong>{yen(plan.initialFeeYen)}<small>円・税別</small></strong></span>{feeMode === "reference" && <span>初期費＋AI月額小計{comparison?.aiFeeYen !== null && comparison?.aiFeeYen !== undefined ? <strong>{format(comparison.aiFeeYen + plan.initialFeeYen)}<small>円・税別／内容確認費は別</small></strong> : <small>有効な条件の入力後</small>}</span>}</div>
            </div>
          </div>
          <a className="kp-sim-nearby-result" href="#kp-sim-results">{comparison?.perCall ? <span>1通話 <strong>{format(comparison.perCall.humanYen)} → {format(comparison.perCall.aiYen)}</strong> 円</span> : <span>条件と結果を確認する</span>}<ArrowDown aria-hidden="true" /></a>
          <p className="kp-sim-privacy">入力内容はこのブラウザに保存されます。外部には送信しません。</p>
        </div>
        <div className="kp-sim-results" id="kp-sim-results" aria-labelledby="kp-sim-result-title">
          <div className="kp-sim-result-heading"><h3 id="kp-sim-result-title">同じ電話業務で比較</h3><button type="button" className="kp-sim-cost-button" onClick={() => openDetails()} aria-controls={detailsId} aria-expanded={detailsOpen}><SlidersHorizontal aria-hidden="true" />条件を変更<ArrowRight aria-hidden="true" /></button></div>
          <div className="kp-sim-unit-switch" role="group" aria-label="比較する単位">{([["call", "1通話"], ["minute", "1分"], ["month", "月額"], ["time", "対応時間"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={unit === value} onClick={() => updateConditions({ unit: value })}>{label}</button>)}</div>
          {result && <div className="kp-sim-comparison-scope"><p><Headphones aria-hidden="true" />{unit === "time" ? "すべての電話" : "AI対象"} <strong>月{format(unit === "time" ? result.monthlyCalls : result.aiCalls)}件／{format(unit === "time" ? result.monthlyMinutes : result.aiMinutes)}分</strong>を比較</p>{unit !== "time" && <p>{staffingValid ? `人${format(parsedValues.staffingCount!)}人×${format(parsedValues.staffingHoursPerDay!)}h／日・時給${yen(parsedValues.hourlyWageYen!)}円` : "専任配置の入力を確認してください"}<span className="kp-sim-reference-tag">{feeMode === "reference" ? "参考料金" : "月額見積額"}</span></p>}</div>}
          <p className="sr-only" aria-live="polite" aria-atomic="true">{resultSummary}</p>
          {result ? unit === "time" ? <>
            <div className="kp-sim-kpis"><div className="kp-sim-kpi kp-sim-human-cost"><span><UserRound aria-hidden="true" />導入前の人の対応</span><strong>{format(result.beforeHumanHours)}<small>時間／月</small></strong><p>すべての電話に人が対応</p></div><div className={`kp-sim-kpi kp-sim-time${result.freedHours < 0 ? " kp-sim-increase" : ""}`}><span><Clock3 aria-hidden="true" />導入後の人の対応</span><strong>{format(result.afterHumanHours)}<small>時間／月</small></strong><p>直接対応＋AI後の内容確認</p></div></div>
            <div className={`kp-sim-cost-delta${result.freedHours < 0 ? " kp-sim-cost-increase" : ""}`}><span>{result.freedHours >= 0 ? "他の仕事へ回せる時間" : "人の対応が増える時間"}</span><strong>{format(Math.abs(result.freedHours))}<small>時間／月</small></strong><span className="kp-sim-cost-rate">{format(Math.abs(result.freedPercent))}%{result.freedHours >= 0 ? "減" : "増"}</span></div>
            <ComparisonChart title="人の対応時間" before={result.beforeHumanHours} afterParts={[{ label: "直接対応", value: result.directHumanMinutes / 60, color: "human" }, { label: "AI後の確認", value: result.reviewMinutes / 60, color: "review" }]} unit="時間／月" formatValue={format} />
            <p className="kp-sim-money-note">この表示は全電話の実対応時間です。配置・待機時間は含みません。確認時間が長いと、人の対応が増える場合もあります。</p>
          </> : comparison ? <><CostResults comparison={comparison} plan={plan} unit={unit} feeMode={feeMode} onEdit={() => openDetails(!comparison.hasCapacity ? "staffing" : "quote")} />{comparison.hasCapacity && <p className="kp-sim-staffing-time">人の配置は月{format(comparison.staffingHours)}時間。通話{format(comparison.aiMinutes / 60)}時間＋待機・その他{format(comparison.nonCallHours)}時間。</p>}</> : <div className="kp-sim-empty kp-sim-cost-empty" role="status"><AlertCircle aria-hidden="true" /><h4>専任配置の入力を確認してください</h4><p>人数と1日の配置時間がそろうと費用を比較できます。</p><button type="button" onClick={() => openDetails()}>詳細条件を確認<ArrowRight aria-hidden="true" /></button></div> : <div className="kp-sim-empty" role="status"><Calculator aria-hidden="true" /><h4>{hasEmptyField ? "未入力の項目があります" : "入力範囲を確認してください"}</h4><p>すべての条件がそろうと、結果を表示します。</p>{detailsInvalid && <button type="button" onClick={() => openDetails()}><AlertCircle aria-hidden="true" />詳細条件を確認<ArrowRight aria-hidden="true" /></button>}</div>}
          {result?.requiresVolumeReview && <p className="kp-sim-volume-note">AI通話は月{format(result.aiMinutes)}分。この通話量に合う料金・運用条件を見積で確認してください。</p>}
          <p className="kp-sim-assumption-tag">仮定に基づく試算です。初期費・税・通信費・社会保険料などは月の比較に含みません。</p>
        </div>
      </div>
      {result && <WorkFlow result={result} />}
      <details className="kp-sim-conditions"><summary>試算の考え方・含まない費用<ChevronDown aria-hidden="true" /></summary><div><p>費用は、月の件数×AIに任せる割合で求めた「AI対象の電話業務」だけを比較します。人へ残る直接の電話は費用比較の対象外です。専任配置の費用＝人数×1日の配置時間×稼働日数×時給。通話以外の時間は「待機・その他の時間」とし、すべて無駄な時間とはみなしません。入力した配置枠より通話時間が長い場合は、配置費用との単位比較・差・率を算出しません。実際に必要な人数は同時着信、ピーク、休憩なども含めて確認します。</p><p>AI側は月のAI利用料＋内容確認時間×時給。参考料金は、月額基本料＋含む時間を超えた通話分×超過単価で計算します。通話0分でも基本料がかかります。「月額見積額で試算」では、入力した基本料・従量料金込みの小計を使い、参考料金を加えません。1通話・1分の単価は双方を同じAI対象の件数・分数で割った平均です。対象0件では単価と費用差を算出しません。費用が増える条件もそのまま表示します。</p><p>対応時間の表示は全電話を対象とし、導入前＝全件の実通話時間、導入後＝人の直接通話＋AI後の内容確認です。AIに任せる割合は用件の範囲の仮定で、達成率や精度ではありません。試算は導入効果や給与の支出削減を保証しません。初期費、税、通信費、接続費、社会保険料、採用・教育費などは月の比較に含みません。計算途中は丸めず、単価・時間・件数は小数第1位まで表示します。</p></div></details>
      <div className="kp-sim-contact"><div><h3>御社の電話を、<br className="kp-mobile-break" />一緒に確かめませんか。</h3><p>AIに任せる範囲と、人に戻す条件を整理します。</p></div><a className="kp-button kp-button-dark" href={content.contactHref} data-analytics-contact="true">導入範囲を相談する<ArrowRight aria-hidden="true" /></a></div>
    </div>
  </section>;
}
