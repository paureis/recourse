// Red ink marks for the video, drawn on frame by frame like a pen (the Case File's stamp red).
//
//   renderMark(spec, dir, name) -> { pattern, x, y, w, h, frames }
//
// A mark is a path (an ellipse, an underline, an arrow or a check) sampled into points; each frame stamps
// anti-aliased discs along the part of the path drawn so far, so the line grows over `draw` seconds and then
// holds. The width swells in the middle of each stroke and tapers at its ends, and the path wobbles a little
// (a fixed seed per mark, so a rebuild draws the same line). Output: one RGBA PNG per frame, cropped to the mark.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const RED = [179, 38, 30];
const FPS = 25;

// ---------- PNG (RGBA, 8 bit) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, alpha, rgb = RED, opacity = 0.92) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2];
      raw[o + 3] = Math.round(255 * opacity * Math.min(1, alpha[y * w + x]));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- paths ----------
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// smooth noise: a sum of two sines with random phases
function wobble(r, amp) { const p1 = r() * 6.28, p2 = r() * 6.28, f1 = 1 + r() * 1.5, f2 = 3 + r() * 2; return (u) => amp * (0.7 * Math.sin(6.28 * f1 * u + p1) + 0.3 * Math.sin(6.28 * f2 * u + p2)); }

// Each builder returns strokes: arrays of [x, y] points, in drawing order.
function ellipseStrokes(m, r) {
  // a loose loop: starts upper left, goes round once and overshoots past its start, slightly tilted,
  // the radius drifting so the two ends do not meet
  const [x0, y0, x1, y1] = m.box;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const a = (x1 - x0) / 2 + (m.padX ?? 16), b = (y1 - y0) / 2 + (m.padY ?? 12);
  const tilt = (m.tilt ?? -2.5) * Math.PI / 180;
  const start = Math.PI * (1.08 + r() * 0.08), sweep = Math.PI * 2 * (1.1 + r() * 0.04);
  const wa = wobble(r, 0.025), wb = wobble(r, 0.03);
  const pts = [];
  const n = Math.ceil((a + b) * 4);
  for (let i = 0; i <= n; i++) {
    const u = i / n, th = start + sweep * u;
    const drift = 1 + 0.05 * (u - 0.5);
    const ex = a * (1 + wa(u)) * drift * Math.cos(th), ey = b * (1 + wb(u)) * drift * Math.sin(th);
    pts.push([cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
  }
  return [pts];
}
function underlineStrokes(m, r) {
  // left to right with a slight arc, a small rise at the end, and a little wobble
  const { x0, x1, y } = m;
  const w = wobble(r, m.wobble ?? 0.9), arc = m.arc ?? 1.6, slope = m.slope ?? 0;
  const pts = [], n = Math.ceil((x1 - x0) * 1.5);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push([x0 + (x1 - x0) * u, y + w(u) - arc * Math.sin(Math.PI * u) + slope * (u - 0.5) - (u > 0.94 ? (u - 0.94) * 20 : 0)]);
  }
  return [pts];
}
function arrowStrokes(m, r) {
  // a curved shaft from `from` to `to` (bulging to one side), then the two strokes of the head
  const [fx, fy] = m.from, [tx, ty] = m.to;
  const dx = tx - fx, dy = ty - fy, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const bulge = (m.bulge ?? 0.12) * L;
  const cx = (fx + tx) / 2 + nx * bulge, cy = (fy + ty) / 2 + ny * bulge;
  const shaft = [], n = Math.ceil(L * 1.5);
  for (let i = 0; i <= n; i++) { const u = i / n; shaft.push([(1 - u) ** 2 * fx + 2 * u * (1 - u) * cx + u * u * tx, (1 - u) ** 2 * fy + 2 * u * (1 - u) * cy + u * u * ty]); }
  // the direction at the tip
  const ex = tx - cx, ey = ty - cy, el = Math.hypot(ex, ey), ux = ex / el, uy = ey / el;
  const head = m.head ?? 16, spread = 0.5;
  const side = (s) => { const c = Math.cos(s * spread), sn = Math.sin(s * spread); const hx = -(ux * c - uy * sn), hy = -(ux * sn + uy * c); const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([tx + hx * head * u, ty + hy * head * u]); } return pts.reverse(); };
  return [shaft, side(1), side(-1)];
}
function checkStrokes(m) {
  const { x, y, size: s } = m; // x, y: the bottom of the tick
  const pts = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([x - 0.45 * s + 0.45 * s * u, y - 0.4 * s + 0.4 * s * u * u]); }
  for (let i = 1; i <= 60; i++) { const u = i / 60; pts.push([x + 0.75 * s * u, y - 0.95 * s * u * (1 - 0.15 * u)]); }
  return [pts];
}

// ---------- raster ----------
export function renderMark(m, dir, name) {
  const r = rng(m.seed ?? [...name].reduce((s, c) => s * 31 + c.charCodeAt(0), 7));
  const strokes = m.kind === "ellipse" ? ellipseStrokes(m, r) : m.kind === "underline" ? underlineStrokes(m, r)
    : m.kind === "arrow" ? arrowStrokes(m, r) : m.kind === "check" ? checkStrokes(m, r) : null;
  if (!strokes) throw new Error("unknown mark kind " + m.kind);
  const width = m.width ?? 4.2;
  // resample each stroke at 0.5 px steps; record cumulative length over all strokes
  const samples = [];
  let total = 0;
  for (const s of strokes) {
    const len = [0];
    for (let i = 1; i < s.length; i++) len.push(len[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
    const L = len.at(-1);
    let j = 0;
    for (let d = 0; d <= L; d += 0.5) {
      while (j < s.length - 2 && len[j + 1] < d) j++;
      const seg = len[j + 1] - len[j] || 1, u = (d - len[j]) / seg;
      const p = [s[j][0] + (s[j + 1][0] - s[j][0]) * u, s[j][1] + (s[j + 1][1] - s[j][1]) * u];
      const along = d / L; // pen pressure: thin at the ends, full in the middle
      const rad = (width / 2) * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, Math.max(0, along * 1.0))) ** 0.5);
      samples.push({ p, rad, at: total + d });
    }
    total += L + (m.liftGap ?? 8); // a pen lift between strokes costs a little time
  }
  const pad = Math.ceil(width) + 3;
  const minX = Math.floor(Math.min(...samples.map((s) => s.p[0])) - pad), minY = Math.floor(Math.min(...samples.map((s) => s.p[1])) - pad);
  const maxX = Math.ceil(Math.max(...samples.map((s) => s.p[0])) + pad), maxY = Math.ceil(Math.max(...samples.map((s) => s.p[1])) + pad);
  const w = maxX - minX, h = maxY - minY;
  const frames = Math.max(2, Math.round((m.draw ?? 0.4) * FPS));
  fs.mkdirSync(dir, { recursive: true });
  const alpha = new Float32Array(w * h);
  let k = 0;
  for (let f = 0; f < frames; f++) {
    const u = (f + 1) / frames, e = 1 - (1 - u) ** 2; // ease out: fast start, careful finish
    const upto = e * total;
    for (; k < samples.length && samples[k].at <= upto; k++) {
      const { p, rad } = samples[k];
      const px = p[0] - minX, py = p[1] - minY;
      for (let y = Math.floor(py - rad - 1); y <= Math.ceil(py + rad + 1); y++) {
        for (let x = Math.floor(px - rad - 1); x <= Math.ceil(px + rad + 1); x++) {
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
          const a = Math.min(1, Math.max(0, rad + 0.5 - d));
          if (a > alpha[y * w + x]) alpha[y * w + x] = a;
        }
      }
    }
    fs.writeFileSync(path.join(dir, name + "-" + String(f).padStart(3, "0") + ".png"), png(w, h, alpha, RED, m.opacity ?? 0.92));
  }
  return { pattern: name + "-%03d.png", x: minX, y: minY, w, h, frames };
}
