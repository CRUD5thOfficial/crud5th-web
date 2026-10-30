import { Check, Code2, Headphones, Phone, RefreshCw, Settings2 } from "lucide-react";
import { KotoportAvatar } from "./kotoport-avatar";
import "./kotoport-onboarding-scene.css";

export type OnboardingSceneKind = "listen" | "build" | "test" | "improve";

function SceneWave({ className = "" }: { className?: string }) {
  return <span className={`kp-onboarding-wave ${className}`}><i /><i /><i /><i /><i /></span>;
}

function ListenScene() {
  return <>
    <div className="kp-onboarding-character"><KotoportAvatar color="yellow" /></div>
    <div className="kp-onboarding-consultation"><span className="kp-onboarding-quote">“</span><SceneWave /></div>
    <span className="kp-onboarding-listen-link" />
    <div className="kp-onboarding-notes"><span /><span /><span /><Check /></div>
    <span className="kp-onboarding-listen-mark"><Headphones /></span>
  </>;
}

function BuildScene() {
  return <>
    <div className="kp-onboarding-character"><KotoportAvatar color="coral" /></div>
    <div className="kp-onboarding-laptop">
      <div className="kp-onboarding-editor"><span className="kp-onboarding-window-dots"><i /><i /><i /></span><Code2 /><div className="kp-onboarding-code"><span /><span /><span /><i className="kp-onboarding-cursor" /></div></div>
      <span className="kp-onboarding-laptop-base" />
    </div>
    <span className="kp-onboarding-setting"><Settings2 /></span>
    <span className="kp-onboarding-connection"><i /><i /><i /></span>
  </>;
}

function TestScene() {
  return <>
    <div className="kp-onboarding-character"><KotoportAvatar color="blue" /></div>
    <div className="kp-onboarding-phone"><span /><Phone /><i /></div>
    <div className="kp-onboarding-test-bubble kp-onboarding-test-question"><SceneWave /></div>
    <div className="kp-onboarding-test-bubble kp-onboarding-test-answer"><SceneWave /></div>
    <span className="kp-onboarding-test-check"><Check /></span>
  </>;
}

function ImproveScene() {
  return <>
    <div className="kp-onboarding-character"><KotoportAvatar color="green" /></div>
    <div className="kp-onboarding-dashboard"><span className="kp-onboarding-window-dots"><i /><i /><i /></span><div className="kp-onboarding-chart"><i /><i /><i /><span /></div><div className="kp-onboarding-response"><Check /><span /><span /></div></div>
    <span className="kp-onboarding-improvement"><RefreshCw /></span>
    <span className="kp-onboarding-review-link"><i /><i /><i /></span>
  </>;
}

const scenes = { listen: ListenScene, build: BuildScene, test: TestScene, improve: ImproveScene };

export function KotoportOnboardingScene({ kind }: { kind: OnboardingSceneKind }) {
  const Scene = scenes[kind];
  return <div className={`kp-onboarding-scene kp-onboarding-${kind} kp-motion-zone`} data-onboarding-scene={kind} aria-hidden="true"><span className="kp-onboarding-backdrop" /><span className="kp-onboarding-ground" /><Scene /></div>;
}
