import { useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useCalculator } from "@/hooks/useCalculator";
import { SettingsPanel } from "./SettingsPanel";
import { formatDisplay } from "@/lib/magic";
import applePng from "@/assets/apple.png";
import androidPng from "@/assets/android.png";

type BtnKind = "num" | "op" | "fn" | "eq";
type Op = "+" | "−" | "×" | "÷" | null;

function applyOp(a: number, b: number, op: Op): number {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? a : a / b;
    default: return b;
  }
}

interface BtnDef {
  key: string;
  label?: string;
  kind: BtnKind;
}

// iOS 26 layout: ⌫ AC % ÷ | 7 8 9 × | 4 5 6 − | 1 2 3 + | ± 0 . =
const LAYOUT_IOS: BtnDef[] = [
  { key: "⌫", kind: "fn" },
  { key: "AC", kind: "fn" },
  { key: "%", kind: "fn" },
  { key: "÷", kind: "op" },
  { key: "7", kind: "num" }, { key: "8", kind: "num" }, { key: "9", kind: "num" }, { key: "×", kind: "op" },
  { key: "4", kind: "num" }, { key: "5", kind: "num" }, { key: "6", kind: "num" }, { key: "−", kind: "op" },
  { key: "1", kind: "num" }, { key: "2", kind: "num" }, { key: "3", kind: "num" }, { key: "+", kind: "op" },
  { key: "±", kind: "num" }, { key: "0", kind: "num" }, { key: ".", kind: "num" }, { key: "=", kind: "op" },
];

// Android (Samsung Calculator) layout
const LAYOUT_ANDROID: BtnDef[] = [
  { key: "AC", kind: "fn", label: "C" },
  { key: "()", kind: "op", label: "( )" },
  { key: "%", kind: "op" },
  { key: "÷", kind: "op" },
  { key: "7", kind: "num" }, { key: "8", kind: "num" }, { key: "9", kind: "num" }, { key: "×", kind: "op" },
  { key: "4", kind: "num" }, { key: "5", kind: "num" }, { key: "6", kind: "num" }, { key: "−", kind: "op" },
  { key: "1", kind: "num" }, { key: "2", kind: "num" }, { key: "3", kind: "num" }, { key: "+", kind: "op" },
  { key: "±", kind: "num", label: "+/−" }, { key: "0", kind: "num" }, { key: ".", kind: "num", label: "," }, { key: "=", kind: "eq" },
];

// ---- iOS SVG icons ----
const IOS_ICONS: Record<string, ReactNode> = {
  "⌫": (
    <svg style={{ display: "block", width: "min(36px,54%)", height: "auto", aspectRatio: "35/27" }}
      viewBox="-0.5 -0.5 35 27" fill="none">
      <path d="M11 3.5H28A2.5 2.5 0 0130.5 6v14A2.5 2.5 0 0128 22.5H11L3.5 13 11 3.5z"
        stroke="currentColor" strokeWidth="2.75" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M15.25 9.25L21.75 15.75M21.75 9.25L15.25 15.75"
        stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
    </svg>
  ),
  "÷": (
    <svg style={{ display: "block", width: "clamp(2.1rem,11vw,2.95rem)", height: "clamp(2.1rem,11vw,2.95rem)" }}
      viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="1.45" fill="currentColor" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.45" fill="currentColor" />
    </svg>
  ),
  "×": (
    <svg style={{ display: "block", width: "clamp(2.1rem,11vw,2.95rem)", height: "clamp(2.1rem,11vw,2.95rem)" }}
      viewBox="0 0 24 24" fill="none">
      <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  ),
  "−": (
    <svg style={{ display: "block", width: "clamp(2.1rem,11vw,2.95rem)", height: "clamp(2.1rem,11vw,2.95rem)" }}
      viewBox="0 0 24 24" fill="none">
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  ),
  "+": (
    <svg style={{ display: "block", width: "clamp(2.1rem,11vw,2.95rem)", height: "clamp(2.1rem,11vw,2.95rem)" }}
      viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  ),
  "=": (
    <svg style={{ display: "block", width: "clamp(2.1rem,11vw,2.95rem)", height: "clamp(2.1rem,11vw,2.95rem)" }}
      viewBox="0 0 24 24" fill="none">
      <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <line x1="6" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  ),
};

// iOS glass button style tokens
const IOS_BTN: Record<BtnKind, { bg: string; shadow: string }> = {
  num: {
    bg: "#212121",
    shadow: "inset 0 0 0 999px rgba(50,50,50,0.52), inset 0 1px 0 rgba(255,255,255,0.09)",
  },
  fn: {
    bg: "#5e5e5e",
    shadow: "inset 0 0 0 999px rgba(94,94,94,0.47), inset 0 1px 0 rgba(255,255,255,0.11)",
  },
  op: {
    bg: "#ff9201",
    shadow: "inset 0 0 0 999px rgba(255,146,1,0.41), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  eq: {
    bg: "#ff9201",
    shadow: "inset 0 0 0 999px rgba(255,146,1,0.41), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
};

export function Calculator() {
  const c = useCalculator();
  const { state, settings, press, flashKey, cancelMagic, revealClimax } = c;
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const skinOverride = (search as { skin?: "ios" | "android" }).skin;
  const activeSkin = skinOverride ?? settings.skin;
  const isAndroid = activeSkin === "android";

  // Keep URL param in sync when user changes skin via settings
  useEffect(() => {
    if (skinOverride && skinOverride !== settings.skin) {
      navigate({ search: { skin: settings.skin as "ios" | "android" } });
    }
  }, [settings.skin]);
  const LAYOUT = isAndroid ? LAYOUT_ANDROID : LAYOUT_IOS;

  // Sync favicon, apple-touch-icon, manifest and body bg based on active skin
  useEffect(() => {
    const base = "/magic-calculator-app";
    const iconHref = isAndroid ? androidPng : applePng;
    const touchIconHref = isAndroid ? `${base}/icons/android.png` : `${base}/icons/apple.png`;
    const manifestHref = isAndroid ? `${base}/manifest-android.json` : `${base}/manifest-ios.json`;
    const themeColor = isAndroid ? "#f8f9fa" : "#000000";
    const bg = isAndroid ? "#f8f9fa" : "#000";

    // favicon
    let favLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!favLink) {
      favLink = document.createElement("link");
      favLink.rel = "icon";
      document.head.appendChild(favLink);
    }
    favLink.href = iconHref;

    // apple-touch-icon
    const touchLink = document.getElementById("apple-touch-icon") as HTMLLinkElement | null;
    if (touchLink) touchLink.href = touchIconHref;

    // manifest
    const manifestLink = document.getElementById("manifest-link") as HTMLLinkElement | null;
    if (manifestLink) manifestLink.href = manifestHref;

    // theme-color
    const themeMeta = document.getElementById("theme-color") as HTMLMetaElement | null;
    if (themeMeta) themeMeta.content = themeColor;

    // body / html background
    document.body.style.background = bg;
    document.documentElement.style.background = bg;
  }, [isAndroid]);

  const fmt = (s: string) => {
    if (/^-?\d+\.?\d*$/.test(s)) {
      const n = parseFloat(s);
      if (!isNaN(n)) {
        const formatted = formatDisplay(n);
        return s.endsWith(".") ? formatted + "," : formatted;
      }
    }
    return s;
  };

  const displayText = fmt(state.display);

  const ANDROID_GREEN = "#1a8a3f";
  const opSym = (o: string | null) =>
    o === "+" ? "+" : o === "−" ? "−" : o === "×" ? "×" : o === "÷" ? "÷" : "";

  // iOS expression line
  let iosExpr: ReactNode = null;
  if (!isAndroid && state.prev !== null && state.op) {
    iosExpr = (
      <>
        <span>{formatDisplay(state.prev)}</span>
        <span style={{ opacity: 0.6 }}> {opSym(state.op)}</span>
      </>
    );
  }

  // Android: full expression string to display
  const androidExprFull = state.expression
    ? state.expression + (state.justEvaluated ? "" : state.display)
    : "";

  // Android result preview (only when there's a pending op and we have a right-hand operand)
  let androidPreview: string | null = null;
  if (isAndroid && state.prev !== null && state.op && !state.justEvaluated) {
    const cur = parseFloat(state.display) || 0;
    const res = applyOp(state.prev, cur, state.op);
    if (isFinite(res)) androidPreview = formatDisplay(res);
  }

  // iOS display font size — scales down for long numbers
  const numLen = displayText.replace(/[^0-9.,-]/g, "").length;
  const iosDisplayFontSize =
    numLen > 12 ? "clamp(1.8rem, 9vw, 2.4rem)" :
    numLen > 9  ? "clamp(2.4rem, 13vw, 3.25rem)" :
                  "clamp(3.25rem, 17.2vw, 4.3125rem)";

  if (isAndroid) {
    return (
      <div className="min-h-screen w-full flex flex-col select-none touch-manipulation" style={{ background: "#f8f9fa" }}>
        {/* Display area */}
        <div className="flex-1 flex flex-col justify-end px-5 pb-1 pt-10">
          {/* Expression line */}
          <div
            className="text-right tracking-tight overflow-hidden min-h-[2.5rem] flex items-end justify-end flex-wrap gap-0"
            style={{ fontVariantNumeric: "tabular-nums", fontSize: "clamp(1.5rem,7vw,2rem)", fontWeight: 400, lineHeight: 1.2, wordBreak: "break-all" }}
          >
            {androidExprFull
              ? androidExprFull.split(/([+−×÷])/).map((tok, i) =>
                  /^[+−×÷]$/.test(tok)
                    ? <span key={i} style={{ color: ANDROID_GREEN }}>{tok}</span>
                    : <span key={i} style={{ color: "#202124" }}>{tok}</span>
                )
              : <span style={{ color: "#202124" }}>{displayText}</span>
            }
          </div>
          {/* Preview / current number */}
          {androidExprFull ? (
            <div
              className="text-right font-light tracking-tight overflow-hidden whitespace-nowrap"
              style={{ fontVariantNumeric: "tabular-nums", color: "#9aa0a6", fontSize: "clamp(1.1rem,5vw,1.4rem)", marginTop: 2, minHeight: "1.6rem" }}
            >
              {androidPreview ?? ""}
            </div>
          ) : null}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            {/* Clock */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200" style={{ color: "#5f6368" }} onClick={() => {}} aria-label="historial">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" />
                <polyline points="12 7 12 12 15 14.5" />
              </svg>
            </button>
            {/* Ruler */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200" style={{ color: "#5f6368" }} onClick={() => {}} aria-label="conversor">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="8" width="20" height="8" rx="2" />
                <line x1="6" y1="12" x2="6" y2="16" /><line x1="10" y1="12" x2="10" y2="16" />
                <line x1="14" y1="12" x2="14" y2="16" /><line x1="18" y1="12" x2="18" y2="16" />
              </svg>
            </button>
            {/* Formula / scientific */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200" style={{ color: "#5f6368" }} onClick={() => c.setShowSettings(true)} aria-label="ajustes">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19 L8 5" /><path d="M16 5 L20 19" />
                <path d="M3 13 L21 13" /><path d="M6 19 L18 19" />
              </svg>
            </button>
          </div>
          {/* Backspace */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200"
            style={{ color: "#5f6368" }}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => press("⌫")}
            aria-label="borrar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 5H8.5L2 12l6.5 7H20a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
              <line x1="15" y1="9" x2="10" y2="15" /><line x1="10" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>
        <div className="mx-4 border-b" style={{ borderColor: "#dadce0" }} />

        {/* Button grid */}
        <div className="grid grid-cols-4 gap-2 p-3 pb-6">
          {LAYOUT.map((b) => (
            <CalcButton key={b.key} def={b} skin="android" active={flashKey === b.key}
              onPress={() => press(b.key)}
              onLongPressEquals={b.key === "=" ? revealClimax : undefined}
              onLongPressAC={b.key === "AC" ? cancelMagic : undefined}
              longMs={settings.longPressMs}
            />
          ))}
        </div>
        <SettingsPanel open={c.showSettings} onOpenChange={c.setShowSettings} settings={settings} setSettings={c.setSettings} />
      </div>
    );
  }

  // ---- iOS 26 skin ----
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center select-none touch-manipulation"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      <div className="w-full flex flex-col flex-1"
        style={{ maxWidth: 402, paddingTop: "max(6px, env(safe-area-inset-top, 0px))", paddingBottom: "max(28px, calc(env(safe-area-inset-bottom, 0px) + 18px))", paddingLeft: "max(15px, env(safe-area-inset-left, 0px))", paddingRight: "max(15px, env(safe-area-inset-right, 0px))" }}
      >
        {/* Top nav */}
        <nav className="flex justify-between items-center py-1 pb-3">
          <button
            type="button"
            aria-label="Historial"
            style={iosNavBtnStyle}
            onClick={() => {}}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="7.25" stroke="currentColor" strokeWidth="1.35" />
              <path d="M11 7.25v3.75l2.5 1.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Ajustes"
            style={iosNavBtnStyle}
            onClick={() => c.setShowSettings(true)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="4" y="4" width="5" height="5" rx="1" fill="currentColor" />
              <rect x="12.5" y="4" width="5" height="5" rx="1" fill="currentColor" />
              <rect x="4" y="12.5" width="5" height="5" rx="1" fill="currentColor" />
              <rect x="12.5" y="12.5" width="5" height="5" rx="1" fill="currentColor" />
            </svg>
          </button>
        </nav>

        {/* Display */}
        <div className="flex-1 flex flex-col justify-end text-right pb-[min(18px,3.5vh)]" style={{ minHeight: "min(110px,16vh)" }}>
          {iosExpr && (
            <div style={{ color: "#8e8e93", fontSize: "clamp(1rem,3.5vw,1.2rem)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 1.25, wordBreak: "break-all", marginBottom: 4 }}>
              {iosExpr}
            </div>
          )}
          <div style={{ color: "#fbfbfb", fontSize: iosDisplayFontSize, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden" }}>
            {displayText}
          </div>
        </div>

        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "max(6px, min(2.1vw, 8px))" }}>
          {LAYOUT_IOS.map((b) => (
            <CalcButton key={b.key} def={b} skin="ios" active={flashKey === b.key}
              onPress={() => press(b.key)}
              onLongPressEquals={b.key === "=" ? revealClimax : undefined}
              onLongPressAC={b.key === "AC" ? cancelMagic : undefined}
              longMs={settings.longPressMs}
            />
          ))}
        </div>
      </div>

      <SettingsPanel open={c.showSettings} onOpenChange={c.setShowSettings} settings={settings} setSettings={c.setSettings} />
    </div>
  );
}

const iosNavBtnStyle: CSSProperties = {
  position: "relative",
  width: 43,
  height: 43,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#f8f8f8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  background: "linear-gradient(165deg, rgba(255,255,255,0.16) 0%, rgba(94,94,94,0.28) 55%, rgba(60,60,60,0.35) 100%)",
  backdropFilter: "blur(18px) saturate(180%)",
  WebkitBackdropFilter: "blur(18px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.35)",
};

function CalcButton({
  def,
  skin,
  active,
  onPress,
  onLongPressEquals,
  onLongPressAC,
  longMs,
}: {
  def: BtnDef;
  skin: "ios" | "android";
  active: boolean;
  onPress: () => void;
  onLongPressEquals?: () => void;
  onLongPressAC?: () => void;
  longMs: number;
}) {
  const timerRef = useRef<number | null>(null);
  const longFiredRef = useRef(false);

  const handleStart = () => {
    longFiredRef.current = false;
    if (onLongPressEquals || onLongPressAC) {
      timerRef.current = window.setTimeout(() => {
        longFiredRef.current = true;
        onLongPressEquals?.();
        onLongPressAC?.();
      }, longMs);
    }
  };
  const handleEnd = (fire: boolean) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (fire && !longFiredRef.current) onPress();
  };

  if (skin === "ios") {
    const { bg, shadow } = IOS_BTN[def.kind];
    const icon = IOS_ICONS[def.key];
    const label = def.label ?? def.key;

    const btnStyle: CSSProperties = {
      background: bg,
      boxShadow: active
        ? `${shadow}, 0 0 0 3px rgba(255,255,255,0.3)`
        : shadow,
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: "50%",
      aspectRatio: "1",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#f8f8f8",
      fontSize: "clamp(1.85rem, 9.2vw, 2.375rem)",
      fontWeight: 500,
      cursor: "pointer",
      transition: "filter 0.1s ease, transform 0.06s ease",
      filter: active ? "brightness(1.15)" : undefined,
    };

    return (
      <button
        style={btnStyle}
        onPointerDown={(e) => { e.preventDefault(); handleStart(); }}
        onPointerUp={() => handleEnd(true)}
        onPointerLeave={() => handleEnd(false)}
        onPointerCancel={() => handleEnd(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {icon ?? label}
      </button>
    );
  }

  // Android
  const androidBase = "rounded-full h-[68px] w-[68px] mx-auto flex items-center justify-center text-3xl font-normal transition-all active:scale-95";
  const androidStyles =
    def.kind === "num" ? "bg-[#f1f3f4] text-[#202124]"
    : def.kind === "eq" ? "bg-[#34a853] text-white"
    : def.kind === "fn" ? "bg-[#f1f3f4] text-[#ea4335]"
    : "bg-[#f1f3f4] text-[#34a853]";
  const androidActive = def.kind === "eq" ? "brightness-110" : "bg-[#e0e3e7]";

  return (
    <button
      className={`${androidBase} ${androidStyles} ${active ? androidActive : ""}`}
      onPointerDown={(e) => { e.preventDefault(); handleStart(); }}
      onPointerUp={() => handleEnd(true)}
      onPointerLeave={() => handleEnd(false)}
      onPointerCancel={() => handleEnd(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {def.label ?? def.key}
    </button>
  );
}
