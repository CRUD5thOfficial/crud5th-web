import { useId, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowRight, Calculator, CalendarDays, ChevronDown, Clock3, Coins, Headphones, Phone, RotateCcw, SlidersHorizontal, UserRound, type LucideIcon } from "lucide-react";
import { kotoportContent as content } from "@/pages/kotoport-content";
import { aiMonthlyQuoteBounds, isValidAiMonthlyQuoteYen, simulateKotoport, simulationInputDefinitions, type SimulationValues } from "@/pages/kotoport-simulation";
import "./kotoport-effect-simulator.css";

type FieldKey = keyof SimulationValues;
type RawValues = Record<FieldKey, string>;
type SimulationResult = NonNullable<ReturnType<typeof simulateKotoport>>;
const fieldKeys = Object.keys(simulationInputDefinitions) as FieldKey[];
const secondaryKeys: FieldKey[] = ["reviewMinutesPerAiCall", "hourlyWageYen"];
const fieldPresentation: Record<FieldKey, { label: string; icon: LucideIcon }> = {
  dailyCalls: { label: "電話件数", icon: Phone },
  averageCallMinutes: { label: "平均通話", icon: Clock3 },
  daysPerMonth: { label: "稼働日数", icon: CalendarDays },
  aiCoveragePercent: { label: "AIに任せる割合", icon: Headphones },
  reviewMinutesPerAiCall: { label: "AI後の確認時間", icon: UserRound },
  hourlyWageYen: { label: "換算する時給", icon: Coins },
};
const numberFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 });
const yenFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const format = (value: number) => numberFormat.format(value);
const yen = (value: number) => yenFormat.format(value);
const initialValues = () => Object.fromEntries(fieldKeys.map(key => [key, String(simulationInputDefinitions[key].defaultValue)])) as RawValues;

function parseField(key: FieldKey, raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  const definition = simulationInputDefinitions[key];
  return Number.isFinite(value) && value >= definition.min && value <= definition.max && (!definition.integer || Number.isInteger(value)) ? value : null;
}

function ComparisonChart({ title, before, afterParts, unit, formatValue }: {
  title: string;
  before: number;
  afterParts: { label: string; value: number; color: "human" | "review" | "ai" }[];
  unit: string;
  formatValue: (value: number) => string;
}) {
  const after = afterParts.reduce((total, part) => total + part.value, 0);
  const scale = Math.max(before, after, 1);
  return <figure className="kp-sim-chart">
    <figcaption>{title}<span>{unit}</span></figcaption>
    <div className="kp-sim-chart-row">
      <div className="kp-sim-chart-label"><span>導入前</span><strong>{formatValue(before)}<small>{unit}</small></strong></div>
      <div className="kp-sim-chart-track" aria-hidden="true"><span className="kp-sim-bar kp-sim-bar-before" style={{ width: `${before / scale * 100}%` }} /></div>
    </div>
    <div className="kp-sim-chart-row">
      <div className="kp-sim-chart-label"><span>導入後</span><strong>{formatValue(after)}<small>{unit}</small></strong></div>
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

export function KotoportEffectSimulator() {
  const id = useId();
  const [rawValues, setRawValues] = useState<RawValues>(initialValues);
  const [rawMonthlyQuote, setRawMonthlyQuote] = useState("");
  const [planId, setPlanId] = useState("medium");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const quoteRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const plan = content.pricing.plans.find(item => item.id === planId) ?? content.pricing.plans[0];
  const parsedValues = Object.fromEntries(fieldKeys.map(key => [key, parseField(key, rawValues[key])])) as Record<FieldKey, number | null>;
  const allValid = fieldKeys.every(key => parsedValues[key] !== null);
  const quoteInputId = `${id}-aiMonthlyQuoteYen`;
  const detailsId = `${id}-details`;
  const hasQuoteInput = rawMonthlyQuote.trim() !== "";
  const parsedQuote = hasQuoteInput ? Number(rawMonthlyQuote) : null;
  const quoteInvalid = hasQuoteInput && !isValidAiMonthlyQuoteYen(parsedQuote);
  const detailsInvalid = secondaryKeys.some(key => parsedValues[key] === null) || quoteInvalid;
  const result = allValid ? simulateKotoport(parsedValues as SimulationValues, plan, parsedQuote) : null;
  const hasQuoteComparison = result !== null && result.differenceYen !== null;
  const monetaryChangeYen = result ? result.differenceYen ?? (result.beforeLaborYen - result.afterLaborYen) : 0;
  const monetaryLabel = hasQuoteComparison ? "見積額を含めた月の差" : result && result.freedHours < 0 ? "増える時間の時給換算" : "空く時間の時給換算";
  const monetaryDirection = monetaryChangeYen > 0 ? "減" : monetaryChangeYen < 0 ? "増" : "差なし";
  const hasEmptyField = fieldKeys.some(key => rawValues[key].trim() === "");
  const coverage = parsedValues.aiCoveragePercent;
  const change = (key: FieldKey, value: string) => setRawValues(previous => ({ ...previous, [key]: value }));
  const reset = () => { setRawValues(initialValues()); setRawMonthlyQuote(""); setPlanId("medium"); setDetailsOpen(false); };

  function openDetails(focusQuote = false) {
    setDetailsOpen(true);
    requestAnimationFrame(() => {
      const target = focusQuote ? quoteRef.current : detailsRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]') ?? detailsRef.current?.querySelector<HTMLInputElement>("input");
      target?.focus();
    });
  }

  function field(key: FieldKey) {
    const definition = simulationInputDefinitions[key];
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

  const resultSummary = result ? `月の人の対応は導入前${format(result.beforeHumanHours)}時間、導入後${format(result.afterHumanHours)}時間。${result.freedHours >= 0 ? `他の仕事へ回せる時間は${format(result.freedHours)}時間` : `人の対応時間は${format(-result.freedHours)}時間増える試算`}です。${monetaryLabel}は${yen(Math.abs(monetaryChangeYen))}円${hasQuoteComparison ? monetaryDirection : "相当"}です。${quoteInvalid ? "月額見積額の入力範囲を確認してください。費用差は表示していません。" : hasQuoteComparison ? "入力した見積額での比較試算です。" : "費用差は月額見積額の入力後に表示します。"}` : hasEmptyField ? "未入力の項目があります。入力がそろうと結果を表示します。" : "入力範囲を確認してください。結果は表示していません。";

  return <section className="kp-sim-section kp-motion-zone" id="effect-simulator" aria-labelledby="kp-sim-title">
    <div className="kp-container">
      <div className="kp-sim-heading"><span className="kp-sim-eyebrow"><Calculator aria-hidden="true" />導入シミュレーション</span><h2 id="kp-sim-title">御社の電話で、<br className="kp-mobile-break" />どれくらい変わるか。</h2><p>電話の量を入れて、月の変化を見てみましょう。</p></div>
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
              <span><SlidersHorizontal aria-hidden="true" />詳細条件</span>
              <span>{detailsInvalid && <span className="kp-sim-details-error"><AlertCircle aria-hidden="true" />入力を確認</span>}<ChevronDown aria-hidden="true" /></span>
            </button>
            <div id={detailsId} className="kp-sim-details-body" ref={detailsRef} hidden={!detailsOpen}>
              <div className="kp-sim-secondary-fields">{field("reviewMinutesPerAiCall")}{field("hourlyWageYen")}</div>
              <p className="kp-sim-field-help">確認時間はAIが受けた1件あたり。時給は対応時間の金額換算に使います。</p>
              <div className="kp-sim-plan"><label htmlFor={`${id}-plan`}>導入プラン</label><select id={`${id}-plan`} value={planId} onChange={event => setPlanId(event.target.value)}>{content.pricing.plans.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              <div className={`kp-sim-field kp-sim-quote${quoteInvalid ? " kp-sim-field-invalid" : ""}`}>
                <label htmlFor={quoteInputId}><Coins aria-hidden="true" />AIの月額見積額<span className="kp-sim-optional">任意・税別</span></label>
                <div className="kp-sim-input-wrap"><input ref={quoteRef} id={quoteInputId} type="number" inputMode="decimal" min={aiMonthlyQuoteBounds.min} max={aiMonthlyQuoteBounds.max} step="any" value={rawMonthlyQuote} placeholder="見積額を入力" onChange={event => setRawMonthlyQuote(event.target.value)} aria-invalid={quoteInvalid || undefined} aria-describedby={`${quoteInputId}-help${quoteInvalid ? ` ${quoteInputId}-error` : ""}`} /><span>円／月</span></div>
                <p className="kp-sim-field-help" id={`${quoteInputId}-help`}>実際の見積額で比較します。未入力なら費用差は計算しません。</p>
                {quoteInvalid && <p className="kp-sim-field-error" id={`${quoteInputId}-error`}>{format(aiMonthlyQuoteBounds.min)}〜{format(aiMonthlyQuoteBounds.max)}円で入力してください。</p>}
              </div>
              <div className="kp-sim-initial-fee"><span>初期費用<strong>{yen(plan.initialFeeYen)}<small>円・税別</small></strong></span><span>初月のAI料金小計{result?.firstMonthAiYen !== null && result?.firstMonthAiYen !== undefined ? <strong>{yen(result.firstMonthAiYen)}<small>円・税別</small></strong> : <small>有効な月額見積額の入力後</small>}</span></div>
            </div>
          </div>
          <a className="kp-sim-nearby-result" href="#kp-sim-results">{result ? <span>人の対応 <strong>{format(result.beforeHumanHours)} → {format(result.afterHumanHours)}</strong> 時間／月</span> : <span>入力を確認して結果を見る</span>}<ArrowDown aria-hidden="true" /></a>
          <p className="kp-sim-privacy">入力内容は送信・保存されません。</p>
        </div>
        <div className="kp-sim-results" id="kp-sim-results" aria-labelledby="kp-sim-result-title">
          <div className="kp-sim-result-heading"><h3 id="kp-sim-result-title">月の変化</h3><button type="button" className="kp-sim-cost-button" onClick={() => openDetails(true)} aria-controls={detailsId} aria-expanded={detailsOpen}><Coins aria-hidden="true" />{hasQuoteComparison ? "見積額を変更" : quoteInvalid ? "見積額を確認" : "費用も比較する"}<ArrowRight aria-hidden="true" /></button></div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">{resultSummary}</p>
          {result ? <>
            <div className="kp-sim-kpis">
              <div className={`kp-sim-kpi kp-sim-time${result.freedHours < 0 ? " kp-sim-increase" : ""}`}><span><Clock3 aria-hidden="true" />{result.freedHours < 0 ? "人の対応が増える時間" : "他の仕事へ回せる時間"}</span><strong>{format(Math.abs(result.freedHours))}<small>時間／月</small></strong><p>{result.beforeHumanHours === 0 ? "電話が0件の条件" : `人の対応時間 ${format(Math.abs(result.freedPercent))}%${result.freedHours >= 0 ? "減" : "増"}`}</p></div>
              <div className={`kp-sim-kpi kp-sim-money${monetaryChangeYen < 0 ? " kp-sim-increase" : ""}`}><span><Coins aria-hidden="true" />{monetaryLabel}</span><strong>{yen(Math.abs(monetaryChangeYen))}<small>{hasQuoteComparison ? "円／月" : "円相当／月"}</small>{hasQuoteComparison && <span className="kp-sim-delta-direction">{monetaryDirection}</span>}</strong><p>{hasQuoteComparison ? "人の時間換算額＋AI月額で比較" : `時給 ${yen(parsedValues.hourlyWageYen ?? 0)}円で換算`}</p></div>
            </div>
            <ComparisonChart title="人の対応時間" before={result.beforeHumanHours} afterParts={[{ label: "直接対応", value: result.directHumanMinutes / 60, color: "human" }, { label: "AI後の確認", value: result.reviewMinutes / 60, color: "review" }]} unit="時間／月" formatValue={format} />
            {result.aiFeeYen !== null && <ComparisonChart title="見積額を含めた費用" before={result.beforeLaborYen} afterParts={[{ label: "人の時間換算額", value: result.afterLaborYen, color: "human" }, { label: "AI月額・税別", value: result.aiFeeYen, color: "ai" }]} unit="円／月" formatValue={yen} />}
            {quoteInvalid && <p className="kp-sim-quote-warning"><AlertCircle aria-hidden="true" />見積額が範囲外のため、費用差は未算出です。</p>}
            <p className="kp-sim-money-note">時給換算は実際の給与削減額ではありません。<br />人数を維持する場合は、通常の給与にAI利用料が加わります。</p>
            {result.requiresVolumeReview && <p className="kp-sim-volume-note">AI通話は月{format(result.aiMinutes)}分。この通話量で月額見積額を確認してください。</p>}
          </> : <div className="kp-sim-empty" role="status"><Calculator aria-hidden="true" /><h4>{hasEmptyField ? "未入力の項目があります" : "入力範囲を確認してください"}</h4><p>すべての条件がそろうと、結果を表示します。</p>{detailsInvalid && <button type="button" onClick={() => openDetails()}><AlertCircle aria-hidden="true" />詳細条件を確認<ArrowRight aria-hidden="true" /></button>}</div>}
          <p className="kp-sim-assumption-tag">仮定に基づく試算です。導入効果を保証するものではありません。</p>
        </div>
      </div>
      {result && <WorkFlow result={result} />}
      <details className="kp-sim-conditions"><summary>試算の考え方・含まない費用<ChevronDown aria-hidden="true" /></summary><div><p>月の電話件数＝1日の件数×稼働日数。導入前の人の時間は、月の件数×平均通話時間。導入後は、人が直接受ける通話時間＋AI対象の件数×1件あたりの確認時間です。確認が長い場合は、人の時間が増えることもあります。AIに任せる割合は対応範囲の仮定で、達成率や精度ではありません。</p><p>人の時間の金額換算＝対応時間×入力した時給。月額見積額が未入力の間は、空く時間（または増える時間）の金額換算だけを表示します。見積額を入力した場合の差＝導入前の時間換算額−（導入後の時間換算額＋AIの月額見積額）。比較額が増える場合も表示します。月額見積額はこの画面で決定する料金ではありません。初期費用は月の比較に含めず、初月のAI料金小計＝入力した月額見積額＋選択プランの初期費用として詳細条件に表示します。</p><p>人数・配置・待機時間から給与を推定するものではありません。通信費、接続費、運用などの別費用は含みません。見積額に含まれる範囲と、AIに任せられる用件・量・運用条件は導入前に確認します。電話件数は月の平均として小数になる場合があります。計算途中は丸めず、時間・件数は小数第1位、金額は1円単位に丸めて表示しています。</p></div></details>
      <div className="kp-sim-contact"><div><h3>御社の電話を、<br className="kp-mobile-break" />一緒に確かめませんか。</h3><p>AIに任せる範囲と、人に戻す条件を整理します。</p></div><a className="kp-button kp-button-dark" href={content.contactHref} data-analytics-contact="true">導入範囲を相談する<ArrowRight aria-hidden="true" /></a></div>
    </div>
  </section>;
}
