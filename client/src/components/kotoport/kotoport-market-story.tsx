import { ArrowDown, ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import type { kotoportContent } from "@/pages/kotoport-content";
import "./kotoport-market-story.css";

type MarketStoryContent = typeof kotoportContent.laborBackground;

function SurveyScope({ text }: { text: string }) {
  return <>{text.split(" · ").map((part, index) => <span className="kp-labor-scope-part" key={part}>{index > 0 ? " · " : ""}{part}</span>)}</>;
}

/** Decorative scenes repeat the adjacent copy; charts use the same values as their visible labels. */
function StaffingScene() {
  return <svg className="kp-labor-staffing-scene" viewBox="0 0 240 120" aria-hidden="true" focusable="false">
    <ellipse cx="121" cy="109" rx="94" ry="7" fill="var(--kp-labor-warm-shade)" />
    <circle cx="196" cy="28" r="20" fill="white" stroke="var(--kp-ink)" strokeWidth="2" />
    <path d="M196 16v13l8 4" fill="none" stroke="var(--kp-ink)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M55 66c0-16 12-29 28-29s28 13 28 29" fill="none" stroke="var(--kp-ink)" strokeWidth="4" />
    <path d="M61 106V86a22 22 0 0 1 44 0v20" fill="var(--kp-yellow)" stroke="var(--kp-ink)" strokeWidth="2" />
    <circle cx="83" cy="64" r="21" fill="white" stroke="var(--kp-ink)" strokeWidth="2" />
    <path d="M63 61c1-16 10-23 22-21 9 1 16 8 17 18-12 2-25-3-29-8-1 5-5 9-10 11Z" fill="var(--kp-ink)" />
    <path d="M57 60v14m52-14v14m0-5v8l-16 4" fill="none" stroke="var(--kp-ink)" strokeWidth="5" strokeLinecap="round" />
    <circle cx="77" cy="65" r="1.8" fill="var(--kp-ink)" /><circle cx="91" cy="65" r="1.8" fill="var(--kp-ink)" />
    <path d="m80 75 5 1" fill="none" stroke="var(--kp-ink)" strokeWidth="2" strokeLinecap="round" />
    <rect x="126" y="61" width="61" height="39" rx="5" fill="white" stroke="var(--kp-ink)" strokeWidth="2" />
    <path d="M156 100v9m-10 0h21m-23-34h26m-26 8h17M40 110h161" fill="none" stroke="var(--kp-ink)" strokeWidth="2" strokeLinecap="round" />
    <path d="M110 98h20" fill="none" stroke="var(--kp-ink)" strokeWidth="5" strokeLinecap="round" />
    <path d="m36 30 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="var(--kp-yellow)" />
  </svg>;
}

function RoleScene({ kind }: { kind: "calls" | "ai" | "human" }) {
  return <svg className={`kp-labor-role-scene kp-labor-role-scene-${kind}`} viewBox="0 0 160 104" aria-hidden="true" focusable="false">
    {kind === "calls" ? <>
      <ellipse cx="82" cy="96" rx="54" ry="5" fill="var(--kp-labor-purple-shade)" />
      <rect x="53" y="16" width="51" height="78" rx="12" fill="white" stroke="var(--kp-ink)" strokeWidth="2" />
      <rect x="59" y="29" width="39" height="47" rx="5" fill="var(--kp-labor-purple-soft)" />
      <path d="M68 22h20m-13 62h7" stroke="var(--kp-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="m70 43 6-3 4 9-4 3c2 4 4 6 8 8l3-4 8 4-3 6c-12 1-25-13-22-23Z" fill="var(--kp-purple)" />
      <g className="kp-labor-call-signal" fill="none" stroke="var(--kp-purple)" strokeWidth="2.5" strokeLinecap="round"><path d="M110 27c5 5 7 10 7 16m1-24c8 7 12 15 12 25" /></g>
      <path d="M18 14h28a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-7l-8 7v-7H18a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8Z" fill="var(--kp-pink)" />
      <circle cx="23" cy="26" r="2" fill="var(--kp-ink)" /><circle cx="32" cy="26" r="2" fill="var(--kp-ink)" /><circle cx="41" cy="26" r="2" fill="var(--kp-ink)" />
    </> : kind === "ai" ? <>
      <ellipse cx="80" cy="96" rx="55" ry="5" fill="var(--kp-labor-purple-shade)" />
      <path d="M80 18v-7" stroke="var(--kp-ink)" strokeWidth="2" /><circle cx="80" cy="9" r="5" fill="var(--kp-yellow)" />
      <rect x="37" y="23" width="84" height="65" rx="23" fill="var(--kp-purple)" stroke="var(--kp-ink)" strokeWidth="2" />
      <rect x="49" y="35" width="59" height="29" rx="14" fill="white" />
      <path d="M64 47v6m28-6v6m-20 20h14" fill="none" stroke="var(--kp-ink)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M31 45v17m97-17v17" stroke="var(--kp-ink)" strokeWidth="5" strokeLinecap="round" />
      <g className="kp-labor-handoff-paper"><rect x="105" y="59" width="33" height="36" rx="5" fill="white" stroke="var(--kp-ink)" strokeWidth="2" /><path d="m112 71 3 3 5-6m-8 16 3 3 5-6m4-8h7m-7 13h7" fill="none" stroke="var(--kp-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>
    </> : <>
      <ellipse cx="80" cy="96" rx="56" ry="5" fill="var(--kp-labor-green-shade)" />
      <path d="M42 90V66a23 23 0 0 1 46 0v24" fill="var(--kp-green)" stroke="var(--kp-ink)" strokeWidth="2" />
      <circle cx="65" cy="34" r="20" fill="white" stroke="var(--kp-ink)" strokeWidth="2" />
      <path d="M45 34c-1-13 6-23 19-23 13 0 22 9 21 23-11-1-20-6-24-11-4 7-9 10-16 11Z" fill="var(--kp-ink)" />
      <path d="m58 43 6 2 6-2m-12-9v1m14-1v1" fill="none" stroke="var(--kp-ink)" strokeWidth="2" strokeLinecap="round" />
      <rect x="90" y="57" width="35" height="32" rx="4" fill="white" stroke="var(--kp-ink)" strokeWidth="2" transform="rotate(-8 107 73)" />
      <path d="m99 72 6 5 11-13M30 94h106M81 76l11 7" fill="none" stroke="var(--kp-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M108 12h27a9 9 0 0 1 9 9v9a9 9 0 0 1-9 9h-11l-9 7v-7h-7a9 9 0 0 1-9-9v-9a9 9 0 0 1 9-9Z" fill="var(--kp-labor-green-shade)" /><path d="m112 25 6 5 12-12" fill="none" stroke="var(--kp-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>}
  </svg>;
}

export function KotoportMarketStory({ content }: { content: MarketStoryContent }) {
  const { shortage, wage, connection } = content;
  const sources = [shortage, wage, connection];
  return <section className="kp-labor-background kp-container kp-motion-zone" aria-labelledby="kp-labor-title">
    <header className="kp-labor-heading"><span className="kp-labor-label">{content.label}</span><h2 id="kp-labor-title">{content.title.map(line => <span key={line}>{line}</span>)}</h2><p>{content.description}</p></header>

    <div className="kp-labor-stats">
      <article className="kp-labor-stat kp-labor-stat-shortage" aria-labelledby="kp-labor-shortage-title">
        <p className="kp-labor-stat-label">01<span>採用の難しさ</span></p><h3 id="kp-labor-shortage-title">{shortage.title}</h3>
        <figure className="kp-labor-visual kp-labor-shortage-visual"><div className="kp-labor-donut"><svg viewBox="0 0 128 128" aria-hidden="true" focusable="false"><circle cx="64" cy="64" r="52" fill="none" stroke="white" strokeWidth="11" /><circle cx="64" cy="64" r="52" fill="none" stroke="var(--kp-purple)" strokeWidth="11" pathLength="100" strokeDasharray={`${shortage.value} ${100 - shortage.value}`} transform="rotate(-90 64 64)" /></svg><p className="kp-labor-number">{shortage.value}<span>％</span></p></div><figcaption>全国企業の<strong>半数以上</strong></figcaption></figure>
        <p className="kp-labor-insight">人を増やすこと自体が、<br /><strong>簡単ではない。</strong></p><p className="kp-labor-scope"><SurveyScope text={shortage.scope} /></p>
      </article>

      <article className="kp-labor-stat kp-labor-stat-wage" aria-labelledby="kp-labor-wage-title">
        <p className="kp-labor-stat-label">02<span>人を配置する費用</span></p><h3 id="kp-labor-wage-title">{wage.title}</h3>
        <figure className="kp-labor-visual kp-labor-wage-visual"><p className="kp-labor-number">{wage.value.toLocaleString("ja-JP")}<span>円／時</span></p><StaffingScene /><figcaption className="sr-only">公開求人に提示された全国の平均採用時時給</figcaption></figure>
        <p className="kp-labor-insight">電話に備える時間にも、<br /><strong>人の配置が必要。</strong></p><p className="kp-labor-scope"><SurveyScope text={wage.scope} /><br />公開求人の平均採用時時給</p>
      </article>

      <article className="kp-labor-stat kp-labor-stat-connection" aria-labelledby="kp-labor-connection-title">
        <p className="kp-labor-stat-label">03<span>つながるまでの待ち時間</span></p><h3 id="kp-labor-connection-title">{connection.title}</h3>
        <figure className="kp-labor-visual kp-labor-connection-visual"><p className="kp-labor-number">{connection.value}<span>％</span></p><div className="kp-labor-bar-wrap"><div className="kp-labor-bar" aria-hidden="true"><span style={{ width: `${connection.value}%` }} /></div><div className="kp-labor-bar-scale" aria-hidden="true"><span>0</span><span>100％</span></div></div><figcaption>「すぐにつながった」と回答</figcaption></figure>
        <p className="kp-labor-insight">電話をかける側には、<br /><strong>待つ時間が生まれる。</strong></p><p className="kp-labor-scope"><SurveyScope text={connection.scope} /><br />※取りこぼし・放棄呼の割合ではありません。</p>
      </article>
    </div>

    <div className="kp-labor-division">
      <div className="kp-labor-division-copy"><span className="kp-labor-label">そこで、コトポート</span><h3>増員だけに頼らず、<br /><strong>電話の役割を分ける。</strong></h3><p>繰り返しの受付・確認はAIへ。<br />判断と次の対応は、人へ。</p></div>
      <ol className="kp-labor-role-flow">
        <li><RoleScene kind="calls" /><span className="kp-labor-role-label">いつもの電話</span><p>問い合わせ・予定確認</p><ArrowRight className="kp-labor-role-arrow" aria-hidden="true" /></li>
        <li><RoleScene kind="ai" /><span className="kp-labor-role-label">AIが受付・確認</span><p>用件と希望を整理</p><ArrowRight className="kp-labor-role-arrow" aria-hidden="true" /></li>
        <li><RoleScene kind="human" /><span className="kp-labor-role-label">人が判断・対応</span><p>要点を受け取り、次へ</p></li>
      </ol>
    </div>
    <div className="kp-labor-footer"><p>任せる業務と、人に戻す条件を先に決めます。<br />費用は、基本料と通話量に応じた料金で比較できます。</p><a className="kp-labor-calculator-link" href={content.calculatorHref}>自社の条件で費用を試す<ArrowDown aria-hidden="true" /></a></div>

    <details className="kp-labor-sources"><summary><span>数字の調査範囲・出典を見る</span><ChevronDown aria-hidden="true" /></summary><ol>{sources.map(item => <li key={item.source.url}><strong>{item.title}：{item.value.toLocaleString("ja-JP")}{item === wage ? "円／時" : "％"}</strong><p>{item.source.details}</p><a href={item.source.url} target="_blank" rel="noopener noreferrer">{item.source.label}<ExternalLink aria-hidden="true" /><span className="sr-only">（新しいタブで開く）</span></a></li>)}</ol></details>
  </section>;
}
