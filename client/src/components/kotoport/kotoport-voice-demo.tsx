import { useEffect, useRef } from "react";
import { ArrowUpRight, Mic, PhoneOff, RotateCcw } from "lucide-react";
import type { VoiceDemoPhase, VoiceDemoTurn } from "./use-kotoport-voice-demo";
import "./kotoport-voice-demo.css";

type KotoportVoiceDemoProps = {
  phase: VoiceDemoPhase;
  status: string;
  turns: VoiceDemoTurn[];
  start: () => Promise<void>;
  stop: () => void;
};

const phaseLabels: Record<VoiceDemoPhase, string> = {
  idle: "音声デモ", connecting: "接続中", listening: "聞いています", thinking: "考えています", speaking: "話しています", error: "接続を確認してください",
};

export function KotoportVoiceDemo({ phase, status, turns, start, stop }: KotoportVoiceDemoProps) {
  const isActive = phase !== "idle" && phase !== "error";
  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [turns]);
  return <section className="kp-voice-demo" aria-labelledby="kp-voice-demo-title" data-phase={phase}>
    <div className="kp-voice-demo-heading">
      <div><span className="kp-voice-demo-eyebrow">TRY KOTOPORT</span><h2 id="kp-voice-demo-title">コトポートと話してみる</h2></div>
      <span className="kp-voice-demo-phase"><span aria-hidden="true" />{phaseLabels[phase]}</span>
    </div>
    <p className="kp-voice-demo-intro">電話の一次受付を、マイクで体験。<br className="kp-voice-demo-mobile-break" />サービスや活用方法について話しかけてください。</p>
    {turns.length > 0 && <div className="kp-voice-demo-transcript" ref={transcriptRef} role="log" aria-label="会話の内容" aria-live="off" tabIndex={0}>
      {turns.map((turn, index) => <div className={`kp-voice-demo-turn kp-voice-demo-turn-${turn.role}`} key={`${index}-${turn.text}`}>
        <span className="kp-voice-demo-speaker">{turn.role === "user" ? "あなた" : "コトポート"}</span><p>{turn.text}</p>
      </div>)}
    </div>}
    <div className="kp-voice-demo-footer">
      <p className="kp-voice-demo-status" role="status" aria-atomic="true">{status}</p>
      <button type="button" className="kp-voice-demo-button" onClick={isActive ? stop : () => void start()}>
        {isActive ? <PhoneOff aria-hidden="true" /> : phase === "error" ? <RotateCcw aria-hidden="true" /> : <Mic aria-hidden="true" />}
        {isActive ? "会話を終了" : phase === "error" ? "もう一度はじめる" : "会話をはじめる"}
        {!isActive && phase !== "error" && <ArrowUpRight aria-hidden="true" />}
      </button>
    </div>
  </section>;
}
