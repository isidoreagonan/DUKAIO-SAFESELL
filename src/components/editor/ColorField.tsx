import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pipette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ControlLabel } from "@/components/editor/controls";
import { cn } from "@/lib/utils";

/* ---------- conversions ---------- */

type Hsv = { h: number; s: number; v: number };

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(value: string): string | null {
  const v = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toLowerCase()}`;
  return null;
}

function hexToHsv(hex: string): Hsv {
  const safe = normalizeHex(hex) ?? "#000000";
  const r = parseInt(safe.slice(1, 3), 16) / 255;
  const g = parseInt(safe.slice(3, 5), 16) / 255;
  const b = parseInt(safe.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const [r1, g1, b1] =
    hh < 1
      ? [c, x, 0]
      : hh < 2
        ? [x, c, 0]
        : hh < 3
          ? [0, c, x]
          : hh < 4
            ? [0, x, c]
            : hh < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = v - c;
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r1)}${to(g1)}${to(b1)}`;
}

/* ---------- drag helper ---------- */

function useDrag(onMove: (x: number, y: number, rect: DOMRect) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const emit = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onMove(clamp((clientX - rect.left) / rect.width), clamp((clientY - rect.top) / rect.height), rect);
    },
    [onMove],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      emit(e.clientX, e.clientY);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [emit]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    emit(e.clientX, e.clientY);
  };

  return { ref, onPointerDown };
}

/* ---------- picker ---------- */

export function ColorPicker({
  label,
  value,
  onChange,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const hsv = useMemo(() => hexToHsv(value), [value]);
  const [hue, setHue] = useState(hsv.h);

  useEffect(() => {
    setText(value);
  }, [value]);

  // Garde la teinte du curseur quand la couleur devient noire ou blanche.
  useEffect(() => {
    if (hsv.s > 0.02 && hsv.v > 0.02) setHue(hsv.h);
  }, [hsv.h, hsv.s, hsv.v]);

  const area = useDrag((x, y) => onChange(hsvToHex({ h: hue, s: x, v: 1 - y })));
  const hueBar = useDrag((x) => {
    const h = x * 360;
    setHue(h);
    onChange(hsvToHex({ h, s: hsv.s || 1, v: hsv.v || 1 }));
  });

  const swatch = normalizeHex(value) ?? "#000000";

  const pickFromScreen = async () => {
    const w = window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };
    if (!w.EyeDropper) return;
    try {
      const res = await new w.EyeDropper().open();
      const hex = normalizeHex(res.sRGBHex);
      if (hex) onChange(hex);
    } catch {
      /* annulé */
    }
  };

  const hasEyeDropper =
    typeof window !== "undefined" && "EyeDropper" in (window as unknown as Record<string, unknown>);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <ControlLabel>{label}</ControlLabel> : null}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center gap-2.5 rounded-[8px] border border-input bg-background px-2 text-left transition hover:bg-accent"
            aria-label={label ?? "Couleur"}
          >
            <span
              className="h-6 w-6 shrink-0 rounded-[6px] border border-black/10"
              style={{ background: swatch }}
            />
            <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold uppercase">
              {swatch}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[264px] rounded-[12px] p-3">
          <div className="space-y-3">
            {/* Zone saturation / luminosité */}
            <div
              ref={area.ref}
              onPointerDown={area.onPointerDown}
              className="relative h-[136px] w-full cursor-crosshair touch-none rounded-[8px]"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))`,
              }}
            >
              <span
                className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
              />
            </div>

            {/* Valeur + pipette */}
            <div className="flex items-center gap-2">
              <span
                className="h-9 w-9 shrink-0 rounded-[8px] border border-black/10"
                style={{ background: swatch }}
              />
              <div className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-[8px] border border-input px-2">
                <span className="text-xs text-muted-foreground">#</span>
                <input
                  value={text.replace(/^#/, "")}
                  onChange={(e) => {
                    setText(e.target.value);
                    const hex = normalizeHex(e.target.value);
                    if (hex) onChange(hex);
                  }}
                  onBlur={() => setText(value)}
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs uppercase outline-none"
                  aria-label="Code couleur hexadécimal"
                />
                {hasEyeDropper ? (
                  <button
                    type="button"
                    onClick={pickFromScreen}
                    className="shrink-0 rounded-[6px] p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label="Prélever une couleur à l'écran"
                  >
                    <Pipette size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Teinte */}
            <div
              ref={hueBar.ref}
              onPointerDown={hueBar.onPointerDown}
              className="relative h-4 w-full cursor-pointer touch-none rounded-full"
              style={{
                background:
                  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              }}
            >
              <span
                className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                style={{ left: `${(hue / 360) * 100}%`, background: `hsl(${hue} 100% 50%)` }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
