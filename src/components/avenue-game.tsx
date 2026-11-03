import { useEffect, useMemo, useRef } from "react";
import {
  avenueEmails,
  institutions,
  isFee,
  isPaid,
  outcomeInfo,
  statusInfo,
  type AvInstitution,
  type AvLevel,
} from "@/data/avenues";
import { cloudNumber, corr, type CorrKind } from "@/data/correspondence";

/**
 * "Avenues": an original arcade-style climb. The ape at the top is the institution and every
 * barrel it throws is one of its replies. The climber is Sion. Each girder is one avenue of that
 * institution's escalation roadmap, bottom (first step) to top (court-ordered disclosure).
 * On each girder: our emails float as numbered clouds (1 = first email to that body), their replies
 * burn as pixel fires (a heart when the reply was fully satisfactory), calls show as phones, generic
 * notes are faded to 40%, and a diamond on the girder under a reply marks a real attachment.
 * All art is original and drawn here in code.
 */

export type GameHit =
  | { kind: "email"; index: number; level: AvLevel }
  | { kind: "diamond"; index: number; level: AvLevel }
  | { kind: "level"; level: AvLevel; levelIndex: number }
  | { kind: "boss" };

const W = 360;
const TOP = 78;
const LH = 50;
/** Girder spacing: tall ramps (many rungs) pack tighter so the climb stays phone-sized. */
const lhFor = (n: number) => (n <= 13 ? LH : Math.max(40, Math.round((13 * LH) / n + 8)));
const BOTTOM = 26;
const X0 = 14;
const X1 = W - 14;
const GAP = 30;
const TILT = 7;

type Slot = {
  x: number;
  y: number;
  s: number;
  index: number;
  out: boolean;
  colour: string;
  level: number;
  fee: boolean;
  kind: CorrKind;
  heart: boolean;
  generic: boolean;
  num: number;
  /** Diamond on the girder line under this reply (an attachment came with it). */
  dx?: number;
  dy?: number;
};
type Barrel = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number;
  index: number;
  rot: number;
  falling: boolean;
  colour: string;
  fee: boolean;
  heart: boolean;
};

function girder(level: number, n: number) {
  // Each girder rises towards its ladder, so the climber only ever walks uphill and climbs up.
  // Even levels: gap on the left, high end (and ladder) on the right. Odd levels: the mirror.
  // Barrels roll downhill, away from the ladder, and drop off the low end onto the girder below.
  const yBase = TOP + (n - 1 - level) * lhFor(n) + 30;
  const highRight = level % 2 === 0;
  const left = highRight ? X0 + GAP : X0;
  const right = highRight ? X1 : X1 - GAP;
  const yL = highRight ? yBase + TILT / 2 : yBase - TILT / 2;
  const yR = highRight ? yBase - TILT / 2 : yBase + TILT / 2;
  return {
    left,
    right,
    yL,
    yR,
    highRight,
    yAt: (x: number) => yL + ((x - left) / (right - left)) * (yR - yL),
  };
}

/** x of the ladder from girder `level` up to the next one: at this girder's high end. */
function ladderX(level: number, n: number) {
  const g = girder(level, n);
  const up = girder(Math.min(level + 1, n - 1), n);
  return g.highRight ? Math.min(g.right, up.right) - 24 : Math.max(g.left, up.left) + 16;
}

function itemColour(level: AvLevel, index: number) {
  const e = avenueEmails[index];
  if (!e.out) return outcomeInfo[e.o].colour;
  if (level.late.includes(e.t)) return statusInfo.overdue.colour;
  if (level.open.includes(e.t)) return statusInfo.progress.colour;
  return statusInfo.done.colour;
}

function layoutSlots(inst: AvInstitution) {
  const n = inst.levels.length;
  const slots: Slot[] = [];
  inst.levels.forEach((level, li) => {
    if (!level.items.length) return;
    const g = girder(li, n);
    const usable = g.right - g.left - 44;
    let s = 12;
    let perRow = Math.max(1, Math.floor(usable / (s + 3)));
    let rows = Math.ceil(level.items.length / perRow);
    while (rows > 3 && s > 5) {
      s -= 1;
      perRow = Math.max(1, Math.floor(usable / (s + 3)));
      rows = Math.ceil(level.items.length / perRow);
    }
    level.items.forEach((index, k) => {
      const row = Math.floor(k / perRow);
      const col = k % perRow;
      const x = g.left + 38 + col * (s + 3) + s / 2;
      const y = g.yAt(x) - 5 - row * (s + 2) - s / 2;
      const c = corr(index);
      const slot: Slot = {
        x,
        y,
        s,
        index,
        out: avenueEmails[index].out,
        colour: itemColour(level, index),
        level: li,
        fee: !avenueEmails[index].out && isFee(index),
        kind: c.kind,
        heart: c.heart,
        generic: c.generic,
        num: c.kind === "his" ? cloudNumber(inst, index) : 0,
      };
      if (c.kind !== "his" && c.diamonds.length) {
        slot.dx = x;
        slot.dy = g.yAt(x) + 2.5;
      }
      slots.push(slot);
    });
  });
  return slots;
}

function frontier(inst: AvInstitution) {
  let f = 0;
  inst.levels.forEach((level, i) => {
    if (level.items.length && level.status !== "na") f = i;
  });
  return f;
}

function drawGirder(
  ctx: CanvasRenderingContext2D,
  level: AvLevel,
  li: number,
  n: number,
  t: number,
) {
  const g = girder(li, n);
  const colour = statusInfo[level.status].colour;
  const h = 7;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(g.left, g.yL);
  ctx.lineTo(g.right, g.yR);
  ctx.lineTo(g.right, g.yR + h);
  ctx.lineTo(g.left, g.yL + h);
  ctx.closePath();
  if (level.status === "na") {
    ctx.fillStyle = "#262a31";
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = "#4a505b";
    ctx.lineWidth = 1;
    for (let x = g.left - 20; x < g.right + 20; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, g.yL - 10);
      ctx.lineTo(x + 14, g.yL + 20);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = level.status === "available" ? "rgba(90,123,216,0.22)" : colour;
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = level.status === "available" ? 1.2 : 1;
  if (level.status === "available") ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  // truss
  ctx.strokeStyle = level.status === "available" ? "rgba(90,123,216,0.5)" : "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  for (let x = g.left + 4; x < g.right - 6; x += 9) {
    const y = g.yAt(x);
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.lineTo(x + 4.5, y + h - 1);
    ctx.lineTo(x + 9, y + 1);
    ctx.stroke();
  }
  if (level.status === "overdue") {
    const pulse = 0.35 + 0.35 * Math.sin(t / 220);
    ctx.strokeStyle = `rgba(255,77,79,${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.left, g.yL - 2);
    ctx.lineTo(g.right, g.yR - 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLadder(ctx: CanvasRenderingContext2D, li: number, n: number) {
  if (li >= n - 1) return;
  const g = girder(li, n);
  const up = girder(li + 1, n);
  const x = ladderX(li, n);
  const y0 = g.yAt(x);
  const y1 = up.yAt(x) + 7;
  ctx.strokeStyle = "rgba(196,165,116,0.45)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.moveTo(x + 8, y0);
  ctx.lineTo(x + 8, y1);
  for (let y = y1 + 4; y < y0; y += 6) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y);
  }
  ctx.stroke();
}

/** Original pixel-art sprites (our own grids, not taken from any game). */
export const FIRE_A = [
  "...r.....",
  "..rr..r..",
  ".rror.rr.",
  ".roorrro.",
  "rrooyoorr",
  "royyyyoor",
  "royywyyor",
  ".roywwyr.",
  "..royyor.",
  "...rrrr..",
];
const FIRE_B = [
  ".....r...",
  "..r..rr..",
  ".rr.rorr.",
  ".orrroor.",
  "rrooyoorr",
  "rooyyyyor",
  "royywyyor",
  ".rywwyor.",
  ".royyor..",
  "..rrrr...",
];
export const HEART = [
  ".rr...rr.",
  "rrrr.rrrr",
  "rrrrrrrrr",
  "rrrrrrrrr",
  ".rrrrrrr.",
  "..rrrrr..",
  "...rrr...",
  "....r....",
];
export const PAL: Record<string, string> = {
  r: "#e0301e",
  o: "#ff7a1a",
  y: "#ffd34d",
  w: "#fff6d6",
  h: "#ff3b5c",
};

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  cx: number,
  cy: number,
  size: number,
  pal: Record<string, string>,
) {
  const rows = grid.length;
  const cols = grid[0].length;
  const p = size / Math.max(rows, cols);
  const x0 = cx - (cols * p) / 2;
  const y0 = cy - (rows * p) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (ch === ".") continue;
      ctx.fillStyle = pal[ch] ?? ch;
      ctx.fillRect(x0 + c * p, y0 + r * p, p + 0.35, p + 0.35);
    }
  }
}

function drawFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  t: number,
  seed: number,
) {
  const frame = Math.floor((t + seed * 137) / 180) % 2 === 0 ? FIRE_A : FIRE_B;
  drawGrid(ctx, frame, x, y - size * 0.08, size * 1.15, PAL);
}

function drawPhoneGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colour: string,
) {
  // A simple handset: two ear/mouth pads joined by a curved grip.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.6);
  ctx.strokeStyle = colour;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.6, size * 0.2);
  ctx.beginPath();
  ctx.arc(0, size * 0.05, size * 0.36, Math.PI * 1.15, Math.PI * 1.85, false);
  ctx.stroke();
  ctx.fillStyle = colour;
  const pad = Math.max(1.6, size * 0.2);
  ctx.fillRect(-size * 0.42, -size * 0.06, pad, pad * 1.4);
  ctx.fillRect(size * 0.42 - pad, -size * 0.06, pad, pad * 1.4);
  ctx.restore();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  t: number,
  inner: "mail" | "phone",
) {
  const beat = 1 + Math.max(0, Math.sin(t / 220)) * 0.06;
  const sz = size * 1.2 * beat;
  drawGrid(ctx, HEART, x, y, sz, { r: PAL.h });
  // icon inside the heart: an envelope for an email, a red-on-white phone for a call
  const w = sz * 0.42;
  const h = sz * 0.28;
  const cy = y - sz * 0.08;
  if (inner === "mail") {
    ctx.fillStyle = "#fff6d6";
    ctx.fillRect(x - w / 2, cy - h / 2, w, h);
    ctx.strokeStyle = PAL.h;
    ctx.lineWidth = Math.max(0.8, sz / 14);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, cy - h / 2);
    ctx.lineTo(x, cy + h * 0.1);
    ctx.lineTo(x + w / 2, cy - h / 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#fff6d6";
    ctx.beginPath();
    ctx.arc(x, cy, sz * 0.25, 0, Math.PI * 2);
    ctx.fill();
    drawPhoneGlyph(ctx, x, cy + sz * 0.02, sz * 0.36, "#d81e2c");
  }
}

function drawPhone(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  drawPhoneGlyph(ctx, x, y, size, "#e0301e");
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, num: number) {
  const r = size * 0.32;
  ctx.fillStyle = "#eef3ff";
  ctx.beginPath();
  ctx.arc(x - r * 0.9, y + r * 0.25, r * 0.85, 0, Math.PI * 2);
  ctx.arc(x, y - r * 0.2, r * 1.05, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.25, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - r * 0.9, y + r * 0.1, r * 1.8, r);
  if (num > 0 && size >= 6) {
    const label = String(num);
    const fs = Math.max(5, size * (label.length > 2 ? 0.46 : label.length > 1 ? 0.55 : 0.66));
    ctx.font = `800 ${fs}px Outfit, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1b2440";
    ctx.fillText(label, x, y + r * 0.3);
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const r = 4.6;
  ctx.save();
  ctx.shadowColor = "#7ff3ff";
  ctx.shadowBlur = 4 + Math.sin(t / 300) * 2;
  ctx.fillStyle = "#5ee6ff";
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.85, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.85, y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#e9fdff";
  ctx.fillRect(x - 0.9, y - r * 0.55, 1.5, 1.5);
  ctx.restore();
}

function drawExchange(ctx: CanvasRenderingContext2D, s: Slot, t: number, bob: boolean) {
  ctx.save();
  if (s.generic) ctx.globalAlpha = 0.4;
  if (s.kind === "his") {
    const dy = bob ? Math.sin(t / 700 + s.index) * 0.8 : 0;
    drawCloud(ctx, s.x, s.y + dy, s.s + 2, s.num);
  } else if (s.kind === "phone") {
    if (s.heart) drawHeart(ctx, s.x, s.y, s.s, t, "phone");
    else drawPhone(ctx, s.x, s.y, s.s);
  } else if (s.heart) drawHeart(ctx, s.x, s.y, s.s, t, "mail");
  else drawFire(ctx, s.x, s.y, s.s, t, s.index);
  ctx.restore();
}

function drawFee(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // "$": the institution sought or mentioned a fee in this reply.
  const size = r >= 4 ? Math.max(8, r * 1.7) : 8;
  const cy = r >= 4 ? y + 0.5 : y - r - 5;
  ctx.save();
  ctx.font = `800 ${size}px Outfit, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#14110e";
  ctx.strokeText("$", x, cy);
  ctx.fillStyle = "#ffd34d";
  ctx.fillText("$", x, cy);
  ctx.restore();
}

function drawApe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  throwing: boolean,
) {
  // Original chunky pixel ape: 3px "pixels", arms up when throwing.
  const p = 3;
  const px = (cx: number, cy: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + cx * p, y + cy * p, w * p, h * p);
  };
  const fur = "#6b4a2f";
  const dark = "#3e2a1a";
  const face = "#d8b48a";
  const bob = Math.round(Math.sin(t / 260)) * 1;
  ctx.save();
  ctx.translate(0, bob);
  px(-5, -10, 10, 9, fur); // body
  px(-4, -15, 8, 6, fur); // head
  px(-3, -13, 6, 4, face); // face
  px(-2, -13, 1, 1, "#111");
  px(1, -13, 1, 1, "#111");
  px(-2, -11, 4, 1, dark); // mouth
  px(-3, -6, 6, 4, "#8a6545"); // chest
  if (throwing) {
    px(-8, -17, 3, 8, fur);
    px(5, -17, 3, 8, fur);
  } else {
    px(-8, -9, 3, 8, fur);
    px(5, -9, 3, 8, fur);
  }
  px(-5, -1, 4, 2, dark); // feet
  px(1, -1, 4, 2, dark);
  // badge: institution tie
  px(-1, -9, 2, 3, "#c4a574");
  ctx.restore();
}

function drawClimber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  t: number,
  duck: boolean,
) {
  const p = 2;
  const px = (cx: number, cy: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + (dir > 0 ? cx : -cx - w) * p, y + cy * p, w * p, h * p);
  };
  const step = Math.floor(t / 120) % 2;
  if (duck) {
    px(-3, -5, 6, 3, "#2f6fd6");
    px(-2, -8, 4, 3, "#f0c9a0");
    px(-3, -9, 6, 2, "#c23b32");
    px(-3, -2, 2, 2, "#3a2a1a");
    px(1, -2, 2, 2, "#3a2a1a");
    return;
  }
  px(-2, -14, 4, 2, "#c23b32"); // cap
  px(-2, -12, 4, 3, "#f0c9a0"); // head
  px(1, -11, 1, 1, "#111");
  px(-3, -9, 6, 5, "#2f6fd6"); // jacket
  px(-1, -9, 2, 1, "#c4a574"); // scarf
  px(-4 + step, -8, 1, 3, "#f0c9a0");
  px(3 - step, -8, 1, 3, "#f0c9a0");
  px(-2, -4, 2, 3 + step, "#2b2b3a"); // legs
  px(0, -4, 2, 4 - step, "#2b2b3a");
}

/* ---------- "Slide me": a second man visitors drag along the climb to read each email ---------- */

type PathPt = { x: number; y: number };
type PathSeg = { a: PathPt; b: PathPt; level: number; ladder: boolean; p0: number; len: number };

/** The journey as one polyline: along each girder from its low end to its high end, a short step
 *  back to the ladder, up the ladder, and so on to the top. Dragging snaps to the nearest point. */
function buildPath(n: number) {
  const segs: PathSeg[] = [];
  let p = 0;
  let cur: PathPt | null = null;
  const to = (pt: PathPt, level: number, ladder = false) => {
    if (cur) {
      const len = Math.hypot(pt.x - cur.x, pt.y - cur.y);
      if (len > 0.01) {
        segs.push({ a: cur, b: pt, level, ladder, p0: p, len });
        p += len;
      }
    }
    cur = pt;
  };
  for (let li = 0; li < n; li++) {
    const g = girder(li, n);
    const low = g.highRight ? g.left + 4 : g.right - 4;
    const high = g.highRight ? g.right - 4 : g.left + 4;
    to({ x: low, y: g.yAt(low) }, li);
    to({ x: high, y: g.yAt(high) }, li);
    if (li < n - 1) {
      const lx = ladderX(li, n) + 4;
      to({ x: lx, y: g.yAt(lx) }, li);
      to({ x: lx, y: girder(li + 1, n).yAt(lx) }, li + 1, true);
    }
  }
  return { segs, total: p };
}

function pointAt(path: { segs: PathSeg[] }, p: number) {
  const segs = path.segs;
  let seg = segs[0];
  for (const s of segs) {
    seg = s;
    if (p <= s.p0 + s.len) break;
  }
  const t = Math.max(0, Math.min(1, (p - seg.p0) / seg.len));
  return {
    x: seg.a.x + (seg.b.x - seg.a.x) * t,
    y: seg.a.y + (seg.b.y - seg.a.y) * t,
    level: seg.level,
    ladder: seg.ladder,
  };
}

/** Nearest point on the path to (x, y); among near-ties, the one closest to where he already is. */
function snapToPath(path: { segs: PathSeg[] }, x: number, y: number, curP: number) {
  const hits: { p: number; d: number }[] = [];
  for (const s of path.segs) {
    const dx = s.b.x - s.a.x;
    const dy = s.b.y - s.a.y;
    const t = Math.max(0, Math.min(1, ((x - s.a.x) * dx + (y - s.a.y) * dy) / (dx * dx + dy * dy)));
    const d = Math.hypot(s.a.x + dx * t - x, s.a.y + dy * t - y);
    hits.push({ p: s.p0 + t * s.len, d });
  }
  const best = Math.min(...hits.map((h) => h.d));
  let pick = hits[0];
  let pd = Infinity;
  for (const h of hits) {
    if (h.d <= best + 1.5 && Math.abs(h.p - curP) < pd) {
      pick = h;
      pd = Math.abs(h.p - curP);
    }
  }
  return pick.p;
}

/** Path position of a point on girder `level` at x (the main low-to-high run of that girder). */
function pathPosOnGirder(path: { segs: PathSeg[] }, level: number, x: number) {
  const seg =
    path.segs.find((s) => s.level === level && !s.ladder && Math.abs(s.b.x - s.a.x) > 40) ??
    path.segs[0];
  const t = Math.max(0, Math.min(1, (x - seg.a.x) / (seg.b.x - seg.a.x)));
  return seg.p0 + t * seg.len;
}

function drawSlider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  active: boolean,
  idle: boolean,
) {
  // Original pixel figure, visibly different from the climber: green overalls, white hard hat,
  // holding a board up on a pole that reads SLIDE ME.
  const p = 2;
  const px = (cx: number, cy: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + cx * p, y + cy * p, w * p, h * p);
  };
  const bob = idle ? Math.round(Math.sin(t / 300) * 1.5) : 0;
  // sign on a pole, held up in the right hand (left hand near the right-hand edge)
  const side = x > W - 34 ? -1 : 1;
  const sx = x + 9 * side;
  const sy = y - 44 + bob;
  ctx.fillStyle = "#8a6545";
  ctx.fillRect(sx - 1, sy + 9, 2, 22);
  ctx.fillStyle = active ? "#ffd34d" : "#f4efe6";
  ctx.fillRect(sx - 21, sy - 3, 42, 13);
  ctx.strokeStyle = "#14110e";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx - 20.5, sy - 2.5, 41, 12);
  ctx.fillStyle = "#14110e";
  ctx.font = "800 7px Outfit, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText("SLIDE", sx + 5, sy + 3.6);
  ctx.textAlign = "left";
  ctx.fillText("ME", sx + 8, sy + 3.6);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  // body
  px(-2, -14, 5, 2, "#f4efe6"); // hard hat
  px(-3, -13, 7, 1, "#f4efe6");
  px(-2, -12, 4, 3, "#c98d5e"); // head
  px(1, -11, 1, 1, "#111");
  px(-3, -9, 6, 5, "#2fa36b"); // overalls
  px(-1, -8, 2, 2, "#ffd34d"); // badge
  if (side > 0) {
    px(3, -12, 1, 4, "#c98d5e"); // arm up to the pole
    px(-4, -8, 1, 3, "#c98d5e");
  } else {
    px(-4, -12, 1, 4, "#c98d5e");
    px(3, -8, 1, 3, "#c98d5e");
  }
  px(-2, -4, 2, 4, "#1f3b2c"); // legs
  px(0, -4, 2, 4, "#1f3b2c");
  if (active) {
    ctx.strokeStyle = "rgba(255,211,77,0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPick(ctx: CanvasRenderingContext2D, s: Slot, t: number) {
  const r = s.s / 2 + 2.5 + Math.sin(t / 160) * 0.8;
  ctx.save();
  ctx.strokeStyle = "#ffd34d";
  ctx.lineWidth = 1.8;
  ctx.shadowColor = "#ffd34d";
  ctx.shadowBlur = 6;
  ctx.strokeRect(s.x - r, s.y - r, r * 2, r * 2);
  ctx.restore();
}

export type SlidePick = {
  index: number;
  level: AvLevel;
  pos: number;
  total: number;
  dock: "top" | "bottom";
};

export function AvenueGame({
  instId,
  onInstChange,
  onHit,
  onSlide,
}: {
  instId: string;
  onInstChange: (id: string) => void;
  onHit: (hit: GameHit, inst: AvInstitution) => void;
  /** The slide-me man is over a log (or, with null, over none). `final` on release / key step. */
  onSlide: (pick: SlidePick | null, inst: AvInstitution, final: boolean) => void;
}) {
  const inst = useMemo(
    () => institutions.find((i) => i.id === instId) ?? institutions[0],
    [instId],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ barrels: Barrel[]; slots: Slot[] }>({ barrels: [], slots: [] });
  const slideCb = useRef(onSlide);
  slideCb.current = onSlide;
  const justDragged = useRef(0);
  const n = inst.levels.length;
  const H = TOP + n * lhFor(n) + BOTTOM;
  const replies = useMemo(() => {
    const seen = new Set<number>();
    for (const level of inst.levels)
      for (const i of level.items) if (!avenueEmails[i].out) seen.add(i);
    return [...seen].sort((a, b) => avenueEmails[a].d.localeCompare(avenueEmails[b].d));
  }, [inst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const slots = layoutSlots(inst);
    stateRef.current = { barrels: [], slots };
    // diamond positions (canvas units), for tests and assistive tools
    canvas.dataset.gems = JSON.stringify(
      slots
        .filter((s) => s.dx !== undefined)
        .map((s) => [Math.round(s.dx ?? 0), Math.round(s.dy ?? 0)]),
    );
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let nextThrow = 600;
    let throwAnim = 0;
    let replyCursor = Math.max(0, replies.length - 12);
    const front = frontier(inst);
    // The climber always starts at the low end of the bottom girder and only goes up: walk uphill
    // to the ladder, climb, repeat. At the highest avenue reached he walks to its top end, pauses,
    // and starts again from the bottom. He never walks downhill or back down a ladder.
    const startX = () => {
      const g0 = girder(0, n);
      return g0.highRight ? g0.left + 10 : g0.right - 10;
    };
    const climber = {
      level: 0,
      x: startX(),
      y: 0,
      dir: girder(0, n).highRight ? 1 : -1,
      mode: "walk" as "walk" | "climb" | "rest" | "fade",
      t: 0,
      h: 0,
      vh: 0,
      duck: 0,
      alpha: 0,
    };

    const resize = () => {
      const cssW = wrap.clientWidth;
      const scale = cssW / W;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${H * scale}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(H * scale * dpr);
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    io.observe(canvas);

    // ---- the slide-me man ----
    const path = buildPath(n);
    // every log in journey order: girder by girder, along the walking direction, bottom row first
    const order = slots
      .map((sl, k) => ({ k, sl }))
      .sort((A, B) => {
        if (A.sl.level !== B.sl.level) return A.sl.level - B.sl.level;
        const dir = girder(A.sl.level, n).highRight ? 1 : -1;
        if (Math.abs(A.sl.x - B.sl.x) > 0.5) return (A.sl.x - B.sl.x) * dir;
        return B.sl.y - A.sl.y;
      })
      .map((o) => o.k);
    const slide = {
      p: 0,
      dragging: false,
      grabDy: 0,
      lift: 0,
      sel: -1,
      shown: -2,
      pointer: -1,
      downX: 0,
      downY: 0,
      moved: false,
    };
    let slideTimer = 0;
    const toCanvas = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * W,
        y: ((clientY - rect.top) / rect.height) * H,
      };
    };
    const slidePoint = () => pointAt(path, slide.p);
    /** The log under him: same girder, his x inside its column; with stacked rows, the lift picks the row. */
    const logUnder = () => {
      const pt = slidePoint();
      if (pt.ladder) return -1;
      const col = slots
        .map((sl, k) => ({ sl, k }))
        .filter(({ sl }) => sl.level === pt.level && Math.abs(sl.x - pt.x) <= sl.s / 2 + 1.01)
        .sort((A, B) => Math.abs(A.sl.x - pt.x) - Math.abs(B.sl.x - pt.x) || B.sl.y - A.sl.y);
      if (!col.length) return -1;
      const cx = col[0].sl.x;
      const stack = col
        .filter(({ sl }) => Math.abs(sl.x - cx) < 0.5)
        .sort((A, B) => B.sl.y - A.sl.y);
      const row = Math.max(
        0,
        Math.min(stack.length - 1, Math.round(slide.lift / (stack[0].sl.s + 1))),
      );
      return stack[row].k;
    };
    const dockFor = () => {
      const rect = canvas.getBoundingClientRect();
      const pt = slidePoint();
      const screenY = rect.top + (pt.y / H) * rect.height;
      return screenY > window.innerHeight * 0.5 ? "top" : "bottom";
    };
    const emit = (final: boolean) => {
      window.clearTimeout(slideTimer);
      const fire = () => {
        const k = slide.sel;
        wrap.dataset.slideLog = k >= 0 ? String(slots[k].index) : "";
        if (k === slide.shown && !final) return;
        slide.shown = k;
        if (k < 0) {
          slideCb.current(null, inst, final);
          return;
        }
        const sl = slots[k];
        slideCb.current(
          {
            index: sl.index,
            level: inst.levels[sl.level],
            pos: order.indexOf(k) + 1,
            total: order.length,
            dock: dockFor(),
          },
          inst,
          final,
        );
      };
      // a new log settles after a short pause (no flicker while sliding past several); off the
      // logs, the last email stays up a little longer before it closes
      if (final) fire();
      else slideTimer = window.setTimeout(fire, slide.sel >= 0 ? 160 : 700);
    };
    const publish = () => {
      const pt = slidePoint();
      wrap.dataset.slideX = pt.x.toFixed(1);
      wrap.dataset.slideY = pt.y.toFixed(1);
      wrap.setAttribute("aria-valuenow", String(slide.sel >= 0 ? order.indexOf(slide.sel) + 1 : 0));
      if (slide.sel >= 0) {
        const e = avenueEmails[slots[slide.sel].index];
        wrap.setAttribute(
          "aria-valuetext",
          `Email ${order.indexOf(slide.sel) + 1} of ${order.length}, ${e.out ? "sent" : "received"} ${e.d}: ${e.s || "no subject"}`,
        );
      } else wrap.setAttribute("aria-valuetext", "At the start, not over an email");
      wrap.setAttribute("aria-valuemax", String(order.length));
    };
    wrap.dataset.slideLog = "";
    publish();
    const nearMan = (x: number, y: number) => {
      const pt = slidePoint();
      // generous grab box: the figure, and the sign he holds up
      return x > pt.x - 32 && x < pt.x + 32 && y > pt.y - 50 && y < pt.y + 8;
    };
    const onDown = (ev: PointerEvent) => {
      if (ev.button > 0) return;
      const c = toCanvas(ev.clientX, ev.clientY);
      if (!nearMan(c.x, c.y)) return;
      ev.preventDefault();
      slide.dragging = true;
      slide.moved = false;
      slide.pointer = ev.pointerId;
      slide.downX = ev.clientX;
      slide.downY = ev.clientY;
      slide.grabDy = c.y - slidePoint().y;
      try {
        canvas.setPointerCapture(ev.pointerId);
      } catch {
        /* capture is best-effort */
      }
      canvas.style.cursor = "grabbing";
    };
    const onMove = (ev: PointerEvent) => {
      if (!slide.dragging) {
        if (ev.pointerType === "mouse") {
          const c = toCanvas(ev.clientX, ev.clientY);
          canvas.style.cursor = nearMan(c.x, c.y) ? "grab" : "";
        }
        return;
      }
      if (ev.pointerId !== slide.pointer) return;
      ev.preventDefault();
      if (Math.hypot(ev.clientX - slide.downX, ev.clientY - slide.downY) > 4) slide.moved = true;
      const c = toCanvas(ev.clientX, ev.clientY);
      const feetY = c.y - slide.grabDy;
      slide.p = snapToPath(path, c.x, feetY, slide.p);
      slide.lift = Math.max(0, slidePoint().y - feetY);
      const k = logUnder();
      slide.sel = k;
      publish();
      emit(false);
    };
    const onUp = (ev: PointerEvent) => {
      if (!slide.dragging || ev.pointerId !== slide.pointer) return;
      slide.dragging = false;
      canvas.style.cursor = "";
      justDragged.current = performance.now();
      // he stays exactly where he was let go; the email under him stays open
      slide.sel = logUnder();
      publish();
      emit(true);
    };
    const onTouchStart = (ev: TouchEvent) => {
      // claim the gesture before the browser starts scrolling the page
      const t = ev.touches[0];
      if (!t) return;
      const c = toCanvas(t.clientX, t.clientY);
      if (nearMan(c.x, c.y)) ev.preventDefault();
    };
    const onTouchMove = (ev: TouchEvent) => {
      if (slide.dragging) ev.preventDefault();
    };
    const onKey = (ev: KeyboardEvent) => {
      if (!order.length) return;
      let pos = slide.sel >= 0 ? order.indexOf(slide.sel) : -1;
      if (ev.key === "ArrowRight" || ev.key === "ArrowUp")
        pos = Math.min(order.length - 1, pos + 1);
      else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown")
        pos = Math.max(0, pos < 0 ? 0 : pos - 1);
      else if (ev.key === "Home") pos = 0;
      else if (ev.key === "End") pos = order.length - 1;
      else return;
      ev.preventDefault();
      const k = order[pos];
      const sl = slots[k];
      slide.p = pathPosOnGirder(path, sl.level, sl.x);
      const stack = slots
        .filter((o) => o.level === sl.level && Math.abs(o.x - sl.x) < 0.5)
        .sort((A, B) => B.y - A.y);
      slide.lift = stack.indexOf(sl) * (sl.s + 1);
      slide.sel = k;
      publish();
      emit(true);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("keydown", onKey);

    const frame = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const st = stateRef.current;

      // spawn
      nextThrow -= dt;
      if (replies.length && nextThrow <= 0 && st.barrels.length < 4) {
        const index = replies[replyCursor % replies.length];
        replyCursor += 1;
        const g = girder(n - 1, n);
        const bx = g.highRight ? g.right - 20 : g.left + 20;
        st.barrels.push({
          x: bx,
          y: g.yAt(bx) - 6,
          vx: 0,
          vy: 0,
          level: n - 1,
          index,
          rot: 0,
          falling: false,
          colour: outcomeInfo[avenueEmails[index].o].colour,
          fee: isFee(index),
          heart: corr(index).heart,
        });
        throwAnim = 350;
        nextThrow = reduce ? 6000 : 2300 + Math.random() * 900;
      }
      throwAnim = Math.max(0, throwAnim - dt);

      // barrels physics
      const speed = reduce ? 0.03 : 0.07;
      for (const b of st.barrels) {
        const g = girder(b.level, n);
        if (!b.falling) {
          b.vx = (g.highRight ? -1 : 1) * speed * dt;
          b.x += b.vx;
          b.y = g.yAt(b.x) - 6;
          b.rot += b.vx / 6;
          if (b.x > g.right + 2 || b.x < g.left - 2) {
            b.falling = true;
            b.vy = 0;
          }
        } else {
          b.vy += 0.0009 * dt;
          b.y += b.vy * dt;
          b.rot += 0.05;
          const below = b.level - 1;
          if (below >= 0) {
            const gb = girder(below, n);
            if (b.y >= gb.yAt(b.x) - 6) {
              b.level = below;
              b.falling = false;
              b.y = gb.yAt(b.x) - 6;
            }
          }
        }
      }
      st.barrels = st.barrels.filter((b) => b.y < H + 20);

      // climber: uphill only, bottom to the highest avenue reached, then back to the bottom
      const walk = (reduce ? 0.02 : 0.045) * dt;
      const cg = girder(climber.level, n);
      climber.alpha =
        climber.mode === "fade"
          ? Math.max(0, climber.alpha - dt / 350)
          : Math.min(1, climber.alpha + dt / 350);
      if (climber.mode === "walk") {
        const atTop = climber.level >= front;
        const target = atTop
          ? cg.highRight
            ? cg.right - 12
            : cg.left + 12
          : ladderX(climber.level, n) + 4;
        if (climber.duck <= 0) climber.x += climber.dir * walk;
        if ((climber.dir > 0 && climber.x >= target) || (climber.dir < 0 && climber.x <= target)) {
          climber.x = target;
          if (atTop) {
            climber.mode = "rest";
            climber.t = 1100;
          } else {
            climber.mode = "climb";
            climber.y = cg.yAt(climber.x);
            climber.h = 0;
            climber.vh = 0;
            climber.duck = 0;
          }
        }
      } else if (climber.mode === "climb") {
        const up = girder(climber.level + 1, n);
        climber.y -= (reduce ? 0.02 : 0.04) * dt;
        if (climber.y <= up.yAt(climber.x)) {
          climber.level += 1;
          climber.mode = "walk";
          climber.dir = up.highRight ? 1 : -1;
        }
      } else if (climber.mode === "rest") {
        climber.t -= dt;
        if (climber.t <= 0) climber.mode = "fade";
      } else if (climber.alpha <= 0) {
        climber.level = 0;
        climber.x = startX();
        climber.dir = girder(0, n).highRight ? 1 : -1;
        climber.mode = "walk";
        climber.h = 0;
        climber.vh = 0;
        climber.duck = 0;
      }
      if (climber.mode === "walk") {
        // a barrel coming down his girder towards him: hop it (mostly) or duck under it, never retreat
        const threat = st.barrels.find(
          (b) =>
            b.level === climber.level &&
            !b.falling &&
            (b.x - climber.x) * climber.dir > -4 &&
            Math.abs(b.x - climber.x) < 24,
        );
        if (threat && climber.h === 0 && climber.duck <= 0) {
          if (Math.random() < 0.75) climber.vh = 0.2;
          else climber.duck = 420;
        }
      }
      if (climber.h > 0 || climber.vh > 0) {
        climber.h += climber.vh * dt;
        climber.vh -= 0.0011 * dt;
        if (climber.h <= 0) {
          climber.h = 0;
          climber.vh = 0;
        }
      }
      climber.duck = Math.max(0, climber.duck - dt);

      // draw
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0b0a12");
      sky.addColorStop(1, "#15110d");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // stars
      ctx.fillStyle = "rgba(244,239,230,0.35)";
      for (let i = 0; i < 26; i++) ctx.fillRect((i * 97) % W, (i * 53) % (H - 40), 1, 1);

      // top platform + goal: the ape stands over the top girder's high end, the record chest opposite
      const apeRight = girder(n - 1, n).highRight;
      const apeX = apeRight ? W - 44 : 44;
      ctx.fillStyle = "#4a3f33";
      ctx.fillRect(apeRight ? W - 134 : X0, TOP - 6, 120, 6);
      drawApe(ctx, apeX, TOP - 6, now, throwAnim > 0);
      const chestX = apeRight ? 20 : W - 46;
      ctx.fillStyle = "#c4a574";
      ctx.fillRect(chestX, TOP - 22, 26, 16);
      ctx.fillStyle = "#7a5f3a";
      ctx.fillRect(chestX, TOP - 22, 26, 5);
      ctx.fillStyle = "#14110e";
      ctx.fillRect(chestX + 11, TOP - 16, 4, 5);
      ctx.fillStyle = "#4a3f33";
      ctx.fillRect(apeRight ? X0 : W - 60, TOP - 6, 46, 6);

      for (let li = 0; li < n; li++) drawLadder(ctx, li, n);
      inst.levels.forEach((level, li) => drawGirder(ctx, level, li, n, now));
      ctx.font = "600 8px Outfit, system-ui, sans-serif";
      ctx.textBaseline = "alphabetic";
      inst.levels.forEach((level, li) => {
        const g = girder(li, n);
        ctx.fillStyle = level.status === "na" ? "#59606b" : "rgba(244,239,230,0.62)";
        const label =
          (li + 1).toString() +
          " " +
          (level.rung
            ? level.rung.s
            : level.phase === "foi" && !level.applicable
              ? "FOI"
              : shortName(level));
        ctx.fillText(label, g.left + 2, g.yAt(g.left + 2) + 17);
        if (level.rung && isPaid(level.rung)) {
          // PAID rung: a money route, not used (Sion pays for nothing)
          const w = ctx.measureText(label).width;
          ctx.fillStyle = "#ffd34d";
          ctx.fillText(" PAID", g.left + 2 + w, g.yAt(g.left + 2) + 17);
        }
      });
      for (const s of st.slots)
        if (s.dx !== undefined && s.dy !== undefined) drawDiamond(ctx, s.dx, s.dy, now);
      for (const s of st.slots) drawExchange(ctx, s, reduce ? 0 : now, !reduce);
      for (const s of st.slots) if (s.fee) drawFee(ctx, s.x, s.y - s.s / 2 - 3, 2);
      for (const b of st.barrels) {
        // thrown replies come down as fireballs (hearts when the reply was fully satisfactory)
        if (b.heart) drawHeart(ctx, b.x, b.y, 11, now, "mail");
        else drawFire(ctx, b.x, b.y, 12, now, b.index);
        if (b.fee) drawFee(ctx, b.x, b.y - 9, 2);
      }
      const cy =
        climber.mode === "climb" ? climber.y : girder(climber.level, n).yAt(climber.x) - climber.h;
      ctx.save();
      ctx.globalAlpha = climber.alpha;
      drawClimber(
        ctx,
        climber.x,
        cy,
        climber.dir,
        climber.mode === "rest" ? 0 : now,
        climber.duck > 0,
      );
      ctx.restore();
      const sp = slidePoint();
      drawSlider(
        ctx,
        sp.x,
        sp.y,
        now,
        slide.dragging || slide.sel >= 0,
        slide.p === 0 && !slide.dragging,
      );
      // the log he is over glows on top of him, so it stays visible under his feet
      if (slide.sel >= 0) drawPick(ctx, slots[slide.sel], now);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(slideTimer);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("keydown", onKey);
    };
  }, [inst, n, H, replies]);

  const handleTap = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (performance.now() - justDragged.current < 400) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const st = stateRef.current;
    // a diamond (attachment) on the girder line wins over the icon above it
    let gem: Slot | null = null;
    let gemD = 9;
    for (const s of st.slots) {
      if (s.dx === undefined || s.dy === undefined) continue;
      const d = Math.hypot(s.dx - x, s.dy - y);
      if (d < gemD) {
        gem = s;
        gemD = d;
      }
    }
    if (gem) {
      onHit({ kind: "diamond", index: gem.index, level: inst.levels[gem.level] }, inst);
      return;
    }
    for (const b of st.barrels) {
      if (Math.hypot(b.x - x, b.y - y) < 15) {
        const level = inst.levels[b.level] ?? inst.levels[0];
        const home = inst.levels.find((l) => l.items.includes(b.index)) ?? level;
        onHit({ kind: "email", index: b.index, level: home }, inst);
        return;
      }
    }
    let best: Slot | null = null;
    let bestD = 12;
    for (const s of st.slots) {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    if (best) {
      onHit({ kind: "email", index: best.index, level: inst.levels[best.level] }, inst);
      return;
    }
    const apeRight = girder(n - 1, n).highRight;
    if (y < TOP + 4 && (apeRight ? x > W - 140 : x < 140)) {
      onHit({ kind: "boss" }, inst);
      return;
    }
    for (let li = 0; li < n; li++) {
      const g = girder(li, n);
      const gy = g.yAt(Math.min(Math.max(x, g.left), g.right));
      if (y > gy - 32 && y < gy + 18) {
        onHit({ kind: "level", level: inst.levels[li], levelIndex: li }, inst);
        return;
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-2">
        <label className="sr-only" htmlFor="avenue-inst">
          Institution
        </label>
        <select
          id="avenue-inst"
          value={inst.id}
          onChange={(event) => onInstChange(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-base text-fg"
        >
          {institutions.map((i, k) => (
            <option key={i.id} value={i.id}>
              {`${k + 1} · ${i.name}`}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onHit({ kind: "boss" }, inst)}
          aria-label="Roadmap for this institution"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-lg text-brass"
        >
          ?
        </button>
      </div>
      {inst.ramp && (
        <p className="mb-2 px-1 text-xs leading-snug text-muted" data-ramp={inst.id}>
          <span className="text-fg">{inst.ramp.rungs.length} rungs</span> ·{" "}
          {inst.ramp.regimes.join(" · ")}
        </p>
      )}
      <div
        ref={wrapRef}
        className="overflow-hidden rounded-2xl border border-line outline-none focus-visible:ring-2 focus-visible:ring-[#ffd34d]"
        tabIndex={0}
        role="slider"
        aria-label="Slide-me man: drag him along the girders, or use the arrow keys to step from email to email"
        aria-valuemin={0}
      >
        <canvas
          ref={canvasRef}
          className="block touch-manipulation"
          onClick={(event) => handleTap(event.clientX, event.clientY)}
          role="img"
          aria-label={`Escalation climb for ${inst.name}`}
        />
      </div>
    </div>
  );
}

const SHORT: Record<string, string> = {
  enquiry: "Enquiry",
  foi: "FOI / EIR",
  eir: "EIR",
  sar: "Subject access",
  review: "Internal review",
  complaint: "Complaint",
  ico: "ICO",
  icr: "Complaints Reviewer",
  psow: "Ombudsman (Wales)",
  phso: "Ombudsman (UK, via MP)",
  iopc: "IOPC / PCC review",
  iac: "Independent Assessor",
  ccw: "CCW / Ofwat",
  charity: "Trustees / Charity Commission",
  regulator: "Regulator",
  democratic: "MP / MS / councillors",
  petition: "Senedd petition",
  register: "Rectify / indemnity",
  courtrec: "Court records",
  tribunal: "Tribunal",
  preaction: "Pre-action letter",
  disclosure: "Court disclosure order",
};

function shortName(level: AvLevel) {
  return SHORT[level.phase] ?? level.phase;
}
