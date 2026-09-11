export type HSL = { h: number; s: number; l: number };

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function hslToCss({ h, s, l }: HSL) {
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}

export function hslToRgb({ h, s, l }: HSL): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  return [clamp(r + m), clamp(g + m), clamp(b + m)];
}

export function hslToHex(hsl: HSL) {
  const [r, g, b] = hslToRgb(hsl);
  const to = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${to(r)}${to(g)}${to(b)}`;
}

const srgbToLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

/** OKLab (perceptual) from sRGB in 0..1 */
export function rgbToOklab(r: number, g: number, b: number) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function hslToOklab(hsl: HSL) {
  const [r, g, b] = hslToRgb(hsl);
  return rgbToOklab(r, g, b);
}

/** Perceptual distance in OKLab. ~0 identical, ~1 = opposite extremes. */
export function oklabDistance(a: HSL, b: HSL) {
  const x = hslToOklab(a);
  const y = hslToOklab(b);
  return Math.sqrt((x.L - y.L) ** 2 + (x.a - y.a) ** 2 + (x.b - y.b) ** 2);
}

export function hueDelta(from: number, to: number) {
  let d = ((to - from + 540) % 360) - 180;
  if (Object.is(d, -180)) d = 180;
  return d;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Procedural target color.
 * `difficulty` 0..1 pushes toward subtler, less obvious colors.
 */
export function generateTargetColor(difficulty: number): HSL {
  const d = clamp(difficulty);
  const h = rand(0, 360);

  // Easy rounds: clearly readable colors. Hard rounds: wider, trickier range.
  const family = Math.random();
  let s: number;
  let l: number;

  if (family < 0.25) {
    // muted
    s = rand(8 + d * 4, 35 - d * 10);
    l = rand(30, 72);
  } else if (family < 0.5) {
    // dark
    s = rand(25, 90);
    l = rand(10 + d * 2, 32);
  } else if (family < 0.7) {
    // light
    s = rand(20, 85);
    l = rand(70, 92 - d * 2);
  } else {
    // saturated mid
    s = rand(55, 98);
    l = rand(38, 62);
  }

  return { h, s: clamp(s, 4, 100), l: clamp(l, 6, 95) };
}

/** A color close to a reference — used by Precision mode. */
export function generateNearColor(ref: HSL, closeness: number): HSL {
  const k = 1 - clamp(closeness);
  return {
    h: (ref.h + rand(-1, 1) * (12 + 55 * k) + 360) % 360,
    s: clamp(ref.s + rand(-1, 1) * (6 + 30 * k), 4, 100),
    l: clamp(ref.l + rand(-1, 1) * (5 + 26 * k), 6, 95),
  };
}
