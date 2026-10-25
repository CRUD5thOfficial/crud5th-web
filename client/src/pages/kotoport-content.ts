export interface KotoportPlan {
  id: string;
  name: string;
  initialFeeYen: number;
  monthlyFeeYen: number;
  includedMinutes: number;
  overageYenPerMinute: number;
  supportHours: number;
  onboardingHours: number;
  locationCount: number;
  scopeSummary: string;
}

const plans: KotoportPlan[] = [
  { id: "small", name: "スモール", initialFeeYen: 30000, monthlyFeeYen: 19800, includedMinutes: 100, overageYenPerMinute: 55, supportHours: 0.5, onboardingHours: 4, locationCount: 1, scopeSummary: "一つの電話業務から。" },
  { id: "medium", name: "スタンダード", initialFeeYen: 50000, monthlyFeeYen: 30000, includedMinutes: 300, overageYenPerMinute: 35, supportHours: 1, onboardingHours: 8, locationCount: 3, scopeSummary: "同じ業務で、電話が多いときに。" },
];

const [smallPlan, mediumPlan] = plans;
const regularMonthCrossoverMinutes = smallPlan.includedMinutes + (mediumPlan.monthlyFeeYen - smallPlan.monthlyFeeYen) / smallPlan.overageYenPerMinute;
const firstMonthCrossoverMinutes = (
  mediumPlan.initialFeeYen - smallPlan.initialFeeYen + mediumPlan.monthlyFeeYen - smallPlan.monthlyFeeYen
  + smallPlan.includedMinutes * smallPlan.overageYenPerMinute - mediumPlan.includedMinutes * mediumPlan.overageYenPerMinute
) / (smallPlan.overageYenPerMinute - mediumPlan.overageYenPerMinute);
const referenceMinutesThreshold = 3000;

export const kotoportContent = {
  name: "コトポート",
  englishName: "Kotoport",
  provider: "エンジニアチームCRUD5th",
  route: "/services/kotoport",
  contactHref: "/#contact",
  meta: {
    title: "コトポート | 業務に合わせたAI電話の導入・運用支援 | CRUD5th",
    description: "電話対応をAIへ。人は、本来の仕事へ。受電の一次受付から、予定・状況を確かめる発信まで。御社の業務に合うAI電話を、応対の設計から導入・運用までCRUD5thが支援します。",
  },
  navigation: {
    home: "CRUD5thホームへ",
    skip: "本文へ移動",
    uses: "できること",
    approach: "使いやすい理由",
    pricing: "料金",
    process: "はじめ方",
    contact: "導入を相談する",
    back: "ページの先頭へ",
  },
  homeEntry: {
    label: "AI電話の導入・運用支援",
    title: "AI電話「コトポート」",
    description: "受付・案内・確認の電話を、御社に合うAIへ。応対の設計から導入・改善まで支援します。",
    link: "サービスを見る",
  },
  hero: {
    title: ["電話対応をAIへ。", "人は、本来の仕事へ。"],
    description: "御社に合うAI電話を、CRUD5thがつくり、支えます。",
    conversationCaption: "会話のイメージ",
    conversation: ["予約について相談したいです。", "ご希望をお聞きして、担当者へお伝えします。"],
    conversationNote: "判断が必要なら、要点を人へ。",
    diagram: { center: "AI電話", brand: "コトポート", caption: "AI電話の流れ", inbound: "受ける電話", outbound: "かける電話", summary: "用件をまとめる", handoff: "判断が必要なら、人へ" },
  },
  value: {
    title: "電話のたびに、\n手が止まっていませんか。",
    burdens: ["電話を待つ", "同じ説明が続く", "作業を止める"],
    outcome: "受付はAIへ。判断は、人へ。",
  },
  economics: {
    title: "人の時間と費用を、\n比べる。",
    inputs: {
      dailyMinutes: { label: "1日の通話時間", unit: "分／日", defaultValue: 500, min: 0, max: 100000, step: "any", integer: false },
      aiCoveragePercent: { label: "AIに任せる通話時間の割合", unit: "%", defaultValue: 80, min: 0, max: 100, step: "any", integer: false },
      hourlyWageYen: { label: "時給", unit: "円／時間", defaultValue: 1500, min: 1, max: 100000, step: "any", integer: false },
      remainingOperators: { label: "導入後の人数", unit: "人", defaultValue: 2, min: 0, max: 1000, step: "1", integer: true },
      currentOperators: { label: "現在配置する人数", unit: "人", defaultValue: 10, min: 0, max: 1000, step: "1", integer: true },
      hoursPerDay: { label: "1人の1日の有給勤務時間", unit: "時間／日", defaultValue: 8, min: 0.1, max: 24, step: "any", integer: false },
      daysPerMonth: { label: "月の稼働日数", unit: "日／月", defaultValue: 20, min: 1, max: 31, step: "1", integer: true },
      averageCallMinutes: { label: "AI通話の平均時間", unit: "分／件", defaultValue: 3, min: 0.1, max: 120, step: "any", integer: false },
    },
    defaultPlanId: "medium",
    planLabel: "比較するプラン",
    planHelp: "料金欄の月額基本料と超過AI利用料を使った試算です。提供容量は導入前に確認します。",
    detailsLabel: "人数・勤務時間などを変える",
    inputError: "表示の範囲内で入力してください。人数・日数は整数です。",
    emptyMessage: "すべての項目を入力すると、比較結果を表示します。",
    invalidMessage: "入力を確認してください。結果は表示していません。詳細の前提も確認できます。",
    assumption: "初期値の2人は仮の人数です。AIの通話時間と、人に残る仕事は別に考えます。",
    exclusionsNote: "社会保険・税・通信費、初期費・接続費や人の確認作業は別です。実際の削減額ではありません。",
    source: {
      label: "時給の参考：スタンバイ「コールセンター」求人統計",
      url: "https://jp.stanby.com/stats/occupation/%E3%82%B3%E3%83%BC%E3%83%AB%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC",
      description: "2026年9月・全国アルバイト／パートの募集時給平均1,512円（2026年10月2日更新）。実際の給与や企業の総費用とは異なります。時給の初期値1,500円は丸めた仮定です。御社の実際の時給へ変更できます。",
    },
    beforeLabel: "いまの給与相当",
    afterLabel: "給与相当＋AI料金",
    wageLabel: "人の給与相当",
    aiLabel: "AI料金の小計（税別）",
    monthlyUnit: "／月",
    differenceLabel: "この例での差額",
    increaseLabel: "条件に基づく費用増",
    equalLabel: "比較する小計は同額",
    breakdownLabel: "内訳と条件を見る",
    noStaffingChange: "人数が同じなら、給与は減らずAI料金が加わります。",
    volumeTitle: "電話量だけを変えて比べる",
    volumeNote: "上の稼働日数・AI割合・プランを使い、1日の通話時間だけを変更。配置人数は予測せず、AI料金と費用をまかなうための勤務時間を比較します。",
    volumeDailyMinutes: [300, 500, 1000],
    caveats: [
      "差額は給与相当とAI料金小計の比較です。社会保険の会社負担、採用・教育・管理、税、回線・通信費、初期費・接続費、人の追加確認・監修・運用費を含みません。総支出の削減保証ではありません。",
      "配置時間から通話時間を引いた残りは、すべて無駄な待機ではありません。他業務、研修、後処理、休憩交代、ピークに備える余力を確認し、減らせる有給勤務枠を別途検証します。",
      "AIには待機の時給はありませんが、通話0分でも月額基本料がかかる条件です。人へ残る確認・クレームの判断や解決も、導入後の仕事に含めます。",
    ],
  },
  uses: {
    title: "受ける電話も、かける電話も。",
    selectorLabel: "電話業務を選択",
    exampleLabel: "業務の流れの例",
    note: "使う範囲と、人への渡し方を一緒に決めます。",
    directions: {
      inbound: {
        label: "受ける電話", summary: "お客様からの電話",
        title: "用件を聞いて、担当者へ。",
        examples: ["問い合わせの受付", "営業時間の案内", "予約・折返しの希望"],
        source: "お客様", destination: "担当者", firstAction: "用件を話す", aiAction: "聞く・確かめる", secondAction: "要点を渡す", humanAction: "次を決める",
        preparation: "営業時間、案内資料、聞く項目、担当者を共有ください。",
        handoff: "用件や希望をまとめて渡します。転送・通知の方法は、今の環境を確かめて決めます。",
        exception: "契約や金額、緊急の用件、資料だけでは答えられない話は、人が対応します。",
      },
      outbound: {
        label: "かける電話", summary: "こちらからの電話",
        title: "返事を集めて、管理者へ。",
        examples: ["出勤予定を聞く", "応援できるか聞く", "現場の返事をまとめる"],
        source: "現場・スタッフ", destination: "管理者", firstAction: "質問・返答", aiAction: "聞く・確かめる", secondAction: "返事を渡す", humanAction: "次を決める",
        preparation: "連絡先、電話してよい相手・時間、聞くこと、返事の期限を共有ください。連絡先の利用条件も確かめます。",
        handoff: "返事あり・不明・つながらない相手を分けて渡します。かけ直す回数や留守電の扱いも先に決めます。",
        exception: "配置の決定や緊急の指示、大事な手続きは、人が対応します。",
      },
    },
    detailLabels: { preparation: "共有いただくもの", handoff: "人に渡すこと", exception: "人が決めること" },
    detailsLabel: "準備するもの・人に戻す場面",
    industryCaption: "警備・清掃・運送の確認にも。",
    industry: {
      description: "対象と質問を管理者が決め、AI電話が予定・可否を確認。集まった返答から、人が配置や追加対応を判断します。清掃・運送・建設設備など、現場が分かれる業務でもご相談いただけます。",
    },
  },
  approach: {
    title: "いつもの仕事に、\n合う電話を。",
    reasons: [{"title": "資料からつくる", "description": "FAQや資料から、応対をつくります。"}, {"title": "声まで確かめる", "description": "実際の電話で、声や返し方を確かめます。"}, {"title": "使いながら直す", "description": "情報が変われば、設定を直します。"}],
    setup: ["役割・対応範囲", "参照する業務知識", "判断・実行の権限", "話し方・トーン"],
    responsibilities: [
      { title: "AIに任せること", subtitle: "一次受付・案内・確認", items: ["問い合わせと希望の聞き取り", "共有された事実に基づく案内", "予定・状況の質問と返答の整理"] },
      { title: "人が判断すること", subtitle: "例外・確約・緊急対応", items: ["契約・金額の確定やクレーム解決", "配置決定・緊急時の指示", "根拠がない質問や重要な手続き"] },
    ],
    divisionLabels: ["AI：受付・案内・確認", "人：判断・約束・困りごとの対応"],
    roles: [{ title: "御社", description: "資料を共有" }, { title: "CRUD5th", description: "設定・調整・改善" }, { title: "御社", description: "内容を確認" }],
    detailsLabel: "応対をつくるときに決めること",
    setupDescription: "役割、使ってよい業務情報、判断の範囲、話し方を御社ごとに設定します。台詞をすべて書いたり、分岐を増やし続けたりする準備は不要です。",
    maintenance: "御社は、営業時間や担当者などの変更を共有。CRUD5thは設定を直し、版を管理して確認します。会話の品質、障害、使える通話量も確認しながら改善します。",
    responsibilityNote: "AIが扱う範囲と、人へ戻す条件を先に決めます。AIであることを偽らない案内も設計します。",
  },
  pricing: {
    title: "電話の量で、\n選べる2プラン。",
    description: "料金の目安（税別）",
    qualification: "月額・利用時間・超過単価は参考条件です。範囲と料金は見積りで決めます。",
    planSelection: "同じ設定で、一つの業務から。",
    plans,
    labels: { initial: "初期費用", monthly: "月額基本料", included: "含むAI通話", overage: "超過AI利用料", onboarding: "導入の作業枠", support: "通常の設定相談・変更支援", locations: "同じ設定を使う拠点" },
    feeUnit: "円／月", minuteUnit: "分／月", overageUnit: "円／分", hourUnit: "時間まで", supportUnit: "時間／月まで", locationUnit: "拠点まで",
    detailsLabel: "含む範囲・追加費用を見る",
    tableCaption: "各プランの作業枠・運用範囲の目安",
    supportNote: "通常の設定相談・変更支援と、CRUD5th側の不具合修正は分けて扱います。不具合修正を相談枠の消化で打ち切ったり、枠超過だけで自動請求したりしません。受付・対応時間とSLAは、導入前に書面で定めます。",
    communicationNote: "試算は月額基本料＋超過AI利用料の小計です。税・回線／通信費・接続／追加作業等は別途確認します。請求総額とは異なります。",
    selectionDetails: "従業員数で選ぶプランではありません。電話量、拠点ごとの設定、導入と変更の作業量を確認します。受電と発信の両方を使う場合も、範囲を伺って見積ります。",
    subtotalNote: "月額＋超過分の小計。税・通信・追加作業費は別です。",
    comparison: `通常月の料金式では、整数の月分数で${Math.ceil(regularMonthCrossoverMinutes).toLocaleString("ja-JP")}分以上ならスタンダードの小計が低くなります。初期費を含む初月は${firstMonthCrossoverMinutes.toLocaleString("ja-JP")}分で同額となり、それを超えるとスタンダードが低くなります。範囲の適合も合わせて選びます。`,
    calculator: {
      title: "月の通話で計算",
      description: "AIに任せる業務の月間通話時間を入力してください。受電・発信の両方を含む条件では、その合計を使います。",
      inputLabel: "月のAI通話時間", inputUnit: "分", defaultMinutes: 300, minMinutes: 0, maxMinutes: 100000, referenceMinutesThreshold,
      inputHelp: "件数ではなく分数を入力。小数も使えます。",
      emptyMessage: "月間の分数を入力すると、両プランの小計を表示します。", invalidMessage: "数値を入力してください。", rangeMessage: "入力できる分数の範囲で指定してください。",
      monthlyLabel: "通常月の小計", firstMonthLabel: "初月の小計", firstMonthFormula: "通常月の小計＋初期費用", overageLabel: "超過する時間",
      detailLabels: { base: "月額基本料", overage: "超過AI利用料", initial: "初期費用" }, detailsLabel: "内訳・初月の費用を見る",
      firstMonthNote: "初月も基本料を全月分加える比較用の仮定です。日割・請求開始日・課金の締め日は、契約前に書面でご案内します。",
      roundingNote: "小数入力時は計算額を小数第2位まで表示します。課金対象時間・端数処理・呼出中／発信不成立／留守電／再架電の扱いは契約前に定めます。",
      highUsageNote: `月${referenceMinutesThreshold.toLocaleString("ja-JP")}分超は参考計算です。通話量と条件は導入前に確かめます。`,
    },
  },
  scope: {
    includedTitle: "含む範囲としてご提案すること",
    included: [
      { title: "業務の整理と初期設定", description: "受付・確認項目、参照情報、話し方、人に戻す条件を整理し、設定へ反映します。" },
      { title: "応対の確認と修正", description: "合意した範囲で会話を確かめ、聞き方や参照情報を調整します。導入枠を超える場合は、着手前に範囲を見直します。" },
      { title: "日常の設定相談", description: "担当者・参照情報・受付項目などの変更を、月内の相談枠で扱います。繰越・超過の扱いも契約前にご案内します。" },
    ],
    additionalTitle: "追加見積になること",
    additional: [
      { title: "別の業務・窓口・個別設定", description: "異なる応対設定や個別開発など、合意した範囲を広げる作業。" },
      { title: "番号・外部システムとの接続", description: "既存番号・PBX・転送・CSV・APIなど、接続可否と作業量の確認が必要なもの。完成済みの標準連携としては含めません。" },
      { title: "相談枠を超える変更支援", description: "追加作業は、範囲と費用の見積りに合意いただいてから着手します。枠の超過だけで自動請求しません。" },
    ],
    humanTitle: "人の担当を決めておく判断",
    humanDescription: "契約・料金の確定、警備の配置決定や緊急指示、医療診断・薬の助言などはAIだけで扱いません。人の担当と連絡経路を先に定めます。",
  },
  onboarding: {
    title: "はじめるときも、\n使ってからも。",
    steps: [{"title": "聞く", "description": "困っている電話を教えてください。"}, {"title": "つくる", "description": "CRUD5thが応対をつくります。"}, {"title": "確かめる", "description": "御社と電話で確かめ、直します。"}, {"title": "使う・見直す", "description": "一部から始め、設定を見直します。"}],
    roleLabels: ["御社：資料の共有と、内容の確認", "CRUD5th：設定・調整・日々の改善"],
    detailsLabel: "準備するものと、始める前の確認",
    preparationTitle: "いまある資料からで大丈夫です。",
    preparationDescription: "FAQ、案内資料、通話例を共有ください。足りない内容は、お話を伺って整理します。",
    preparations: [
      { title: "電話業務と量", description: "受電・発信の目的、受付時間、月の件数とおおよその通話時間、困っている作業。" },
      { title: "伝えてよい情報", description: "営業時間・案内内容・質問項目・参照資料。連絡先を使う場合は利用目的、対象者への案内、渡してよい項目。" },
      { title: "人の担当と判断", description: "判断が必要な事項、確認できないときの対応、引継ぎ先、結果を確認する担当者。" },
      { title: "電話と記録の条件", description: "電話番号・接続方法、通話・記録の取扱条件、会話確認に参加する方。接続は可否を確認して定めます。" },
    ],
    responsibilities: [
      { title: "御社", description: "業務情報の共有・監修、例外や契約・配置・緊急時の判断、開始の承認。導入後も事実と担当者の変更を共有いただきます。" },
      { title: "CRUD5th", description: "応対の設計・設定・修正・再確認。導入後の会話品質・障害・容量と、設定の版管理・改善を担当します。" },
    ],
    acceptanceNote: "声質・間・相づち・割込み・発音、応答時間、事実にない回答や処理の完了案内がないこと、接続・引継ぎを確認します。同時通話数・上限超過時の対応も実環境で確かめ、合格基準と提供容量を合意します。条件を満たさない場合は修正・再確認し、範囲の見直しや開始時期を調整します。応答時間・SLAは測定条件・対象・除外・運用と合わせて書面で定めます。",
    timelineNote: "接続と応対を確かめ、開始日を決めます。",
  },
  faq: {
    title: "気になること",
    items: [{"question": "どんな電話に使えますか？", "answer": "受付・案内・予定や状況の確認など、一つの業務から相談できます。AIに任せることと、人が決めることを先に整理します。"}, {"question": "2つのプランの違いは？", "answer": "従業員数ではなく、電話量・設定・作業量で選びます。両方向の電話や別の業務を扱う場合も、範囲を伺って見積ります。"}, {"question": "つながらない電話の料金は？", "answer": "呼出中、つながらない電話、留守電、かけ直しを含めるかは契約前に書面で示します。課金時間や端数も先に決めます。"}, {"question": "今の番号は使えますか？", "answer": "今の番号や設備、必要な連携を伺い、可否・方法・費用を案内します。どの番号やシステムでも使えるという前提ではありません。"}, {"question": "録音や個人情報は？", "answer": "録音するか、何をどこにいつまで保存するか、誰が見られるか、削除方法、外部サービスに渡る範囲を導入前に文書で決めます。連絡先や会話内容は合意後にお預かりします。"}, {"question": "契約・解約の条件は？", "answer": "契約期間、解約期限、支払方法・請求日、日割、開始月と終了月の扱いを契約前に書面で案内します。"}, {"question": "変更や不具合のときは？", "answer": "変更支援と不具合修正は分けて扱います。追加作業は見積りと合意後に着手し、枠の超過だけで自動請求しません。不具合修正を相談枠で打ち切らず、対応条件も導入前に決めます。"}, {"question": "いつから使えますか？", "answer": "業務と接続方法、資料の状況を伺って案内します。実際の電話を御社と確かめ、合意した業務・時間帯から始めます。"}],
  },
  consultation: {
    title: "電話のこと、\nまずはご相談を。",
    description: "任せたい電話と、費用のこと。",
    providerDescription: "使い始めたあとも支えます。",
    contactNote: "お問い合わせフォームへ",
    startingPoints: ["任せたい電話", "件数と時間帯", "人に残す仕事"],
    signature: [
      "CRUD5th", "髙橋綱弥", "メール：crud5th@crud5th.com", "電話番号：09094238717", "住所：〒106-0032 東京都港区六本木7-17-12-513", "ホームページ：https://crud5th.netlify.app/",
    ],
  },
};

export type CallDirection = keyof typeof kotoportContent.uses.directions;
