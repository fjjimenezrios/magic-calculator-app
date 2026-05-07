// Magic Time Calculator - core logic helpers

export type Skin = "ios" | "android";
export type DigitFormat = 8 | 12;

export interface Settings {
  skin: Skin;
  format: DigitFormat;
  predictionOn: boolean;
  predictionValue: number;
  minutesOffset: 0 | 1 | 2;
  injectionSensitivity: number; // tap index from which to inject (default 3)
  longPressMs: number; // long-press for = and AC
}

export const DEFAULT_SETTINGS: Settings = {
  skin: "ios",
  format: 8,
  predictionOn: false,
  predictionValue: 0,
  minutesOffset: 0,
  injectionSensitivity: 3,
  longPressMs: 1000,
};

export const SETTINGS_KEY = "mtc.settings.v1";
export const STATE_KEY = "mtc.state.v1";

/** Build T as numeric digit-string for current time, with offset applied. */
export function buildT(format: DigitFormat, minutesOffset: number): string {
  const d = new Date(Date.now() + minutesOffset * 60_000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  if (format === 8) {
    // DDMMYYYY
    return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
  }
  // 12: DDMMYYYYHHMM
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
}

/** M such that C + M = T (mod 10^digits). Returns padded digit string. */
export function computeM(tStr: string, c: number, predictionValue: number): string {
  const digits = tStr.length;
  const mod = Math.pow(10, digits);
  const target = (Number(tStr) + predictionValue) % mod;
  const m = ((target - c) % mod + mod) % mod;
  return String(m).padStart(digits, "0");
}

export function formatDisplay(n: number): string {
  if (!isFinite(n)) return "Error";
  const s = n.toString();
  if (s.length > 12) return n.toPrecision(8);
  // Add thousands separators for integer part
  const [int, dec] = s.split(".");
  const sign = int.startsWith("-") ? "-" : "";
  const absInt = sign ? int.slice(1) : int;
  const grouped = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sign + grouped + (dec !== undefined ? "," + dec : "");
}
