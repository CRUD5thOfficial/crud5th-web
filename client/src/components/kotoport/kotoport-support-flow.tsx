import { ArrowRight, Check, FileText, Headphones } from "lucide-react";
import "./kotoport-support-flow.css";

type MaintenanceStep = {
  owner: string;
  title: string;
  description: string;
};

type SupportFlowProps = {
  maintenanceDescription: string;
  maintenanceSteps: readonly MaintenanceStep[];
  maintenanceScopeNote: string;
};

function UpdateIllustration({ step }: { step: number }) {
  return <svg className={`kp-support-illustration kp-support-illustration-${step}`} viewBox="0 0 144 92" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="72" cy="82" rx="55" ry="6" fill="#ede8f0" />
    {step === 0 && <>
      <rect x="27" y="21" width="55" height="56" rx="7" fill="#efe6ff" stroke="#bba2df" strokeWidth="2" transform="rotate(-8 27 21)" />
      <g className="kp-support-paper">
        <rect x="48" y="12" width="56" height="66" rx="8" fill="white" stroke="#73529b" strokeWidth="2" />
        <rect x="59" y="24" width="34" height="6" rx="3" fill="#e6d6ff" />
        <path d="M60 42h31M60 51h23M60 60h16" stroke="#b5a3ca" strokeWidth="3" strokeLinecap="round" />
        <path d="m97 54 15 8-15 8M87 62h24" stroke="#7d3bff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>}
    {step === 1 && <>
      <rect x="27" y="13" width="90" height="57" rx="8" fill="white" stroke="#5d789d" strokeWidth="2" />
      <path d="M28 26h88" stroke="#d5e2f4" strokeWidth="2" />
      <circle cx="36" cy="20" r="2" fill="#bdcff0" /><circle cx="43" cy="20" r="2" fill="#bdcff0" />
      <rect x="38" y="35" width="25" height="22" rx="4" fill="#e5efff" />
      <path d="M44 42h13M44 49h8M73 38h30M73 47h21" stroke="#7d9fcf" strokeWidth="3" strokeLinecap="round" />
      <path d="M65 70v8M79 70v8M55 79h34" stroke="#5d789d" strokeWidth="3" strokeLinecap="round" />
      <g className="kp-support-setting-check"><circle cx="104" cy="62" r="15" fill="#c9f4e8" stroke="#168367" strokeWidth="2" /><path d="m97 62 5 5 9-11" stroke="#168367" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
    </>}
    {step === 2 && <>
      <rect x="46" y="10" width="46" height="70" rx="10" fill="white" stroke="#46836f" strokeWidth="2" />
      <path d="M60 17h18M65 73h8" stroke="#b1dacc" strokeWidth="3" strokeLinecap="round" />
      <rect x="53" y="27" width="32" height="34" rx="7" fill="#dcf7eb" />
      <path d="m62 36-3 4c1 8 5 12 12 14l4-4-5-5-3 2-4-5 2-2-3-4Z" fill="#46836f" />
      <g className="kp-support-call-check"><path d="M93 28h22a7 7 0 0 1 7 7v15a7 7 0 0 1-7 7h-13l-10 7V35a7 7 0 0 1 1-7Z" fill="#fff1bd" stroke="#ad8b24" strokeWidth="2" /><path d="m101 42 5 5 9-10" stroke="#876819" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
      <path className="kp-support-call-ring" d="M35 34c-5 6-5 16 0 22M28 30c-7 9-7 22 0 30" stroke="#81b8a6" strokeWidth="2" strokeLinecap="round" />
    </>}
  </svg>;
}

export function KotoportSupportFlow({ maintenanceDescription, maintenanceSteps, maintenanceScopeNote }: SupportFlowProps) {
  return <div className="kp-support-flow">
    <section className="kp-support-roles" aria-labelledby="kp-support-roles-title">
      <h3 id="kp-support-roles-title">導入・運用の役割</h3>
      <div className="kp-support-role-grid">
        <article className="kp-support-role kp-support-role-client">
          <span className="kp-support-role-owner"><FileText aria-hidden="true" />御社</span>
          <h4>資料を共有・内容を確認</h4>
          <p>いまある資料を共有し、応対の内容を確認します。</p>
        </article>
        <article className="kp-support-role kp-support-role-team">
          <span className="kp-support-role-owner"><Headphones aria-hidden="true" />CRUD5th</span>
          <h4>設定・調整・日々の改善</h4>
          <p>業務に合わせて応対をつくり、使いながら見直します。</p>
        </article>
      </div>
    </section>
    <div className="kp-support-start-bar"><Check aria-hidden="true" /><p><strong>確認してから、スタート。</strong><span>接続と応対を確かめ、合意した業務・時間帯から始めます。</span></p></div>
    <section className="kp-support-updates" aria-labelledby="kp-maintenance-title">
      <div className="kp-support-update-heading">
        <div><span className="kp-support-eyebrow">導入後の更新</span><h3 id="kp-maintenance-title">使い始めたあとも、<br className="kp-support-heading-break" />変更に合わせて更新。</h3><p>{maintenanceDescription}</p></div>
        <div className="kp-support-change-example"><span>例：営業時間を変更</span><div><span>18:00まで</span><ArrowRight aria-hidden="true" /><strong>17:00まで</strong></div></div>
      </div>
      <ol className="kp-support-update-steps">{maintenanceSteps.map((step, index) => <li className="kp-support-update-step kp-motion-zone" key={step.title}>
        <div className="kp-support-step-visual" aria-hidden="true"><span>0{index + 1}</span><UpdateIllustration step={index} /></div>
        <span className="kp-support-step-owner">{step.owner}</span><h4>{step.title}</h4><p>{step.description}</p>
        {index < maintenanceSteps.length - 1 && <span className="kp-support-connector" aria-hidden="true"><ArrowRight /></span>}
      </li>)}</ol>
      <p className="kp-support-scope-note">{maintenanceScopeNote}</p>
    </section>
  </div>;
}
