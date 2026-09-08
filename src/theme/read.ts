import type { Settings, SettingsValue } from "./types";

export const s = (settings: Settings, key: string, fallback = ""): string => {
  const value = settings[key];
  return typeof value === "string" ? value : fallback;
};

export const b = (settings: Settings, key: string, fallback = true): boolean => {
  const value = settings[key];
  return typeof value === "boolean" ? value : fallback;
};

export const n = (settings: Settings, key: string, fallback = 0): number => {
  const value = settings[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)))
    return Number(value);
  return fallback;
};

export const list = (settings: Settings, key: string): Record<string, string>[] => {
  const value: SettingsValue | undefined = settings[key];
  return Array.isArray(value) ? value : [];
};

/**
 * Per-section appearance overrides: background, text color and local accent
 * palette. Accent overrides are applied as CSS variables so every icon, badge
 * and border inside the section follows the chosen color automatically.
 */
export const sectionStyle = (settings: Settings): Record<string, string> => {
  const style: Record<string, string> = {};
  const bg = s(settings, "sectionBg");
  const text = s(settings, "textColor");
  const accent = s(settings, "accentColor");
  const soft = s(settings, "softColor");
  const pale = s(settings, "paleColor");
  if (bg) style["background"] = bg;
  if (text) style["color"] = text;
  if (accent) style["--rose"] = accent;
  if (soft) style["--rose-soft"] = soft;
  if (pale) style["--rose-pale"] = pale;
  const top = n(settings, "paddingTop", 0);
  const bottom = n(settings, "paddingBottom", 0);
  if (top > 0) style["paddingTop"] = `${top}px`;
  if (bottom > 0) style["paddingBottom"] = `${bottom}px`;
  return style;
};

/** Heading color override (falls back to inherited text color) */
export const headingStyle = (settings: Settings): Record<string, string> => {
  const color = s(settings, "headingColor");
  return color ? { color } : {};
};

/** Button color overrides shared by every CTA in the theme */
export const btnStyle = (settings: Settings, prefix = "btn"): Record<string, string> => {
  const style: Record<string, string> = {};
  const bg = s(settings, `${prefix}Bg`);
  const color = s(settings, `${prefix}Color`);
  if (bg) {
    style["background"] = bg;
    style["boxShadow"] = `0 12px 30px -12px ${bg}`;
  }
  if (color) style["color"] = color;
  return style;
};
