import { useRef, type ReactNode } from "react";
import { useCalculator } from "@/hooks/useCalculator";
import { SettingsPanel } from "./SettingsPanel";
import { formatDisplay } from "@/lib/magic";

type BtnKind = "num" | "op" | "fn" | "eq";

interface BtnDef {
  key: string;
  label?: string;
  kind: BtnKind;
  span?: 2;
}

// iOS layout (AC ± % on top row, 0 spans 2)
const LAYOUT_IOS: BtnDef[] = [
  { key: "AC", kind: "fn" },
  { key: "±", kind: "fn" },
  { key: "%", kind: "fn" },
  { key: "÷", kind: "op" },
  { key: "7", kind: "num" }, { key: "8", kind: "num" }, { key: "9", kind: "num" }, { key: "×", kind: "op" },
  { key: "4", kind: "num" }, { key: "5", kind: "num" }, { key: "6", kind: "num" }, { key: "−", kind: "op" },
  { key: "1", kind: "num" }, { key: "2", kind: "num" }, { key: "3", kind: "num" }, { key: "+", kind: "op" },
  { key: "0", kind: "num", span: 2 }, { key: ".", kind: "num" }, { key: "=", kind: "op" },
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

export function Calculator() {
  const c = useCalculator();
  const { state, settings, press, flashKey, cancelMagic, revealClimax } = c;
  const isAndroid = settings.skin === "android";
  const LAYOUT = isAndroid ? LAYOUT_ANDROID : LAYOUT_IOS;

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

  // iOS: expression line derived from state (shown above main number)
  let iosExpr: ReactNode = null;
  if (!isAndroid && state.prev !== null && state.op) {
    iosExpr = (
      <>
        <span>{formatDisplay(state.prev)}</span>
        <span style={{ opacity: 0.6 }}> {opSym(state.op)}</span>
      </>
    );
  }

  // Android: formula for bottom line, result state for top
  let androidFormula: string | null = null;
  let androidShowResultGreen = false;

  if (isAndroid) {
    if (state.justEvaluated && state.op === null && state.prev === null) {
      androidShowResultGreen = true;
    } else if (state.prev !== null && state.op) {
      androidFormula = formatDisplay(state.prev) + " " + opSym(state.op);
    }
  }

  const numLen = displayText.replace(/[^0-9.,-]/g, "").length;
  const iosFontSize =
    numLen > 13 ? "text-3xl" :
    numLen > 10 ? "text-4xl" :
    numLen > 7  ? "text-5xl" :
    numLen > 5  ? "text-6xl" : "text-7xl";

  // Skin-dependent shell (Samsung-style: light theme)
  const shellBg = isAndroid ? "bg-white" : "bg-black";

  return (
    <div className={`min-h-screen w-full ${shellBg} flex flex-col select-none touch-manipulation`}>
      {/* Display */}
      {isAndroid ? (
        <div className="flex-1 flex flex-col justify-end px-6 pb-2 pt-12 gap-1">
          {/* Top: current number (large) */}
          <div
            className="text-right font-light text-5xl tracking-tight overflow-hidden whitespace-nowrap min-h-[3rem]"
            style={{
              fontVariantNumeric: "tabular-nums",
              color: androidShowResultGreen ? ANDROID_GREEN : "#202124",
            }}
          >
            {displayText}
          </div>
          {/* Bottom: expression formula (small green) */}
          <div
            className="text-right font-light text-xl tracking-tight overflow-hidden whitespace-nowrap min-h-[1.5rem]"
            style={{ fontVariantNumeric: "tabular-nums", color: ANDROID_GREEN, opacity: 0.8 }}
          >
            {androidFormula ?? ""}
          </div>
          {/* Toolbar with backspace */}
          <div className="flex items-center justify-end pt-2 border-b border-gray-200 pb-3">
            <button
              onClick={() => press("⌫")}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100"
              style={{ color: ANDROID_GREEN }}
              aria-label="backspace"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5H8l-7 7 7 7h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end px-6 pb-4 pt-12">
          {/* Expression line: appears when operator is active */}
          {iosExpr && (
            <div
              className="text-right text-white font-light text-2xl tracking-tight overflow-hidden whitespace-nowrap mb-1"
              style={{ fontVariantNumeric: "tabular-nums", opacity: 0.55 }}
            >
              {iosExpr}
            </div>
          )}
          {/* Main number */}
          <div
            className={`text-right text-white font-light ${iosFontSize} tracking-tight overflow-hidden whitespace-nowrap`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {displayText}
          </div>
        </div>
      )}

      {/* Keypad */}
      <div className={`grid grid-cols-4 ${isAndroid ? "gap-2 p-3 pb-6" : "gap-3 p-3 pb-8"}`}>
        {LAYOUT.map((b) => (
          <CalcButton
            key={b.key}
            def={b}
            skin={settings.skin}
            active={flashKey === b.key}
            onPress={() => press(b.key)}
            onLongPressEquals={b.key === "=" ? revealClimax : undefined}
            onLongPressAC={b.key === "AC" ? cancelMagic : undefined}
            longMs={settings.longPressMs}
          />
        ))}
      </div>

      <SettingsPanel
        open={c.showSettings}
        onOpenChange={c.setShowSettings}
        settings={settings}
        setSettings={c.setSettings}
      />
    </div>
  );
}

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

  const isAndroid = skin === "android";

  // ---- iOS styles ----
  const iosBase =
    "rounded-full h-[72px] flex items-center justify-center text-4xl font-medium transition-all active:scale-95";
  const iosStyles =
    def.kind === "num"
      ? "bg-[#333333] text-white"
      : def.kind === "op" || def.kind === "eq"
      ? "bg-[#ff9f0a] text-white"
      : "bg-[#a5a5a5] text-black";
  const iosActive =
    def.kind === "op" || def.kind === "eq"
      ? "brightness-125"
      : def.kind === "num"
      ? "bg-[#737373]"
      : "brightness-110";

  // ---- Android styles (Samsung Calculator) ----
  const androidBase =
    "rounded-full h-[68px] w-[68px] mx-auto flex items-center justify-center text-3xl font-normal transition-all active:scale-95";
  const androidStyles =
    def.kind === "num"
      ? "bg-[#f1f3f4] text-[#202124]"
      : def.kind === "eq"
      ? "bg-[#34a853] text-white"
      : def.kind === "fn"
      ? "bg-[#f1f3f4] text-[#ea4335]"
      : "bg-[#f1f3f4] text-[#34a853]";
  const androidActive =
    def.kind === "eq" ? "brightness-110" : "bg-[#e0e3e7]";

  const base = isAndroid ? androidBase : iosBase;
  const styles = isAndroid ? androidStyles : iosStyles;
  const activeStyle = isAndroid ? androidActive : iosActive;

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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fire && !longFiredRef.current) onPress();
  };

  return (
    <button
      className={`${base} ${styles} ${active ? activeStyle : ""} ${
        def.span === 2 && !isAndroid ? "col-span-2 justify-start pl-7" : ""
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        handleStart();
      }}
      onPointerUp={() => handleEnd(true)}
      onPointerLeave={() => handleEnd(false)}
      onPointerCancel={() => handleEnd(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {def.label ?? def.key}
    </button>
  );
}
