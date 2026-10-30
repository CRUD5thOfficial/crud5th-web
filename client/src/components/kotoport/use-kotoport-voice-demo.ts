import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceDemoPhase = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";
export type VoiceDemoTurn = { role: "user" | "assistant"; text: string };
type ChatReply = { reply: string; state: Record<string, unknown>; done: boolean; error?: unknown };
type VoiceSession = {
  controller: AbortController;
  context: AudioContext;
  stream: MediaStream | null;
  microphoneSource: MediaStreamAudioSourceNode | null;
  recordingNode: ScriptProcessorNode | null;
  playbackSource: AudioBufferSourceNode | null;
  outputLevelTimer: number | null;
  timers: Set<number>;
  chunks: Float32Array[];
  sampleCount: number;
  state: Record<string, unknown> | null;
  removeListeners: (() => void) | null;
};

class VoiceDemoError extends Error {}

const endpoint = "/api/kotoport-demo";
const recordingByteLimit = 3 * 1024 * 1024;

function stopRecording(session: VoiceSession) {
  if (session.recordingNode) {
    session.recordingNode.onaudioprocess = null;
    session.recordingNode.disconnect();
  }
  session.microphoneSource?.disconnect();
  session.recordingNode = null;
  session.microphoneSource = null;
  session.chunks = [];
  session.sampleCount = 0;
}

function disposeSession(session: VoiceSession) {
  session.controller.abort();
  session.timers.forEach(timer => window.clearTimeout(timer));
  session.timers.clear();
  if (session.outputLevelTimer !== null) window.clearInterval(session.outputLevelTimer);
  session.outputLevelTimer = null;
  stopRecording(session);
  if (session.playbackSource) {
    session.playbackSource.onended = null;
    try { session.playbackSource.stop(); } catch { /* Playback may already have ended. */ }
    session.playbackSource.disconnect();
  }
  session.playbackSource = null;
  session.removeListeners?.();
  session.removeListeners = null;
  session.stream?.getTracks().forEach(track => track.stop());
  session.stream = null;
  session.state = null;
  if (session.context.state !== "closed") void session.context.close().catch(() => undefined);
}

// The local voice endpoint accepts mono PCM WAV at the browser's actual sample rate.
function encodeWav(chunks: Float32Array[], sampleCount: number, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const writeLabel = (offset: number, label: string) => label.split("").forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeLabel(0, "RIFF"); view.setUint32(4, 36 + sampleCount * 2, true); writeLabel(8, "WAVE");
  writeLabel(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeLabel(36, "data"); view.setUint32(40, sampleCount * 2, true);
  let offset = 44;
  for (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index += 1) {
      const bounded = Math.max(-1, Math.min(1, chunk[index]));
      view.setInt16(offset, bounded < 0 ? bounded * 32768 : bounded * 32767, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function inputLevel(samples: Float32Array, offset = 0, count = samples.length) {
  let sum = 0;
  const end = Math.min(samples.length, offset + count);
  for (let index = offset; index < end; index += 1) sum += samples[index] ** 2;
  return Math.sqrt(sum / Math.max(1, end - offset));
}

export function useKotoportVoiceDemo(onLevel: (level: number) => void, onUnauthorized?: () => void) {
  const sessionRef = useRef<VoiceSession | null>(null);
  const hiddenTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const levelRef = useRef(onLevel);
  levelRef.current = onLevel;
  const unauthorizedRef = useRef(onUnauthorized);
  unauthorizedRef.current = onUnauthorized;
  const [phase, setPhase] = useState<VoiceDemoPhase>("idle");
  const [status, setStatus] = useState("ボタンを押すと、マイクで会話を体験できます。");
  const [turns, setTurns] = useState<VoiceDemoTurn[]>([]);

  const finish = useCallback((message: string, hasError = false) => {
    if (hiddenTimerRef.current !== null) window.clearTimeout(hiddenTimerRef.current);
    hiddenTimerRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) disposeSession(session);
    levelRef.current(0);
    if (mountedRef.current) {
      setPhase(hasError ? "error" : "idle");
      setStatus(message);
    }
  }, []);

  const stop = useCallback(() => finish("会話を終了しました。もう一度はじめられます。"), [finish]);

  useEffect(() => {
    mountedRef.current = true;
    const endWhenHidden = () => {
      if (hiddenTimerRef.current !== null) window.clearTimeout(hiddenTimerRef.current);
      hiddenTimerRef.current = null;
      const session = sessionRef.current;
      if (!document.hidden || !session) return;
      // Brief browser focus handoffs can emit hidden/visible without leaving the page.
      hiddenTimerRef.current = window.setTimeout(() => {
        hiddenTimerRef.current = null;
        if (document.hidden && sessionRef.current === session) finish("画面を離れたため会話を終了しました。もう一度はじめられます。");
      }, 250);
    };
    const endWhenLeaving = () => { if (sessionRef.current) stop(); };
    document.addEventListener("visibilitychange", endWhenHidden);
    window.addEventListener("pagehide", endWhenLeaving);
    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", endWhenHidden);
      window.removeEventListener("pagehide", endWhenLeaving);
      finish("");
    };
  }, [finish, stop]);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      finish("このブラウザでは音声を開始できません。Chromeなどの対応ブラウザで開いてください。", true);
      return;
    }
    setPhase("connecting");
    setStatus("会話を準備しています…");
    setTurns([]);

    let context: AudioContext;
    try {
      // Start output in the click gesture; the same context owns recording and playback.
      context = new AudioContext();
    } catch {
      finish("音声出力を開始できませんでした。もう一度はじめてください。", true);
      return;
    }
    const session: VoiceSession = {
      controller: new AbortController(), context, stream: null, microphoneSource: null, recordingNode: null,
      playbackSource: null, outputLevelTimer: null, timers: new Set(), chunks: [], sampleCount: 0, state: null, removeListeners: null,
    };
    sessionRef.current = session;
    const isCurrent = () => mountedRef.current && sessionRef.current === session && !session.controller.signal.aborted;
    const publish = (nextPhase: VoiceDemoPhase, message: string) => {
      if (isCurrent()) { setPhase(nextPhase); setStatus(message); }
    };
    const fail = (message: string) => { if (sessionRef.current === session) finish(message, true); };
    const addTurn = (role: VoiceDemoTurn["role"], text: string) => {
      if (isCurrent() && text) setTurns(previous => [...previous, { role, text }].slice(-6));
    };
    const schedule = (callback: () => void, delayMs: number) => {
      const timer = window.setTimeout(() => {
        session.timers.delete(timer);
        if (isCurrent()) callback();
      }, delayMs);
      session.timers.add(timer);
      return timer;
    };
    async function request<T>(path: string, init: RequestInit, read: (response: Response) => Promise<T>, failureMessage: string, timeoutMs = 120000) {
      const timer = schedule(() => fail("応答に時間がかかっているため会話を終了しました。もう一度はじめてください。"), timeoutMs);
      try {
        const response = await fetch(`${endpoint}/${path}`, { ...init, cache: "no-store", signal: session.controller.signal });
        if (isCurrent() && (response.status === 401 || response.status === 403)) unauthorizedRef.current?.();
        if (!response.ok) throw new VoiceDemoError(failureMessage);
        return await read(response);
      } catch {
        throw new VoiceDemoError(failureMessage);
      } finally {
        window.clearTimeout(timer);
        session.timers.delete(timer);
      }
    }

    function listen(message = "お話しください。話し終わると自動で送信します。") {
      if (!isCurrent() || !session.stream) return;
      try {
        stopRecording(session);
        levelRef.current(0);
        publish("listening", message);
        let heardVoice = false;
        let lastVoiceMs = performance.now();
        const maxSamples = Math.min(context.sampleRate * 25, Math.floor((recordingByteLimit - 44) / 2));
        session.microphoneSource = context.createMediaStreamSource(session.stream);
        // Reuse the dependency-free recorder from Kotoport's existing local voice QA.
        const node = context.createScriptProcessor(2048, 1, 1);
        session.recordingNode = node;
        session.microphoneSource.connect(node);
        node.connect(context.destination);
        const recordingTimer = schedule(() => {
          if (session.recordingNode !== node) return;
          if (heardVoice) void sendRecording();
          else listen("声が聞こえませんでした。マイクに向かってお話しください。");
        }, 30000);
        node.onaudioprocess = event => {
          event.outputBuffer.getChannelData(0).fill(0);
          if (!isCurrent() || session.recordingNode !== node) return;
          const samples = new Float32Array(event.inputBuffer.getChannelData(0));
          const volume = inputLevel(samples);
          levelRef.current(Math.min(1, Math.max(0, volume - 0.015) * 6));
          const now = performance.now();
          if (volume > 0.015) { heardVoice = true; lastVoiceMs = now; }
          const remaining = maxSamples - session.sampleCount;
          const captured = samples.length > remaining ? samples.slice(0, remaining) : samples;
          session.chunks.push(captured);
          session.sampleCount += captured.length;
          if ((heardVoice && now - lastVoiceMs >= 850) || session.sampleCount >= maxSamples) {
            window.clearTimeout(recordingTimer);
            session.timers.delete(recordingTimer);
            if (heardVoice) void sendRecording();
            else listen("マイクに向かってお話しください。");
          }
        };
      } catch {
        fail("マイクから音声を受け取れませんでした。もう一度はじめてください。");
      }
    }

    async function speak(text: string, done: boolean) {
      if (!isCurrent()) return;
      if (!text.trim()) {
        if (done) finish("会話が終了しました。もう一度はじめられます。");
        else schedule(() => listen(), 350);
        return;
      }
      publish("thinking", "返事の音声を準備しています…");
      const wav = await request("speech", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: text }),
      }, response => response.arrayBuffer(), "返事の音声を準備できませんでした。もう一度はじめてください。");
      if (!isCurrent()) return;
      let buffer: AudioBuffer;
      try { buffer = await context.decodeAudioData(wav); }
      catch { throw new VoiceDemoError("返事の音声を再生できませんでした。もう一度はじめてください。"); }
      if (!isCurrent()) return;
      if (context.state !== "running") throw new VoiceDemoError("音声を再生できませんでした。もう一度はじめてください。");
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      session.playbackSource = source;
      source.onended = () => {
        if (!isCurrent() || session.playbackSource !== source) return;
        source.onended = null;
        source.disconnect();
        session.playbackSource = null;
        if (session.outputLevelTimer !== null) window.clearInterval(session.outputLevelTimer);
        session.outputLevelTimer = null;
        levelRef.current(0);
        if (done) finish("会話が終了しました。もう一度はじめられます。");
        else schedule(() => listen(), 350);
      };
      const startedAt = context.currentTime;
      try { source.start(); }
      catch { throw new VoiceDemoError("返事の音声を再生できませんでした。もう一度はじめてください。"); }
      const samples = buffer.getChannelData(0);
      session.outputLevelTimer = window.setInterval(() => {
        if (!isCurrent()) return;
        const offset = Math.floor((context.currentTime - startedAt) * buffer.sampleRate);
        levelRef.current(Math.min(1, inputLevel(samples, offset, 1024) * 5));
      }, 60);
      publish("speaking", "コトポートが話しています。返事のあとにお話しください。");
    }

    async function send(text: string) {
      publish("thinking", "コトポートが返事を考えています…");
      addTurn("user", text);
      const reply = await request("chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: session.state, text }),
      }, response => response.json() as Promise<ChatReply>, "会話に接続できませんでした。もう一度はじめてください。");
      if (!isCurrent()) return;
      if (!reply || reply.error || typeof reply.reply !== "string" || !reply.state || typeof reply.state !== "object" || Array.isArray(reply.state) || typeof reply.done !== "boolean") {
        throw new VoiceDemoError("返事を受け取れませんでした。もう一度はじめてください。");
      }
      session.state = reply.state;
      addTurn("assistant", reply.reply);
      await speak(reply.reply, reply.done);
    }

    async function sendRecording() {
      if (!isCurrent() || !session.recordingNode || !session.sampleCount) return;
      const wav = encodeWav(session.chunks, session.sampleCount, context.sampleRate);
      stopRecording(session);
      levelRef.current(0);
      publish("thinking", "お話の内容を聞き取っています…");
      try {
        const transcript = await request("transcribe", {
          method: "POST", headers: { "Content-Type": "audio/wav" }, body: wav,
        }, response => response.json() as Promise<{ text?: unknown }>, "声を聞き取れませんでした。もう一度はじめてください。");
        if (!isCurrent()) return;
        if (!transcript || typeof transcript.text !== "string") throw new VoiceDemoError("声を聞き取れませんでした。もう一度はじめてください。");
        if (transcript.text.trim()) await send(transcript.text.trim());
        else schedule(() => listen("うまく聞き取れませんでした。もう一度お話しください。"), 350);
      } catch (error) {
        fail(error instanceof VoiceDemoError ? error.message : "会話を続けられませんでした。もう一度はじめてください。");
      }
    }

    try {
      const outputTimeout = schedule(() => fail("音声出力を開始できませんでした。もう一度はじめてください。"), 10000);
      await context.resume();
      window.clearTimeout(outputTimeout);
      session.timers.delete(outputTimeout);
      if (!isCurrent()) return;
      if (context.state !== "running") throw new VoiceDemoError("音声出力を開始できませんでした。もう一度はじめてください。");
      const health = await request("status", {}, response => response.json() as Promise<{ enabled?: boolean; ready?: boolean }>,
        "ただいまデモに接続できません。少し待ってからもう一度はじめてください。", 10000);
      if (!isCurrent()) return;
      if (!health || !health.enabled || !health.ready) throw new VoiceDemoError("ただいまデモを準備しています。少し待ってからもう一度はじめてください。");
      publish("connecting", "マイクを準備しています。使用の許可を求められたら確認してください。");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
      // Permission can arrive after stop, a new session, navigation, or unmount.
      if (!isCurrent()) { stream.getTracks().forEach(track => track.stop()); return; }
      session.stream = stream;
      const tracks = stream.getTracks();
      const trackEnded = () => fail("マイクの接続が切れたため会話を終了しました。接続してからもう一度はじめてください。");
      const contextChanged = () => {
        if (context.state !== "running") fail("音声が停止したため会話を終了しました。もう一度はじめてください。");
      };
      tracks.forEach(track => track.addEventListener("ended", trackEnded));
      context.addEventListener("statechange", contextChanged);
      session.removeListeners = () => {
        tracks.forEach(track => track.removeEventListener("ended", trackEnded));
        context.removeEventListener("statechange", contextChanged);
      };
      await send("");
    } catch (error) {
      fail(error instanceof DOMException && error.name === "NotAllowedError"
        ? "マイクの使用が許可されていません。ブラウザのサイト設定で許可してから、もう一度はじめてください。"
        : error instanceof DOMException && (error.name === "NotFoundError" || error.name === "NotReadableError")
          ? "マイクを利用できません。接続や入力機器を確認してから、もう一度はじめてください。"
          : error instanceof VoiceDemoError ? error.message : "音声を開始できませんでした。もう一度はじめてください。");
    }
  }, [finish]);

  return { phase, status, turns, start, stop };
}
