import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  SETTINGS_KEY,
  STATE_KEY,
  buildT,
  computeM,
} from "@/lib/magic";

type Op = "+" | "−" | "×" | "÷" | null;

interface PersistedState {
  display: string;
  prev: number | null;
  op: Op;
  justEvaluated: boolean;
  // magic
  magicActive: boolean;
  T: string | null;
  C: number | null;
  M: string | null;
  injectionTaps: number;
  injectedDigits: number;
  prevForMagic: number | null;
  opForMagic: Op;
}

const initialState: PersistedState = {
  display: "0",
  prev: null,
  op: null,
  justEvaluated: false,
  magicActive: false,
  T: null,
  C: null,
  M: null,
  injectionTaps: 0,
  injectedDigits: 0,
  prevForMagic: null,
  opForMagic: null,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {}
  return initialState;
}

function applyOp(a: number, b: number, op: Op): number {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? a : a / b; // NEVER throw — needed for 0÷0= trigger
    default: return b;
  }
}

function vibrate(ms: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { (navigator as any).vibrate(ms); } catch {}
  }
}

export function useCalculator() {
  const [settings, setSettings] = useState<Settings>(() =>
    typeof window !== "undefined" ? loadSettings() : DEFAULT_SETTINGS
  );
  const [s, setS] = useState<PersistedState>(() =>
    typeof window !== "undefined" ? loadState() : initialState
  );
  const [showSettings, setShowSettings] = useState(false);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);
  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  // Wake lock during magic mode
  useEffect(() => {
    const acquire = async () => {
      try {
        if ((navigator as any).wakeLock && s.magicActive) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch {}
    };
    const release = () => {
      try { wakeLockRef.current?.release(); } catch {}
      wakeLockRef.current = null;
    };
    if (s.magicActive) acquire();
    else release();
    const onVis = () => { if (s.magicActive && document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); release(); };
  }, [s.magicActive]);

  // Portrait lock
  useEffect(() => {
    try { (screen.orientation as any)?.lock?.("portrait").catch(() => {}); } catch {}
  }, []);

  const flash = (key: string) => {
    setFlashKey(key);
    setTimeout(() => setFlashKey((k) => (k === key ? null : k)), 120);
  };

  // ---- 0÷0= trigger detection ----
  const triggerSeqRef = useRef<string[]>([]);
  const noteTriggerKey = (k: string) => {
    const seq = triggerSeqRef.current;
    seq.push(k);
    if (seq.length > 4) seq.shift();
    if (seq.slice(-4).join(",") === "0,÷,0,=") {
      triggerSeqRef.current = [];
      setShowSettings(true);
      // Reset display silently
      setS((p) => ({ ...p, display: "0", prev: null, op: null, justEvaluated: false }));
    }
  };

  // ---- Double-click + detection ----
  const lastPlusRef = useRef<number>(0);

  const enterMagic = useCallback(() => {
    setS((prev) => {
      // C = current display numeric value
      const C = parseFloat(prev.display.replace(/,/g, "")) || 0;
      const T = buildT(settings.format, settings.minutesOffset);
      const M = computeM(T, C, settings.predictionOn ? settings.predictionValue : 0);
      vibrate(40);
      return {
        ...prev,
        magicActive: true,
        T, C, M,
        injectionTaps: 0,
        injectedDigits: 0,
        prevForMagic: prev.prev,
        opForMagic: prev.op,
      };
    });
  }, [settings]);

  const cancelMagic = useCallback(() => {
    vibrate([20, 40, 20]);
    setS({ ...initialState });
  }, []);

  const revealClimax = useCallback(() => {
    setS((prev) => {
      if (!prev.magicActive || !prev.T) return prev;
      const digits = prev.T.length;
      const mod = Math.pow(10, digits);
      const target = (Number(prev.T) + (settings.predictionOn ? settings.predictionValue : 0)) % mod;
      const display = String(target).padStart(digits, "0");
      vibrate([30, 60, 30]);
      return {
        ...initialState,
        display,
      };
    });
  }, [settings]);

  // ---- Key handlers ----
  const press = (key: string) => {
    flash(key);

    // Magic mode: keyboard locked, but visual feedback + injection logic
    if (s.magicActive) {
      // Long-press handlers manage = and AC separately (handled in component)
      if (key === "=" || key === "AC") return; // ignore short press
      // Tap counter
      setS((prev) => {
        const taps = prev.injectionTaps + 1;
        // Inject digit from M starting at sensitivity threshold
        let injected = prev.injectedDigits;
        let display = prev.display;
        if (taps >= settings.injectionSensitivity && prev.M && injected < prev.M.length) {
          const nextDigit = prev.M[injected];
          injected += 1;
          // Build display: typed progressively. Strip leading zeros from prefix unless all zeros.
          const prefix = prev.M.slice(0, injected);
          const num = String(parseInt(prefix, 10) || 0);
          display = num;
        }
        return { ...prev, injectionTaps: taps, injectedDigits: injected, display };
      });
      return;
    }

    // Normal mode
    if (/^\d$/.test(key)) {
      noteTriggerKey(key);
      setS((prev) => {
        if (prev.justEvaluated) {
          return { ...prev, display: key, justEvaluated: false };
        }
        const d = prev.display === "0" ? key : prev.display + key;
        if (d.replace(/[^\d]/g, "").length > 15) return prev;
        return { ...prev, display: d };
      });
      return;
    }

    if (key === ".") {
      setS((prev) => {
        if (prev.display.includes(".")) return prev;
        return { ...prev, display: prev.display + ".", justEvaluated: false };
      });
      return;
    }

    if (key === "AC") {
      setS({ ...initialState });
      return;
    }

    if (key === "⌫") {
      setS((prev) => {
        if (prev.justEvaluated) return prev;
        const d = prev.display.length <= 1 || (prev.display.length === 2 && prev.display.startsWith("-"))
          ? "0"
          : prev.display.slice(0, -1);
        return { ...prev, display: d };
      });
      return;
    }

    if (key === "±") {
      setS((prev) => ({
        ...prev,
        display: prev.display.startsWith("-") ? prev.display.slice(1) : "-" + prev.display,
      }));
      return;
    }

    if (key === "%") {
      setS((prev) => {
        const v = parseFloat(prev.display) / 100;
        return { ...prev, display: String(v) };
      });
      return;
    }

    if (key === "+" || key === "−" || key === "×" || key === "÷") {
      noteTriggerKey(key);
      // Double-tap + detection BEFORE state change
      if (key === "+") {
        const now = Date.now();
        if (now - lastPlusRef.current < 500) {
          lastPlusRef.current = 0;
          enterMagic();
          return;
        }
        lastPlusRef.current = now;
      }
      setS((prev) => {
        const cur = parseFloat(prev.display) || 0;
        let prevVal = prev.prev;
        if (prevVal !== null && prev.op && !prev.justEvaluated) {
          prevVal = applyOp(prevVal, cur, prev.op);
        } else {
          prevVal = cur;
        }
        return {
          ...prev,
          prev: prevVal,
          op: key as Op,
          display: prev.justEvaluated ? prev.display : String(prevVal),
          justEvaluated: true,
        };
      });
      return;
    }

    if (key === "=") {
      noteTriggerKey(key);
      setS((prev) => {
        if (prev.op === null || prev.prev === null) return prev;
        const cur = parseFloat(prev.display) || 0;
        const result = applyOp(prev.prev, cur, prev.op);
        return {
          ...prev,
          display: String(result),
          prev: null,
          op: null,
          justEvaluated: true,
        };
      });
      return;
    }
  };

  return {
    state: s,
    settings,
    setSettings,
    showSettings,
    setShowSettings,
    flashKey,
    press,
    cancelMagic,
    revealClimax,
  };
}
