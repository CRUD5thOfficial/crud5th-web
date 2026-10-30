import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPlushRenderer, type PlushRenderer } from "./kotoport-plush-mesh";

export type AvatarMode = "walking" | "listening" | "thinking" | "speaking";
export type AvatarColor = "yellow" | "coral" | "blue" | "green";

export interface KotoportAvatarProps {
  color: AvatarColor;
  mode?: AvatarMode;
  /** Normalized 0–1 input/output volume. A parent CSS variable can stream it without React renders. */
  level?: number;
  paused?: boolean;
  className?: string;
}

const texture = "/images/kotoport-plush-reference.png";
const modes: Record<AvatarMode, number> = { walking: 0, listening: 1, thinking: 2, speaking: 3 };
const portraits: Record<AvatarColor, { viewBox: string; outline: string }> = {
  yellow: {
    viewBox: "0 65 610 640",
    outline: "M111 213C149 129 214 94 304 95C423 87 513 130 545 235C579 247 586 286 581 335C576 367 560 393 559 414C582 441 596 482 597 520C597 548 583 568 563 562C544 558 533 544 529 530C515 581 483 606 441 619C459 642 456 664 437 672C409 684 352 682 331 666L321 626L275 627C277 651 264 671 239 677C207 683 159 680 151 663C144 650 154 631 169 616C120 588 105 550 102 507C92 464 71 432 51 401C20 365 -3 304 8 272C11 246 37 232 61 240C81 246 91 266 99 287C101 259 103 237 111 213Z",
  },
  coral: {
    viewBox: "575 85 550 620",
    outline: "M608 310C615 207 662 140 750 119C837 94 929 108 993 159C1046 197 1072 268 1079 338C1087 361 1101 400 1102 437C1105 472 1087 493 1072 499L1077 608C1078 646 1071 665 1049 673C1007 682 944 678 918 666C892 654 883 636 881 605L880 502C877 472 863 453 850 454C833 454 819 477 817 505L814 608C814 653 795 674 763 678C723 682 656 678 633 661C612 647 611 626 609 594L613 522C593 503 595 480 611 460C587 440 584 397 592 367Z",
  },
  blue: {
    viewBox: "1070 125 475 580",
    outline: "M1150 347C1181 295 1205 224 1246 181C1274 150 1311 145 1343 158C1387 178 1414 241 1441 310L1497 449C1521 481 1540 519 1530 554C1525 584 1487 607 1439 615L1436 644C1432 669 1414 680 1385 680C1358 680 1328 675 1319 662L1314 619L1285 619L1283 650C1279 673 1257 682 1231 681C1199 681 1168 672 1161 658L1159 612C1115 600 1083 582 1082 550C1074 514 1090 474 1116 443Z",
  },
  green: {
    viewBox: "1470 15 578 690",
    outline: "M1515 205C1510 132 1562 75 1647 52C1740 22 1839 43 1881 108C1901 136 1905 167 1906 192C1935 202 1940 239 1932 277C1930 289 1924 301 1917 310C1933 299 1942 264 1956 241C1975 211 2005 217 2021 240C2042 274 2031 311 2017 335C1990 380 1957 397 1924 405C1921 456 1917 516 1902 554C1890 587 1874 608 1855 620C1877 638 1885 661 1865 674C1842 687 1790 683 1776 670L1767 626L1731 627L1727 656C1723 676 1695 682 1668 681C1641 680 1611 675 1603 662C1596 651 1606 630 1621 615C1566 596 1536 556 1529 502C1519 464 1523 425 1534 393L1519 340C1493 336 1482 310 1487 273C1487 242 1498 218 1515 205Z",
  },
};

function PlushTextureFilter({ id }: { id: string }) {
  return <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
    <feColorMatrix in="SourceGraphic" result="warm" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  18 0 -18 0 -1.08" />
    <feColorMatrix in="SourceGraphic" result="green" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 60 -60 0 -.12" />
    <feColorMatrix in="SourceGraphic" result="blue" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -18 18 0 -1.08" />
    <feColorMatrix in="SourceGraphic" result="dark" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2.5512 -8.5824 -.8664 0 9" />
    <feComposite in="warm" in2="green" operator="arithmetic" k2="1" k3="1" result="colors" />
    <feComposite in="colors" in2="blue" operator="arithmetic" k2="1" k3="1" result="chroma" />
    <feComposite in="chroma" in2="dark" operator="arithmetic" k2="1" k3="1" result="detail" />
    <feMorphology in="detail" operator="dilate" radius="2" result="edge" />
    <feGaussianBlur in="edge" stdDeviation=".45" result="soft" />
    <feComposite in="SourceGraphic" in2="soft" operator="in" />
  </filter>;
}

/** Static, texture-based portraits for the cards and feature illustrations. */
export function KotoportAvatar({ color, mode = "listening", level, paused = true, className = "" }: KotoportAvatarProps) {
  const id = `kp-plush-${useId().replace(/:/g, "")}`;
  const portrait = portraits[color];
  const style = level === undefined ? undefined : { "--kp-avatar-level": Math.max(0, Math.min(1, level)) } as CSSProperties;
  return <svg className={`kp-plush-portrait kp-avatar-${color} ${className}`} viewBox={portrait.viewBox} data-mode={mode} data-paused={paused} style={style} aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={id}><path d={portrait.outline} />{color === "coral" && <path d="M590 565H680V616H590Z" />}</clipPath>
      <PlushTextureFilter id={`${id}-alpha`} />
      {color === "green" && <>
        <filter id={`${id}-core`}><feMorphology operator="erode" radius="16" /></filter>
        <mask id={`${id}-protected`} maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="759" style={{ maskType: "alpha" }}>
          <image href={texture} width="2048" height="759" filter={`url(#${id}-alpha)`} />
          <path d={portrait.outline} fill="white" filter={`url(#${id}-core)`} />
        </mask>
      </>}
    </defs>
    <image href={texture} width="2048" height="759" clipPath={`url(#${id})`} filter={color === "green" ? undefined : `url(#${id}-alpha)`} mask={color === "green" ? `url(#${id}-protected)` : undefined} />
  </svg>;
}

export function KotoportPlushLineup({ mode = "walking", level, paused = false }: Omit<KotoportAvatarProps, "color" | "className">) {
  const frameId = `kp-plush-frame-${useId().replace(/:/g, "")}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PlushRenderer | null>(null);
  const motionRef = useRef({ mode, level, paused, elapsed: 0, previous: 0, frame: 0 });
  const [isReady, setIsReady] = useState(false);
  motionRef.current.mode = mode;
  motionRef.current.level = level;
  motionRef.current.paused = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    const image = new Image();
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.width * 759 / 2048));
      rendererRef.current?.draw(motionRef.current.elapsed, modes[motionRef.current.mode], motionRef.current.level ?? 0);
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(motionRef.current.frame);
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setIsReady(false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("webglcontextlost", contextLost);
    image.onload = () => {
      if (disposed) return;
      rendererRef.current = createPlushRenderer(canvas, image);
      resize();
      setIsReady(rendererRef.current !== null);
    };
    image.src = texture;
    return () => {
      disposed = true;
      image.onload = null;
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      cancelAnimationFrame(motionRef.current.frame);
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const motion = motionRef.current;
    motion.previous = 0;
    if (paused || !isReady) return;
    const animate = (now: number) => {
      if (motion.paused || !rendererRef.current || !canvasRef.current) return;
      if (motion.previous) motion.elapsed += Math.min((now - motion.previous) / 1000, 0.05);
      motion.previous = now;
      const input = motion.level ?? Number.parseFloat(getComputedStyle(canvasRef.current).getPropertyValue("--kp-avatar-level"));
      rendererRef.current.draw(motion.elapsed, modes[motion.mode], Number.isFinite(input) ? Math.max(0, Math.min(1, input)) : 0);
      motion.frame = requestAnimationFrame(animate);
    };
    motion.frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(motion.frame);
  }, [paused, isReady]);

  return <div className="kp-hero-assistants kp-plush-lineup" data-renderer={isReady ? "webgl" : "image"} data-mode={mode} data-paused={paused} aria-hidden="true">
    <svg className="kp-plush-mask" aria-hidden="true" focusable="false"><defs><PlushTextureFilter id={`${frameId}-alpha`} /></defs></svg>
    <img className="kp-plush-original" style={{ filter: `url(#${frameId}-alpha)` }} src={texture} alt="" width="2048" height="759" />
    <canvas className="kp-plush-canvas" ref={canvasRef} />
  </div>;
}
