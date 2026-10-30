import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { KotoportPlushLineup, type AvatarMode } from "./kotoport-avatar";
import { KotoportVoiceDemo } from "./kotoport-voice-demo";
import { useKotoportVoiceDemo } from "./use-kotoport-voice-demo";
import "./kotoport-avatars.css";

type KotoportAvatarStageProps = {
  paused?: boolean;
  isDemoOpen: boolean;
  onDemoClose: () => void;
  isDemoAuthorized: boolean;
  canUseDemo: () => boolean;
  onDemoUnauthorized: () => void;
};

export function KotoportAvatarStage({ paused = false, isDemoOpen, onDemoClose, isDemoAuthorized, canUseDemo, onDemoUnauthorized }: KotoportAvatarStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [canAnimate, setCanAnimate] = useState(true);
  const updateLevel = useCallback((level: number) => {
    stageRef.current?.style.setProperty("--kp-avatar-level", level.toFixed(3));
  }, []);
  const demo = useKotoportVoiceDemo(updateLevel, onDemoUnauthorized);
  const startDemo = useCallback(async () => {
    if (isDemoOpen && canUseDemo()) await demo.start();
  }, [isDemoOpen, canUseDemo, demo.start]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isDemoOpen || !isDemoAuthorized) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      demo.stop();
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [isDemoOpen, isDemoAuthorized, demo.stop]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isOnscreen = true;
    const updateMotion = () => setCanAnimate(!query.matches && !document.hidden && isOnscreen);
    const observer = new IntersectionObserver(([entry]) => {
      isOnscreen = entry.isIntersecting;
      updateMotion();
    }, { threshold: 0.05 });
    if (stageRef.current) observer.observe(stageRef.current);
    query.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    updateMotion();
    return () => {
      observer.disconnect();
      query.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);

  const isMoving = !paused && canAnimate;
  const mode: AvatarMode = demo.phase === "connecting" || demo.phase === "thinking"
    ? "thinking" : demo.phase === "speaking" ? "speaking" : demo.phase === "listening" ? "listening" : "walking";

  return <div className="kp-avatar-stage" ref={stageRef} data-running={isMoving} data-mode={mode} data-conversation={demo.phase}>
    <KotoportPlushLineup mode={mode} paused={!isMoving} />
    {isDemoAuthorized && <dialog id="kp-voice-demo-dialog" className="kp-voice-dialog" ref={dialogRef} aria-labelledby="kp-voice-demo-title" onCancel={event => { event.preventDefault(); onDemoClose(); }} onClose={() => { if (!dialogRef.current?.open) onDemoClose(); }}>
      <button type="button" className="kp-voice-dialog-close" aria-label="音声デモを閉じる" onClick={onDemoClose}><X aria-hidden="true" /></button>
      <KotoportVoiceDemo {...demo} start={startDemo} />
    </dialog>}
  </div>;
}
