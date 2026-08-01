import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface SvgCharacterProps {
  character?: string;
  action?: string;
  palette?: string[];
  motion?: string;
}

const DEFAULT_PALETTE = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"];

const luminance = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const getPalette = (palette?: string[]): string[] => {
  if (Array.isArray(palette) && palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).length >= 2) {
    const valid = palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 4);
    const avgLum = valid.reduce((sum, c) => sum + luminance(c), 0) / valid.length;
    if (avgLum >= 120) return valid;
  }
  return DEFAULT_PALETTE;
};

const getMotionParams = (motion?: string) => {
  const m = motion || "lively";
  const configs: Record<string, { amplitude: number; frequency: number; damping: number }> = {
    calm: { amplitude: 0.3, frequency: 1.5, damping: 200 },
    lively: { amplitude: 0.8, frequency: 3, damping: 180 },
    energetic: { amplitude: 1.2, frequency: 4, damping: 150 },
    slow: { amplitude: 0.2, frequency: 0.8, damping: 250 },
    intense: { amplitude: 1.5, frequency: 5, damping: 120 },
    gentle: { amplitude: 0.4, frequency: 2, damping: 200 },
  };
  return configs[m] || configs.lively;
};

export const SvgCharacter: React.FC<SvgCharacterProps> = ({
  character = "cat",
  action = "groovy sway",
  palette,
  motion = "lively",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const colors = getPalette(palette);
  const mp = getMotionParams(motion);

  const beat = frame % 48;
  const progress = beat / 48;
  const sway = interpolate(
    beat,
    [0, 12, 24, 36, 48],
    [0, mp.amplitude, 0, -mp.amplitude, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const bounce = spring({ frame: beat, fps, config: { damping: mp.damping, mass: 0.5, stiffness: 200 } });
  const headTilt = interpolate(beat, [0, 24], [-0.1, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const earWiggle = interpolate(beat, [0, 12, 24, 36, 48], [0, 0.2, 0, -0.2, 0]);
  const tailSwing = interpolate(beat, [0, 24], [0.3, -0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const legKick = Math.abs(interpolate(beat, [0, 12, 24, 36, 48], [0, 0.4, 0, -0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const isCat = character === "cat" || character === "dog" || character === "robot" || character === "bird" || character === "alien" || character === "person";

  return (
    <g transform={`translate(${width / 2}, ${height / 2 + 40}) translate(0, ${sway * 30})`}>
      {/* Body */}
      <ellipse cx="0" cy="0" rx="40" ry="50" fill={colors[0]} transform={`rotate(${sway * 15}, 0, 0)`} />

      {/* Head */}
      <g transform={`translate(0, -55) rotate(${headTilt * 10})`}>
        <circle cx="0" cy="0" r="25" fill={colors[1]} />
        {/* Eyes */}
        <ellipse cx="-8" cy="-5" rx="4" ry="5" fill="#ffffff" />
        <ellipse cx="8" cy="-5" rx="4" ry="5" fill="#ffffff" />
        <circle cx="-7" cy="-5" r="2" fill="#1a1a2e" />
        <circle cx="9" cy="-5" r="2" fill="#1a1a2e" />
        {/* Mouth */}
        <path d="M-5,8 Q0,12 5,8" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
      </g>

      {/* Ears */}
      {character === "cat" && (
        <g transform={`translate(-15, -65) rotate(${earWiggle * 20})`}>
          <polygon points="-8,-20 0,0 8,-20" fill={colors[1]} />
          <polygon points="-5,-15 0,-5 5,-15" fill="#ffb3b3" />
        </g>
      )}
      {character === "cat" && (
        <g transform={`translate(15, -65) rotate(${-earWiggle * 20})`}>
          <polygon points="-8,-20 0,0 8,-20" fill={colors[1]} />
          <polygon points="-5,-15 0,-5 5,-15" fill="#ffb3b3" />
        </g>
      )}

      {/* Hat accessory when requested */}
      {(action.match(/\b(hat|top hat|beanie|cap)\b/i)) && (
        <g transform={`translate(0, -78) rotate(${headTilt * 10})`}>
          <ellipse cx="0" cy="6" rx="24" ry="6" fill="#1a1a2e" />
          <rect x="-16" y="-22" width="32" height="24" rx="2" fill="#1a1a2e" />
          <rect x="-17" y="4" width="34" height="4" fill="#c0392b" />
        </g>
      )}

      {/* Tail */}
      <path
        d={`M35,10 Q${60 + tailSwing * 40},${-10 + Math.sin(progress * Math.PI * 2) * 20},${50 + tailSwing * 30},${-30 + Math.cos(progress * Math.PI * 2) * 15}`}
        stroke={colors[2]}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Legs */}
      <rect x="-25" y="40" width="8" height={20 + legKick * 10} rx="3" fill={colors[0]} />
      <rect x="17" y="40" width="8" height={20 - legKick * 5} rx="3" fill={colors[0]} />

      {/* Arms/Paws */}
      <g transform={`translate(-35, -10) rotate(${sway * 20})`}>
        <ellipse cx="0" cy="0" rx="6" ry="12" fill={colors[1]} />
      </g>
      <g transform={`translate(35, -10) rotate(${-sway * 20})`}>
        <ellipse cx="0" cy="0" rx="6" ry="12" fill={colors[1]} />
      </g>
    </g>
  );
};
