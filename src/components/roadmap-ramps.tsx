import { useEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "@/components/detail-modal";
import { CLASS } from "@/components/disclosure-record";
import { FIRE_A, PAL } from "@/components/avenue-game";

/**
 * Roadmap ramps: the Donkey Kong climb as a dated roadmap. One institution at a time; each girder is one
 * escalation step (Request at the bottom, Court at the top), dates run along the girders, every case email
 * sits at its date, replies still due sit as faint envelopes at their due date, missed deadlines burn, and
 * the man in green overalls stands at TODAY (worked out in the browser). Data: /data/roadmap.json.
 * — Sion's Tab agent, 21 Oct 2026
 */

type Step = {
  n: number; key: string; label: string; date: string | null; date_kind: "actual" | "projected";
  status: "done" | "missed" | "pending" | "not yet reached" | "na"; basis: string; body: string | null;
  link: string | null; ev: string | null; note: string | null; axis: string | null;
};
type Email = {
  id: string; date: string; dir: "sent" | "received"; cls: string; subject: string; summary: string;
  url: string | null; wayback: string | null; ev: string | null; cid: string; att: number;
  deadline: string | null; deadline_met: string;
};
type Due = { date: string; kind: string; cid: string | null; ev: string | null; url: string | null; title: string; ref: string; regime?: string; basis?: string; status?: string };
type Lane = {
  id: string; name: string; kind: string; regime: string | null; note: string; ombudsman: string | null; court: string | null;
  anchored: boolean; lead: { cid: string; ev: string | null; url: string | null; title: string; ref: string; regime: string } | null;
  reached: number; next: { n: number; label: string; date: string | null; status: string } | null;
  counts: { emails: number; sent: number; received: number; requests: number; missed: number; met: number; expected: number };
  steps: Step[]; emails: Email[]; expected: Due[]; missed: Due[]; met: Due[];
  requests: { cid: string; ev: string | null; url: string | null; title: string }[];
};
type Roadmap = { as_of: string; generated: string; lanes: Lane[]; totals: { institutions: number; steps: number } };

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86400000;
const ms = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const fmt = (s: string | null | undefined) => (s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : "—");
const fmtShort = (s: string) => `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]}`;
function todayIso() {
  const d = new Date();
  return iso(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export const STATUS: Record<Step["status"], { label: string; colour: string }> = {
  done: { label: "Done", colour: "#2e9e57" },
  missed: { label: "Missed", colour: "#e5484d" },
  pending: { label: "Pending", colour: "#f0a020" },
  "not yet reached": { label: "Not yet reached", colour: "#5a7bd8" },
  na: { label: "Not applicable", colour: "#4a505b" },
};

/* ---------- geometry: 12 girders (0 = before the first request, 1..11 = the ladder) ---------- */
const W = 360;
const N = 12;
const TOP = 70;
const LH = 47;
const X0 = 10;
const X1 = W - 10;
const GAP = 26;
const TILT = 6;
const H = TOP + N * LH + 18;

function girder(level: number) {
  const yBase = TOP + (N - 1 - level) * LH + 30;
  const highRight = level % 2 === 0;
  const left = highRight ? X0 + GAP : X0;
  const right = highRight ? X1 : X1 - GAP;
  const yL = highRight ? yBase + TILT / 2 : yBase - TILT / 2;
  const yR = highRight ? yBase - TILT / 2 : yBase + TILT / 2;
  return { left, right, yL, yR, highRight, yAt: (x: number) => yL + ((x - left) / (right - left)) * (yR - yL) };
}
const ladderX = (level: number) => {
  const g = girder(level);
  return g.highRight ? g.right - 22 : g.left + 14;
};
/** Walking span on a girder: from where the ladder below lands to where the ladder up leaves. */
function span(level: number) {
  const g = girder(level);
  const from = level === 0 ? g.left + 8 : ladderX(level - 1) + 4;
  const to = level === N - 1 ? (g.highRight ? g.right - 70 : g.left + 70) : ladderX(level);
  return { from, to, g };
}

type Axis = { start: number[]; end: number[] };
function buildAxis(lane: Lane, today: number): Axis {
  const st: number[] = [];
  const firstMail = lane.emails.length ? ms(lane.emails[0].date) : today;
  const s1 = lane.steps[0]?.axis ? ms(lane.steps[0].axis) : today;
  st[0] = Math.min(firstMail, s1) - 14 * DAY;
  for (let i = 1; i < N; i++) {
    const a = lane.steps[i - 1]?.axis;
    st[i] = a ? Math.max(ms(a), st[i - 1]) : st[i - 1];
  }
  const end: number[] = [];
  for (let i = 0; i < N; i++) end[i] = i < N - 1 ? st[i + 1] : st[i] + 60 * DAY;
  return { start: st, end };
}
function levelOf(axis: Axis, t: number) {
  for (let i = N - 1; i >= 0; i--) if (t >= axis.start[i] && (t < axis.end[i] || i === N - 1)) {
    if (t === axis.start[i] && i > 0 && axis.end[i - 1] === axis.start[i] && axis.start[i] === axis.end[i]) continue;
    return i;
  }
  return 0;
}
function placeAt(axis: Axis, t: number) {
  const lv = levelOf(axis, t);
  const { from, to, g } = span(lv);
  const a = axis.start[lv];
  const b = axis.end[lv];
  const f = b > a ? Math.min(1, Math.max(0, (t - a) / (b - a))) : 0;
  const x = from + (to - from) * f;
  return { level: lv, x, y: g.yAt(x) };
}

/* ---------- sprites ---------- */
function envelope(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string, alpha = 1, dashed = false, ring?: string) {
  const w = 11;
  const h = 8;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (dashed) {
    ctx.setLineDash([2, 1.5]);
    ctx.strokeStyle = fill;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - w / 2, y - h, w, h);
  } else {
    ctx.fillStyle = fill;
    ctx.fillRect(x - w / 2, y - h, w, h);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = dashed ? fill : "rgba(0,0,0,0.55)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h);
  ctx.lineTo(x, y - h / 2 + 0.5);
  ctx.lineTo(x + w / 2, y - h);
  ctx.stroke();
  if (ring) {
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x - w / 2 - 1.5, y - h - 1.5, w + 3, h + 3);
  }
  ctx.restore();
}
function drawGrid(ctx: CanvasRenderingContext2D, grid: string[], cx: number, cy: number, size: number) {
  const rows = grid.length;
  const cols = grid[0].length;
  const p = size / Math.max(rows, cols);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (ch === ".") continue;
      ctx.fillStyle = PAL[ch] ?? ch;
      ctx.fillRect(cx - (cols * p) / 2 + c * p, cy - (rows * p) / 2 + r * p, p + 0.35, p + 0.35);
    }
}
function drawApe(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const p = 3;
  const px = (cx: number, cy: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + cx * p, y + cy * p, w * p, h * p);
  };
  const up = Math.floor(t / 900) % 3 === 0;
  const fur = "#6b4a2f";
  px(-5, -10, 10, 9, fur);
  px(-4, -15, 8, 6, fur);
  px(-3, -13, 6, 4, "#d8b48a");
  px(-2, -13, 1, 1, "#111");
  px(1, -13, 1, 1, "#111");
  px(-2, -11, 4, 1, "#3e2a1a");
  px(-3, -6, 6, 4, "#8a6545");
  if (up) {
    px(-8, -17, 3, 8, fur);
    px(5, -17, 3, 8, fur);
  } else {
    px(-8, -9, 3, 8, fur);
    px(5, -9, 3, 8, fur);
  }
  px(-5, -1, 4, 2, "#3e2a1a");
  px(1, -1, 4, 2, "#3e2a1a");
}
function drawMan(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, label: string) {
  const p = 2;
  const bob = Math.round(Math.sin(t / 300) * 1.2);
  const px = (cx: number, cy: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + cx * p, y + bob + cy * p, w * p, h * p);
  };
  // sign on a pole: TODAY + date
  const side = x > W - 50 ? -1 : 1;
  const sx = x + 10 * side;
  const sy = y - 46 + bob;
  ctx.fillStyle = "#8a6545";
  ctx.fillRect(sx - 1, sy + 9, 2, 22);
  ctx.fillStyle = "#ffd34d";
  ctx.fillRect(sx - 27, sy - 4, 54, 14);
  ctx.strokeStyle = "#14110e";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx - 26.5, sy - 3.5, 53, 13);
  ctx.fillStyle = "#14110e";
  ctx.font = "800 7.5px Outfit, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, sx, sy + 3.2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  px(-2, -14, 5, 2, "#f4efe6");
  px(-3, -13, 7, 1, "#f4efe6");
  px(-2, -12, 4, 3, "#c98d5e");
  px(1, -11, 1, 1, "#111");
  px(-3, -9, 6, 5, "#2fa36b");
  px(-1, -8, 2, 2, "#ffd34d");
  if (side > 0) {
    px(3, -12, 1, 4, "#c98d5e");
    px(-4, -8, 1, 3, "#c98d5e");
  } else {
    px(-4, -12, 1, 4, "#c98d5e");
    px(3, -8, 1, 3, "#c98d5e");
  }
  px(-2, -4, 2, 4, "#1f3b2c");
  px(0, -4, 2, 4, "#1f3b2c");
  ctx.strokeStyle = "rgba(255,211,77,0.8)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 9, 2.5, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/* ---------- hits ---------- */
type Hit =
  | { kind: "emails"; level: number; items: Email[] }
  | { kind: "due"; level: number; item: Due }
  | { kind: "missed"; level: number; item: Due }
  | { kind: "met"; level: number; item: Due }
  | { kind: "step"; level: number }
  | { kind: "today"; level: number }
  | { kind: "court" };
type Target = { x: number; y: number; r: number; hit: Hit };

function stepColour(s: Step | undefined) {
  return s ? STATUS[s.status].colour : "#8a817a";
}

function layout(lane: Lane, today: number) {
  const axis = buildAxis(lane, today);
  const targets: Target[] = [];
  // email stacks: bucket by level + 10px of x
  const buckets = new Map<string, { level: number; x: number; y: number; items: Email[] }>();
  for (const e of lane.emails) {
    const p = placeAt(axis, ms(e.date));
    const bx = Math.round(p.x / 10) * 10;
    const key = `${p.level}:${bx}`;
    const b = buckets.get(key) ?? { level: p.level, x: bx, y: span(p.level).g.yAt(bx), items: [] };
    b.items.push(e);
    buckets.set(key, b);
  }
  const stacks = [...buckets.values()];
  for (const s of stacks) targets.push({ x: s.x, y: s.y - 10, r: 9, hit: { kind: "emails", level: s.level, items: s.items } });
  const marks = (list: Due[], kind: "due" | "missed" | "met") =>
    list.map((d) => {
      const p = placeAt(axis, ms(d.date));
      targets.push({ x: p.x, y: p.y - (kind === "met" ? 4 : 12), r: 10, hit: { kind, level: p.level, item: d } as Hit });
      return { ...p, d };
    });
  const due = marks(lane.expected, "due");
  const missed = marks(lane.missed, "missed");
  const met = marks(lane.met, "met");
  const tp = placeAt(axis, today);
  targets.push({ x: tp.x, y: tp.y - 14, r: 14, hit: { kind: "today", level: tp.level } });
  for (let lv = 1; lv < N; lv++) {
    const { from, g } = span(lv);
    targets.push({ x: from + (g.highRight ? 28 : -28), y: g.yAt(from) + 13, r: 16, hit: { kind: "step", level: lv } });
  }
  const top = girder(N - 1);
  const apeX = top.highRight ? top.right - 30 : top.left + 30;
  targets.push({ x: apeX, y: top.yAt(apeX) - 28, r: 26, hit: { kind: "court" } });
  return { axis, stacks, due, missed, met, tp, apeX, targets };
}

function monthTicks(axis: Axis, lv: number) {
  const a = axis.start[lv];
  const b = axis.end[lv];
  if (b - a < 20 * DAY) return [] as { t: number; label: string }[];
  const out: { t: number; label: string }[] = [];
  const d = new Date(a);
  let m = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  const months = (b - a) / (30 * DAY);
  const every = months > 30 ? 12 : months > 14 ? 3 : months > 6 ? 2 : 1;
  while (m < b) {
    const dd = new Date(m);
    if (dd.getUTCMonth() % every === 0)
      out.push({ t: m, label: dd.getUTCMonth() === 0 ? `${dd.getUTCFullYear()}` : `${MON[dd.getUTCMonth()]}` });
    m = Date.UTC(dd.getUTCFullYear(), dd.getUTCMonth() + 1, 1);
  }
  return out;
}

function draw(ctx: CanvasRenderingContext2D, lane: Lane, L: ReturnType<typeof layout>, t: number, todayStr: string, motion: boolean) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0d0b09";
  ctx.fillRect(0, 0, W, H);
  const { axis } = L;
  // girders + ladders + labels
  for (let lv = 0; lv < N; lv++) {
    const g = girder(lv);
    const s = lv > 0 ? lane.steps[lv - 1] : undefined;
    const col = lv === 0 ? "#6f6558" : stepColour(s);
    const na = s?.status === "na";
    const future = s?.status === "not yet reached";
    ctx.beginPath();
    ctx.moveTo(g.left, g.yL);
    ctx.lineTo(g.right, g.yR);
    ctx.lineTo(g.right, g.yR + 6);
    ctx.lineTo(g.left, g.yL + 6);
    ctx.closePath();
    ctx.fillStyle = na ? "#262a31" : future ? "rgba(90,123,216,0.22)" : col;
    ctx.fill();
    ctx.strokeStyle = na ? "#4a505b" : col;
    ctx.lineWidth = 1;
    if (future || na) ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!na && !future) {
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      for (let x = g.left + 4; x < g.right - 6; x += 9) {
        const y = g.yAt(x);
        ctx.beginPath();
        ctx.moveTo(x, y + 1);
        ctx.lineTo(x + 4.5, y + 5);
        ctx.lineTo(x + 9, y + 1);
        ctx.stroke();
      }
    }
    if (s?.status === "missed") {
      const pulse = motion ? 0.35 + 0.35 * Math.sin(t / 220) : 0.6;
      ctx.strokeStyle = `rgba(255,77,79,${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.left, g.yL - 2);
      ctx.lineTo(g.right, g.yR - 2);
      ctx.stroke();
    }
    if (lv < N - 1) {
      const x = ladderX(lv);
      const y0 = g.yAt(x);
      const y1 = girder(lv + 1).yAt(x) + 6;
      ctx.strokeStyle = "rgba(196,165,116,0.45)";
      ctx.lineWidth = 1.3;
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
    // labels under the girder: step name at the walking start, dates along it
    const { from, to } = span(lv);
    const yb = (x: number) => g.yAt(x) + 15;
    ctx.font = "700 8.5px Outfit, system-ui, sans-serif";
    ctx.textBaseline = "alphabetic";
    const dStr = lv === 0 ? null : s?.date ?? null;
    const when = dStr && !na ? ` · ${fmtShort(dStr)} ${dStr.slice(2, 4)}` : "";
    const base = lv === 0 ? `Earlier letters · from ${fmtShort(iso(axis.start[0] + 14 * DAY))} ${iso(axis.start[0] + 14 * DAY).slice(2, 4)}` : `${lv} · ${s?.label ?? ""}`;
    const short = base.length > 27 ? base.slice(0, 26) + "…" : base;
    const nameFont = "700 8.5px Outfit, system-ui, sans-serif";
    const whenFont = "600 8px Outfit, system-ui, sans-serif";
    ctx.font = nameFont;
    const wName = ctx.measureText(short).width;
    ctx.font = whenFont;
    const wWhen = when ? ctx.measureText(when).width : 0;
    const ltr = from < to;
    const anchor = ltr ? Math.max(from - 2, g.left + 2) : Math.min(from + 2, g.right - 2);
    const sx0 = ltr ? anchor : anchor - wName - wWhen;
    ctx.textAlign = "left";
    ctx.font = nameFont;
    ctx.fillStyle = lv === 0 ? "#a39888" : na ? "#6f6558" : col;
    ctx.fillText(short, sx0, yb(anchor));
    if (when) {
      ctx.font = whenFont;
      ctx.fillStyle = s?.date_kind === "projected" ? "#a39888" : "#f4efe6";
      ctx.fillText(when, sx0 + wName, yb(anchor));
    }
    // month ticks
    ctx.font = "500 7px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const m of monthTicks(axis, lv)) {
      const p = placeAt(axis, m.t);
      if (p.level !== lv) continue;
      ctx.strokeStyle = "rgba(244,239,230,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 6);
      ctx.lineTo(p.x, p.y + 9);
      ctx.stroke();
      if (Math.abs(p.x - from) > 175 && Math.abs(p.x - to) > 12) {
        ctx.fillStyle = "rgba(244,239,230,0.45)";
        ctx.fillText(m.label, p.x, p.y + 23);
      }
    }
  }
  ctx.textAlign = "start";
  // court + ape at the top
  const top = girder(N - 1);
  const ax = L.apeX;
  const ay = top.yAt(ax) - 1;
  ctx.fillStyle = "#c4a574";
  ctx.fillRect(ax - 26, ay - 66, 52, 14);
  ctx.fillStyle = "#14110e";
  ctx.font = "800 8.5px Outfit, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("COURT", ax, ay - 56);
  ctx.textAlign = "start";
  drawApe(ctx, ax, ay, motion ? t : 0);
  // barrels rolling down the climb (decorative: the fob-offs)
  if (motion) {
    for (let k = 0; k < 2; k++) {
      const f = ((t / 14000 + k * 0.5) % 1);
      const lvF = (N - 1) * (1 - f);
      const lv = Math.floor(lvF);
      const fr = lvF - lv;
      const { from, to, g } = span(lv);
      const x = to + (from - to) * (1 - fr);
      const y = g.yAt(x) - 5;
      ctx.fillStyle = "#8a5a2b";
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3e2a1a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 4, y + Math.sin(t / 120) * 2);
      ctx.lineTo(x + 4, y - Math.sin(t / 120) * 2);
      ctx.stroke();
    }
  }
  // met deadlines: green post
  for (const m of L.met) {
    ctx.fillStyle = "#2e9e57";
    ctx.fillRect(m.x - 0.75, m.y - 12, 1.5, 12);
    ctx.beginPath();
    ctx.moveTo(m.x + 0.75, m.y - 12);
    ctx.lineTo(m.x + 7, m.y - 9.5);
    ctx.lineTo(m.x + 0.75, m.y - 7);
    ctx.fill();
  }
  // emails, stacked
  for (const s of L.stacks) {
    const show = s.items.slice(0, 3);
    show.forEach((e, i) => {
      const fill = e.dir === "sent" ? "#e9e2d4" : (CLASS[e.cls] ?? CLASS["no reply"]).colour;
      envelope(ctx, s.x, s.y - 2 - i * 7, fill, 1, false);
    });
    if (s.items.length > 3) {
      ctx.fillStyle = "#ffd34d";
      ctx.font = "800 7px Outfit, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${s.items.length}`, s.x, s.y - 2 - 3 * 7 - 2);
      ctx.textAlign = "start";
    }
  }
  // expected replies: faint dashed envelopes (red if the day has passed since the build)
  const now = ms(todayStr);
  for (const d of L.due) {
    const past = ms(d.d.date) < now;
    const a = motion ? 0.4 + 0.15 * Math.sin(t / 400) : 0.45;
    envelope(ctx, d.x, d.y - 4, past ? "#ff6b6b" : "#f4efe6", a, true);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = past ? "#ff6b6b" : "#f4efe6";
    ctx.font = "600 6.5px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fmtShort(d.d.date), d.x, d.y - 15);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }
  // missed deadlines: fire
  for (const m of L.missed) drawGrid(ctx, FIRE_A, m.x, m.y - 9, 13);
  // the man at today
  drawMan(ctx, L.tp.x, L.tp.y - 1, motion ? t : 0, `TODAY ${fmtShort(todayStr)}`);
}

/* ---------- sheet ---------- */
function A({ href, children }: { href: string | null | undefined; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-2">
      {children}
    </a>
  );
}
function Chip({ status }: { status: Step["status"] }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-[#14110e]" style={{ background: STATUS[status].colour }}>
      {STATUS[status].label}
    </span>
  );
}
function stepAt(lane: Lane, level: number) {
  return level > 0 ? lane.steps[level - 1] : undefined;
}
function StepLine({ lane, level }: { lane: Lane; level: number }) {
  const s = stepAt(lane, level);
  return (
    <p className="text-sm text-muted">
      {s ? `Step ${s.n} of 11 · ${s.label}` : "Before the first request on the ladder"}
    </p>
  );
}
function Sheet({ hit, lane }: { hit: Hit; lane: Lane }) {
  const head = <h3 className="font-serif text-lg leading-snug text-fg">{lane.name}</h3>;
  if (hit.kind === "emails")
    return (
      <div className="space-y-3">
        {head}
        <StepLine lane={lane} level={hit.level} />
        <ul className="space-y-3">
          {hit.items.map((e) => (
            <li key={e.id} className="border-t border-line pt-2">
              <p className="text-xs text-muted">
                {fmt(e.date)} · {e.dir === "sent" ? "Sent by the family" : "Reply received"} ·{" "}
                <span style={{ color: (CLASS[e.cls] ?? CLASS["no reply"]).colour }}>{(CLASS[e.cls] ?? CLASS["no reply"]).label}</span>
              </p>
              <p className="text-sm font-semibold text-fg">{e.subject}</p>
              {e.summary && <p className="text-sm text-muted">{e.summary}</p>}
              {e.deadline && <p className="text-xs text-muted">Statutory deadline {fmt(e.deadline)} · {e.deadline_met}</p>}
              <p className="mt-1 flex flex-wrap gap-3 text-sm">
                <A href={e.url}>Email</A>
                <A href={e.wayback}>Wayback copy</A>
                {e.ev && <A href={lane.requests.find((r) => r.cid === e.cid)?.url ?? null}>{e.ev}</A>}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  if (hit.kind === "due" || hit.kind === "missed" || hit.kind === "met") {
    const d = hit.item;
    const word = hit.kind === "due" ? "Reply expected" : hit.kind === "missed" ? "Deadline missed" : "Deadline met";
    return (
      <div className="space-y-2">
        {head}
        <StepLine lane={lane} level={hit.level} />
        <p className="text-sm text-fg">
          <span className="font-semibold">{word}</span> · {fmt(d.date)}
        </p>
        <p className="text-sm text-fg">
          {d.title}
          {d.ref ? ` (${d.ref})` : ""}
        </p>
        {d.basis && <p className="text-xs text-muted">{d.basis}</p>}
        {d.status && <p className="text-xs text-muted">{d.status}</p>}
        <p className="text-sm">
          <A href={d.url}>Evidence page {d.ev ?? ""}</A>
        </p>
      </div>
    );
  }
  if (hit.kind === "court")
    return (
      <div className="space-y-2">
        {head}
        <p className="text-sm text-fg">Court: the top of the ladder, reached only after every step below is used up.</p>
        <p className="text-sm text-muted">{lane.court ?? "No court route for this body."}</p>
        <StepList lane={lane} />
      </div>
    );
  if (hit.kind === "today") {
    const s = stepAt(lane, hit.level);
    return (
      <div className="space-y-2">
        {head}
        <p className="text-sm text-fg">
          Today, {fmt(todayIso())}: {s ? `step ${s.n}, ${s.label}` : "before the first request on the ladder"}.
        </p>
        {lane.next && (
          <p className="text-sm text-fg">
            Next: step {lane.next.n}, {lane.next.label} · {fmt(lane.next.date)}
          </p>
        )}
        <StepList lane={lane} />
      </div>
    );
  }
  const s = stepAt(lane, hit.level)!;
  return (
    <div className="space-y-2">
      {head}
      <p className="text-sm text-fg">
        Step {s.n} of 11 · <span className="font-semibold">{s.label}</span>
      </p>
      <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
        <Chip status={s.status} /> {s.status !== "na" && <span>{fmt(s.date)}{s.date_kind === "projected" ? " (projected)" : ""}</span>}
      </p>
      <p className="text-sm text-muted">{s.basis}</p>
      {s.body && <p className="text-sm text-muted">With: {s.body}</p>}
      {s.note && <p className="text-sm text-muted">{s.note}</p>}
      <p className="text-sm">
        <A href={s.link}>Evidence {s.ev ?? ""}</A>
      </p>
    </div>
  );
}
function StepList({ lane }: { lane: Lane }) {
  return (
    <ol className="mt-2 space-y-1 border-t border-line pt-2">
      {[...lane.steps].reverse().map((s) => (
        <li key={s.n} className="flex items-baseline gap-2 text-sm">
          <span className="w-5 shrink-0 text-right text-muted">{s.n}</span>
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS[s.status].colour }} />
          <span className="min-w-0 flex-1 text-fg">{s.label}</span>
          <span className="shrink-0 text-xs text-muted">{s.status === "na" ? "n/a" : fmtShort(s.date ?? "2000-01-01")}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- upcoming ---------- */
type Up = { date: string; lane: Lane; kind: "reply expected" | "action due"; what: string; url: string | null; dueNow: boolean };
const ACTIONS = new Set(["chaser", "review", "regulator", "tribunal", "complaint", "preaction", "court"]);
function upcoming(lanes: Lane[], todayStr: string): Up[] {
  const t0 = ms(todayStr);
  const t1 = t0 + 30 * DAY;
  const out: Up[] = [];
  for (const lane of lanes) {
    for (const e of lane.expected) {
      const t = ms(e.date);
      if (t >= t0 && t <= t1)
        out.push({ date: e.date, lane, kind: "reply expected", what: `${e.kind === "review outcome" ? "Review outcome" : "Reply due"}: ${e.title}${e.ref ? ` (${e.ref})` : ""}`, url: e.url, dueNow: false });
    }
    if (!lane.anchored) continue;
    for (const s of lane.steps) {
      if (!ACTIONS.has(s.key) || !s.date || (s.status !== "pending" && s.status !== "not yet reached")) continue;
      const t = ms(s.date);
      const now = s.status === "pending" && t <= t0;
      if (now || (t >= t0 && t <= t1))
        out.push({ date: now ? todayStr : s.date, lane, kind: "action due", what: `${s.label}${lane.lead?.ref ? ` (${lane.lead.ref})` : ""}`, url: s.link ?? lane.lead?.url ?? null, dueNow: now });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.kind === b.kind ? a.lane.name.localeCompare(b.lane.name) : a.kind === "action due" ? -1 : 1));
}

/* ---------- component ---------- */
export function RoadmapRamps({ preferName }: { preferName?: string }) {
  const [data, setData] = useState<Roadmap | null>(null);
  const [failed, setFailed] = useState(false);
  const [laneId, setLaneId] = useState<string | null>(null);
  const [hit, setHit] = useState<Hit | null>(null);
  const [todayStr, setTodayStr] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTodayStr(todayIso());
    let off = false;
    fetch(`/data/roadmap.json?d=${todayIso()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: Roadmap) => !off && setData(j))
      .catch(() => !off && setFailed(true));
    return () => {
      off = true;
    };
  }, []);

  const lanes = useMemo(() => {
    if (!data) return [];
    const rank = (l: Lane) => (l.anchored ? 0 : l.kind === "representative" || l.kind === "platform" ? 2 : 1);
    return [...data.lanes].sort((a, b) => rank(a) - rank(b) || (a.next?.date ?? "9") .localeCompare(b.next?.date ?? "9") || b.counts.emails - a.counts.emails);
  }, [data]);

  useEffect(() => {
    if (!lanes.length) return;
    if (preferName) {
      const p = preferName.toLowerCase();
      const m = lanes.find((l) => l.name.toLowerCase() === p) ?? lanes.find((l) => l.name.toLowerCase().includes(p) || p.includes(l.name.toLowerCase()));
      if (m) {
        setLaneId(m.id);
        return;
      }
    }
    setLaneId((cur) => cur ?? lanes[0].id);
  }, [lanes, preferName]);

  const lane = lanes.find((l) => l.id === laneId) ?? null;
  const L = useMemo(() => (lane && todayStr ? layout(lane, ms(todayStr)) : null), [lane, todayStr]);
  const up = useMemo(() => (todayStr ? upcoming(lanes, todayStr) : []), [lanes, todayStr]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !lane || !L || !todayStr) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    const size = () => {
      const w = wrap.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${(w * H) / W}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(((w * H) / W) * dpr);
      ctx.setTransform((w * dpr) / W, 0, 0, (w * dpr) / W, 0, 0);
    };
    size();
    const frame = (t: number) => {
      draw(ctx, lane, L, t, todayStr, motion);
      if (motion && visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => {
      size();
      draw(ctx, lane, L, performance.now(), todayStr, motion);
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [lane, L, todayStr]);

  const onTap = (cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !L) return;
    const r = canvas.getBoundingClientRect();
    const x = ((cx - r.left) / r.width) * W;
    const y = ((cy - r.top) / r.height) * H;
    let best: Target | null = null;
    let bd = 1e9;
    for (const tg of L.targets) {
      const d = Math.hypot(tg.x - x, tg.y - y);
      if (d <= tg.r + 6 && d < bd) {
        bd = d;
        best = tg;
      }
    }
    if (best) setHit(best.hit);
    else {
      // nearest girder: open its step
      let lv = -1;
      let dy = 1e9;
      for (let i = 1; i < N; i++) {
        const g = girder(i);
        const d = Math.abs(g.yAt(Math.min(Math.max(x, g.left), g.right)) - y);
        if (d < dy && x >= g.left - 4 && x <= g.right + 4) {
          dy = d;
          lv = i;
        }
      }
      if (lv > 0 && dy < 22) setHit({ kind: "step", level: lv });
    }
  };

  const pick = (id: string) => {
    setLaneId(id);
    setHit(null);
    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const idx = lane ? lanes.indexOf(lane) : -1;
  const dueNow = up.filter((u) => u.dueNow);
  const later = up.filter((u) => !u.dueNow);
  const shown = all ? later : later.slice(0, 10);

  return (
    <section id="roadmap" aria-label="Roadmap to court" className="w-full scroll-mt-3">
      <div className="mb-2 flex items-center gap-2">
        <label className="sr-only" htmlFor="roadmap-lane">
          Institution
        </label>
        <button
          type="button"
          aria-label="Previous institution"
          onClick={() => idx > 0 && pick(lanes[idx - 1].id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-lg text-brass disabled:opacity-40"
          disabled={idx <= 0}
        >
          ‹
        </button>
        <select
          id="roadmap-lane"
          value={laneId ?? ""}
          onChange={(e) => pick(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-base text-fg"
        >
          {!lanes.length && <option value="">Loading the roadmap…</option>}
          {lanes.map((l) => (
            <option key={l.id} value={l.id}>
              {`${l.name} · step ${l.reached || 1}/11`}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Next institution"
          onClick={() => idx < lanes.length - 1 && pick(lanes[idx + 1].id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-lg text-brass disabled:opacity-40"
          disabled={idx < 0 || idx >= lanes.length - 1}
        >
          ›
        </button>
      </div>
      {lane && (
        <p className="mb-2 px-1 text-xs leading-snug text-muted">
          <span className="text-fg">{lane.counts.emails} emails</span> · {lane.counts.requests} requests
          {lane.counts.missed ? <span style={{ color: STATUS.missed.colour }}> · {lane.counts.missed} deadline{lane.counts.missed > 1 ? "s" : ""} missed</span> : null}
          {lane.counts.expected ? ` · ${lane.counts.expected} repl${lane.counts.expected > 1 ? "ies" : "y"} due` : ""}
          {lane.next ? ` · next: ${lane.next.label}, ${fmt(lane.next.date)}` : ""}
        </p>
      )}
      <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-line bg-[#0d0b09]" style={{ aspectRatio: `${W} / ${H}` }}>
        {failed ? (
          <p className="p-4 text-sm text-muted">The roadmap data did not load. Open /data/roadmap.json directly.</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="block touch-manipulation"
            onClick={(e) => onTap(e.clientX, e.clientY)}
            role="img"
            aria-label={lane ? `Roadmap for ${lane.name}: ${lane.steps.map((s) => `${s.n} ${s.label} ${STATUS[s.status].label} ${s.date ?? ""}`).join("; ")}` : "Roadmap loading"}
          />
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-muted" aria-label="Key">
        <li className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-[1px] bg-[#e9e2d4]" />sent</li>
        <li className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-[1px] bg-[#8b5cf6]" />reply (colour = what came back)</li>
        <li className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-[1px] border border-dashed border-[#f4efe6] opacity-60" />reply due</li>
        <li className="flex items-center gap-1"><span aria-hidden>🔥</span>deadline missed</li>
        <li className="flex items-center gap-1"><span className="inline-block h-2 w-1 bg-[#2e9e57]" />deadline met</li>
        <li className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-[#2fa36b]" />today</li>
      </ul>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-muted" aria-label="Step status">
        {(Object.keys(STATUS) as Step["status"][]).map((k) => (
          <li key={k} className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-4 rounded-sm" style={{ background: STATUS[k].colour }} />
            {STATUS[k].label}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-3">
        <h3 className="font-serif text-lg text-fg">Upcoming · next 30 days</h3>
        {!data && !failed && <p className="mt-1 text-sm text-muted">Loading…</p>}
        {dueNow.length > 0 && (
          <>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: STATUS.pending.colour }}>
              Due now · {dueNow.length}
            </p>
            <ul className="mt-1 divide-y divide-line">
              {dueNow.map((u, i) => (
                <UpRow key={`n${i}`} u={u} onPick={pick} />
              ))}
            </ul>
          </>
        )}
        {later.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Coming up · {later.length}</p>
            <ul className="mt-1 divide-y divide-line">
              {shown.map((u, i) => (
                <UpRow key={`l${i}`} u={u} onPick={pick} />
              ))}
            </ul>
            {later.length > 10 && (
              <button type="button" onClick={() => setAll(!all)} className="mt-2 text-sm text-brass underline underline-offset-2">
                {all ? "Show fewer" : `Show all ${later.length}`}
              </button>
            )}
          </>
        )}
        {data && (
          <p className="mt-3 text-xs text-muted">
            {data.totals.institutions} institutions · {data.totals.steps} steps · built {fmt(data.as_of)} ·{" "}
            <a href="/data/roadmap.json" className="underline underline-offset-2">roadmap.json</a>
          </p>
        )}
      </div>

      <DetailModal open={hit !== null && lane !== null} onClose={() => setHit(null)} accent={hit && lane && "level" in hit ? stepColour(stepAt(lane, hit.level)) : undefined}>
        {hit && lane && <Sheet hit={hit} lane={lane} />}
      </DetailModal>
    </section>
  );
}

function UpRow({ u, onPick }: { u: Up; onPick: (id: string) => void }) {
  return (
    <li className="flex items-start gap-2 py-2">
      <span
        className="mt-0.5 w-14 shrink-0 rounded-md px-1 py-0.5 text-center text-xs font-semibold"
        style={{ background: u.kind === "action due" ? "rgba(240,160,32,0.18)" : "rgba(244,239,230,0.08)", color: u.kind === "action due" ? STATUS.pending.colour : "var(--color-fg)" }}
      >
        {u.dueNow ? "now" : fmtShort(u.date)}
      </span>
      <button type="button" onClick={() => onPick(u.lane.id)} className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-fg">{u.lane.name}</span>
        <span className="block text-sm text-muted">
          {u.kind === "action due" ? "Action: " : ""}
          {u.what}
        </span>
      </button>
      {u.url && (
        <a href={u.url} target="_blank" rel="noreferrer" aria-label="Evidence page" className="shrink-0 pt-0.5 text-sm text-brass">
          ↗
        </a>
      )}
    </li>
  );
}
