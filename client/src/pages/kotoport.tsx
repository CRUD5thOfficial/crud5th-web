import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronRight, Clock3, Cloud, Cpu, FileText, Globe, Headphones, Menu, MessageCircle, Mic, Phone, PhoneIncoming, PhoneOutgoing, RefreshCw, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { kotoportContent as content, type CallDirection } from "./kotoport-content";
import { EconomicsCalculator, PricingCalculator } from "./kotoport-calculators";
import { calculatePlanEstimate } from "./kotoport-pricing";
import { KotoportAvatarStage } from "@/components/kotoport/kotoport-avatar-stage";
import { useKotoportDemoAccess } from "@/components/kotoport/use-kotoport-demo-access";
import { KotoportAvatar } from "@/components/kotoport/kotoport-avatar";
import { KotoportOnboardingScene } from "@/components/kotoport/kotoport-onboarding-scene";
import { KotoportSupportFlow } from "@/components/kotoport/kotoport-support-flow";
import { KotoportUseCaseScene } from "@/components/kotoport/kotoport-use-case-scene";
import { KotoportEffectSimulator } from "@/components/kotoport/kotoport-effect-simulator";
import "@/components/kotoport/kotoport-use-case-cards.css";
import { KotoportMotionProvider, KotoportWaveRibbon, useConversationPlayback, useKotoportMotion, useMotionVisibility, useMotionZones } from "@/components/kotoport/kotoport-motion";
import "./kotoport.css";

const conversations = {
  inbound: [
    { speaker: "AI電話", text: "お電話ありがとうございます。ご用件をお聞かせください。" },
    { speaker: "お客様", text: "予約について、折返しのお電話をお願いしたいです。" },
    { speaker: "AI電話", text: "承知しました。ご希望を伺い、担当者へお伝えします。" },
  ],
  outbound: [
    { speaker: "AI電話", text: "明日の出勤予定について、確認のお電話です。" },
    { speaker: "スタッフ", text: "予定どおり、9時に出勤できます。" },
    { speaker: "AI電話", text: "ありがとうございます。ご回答を管理者へお伝えします。" },
  ],
};
const navItems = [
  { href: "#service-overview", label: "コトポートとは" },
  { href: "#capabilities", label: "できること" },
  { href: "#product-details", label: "製品詳細" },
  { href: "#use-cases", label: "活用シーン" },
  { href: "#getting-started", label: "導入の流れ" },
];
const businessFlowIcons = [FileText, Headphones, Phone, UsersRound];
const useCaseScenes = ["security", "facilities", "booking", "commerce", "repair"] as const;
const onboardingScenes = ["listen", "build", "test", "improve"] as const;
const productDetailIcons = { inbound: PhoneIncoming, outbound: PhoneOutgoing, voice: Mic, languages: Globe, cloud: Cloud, gpu: Cpu };

function Brand() {
  return <a className="kp-brand" href="#kotoport-top" aria-label="コトポート ページの先頭へ"><span className="kp-brand-mark" aria-hidden="true"><i /><i /></span><span>コトポート</span></a>;
}

function Actions({ large = false }: { large?: boolean }) {
  return <div className={`kp-actions${large ? " kp-actions-large" : ""}`}><a className="kp-button kp-button-dark" href={content.contactHref} data-analytics-contact="true">導入を相談する<ArrowRight aria-hidden="true" /></a><a className="kp-button kp-button-white" href="#service-overview">サービス概要<ArrowDown aria-hidden="true" /></a></div>;
}

function SoundWave({ speaker }: { speaker: "ai" | "human" | "idle" }) {
  return <span className="kp-soundwave" data-speaker={speaker} aria-hidden="true">{[24, 45, 64, 37, 80, 53, 31, 68, 46, 25].map((height, index) => <i key={index} style={{ height }} />)}</span>;
}

function ConversationCard({ direction, compact = false }: { direction: CallDirection; compact?: boolean }) {
  const lines = compact ? conversations[direction] : conversations[direction].slice(1);
  const { ref, isOnscreen } = useMotionVisibility<HTMLDivElement>();
  const { phase, canAnimate, showFullConversation } = useConversationPlayback(lines.map(line => line.text), isOnscreen, direction);
  const currentLine = lines[phase.row];
  const speaker = !showFullConversation && phase.kind === "reply" ? currentLine?.speaker === "AI電話" ? "ai" : "human" : "idle";
  const status = showFullConversation || phase.kind === "hold" ? "必要な内容を、人へ。" : phase.kind === "typing" ? `${currentLine?.speaker ?? "AI電話"}が応答を準備中` : phase.kind === "reply" ? `${currentLine?.speaker ?? "AI電話"}がお話し中` : "耳をかたむけています";
  return <div ref={ref} className={`kp-conversation kp-motion-zone${compact ? " kp-conversation-compact" : ""}`} data-conversation-phase={showFullConversation ? "static" : phase.kind} data-running={canAnimate} data-direction={direction}>
    <div className="sr-only"><p>応対イメージの会話</p>{lines.map(line => <p key={line.text}>{line.speaker}：{line.text}</p>)}</div>
    <div className="kp-conversation-lines" aria-hidden="true">{lines.map((line, index) => {
      const isRevealed = showFullConversation || phase.kind === "hold" || index < phase.row || (index === phase.row && phase.kind === "reply");
      const state = isRevealed ? index === phase.row && phase.kind === "reply" && !showFullConversation ? "speaking" : "settled" : index === phase.row && phase.kind === "typing" ? "typing" : "queued";
      return <div className={`kp-chat-row${line.speaker !== "AI電話" ? " kp-chat-human" : ""}`} data-chat-state={state} key={line.text}><span className="kp-chat-avatar">{line.speaker !== "AI電話" ? <UserRound /> : <Headphones />}</span><div><span className="kp-chat-speaker">{line.speaker}</span><p><span className="kp-chat-text">{line.text}</span><span className="kp-typing-dots"><i /><i /><i /></span></p></div></div>;
    })}</div>
    <div className={compact ? "kp-conversation-meter" : "kp-conversation-sound"} aria-hidden="true"><SoundWave speaker={speaker} />{!compact && <p>受付から、引き継ぎまで。</p>}<span className="kp-conversation-status">{status}</span></div>
  </div>;
}

function ConceptFlower() {
  return <figure className="kp-flower" aria-label="相手の話を聴く、曖昧な点を確かめる、必要な内容を整理する、担当者へ引き継ぐ">
    <div className="kp-petal kp-petal-top"><span className="kp-petal-surface" aria-hidden="true" /><div className="kp-petal-content"><Headphones aria-hidden="true" /><strong>聴く</strong><span>相手の用件を<br />受け取る</span></div></div>
    <div className="kp-petal kp-petal-right"><span className="kp-petal-surface" aria-hidden="true" /><div className="kp-petal-content"><MessageCircle aria-hidden="true" /><strong>確かめる</strong><span>曖昧な点を<br />聞き返す</span></div></div>
    <div className="kp-petal kp-petal-bottom"><span className="kp-petal-surface" aria-hidden="true" /><div className="kp-petal-content"><FileText aria-hidden="true" /><strong>整理する</strong><span>必要な内容を<br />まとめる</span></div></div>
    <div className="kp-petal kp-petal-left"><span className="kp-petal-surface" aria-hidden="true" /><div className="kp-petal-content"><UsersRound aria-hidden="true" /><strong>引き継ぐ</strong><span>担当者の判断へ<br />つなぐ</span></div></div>
    <div className="kp-flower-center"><Phone aria-hidden="true" /><span>コトポート</span></div>
  </figure>;
}

function BusinessFlow() {
  return <figure className="kp-business-flow" aria-label="御社が業務と資料を共有、CRUD5thが応対を設定、AI電話が受付・確認し、人が判断する流れ">
    <ol className="kp-flow-steps">{content.businessFlow.steps.map((step, index) => {
      const StepIcon = businessFlowIcons[index];
      return <li className="kp-workflow-card" key={step.title}>
        <div className="kp-flow-card-heading"><span className="kp-flow-step-count">0{index + 1}</span><span className="kp-owner">{step.owner}</span></div>
        <StepIcon aria-hidden="true" /><h3>{step.title}</h3><p>{step.description}</p>
        {index < content.businessFlow.steps.length - 1 && <ArrowRight className="kp-flow-connector" aria-hidden="true" />}
      </li>;
    })}</ol>
    <figcaption>{content.businessFlow.note}</figcaption>
  </figure>;
}

function KnowledgeContinuity() {
  const icons = [FileText, Headphones, RefreshCw];
  return <section className="kp-knowledge kp-container" aria-labelledby="kp-knowledge-title">
    <div className="kp-knowledge-copy"><h2 id="kp-knowledge-title">{content.knowledgeContinuity.title}</h2><p>{content.knowledgeContinuity.description}</p></div>
    <ol className="kp-knowledge-steps">{content.knowledgeContinuity.steps.map((step, index) => {
      const StepIcon = icons[index];
      return <li key={step.title}><div className="kp-knowledge-illustration" aria-hidden="true">{index === 1 ? <KotoportAvatar color="green" /> : <StepIcon />}</div><h3>{step.title}</h3><p>{step.description}</p>{index < content.knowledgeContinuity.steps.length - 1 && <ArrowRight className="kp-knowledge-arrow" aria-hidden="true" />}</li>;
    })}</ol>
    <p className="kp-knowledge-note"><Check aria-hidden="true" />{content.knowledgeContinuity.note}</p>
  </section>;
}

function PricingExample() {
  const { plan, monthlyMinutes } = content.pricing.example;
  const estimate = calculatePlanEstimate(plan, monthlyMinutes);
  return <div className="kp-pricing-example" aria-labelledby="kp-pricing-example-title">
    <div className="kp-pricing-example-heading"><h3 id="kp-pricing-example-title">{plan.name}で月{monthlyMinutes.toLocaleString("ja-JP")}分使うと</h3><span>参考条件・税別</span></div>
    <p className="kp-pricing-formula">月の料金 ＝ 基本料金 ＋ 超過通話分 × 単価</p>
    <div className="kp-pricing-equation">
      <div><span>月額基本料</span><strong>{plan.monthlyFeeYen.toLocaleString("ja-JP")}<small>円</small></strong><p>{plan.includedMinutes.toLocaleString("ja-JP")}分を含む</p></div>
      <span className="kp-pricing-operator" aria-hidden="true">＋</span>
      <div><span>超過分の従量料金</span><strong>{estimate.overageFeeYen.toLocaleString("ja-JP")}<small>円</small></strong><p>{estimate.overageMinutes.toLocaleString("ja-JP")}分 × {plan.overageYenPerMinute.toLocaleString("ja-JP")}円</p></div>
      <span className="kp-pricing-operator" aria-hidden="true">＝</span>
      <div className="kp-pricing-equation-total"><span>月額小計</span><strong>{estimate.monthlySubtotalYen.toLocaleString("ja-JP")}<small>円</small></strong><p>基本料＋超過分</p></div>
    </div>
    <p className="kp-pricing-example-note">通話0分でも基本料がかかります。含む分数以内は追加の従量料金0円。<br className="kp-desktop-break" />初期費用・税・回線／通信費などは別です。</p>
  </div>;
}

function KotoportPage() {
  const [callDirection, setCallDirection] = useState<CallDirection>("inbound");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const closeDemo = useCallback(() => setIsDemoOpen(false), []);
  const demoAccess = useKotoportDemoAccess();
  useEffect(() => { if (!demoAccess.isAuthorized) closeDemo(); }, [demoAccess.isAuthorized, closeDemo]);
  const pageRef = useRef<HTMLDivElement>(null);
  const { isPaused, isReduced, isDocumentVisible } = useKotoportMotion();
  useMotionZones(pageRef);
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

  return <div ref={pageRef} className="kotoport-page" id="kotoport-top" data-motion-static={isPaused || isReduced} data-document-visible={isDocumentVisible}>
    <a className="kp-skip" href="#kotoport-main">本文へ移動</a>
    <header className="kp-header"><Brand /><nav className="kp-desktop-nav" aria-label="メインメニュー">{navItems.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}</nav><div className="kp-header-actions"><a className="kp-button kp-button-white kp-header-overview" href="#service-overview">サービス概要</a><a className="kp-button kp-button-dark" href={content.contactHref} data-analytics-contact="true">相談する</a><button className="kp-menu-button" aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"} aria-expanded={isMenuOpen} aria-controls="kp-mobile-menu" onClick={() => setIsMenuOpen(open => !open)}>{isMenuOpen ? <X /> : <Menu />}</button></div>
      {isMenuOpen && <nav id="kp-mobile-menu" className="kp-mobile-nav" aria-label="モバイルメニュー">{navItems.map(item => <a href={item.href} key={item.href} onClick={() => setIsMenuOpen(false)}>{item.label}<ChevronRight aria-hidden="true" /></a>)}<a href="#pricing" onClick={() => setIsMenuOpen(false)}>料金<ChevronRight aria-hidden="true" /></a></nav>}
    </header>
    <main id="kotoport-main">
      <section className="kp-hero kp-motion-zone" aria-labelledby="kp-main-title"><span className="kp-halftone kp-halftone-hero" aria-hidden="true" /><div className="kp-hero-copy"><h1 id="kp-main-title">電話対応は、<span>AIにまかせよう。</span></h1><p className="kp-hero-subtitle">受電の一次受付も、発信の確認連絡も。</p></div>
        <div className="kp-hero-card"><div className="kp-conversation-heading"><span>応対イメージ</span><div className="kp-call-tabs" role="group" aria-label="応対イメージを選択"><button type="button" aria-pressed={callDirection === "inbound"} aria-controls="kp-hero-conversation" onClick={() => setCallDirection("inbound")}>受電</button><button type="button" aria-pressed={callDirection === "outbound"} aria-controls="kp-hero-conversation" onClick={() => setCallDirection("outbound")}>発信</button></div></div><div id="kp-hero-conversation"><ConversationCard direction={callDirection} /></div>{demoAccess.isAuthorized && <button type="button" className="kp-hero-demo-button" aria-haspopup="dialog" aria-controls="kp-voice-demo-dialog" aria-expanded={isDemoOpen} onClick={() => { if (demoAccess.canUseDemo()) setIsDemoOpen(true); }}>コトポートと話す<ArrowRight aria-hidden="true" /></button>}</div>
        <KotoportWaveRibbon variant="hero" />
        <KotoportAvatarStage paused={isPaused || isReduced} isDemoOpen={isDemoOpen} onDemoClose={closeDemo} isDemoAuthorized={demoAccess.isAuthorized} canUseDemo={demoAccess.canUseDemo} onDemoUnauthorized={demoAccess.invalidate} />
      </section>
      <div className="kp-purpose-band"><div><span className="kp-purpose-icon kp-purple-soft"><PhoneIncoming aria-hidden="true" /></span><strong>受電の一次受付</strong></div><div><span className="kp-purpose-icon kp-blue-soft"><PhoneOutgoing aria-hidden="true" /></span><strong>発信の確認連絡</strong></div><div><span className="kp-purpose-icon kp-yellow-soft"><FileText aria-hidden="true" /></span><strong>必要事項の整理</strong></div><div><span className="kp-purpose-icon kp-green-soft"><UsersRound aria-hidden="true" /></span><strong>人への引き継ぎ</strong></div></div>
      <section className="kp-concept kp-container kp-motion-zone" id="service-overview" aria-labelledby="kp-concept-title"><span id="kotoport-approach" className="kp-anchor-alias" aria-hidden="true" /><div className="kp-concept-ribbon" aria-hidden="true" /><div className="kp-concept-copy"><span className="kp-display-en">Voice AI</span><h2 id="kp-concept-title">話を聴いて、<br />仕事につなぐ。</h2><p>コトポートは、御社の業務に合わせて<br className="kp-desktop-break" />受付・案内・確認を受け持つAI電話です。<br />必要な内容を人へつなぎ、<br />電話にかかる負担を軽くします。</p></div><ConceptFlower /></section>
      <section className="kp-labor-background kp-container" aria-labelledby="kp-labor-title">
        <div className="kp-labor-copy"><span className="kp-labor-label">{content.laborBackground.label}</span><h2 id="kp-labor-title">{content.laborBackground.title}</h2><p>{content.laborBackground.description}</p></div>
        <div className="kp-labor-source"><FileText aria-hidden="true" /><p>{content.laborBackground.scope}</p><a href={content.laborBackground.source.url} target="_blank" rel="noopener noreferrer">出典：{content.laborBackground.source.label}<ArrowRight aria-hidden="true" /><span className="sr-only">（新しいタブで開く）</span></a><p>{content.laborBackground.source.details}</p></div>
      </section>
      <section className="kp-role-section kp-motion-zone" id="capabilities"><span id="kotoport-uses" className="kp-anchor-alias" aria-hidden="true" /><div className="kp-section-title"><h2>その電話、<br className="kp-mobile-break" />まかせられるかも。</h2><p>いつもの仕事にある、繰り返しの受付や確認から。</p></div><div className="kp-role-cards kp-container">{[{ icon: PhoneIncoming, color: "purple", title: "問い合わせを受ける", text: "用件や希望を聞いて、担当者へ。", figure: "yellow" }, { icon: Clock3, color: "blue", title: "予定を確かめる", text: "出勤予定や状況の返事を集める。", figure: "coral" }, { icon: UsersRound, color: "green", title: "応援できるか聞く", text: "確認の電話を、管理者の判断へ。", figure: "green" }].map(item => <article className={`kp-role-card kp-role-${item.color}`} key={item.title}><div className="kp-role-figure"><KotoportAvatar color={item.figure === "yellow" ? "yellow" : item.figure === "coral" ? "coral" : "green"} /><span><item.icon aria-hidden="true" /></span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div><Actions /></section>
      <div className="kp-feature-stack">
        <section className="kp-feature kp-feature-blue kp-motion-zone" id="inbound" aria-labelledby="kp-inbound-title">
          <span className="kp-halftone kp-halftone-feature" aria-hidden="true" /><div className="kp-section-title"><h2 id="kp-inbound-title">かかってきた電話に、<br />きちんと耳をかたむける。</h2><p>問い合わせや折返しの希望を伺い、<br className="kp-mobile-break" />担当者へ必要な内容をつなぎます。</p></div>
          <div className="kp-inbound-example">
            <div className="kp-inbound-scene"><KotoportAvatar className="kp-scene-assistant" color="green" /><div className="kp-inbound-card"><div className="kp-example-caption"><PhoneIncoming aria-hidden="true" />受電の応対イメージ</div><ConversationCard direction="inbound" compact /><div className="kp-handoff-note"><Check aria-hidden="true" /><span>用件・希望・折返し先を、担当者へ。</span></div></div></div>
            <aside className="kp-handoff-sheet" aria-labelledby="kp-handoff-title">
              <div className="kp-handoff-heading"><FileText aria-hidden="true" /><span>{content.handoffExample.label}</span></div><h3 id="kp-handoff-title">{content.handoffExample.title}</h3>
              <dl>{content.handoffExample.items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
              <div className="kp-handoff-next"><span>担当者の次の仕事</span><p>{content.handoffExample.nextAction}</p></div><p className="kp-handoff-caption">{content.handoffExample.note}</p>
            </aside>
          </div>
        </section>
        <section className="kp-feature kp-feature-yellow kp-motion-zone" id="outbound" aria-labelledby="kp-outbound-title"><div className="kp-outbound-scene"><div className="kp-outbound-requests"><span><Clock3 aria-hidden="true" />出勤予定の確認</span><span><UsersRound aria-hidden="true" />応援できるかの打診</span><span><MessageCircle aria-hidden="true" />現場の状況の確認</span></div><div className="kp-outbound-line" aria-hidden="true"><ArrowDown /></div><div className="kp-outbound-conversation"><div className="kp-example-caption">発信の応対イメージ</div><ConversationCard direction="outbound" compact /></div><KotoportAvatar className="kp-outbound-assistant" color="coral" /></div><div className="kp-panel-copy"><span className="kp-section-number">OUTBOUND</span><h2 id="kp-outbound-title">確認の電話を、<br />AIにまかせる。</h2><p>予定や状況、応援の可否。<br />繰り返しの連絡をAI電話が受け持ち、<br />集まった返答を管理者へ渡します。</p><p className="kp-panel-small">電話する相手・時間・質問・かけ直しの扱いは、<br className="kp-desktop-break" />あらかじめ一緒に決めます。</p></div></section>
        <section className="kp-feature kp-feature-green kp-motion-zone" id="business-fit" aria-labelledby="kp-fit-title"><div className="kp-panel-copy"><h2 id="kp-fit-title">いつもの仕事に、<br />無理なくつながる。</h2><p>いまあるFAQや案内資料から。<br />役割、答えてよい情報、話し方を<br />御社の業務に合わせて整えます。</p><p className="kp-panel-small">台詞をすべて書いたり、<br />分岐を増やし続けたりする準備は不要です。</p></div><BusinessFlow /></section>
        <section className="kp-feature kp-feature-pink kp-motion-zone" id="getting-started" aria-labelledby="kp-start-title"><span id="kotoport-onboarding" className="kp-anchor-alias" aria-hidden="true" /><div className="kp-section-title"><h2 id="kp-start-title">はじめるときも、<br className="kp-mobile-break" />使ってからも。</h2><p>応対の設計から導入後の改善まで、CRUD5thが支えます。</p></div><ol className="kp-start-steps">{content.onboarding.steps.map((step, index) => <li key={step.title}><span className="kp-step-count">0{index + 1}</span><KotoportOnboardingScene kind={onboardingScenes[index]} /><h3>{step.title}</h3><p>{step.description}</p>{index < 3 && <ArrowRight className="kp-step-arrow" aria-hidden="true" />}</li>)}</ol>
          <KotoportSupportFlow maintenanceDescription={content.approach.maintenanceDescription} maintenanceSteps={content.approach.maintenanceSteps} maintenanceScopeNote={content.approach.maintenanceScopeNote} />
        </section>
      </div>
      <section className="kp-product-details kp-motion-zone" id="product-details" aria-labelledby="kp-product-title">
        <div className="kp-container">
          <div className="kp-section-title"><span className="kp-product-eyebrow">{content.productDetails.eyebrow}</span><h2 id="kp-product-title">{content.productDetails.title}</h2><p>{content.productDetails.description}</p></div>
          <div className="kp-product-grid">{content.productDetails.items.map(item => {
            const ProductIcon = productDetailIcons[item.id];
            return <article className={`kp-product-card kp-product-${item.id}`} key={item.id}><span className="kp-product-icon" aria-hidden="true"><ProductIcon />{item.id === "gpu" && <ShieldCheck className="kp-product-shield" />}</span><h3>{item.title}</h3><p>{item.description}</p></article>;
          })}</div>
          <div className="kp-product-contact"><p>{content.productDetails.note}</p><a className="kp-button kp-button-dark" href={content.contactHref} data-analytics-contact="true">{content.productDetails.cta}<ArrowRight aria-hidden="true" /></a></div>
        </div>
      </section>
      <section className="kp-use-cases kp-container kp-motion-zone" id="use-cases"><div className="kp-section-title"><h2>現場がちがっても、<br />電話の負担は減らせる。</h2><p>こんな場面で使えます。<span className="kp-inline-note">※利用イメージ</span></p></div>
        <div className="kp-case-grid kp-case-scene-grid">{content.useCases.items.map((item, index) => <article className={`kp-case-card kp-case-card-scene kp-case-${item.color}`} key={item.title}>
          <h3>{item.title}</h3><div className="kp-case-scene-stage"><KotoportUseCaseScene kind={useCaseScenes[index]} /></div>
          <dl className="kp-case-responsibilities"><div><dt><Headphones aria-hidden="true" />AIが受け持つこと</dt><dd>{item.request}</dd></div><div><dt><UserRound aria-hidden="true" />担当者へ引き継ぐこと</dt><dd>{item.human}</dd></div></dl>
        </article>)}</div><p className="kp-case-note">{content.useCases.note}</p>
      </section>
      <KnowledgeContinuity />
      <KotoportEffectSimulator />
      <section className="kp-pricing kp-container" id="pricing" aria-labelledby="kp-pricing-title">
        <span id="kotoport-pricing" className="kp-anchor-alias" aria-hidden="true" />
        <div className="kp-section-title"><h2 id="kp-pricing-title">電話の量で、<br className="kp-mobile-break" />選べる2プラン。</h2><p>{content.pricing.description}</p></div>
        <p className="kp-pricing-qualification">{content.pricing.qualification}</p>
        <div className="kp-plan-grid">{content.pricing.plans.map((plan, index) => <article className="kp-plan-card" key={plan.id}>
          <span className="kp-plan-label">{index === 0 ? "一つの電話業務から" : "同じ業務で、電話が多いときに"}</span><h3>{plan.name}</h3>
          <p className="kp-plan-base-label">月額基本料</p>
          <div className="kp-plan-amount"><strong>{plan.monthlyFeeYen.toLocaleString("ja-JP")}</strong><span>円／月・税別</span></div>
          <p className="kp-plan-usage"><strong>＋ 従量料金</strong><span>含む{plan.includedMinutes.toLocaleString("ja-JP")}分を超えた分：<b>{plan.overageYenPerMinute.toLocaleString("ja-JP")}円／分</b></span></p>
          <dl><div><dt>初期費用</dt><dd>{plan.initialFeeYen.toLocaleString("ja-JP")}円</dd></div><div><dt>基本料に含むAI通話</dt><dd>{plan.includedMinutes}分／月</dd></div></dl>
          <a className="kp-button kp-button-dark" href={content.contactHref} data-analytics-contact="true">このプランを相談する<ArrowRight aria-hidden="true" /></a>
        </article>)}</div>
        <PricingExample />
        <p className="kp-pricing-note">{content.pricing.selectionDetails}</p>
        <details className="kp-calculator-disclosure"><summary><span>月の通話で料金を計算する</span><span className="kp-disclosure-plus" aria-hidden="true">+</span></summary><PricingCalculator /><p className="kp-small">{content.pricing.communicationNote}</p><p className="kp-small">{content.pricing.calculator.roundingNote}</p></details>
        <details className="kp-calculator-disclosure"><summary><span>人数・勤務時間を変える場合の比較</span><span className="kp-disclosure-plus" aria-hidden="true">+</span></summary><div className="kp-economics-review"><h3>{content.economics.reviewTitle}</h3><p>{content.economics.reviewNote}</p></div><EconomicsCalculator /></details>
        <details className="kp-calculator-disclosure"><summary><span>含む範囲・追加費用を見る</span><span className="kp-disclosure-plus" aria-hidden="true">+</span></summary><div className="kp-scope-grid"><div><h3>{content.scope.includedTitle}</h3>{content.scope.included.map(item => <div key={item.title}><h4>{item.title}</h4><p>{item.description}</p></div>)}</div><div><h3>{content.scope.additionalTitle}</h3>{content.scope.additional.map(item => <div key={item.title}><h4>{item.title}</h4><p>{item.description}</p></div>)}</div></div><p className="kp-small">{content.pricing.supportNote}</p></details>
      </section>
      <section className="kp-faq kp-container" aria-labelledby="kp-faq-title"><h2 id="kp-faq-title">よくある質問</h2><div>{content.faq.items.map(item => <details key={item.question}><summary><span className="kp-faq-q">Q.</span><span>{item.question}</span><span className="kp-disclosure-plus" aria-hidden="true">+</span></summary><p><span className="kp-faq-a">A.</span>{item.answer}</p></details>)}</div></section>
      <section className="kp-closing kp-motion-zone" aria-labelledby="kp-closing-title"><h2 id="kp-closing-title">電話に使う時間を、<br className="kp-mobile-break" />本来の仕事へ。</h2><p>まずは、負担になっている電話業務を一つ。</p><Actions large /><KotoportWaveRibbon variant="closing" /><span className="kp-halftone kp-halftone-closing" aria-hidden="true" /><div className="kp-closing-art" aria-hidden="true"><KotoportAvatar color="yellow" /><div className="kp-closing-message"><Headphones /><span>受付はAIへ。<br />判断は、人へ。</span></div><KotoportAvatar color="green" /></div></section>
    </main>
    <footer className="kp-footer kp-container"><div><Brand /><p>業務に合わせたAI電話の導入・運用支援</p><p className="kp-footer-provider">エンジニアチームCRUD5th</p></div><nav aria-label="フッターリンク"><a href="/">CRUD5thホーム<ArrowRight aria-hidden="true" /></a><a href={content.contactHref} data-analytics-contact="true">お問い合わせ<ArrowRight aria-hidden="true" /></a><a href="/privacy-policy">プライバシーポリシー</a><a href="/information-security">情報セキュリティ方針</a></nav><div className="kp-footer-bottom"><a href="mailto:crud5th@crud5th.com">crud5th@crud5th.com</a><span>© CRUD5th</span><a href="#kotoport-top">ページの先頭へ ↑</a></div></footer>
  </div>;
}

export default function Kotoport() {
  return <KotoportMotionProvider><KotoportPage /></KotoportMotionProvider>;
}
