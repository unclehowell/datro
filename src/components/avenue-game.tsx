import { useEffect, useMemo, useRef } from "react";
import {
  avenueEmails,
  institutions,
  isFee,
  outcomeInfo,
  statusInfo,
  type AvInstitution,
  type AvLevel,
} from "@/data/avenues";

/**
 * "Avenues": an original arcade-style climb. The ape at the top is the institution and every
 * barrel it throws is one of its replies. The climber is Sion. Each girder is one avenue of that
 * institution's escalation roadmap, bottom (first step) to top (court-ordered disclosure). Crates
 * on a girder are emails Sion sent on that avenue; small barrels resting there are replies.
 * All art is drawn here in code.
 */

export type GameHit =
  | { kind: "email"; index: number; level: AvLevel }
  | { kind: "level"; level: AvLevel; levelIndex: number }
  | { kind: "boss" };

const W = 360;
const TOP = 78;
const LH = 50;
const BOTTOM = 26;
const X0 = 14;
const X1 = W - 14;
const GAP = 30;
const TILT = 7;

type Slot = { x: number; y: number; s: number; index: number; out: boolean; colour: string; level: number; fee: boolean };
type Barrel = { x: number; y: number; vx: number; vy: number; level: number; index: number; rot: number; falling: boolean; colour: string; fee: boolean };

function girder(level: number, n: number) {
  // Each girder rises towards its ladder, so the climber only ever walks uphill and climbs up.
  // Even levels: gap on the left, high end (and ladder) on the right. Odd levels: the mirror.
  // Barrels roll downhill, away from the ladder, and drop off the low end onto the girder below.
  const yBase = TOP + (n - 1 - level) * LH + 30;
  const highRight = level % 2 === 0;
  const left = highRight ? X0 + GAP : X0;
  const right = highRight ? X1 : X1 - GAP;
  const yL = highRight ? yBase + TILT / 2 : yBase - TILT / 2;
  const yR = highRight ? yBase - TILT / 2 : yBase + TILT / 2;
  return { left, right, yL, yR, highRight, yAt: (x: number) => yL + ((x - left) / (right - left)) * (yR - yL) };
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
    let s = 8;
    let perRow = Math.max(1, Math.floor(usable / (s + 2)));
    let rows = Math.ceil(level.items.length / perRow);
    while (rows > 3 && s > 4) {
      s -= 1;
      perRow = Math.max(1, Math.floor(usable / (s + 2)));
      rows = Math.ceil(level.items.length / perRow);
    }
    level.items.forEach((index, k) => {
      const row = Math.floor(k / perRow);
      const col = k % perRow;
      const x = g.left + 38 + col * (s + 2) + s / 2;
      const y = g.yAt(x) - 4 - row * (s + 1) - s / 2;
      slots.push({ x, y, s, index, out: avenueEmails[index].out, colour: itemColour(level, index), level: li, fee: !avenueEmails[index].out && isFee(index) });
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

function drawGirder(ctx: CanvasRenderingContext2D, level: AvLevel, li: number, n: number, t: number) {
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

function drawCrate(ctx: CanvasRenderingContext2D, s: Slot) {
  const h = s.s;
  ctx.fillStyle = s.colour;
  ctx.fillRect(s.x - h / 2, s.y - h / 2, h, h);
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(s.x - h / 2 + 0.5, s.y - h / 2 + 0.5, h - 1, h - 1);
  if (h >= 6) {
    // envelope flap
    ctx.beginPath();
    ctx.moveTo(s.x - h / 2 + 1, s.y - h / 2 + 1);
    ctx.lineTo(s.x, s.y);
    ctx.lineTo(s.x + h / 2 - 1, s.y - h / 2 + 1);
    ctx.stroke();
  }
}

function drawBarrel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = Math.max(1, r / 4);
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.75);
  ctx.lineTo(-r * 0.55, r * 0.75);
  ctx.moveTo(r * 0.55, -r * 0.75);
  ctx.lineTo(r * 0.55, r * 0.75);
  ctx.stroke();
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

function drawApe(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, throwing: boolean) {
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

function drawClimber(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, t: number, duck: boolean) {
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

export function AvenueGame({
  instId,
  onInstChange,
  onHit,
}: {
  instId: string;
  onInstChange: (id: string) => void;
  onHit: (hit: GameHit, inst: AvInstitution) => void;
}) {
  const inst = useMemo(() => institutions.find((i) => i.id === instId) ?? institutions[0], [instId]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ barrels: Barrel[]; slots: Slot[] }>({ barrels: [], slots: [] });
  const n = inst.levels.length;
  const H = TOP + n * LH + BOTTOM;
  const replies = useMemo(() => {
    const seen = new Set<number>();
    for (const level of inst.levels) for (const i of level.items) if (!avenueEmails[i].out) seen.add(i);
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
    const climber = { level: 0, x: startX(), y: 0, dir: girder(0, n).highRight ? 1 : -1, mode: "walk" as "walk" | "climb" | "rest" | "fade", t: 0, h: 0, vh: 0, duck: 0, alpha: 0 };

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
        st.barrels.push({ x: bx, y: g.yAt(bx) - 6, vx: 0, vy: 0, level: n - 1, index, rot: 0, falling: false, colour: outcomeInfo[avenueEmails[index].o].colour, fee: isFee(index) });
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
      climber.alpha = climber.mode === "fade" ? Math.max(0, climber.alpha - dt / 350) : Math.min(1, climber.alpha + dt / 350);
      if (climber.mode === "walk") {
        const atTop = climber.level >= front;
        const target = atTop ? (cg.highRight ? cg.right - 12 : cg.left + 12) : ladderX(climber.level, n) + 4;
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
          (b) => b.level === climber.level && !b.falling && (b.x - climber.x) * climber.dir > -4 && Math.abs(b.x - climber.x) < 24,
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
        const label = (li + 1).toString() + " " + (level.phase === "foi" && !level.applicable ? "FOI" : shortName(level));
        ctx.fillText(label, g.left + 2, g.yAt(g.left + 2) + 17);
      });
      for (const s of st.slots) {
        if (s.out) drawCrate(ctx, s);
        else drawBarrel(ctx, s.x, s.y, s.s / 2, s.colour, 0);
      }
      for (const s of st.slots) if (s.fee) drawFee(ctx, s.x, s.y, s.s / 2);
      for (const b of st.barrels) {
        drawBarrel(ctx, b.x, b.y, 6, b.colour, b.rot);
        if (b.fee) drawFee(ctx, b.x, b.y, 6);
      }
      const cy = climber.mode === "climb" ? climber.y : girder(climber.level, n).yAt(climber.x) - climber.h;
      ctx.save();
      ctx.globalAlpha = climber.alpha;
      drawClimber(ctx, climber.x, cy, climber.dir, climber.mode === "rest" ? 0 : now, climber.duck > 0);
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [inst, n, H, replies]);

  const handleTap = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const st = stateRef.current;
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
      <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-line">
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
