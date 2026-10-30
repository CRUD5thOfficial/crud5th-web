import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const MotionContext = createContext({ isPaused: false, isReduced: false, isDocumentVisible: true });

export function KotoportMotionProvider({ children }: { children: ReactNode }) {
  const [isReduced, setIsReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReduced = () => setIsReduced(query.matches);
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    query.addEventListener("change", updateReduced);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      query.removeEventListener("change", updateReduced);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  return <MotionContext.Provider value={{ isPaused: false, isReduced, isDocumentVisible }}>
    {children}
  </MotionContext.Provider>;
}

export function useKotoportMotion() {
  return useContext(MotionContext);
}

export function useMotionVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isOnscreen, setIsOnscreen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsOnscreen(entry.isIntersecting), { threshold: 0.05 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isOnscreen };
}

export function useMotionZones(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const zones = ref.current?.querySelectorAll<HTMLElement>(".kp-motion-zone");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.target instanceof HTMLElement) entry.target.dataset.motionOnscreen = String(entry.isIntersecting);
    }), { threshold: 0.02 });
    zones?.forEach(zone => {
      zone.dataset.motionOnscreen = "false";
      observer.observe(zone);
    });
    return () => observer.disconnect();
  }, [ref]);
}

type ConversationPhase = { kind: "listening" | "typing" | "reply" | "hold" | "reset"; row: number; durationMs: number };

export function useConversationPlayback(texts: string[], isOnscreen: boolean, conversationKey: string) {
  const { isPaused, isReduced, isDocumentVisible } = useKotoportMotion();
  const [step, setStep] = useState(0);
  const phases: ConversationPhase[] = texts.flatMap((text, row) => [
    { kind: "listening", row, durationMs: row === 0 ? 1100 : 550 },
    { kind: "typing", row, durationMs: 1000 },
    { kind: "reply", row, durationMs: 2400 + text.length * 18 },
  ]);
  phases.push({ kind: "hold", row: texts.length, durationMs: 4800 }, { kind: "reset", row: -1, durationMs: 500 });
  const phase = phases[step % phases.length];
  const canAnimate = !isPaused && !isReduced && isDocumentVisible && isOnscreen;
  useEffect(() => setStep(0), [conversationKey]);
  useEffect(() => {
    if (!canAnimate) return;
    const timeout = window.setTimeout(() => setStep(current => (current + 1) % phases.length), phase.durationMs);
    return () => window.clearTimeout(timeout);
  }, [canAnimate, step, phase.durationMs, phases.length]);
  return { phase, canAnimate, showFullConversation: isPaused || isReduced };
}

export function KotoportWaveRibbon({ variant }: { variant: "hero" | "closing" }) {
  const isHero = variant === "hero";
  return <svg className={`kp-${variant}-wave kp-wave-ribbon`} viewBox={`0 0 1440 ${isHero ? 300 : 450}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {isHero ? <>
      <g className="kp-wave-layer kp-wave-layer-back"><path d="M-200 130C50 40 180 230 420 140S750 0 990 120 1310 230 1640 80V350H-200Z" fill="#dce3ff" /></g>
      <g className="kp-wave-layer kp-wave-layer-middle"><path d="M-200 200C30 280 240 30 470 90S850 250 1090 130 1430 50 1640 190V350H-200Z" fill="#d1e9ff" /></g>
      <g className="kp-wave-layer kp-wave-layer-front"><path d="M-200 190C-40 250 160 150 300 90S540 250 720 142 900 20 1080 120 1390 250 1640 120V350H-200Z" fill="white" /></g>
    </> : <>
      <g className="kp-wave-layer kp-wave-layer-back"><path d="M-200 150C80 -30 280 10 520 120S1000 260 1640 20V260C1200 480 960 350 710 250S200 130-200 340Z" fill="#64b7ff" /></g>
      <g className="kp-wave-layer kp-wave-layer-middle"><path d="M-200 95C80 30 320-10 590 130S1100 270 1640 65V330C1230 470 920 390 670 260S200 190-200 365Z" fill="#c4a5ff" /></g>
      <g className="kp-wave-layer kp-wave-layer-front"><path d="M-200 230C20 90 250 0 500 90S960 310 1640 90V370C1240 520 900 400 660 290S210 170-200 430Z" fill="#7d3bff" /></g>
    </>}
  </svg>;
}
