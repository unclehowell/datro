import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface SceneRigProps {
  background?: string;
  palette?: string[];
  motion?: string;
  character?: string;
}

const DEFAULT_PALETTE = ["#ff6b6b", "#ffd93d", "#6bcb77"];

const getPalette = (palette?: string[]): string[] => {
  if (Array.isArray(palette) && palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).length >= 2) {
    return palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 3);
  }
  return DEFAULT_PALETTE;
};

const getMotionParams = (motion?: string) => {
  const m = motion || "lively";
  const configs: Record<string, { speed: number; amplitude: number }> = {
    calm: { speed: 0.5, amplitude: 0.3 },
    lively: { speed: 2, amplitude: 0.8 },
    energetic: { speed: 3, amplitude: 1.0 },
    slow: { speed: 0.3, amplitude: 0.2 },
    intense: { speed: 4, amplitude: 1.2 },
    gentle: { speed: 1, amplitude: 0.4 },
  };
  return configs[m] || configs.lively;
};

export const SceneRig: React.FC<SceneRigProps> = ({
  background = "disco floor",
  palette,
  motion = "lively",
  character = "cat",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const colors = getPalette(palette);
  const mp = getMotionParams(motion);
  const beat = frame % 48;
  const progress = beat / 48;

  const bgColors = {
    disco: [`linear-gradient(135deg, ${colors[0]}33, ${colors[1]}33, ${colors[2]}33)`, colors[0], colors[1]],
    nature: [`linear-gradient(180deg, #87CEEB 0%, #90EE90 40%, #228B22 100%)`, "#87CEEB", "#228B22"],
    city: [`linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #232526 100%)`, "#0f0c29", "#fc466b"],
    space: [`linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #c850c0 100%)`, "#0f0c29", "#c850c0"],
    fire: [`linear-gradient(180deg, #1a0000 0%, #f83600 40%, #f9d423 100%)`, "#f83600", "#f9d423"],
    snow: [`linear-gradient(180deg, #e0eafc 0%, #cfdef3 50%, #ffffff 100%)`, "#e0eafc", "#ffffff"],
  };

  const [bgGradient, accent1, accent2] = bgColors[background as keyof typeof bgColors] || bgColors.disco;

  const spotlightX = interpolate(beat, [0, 24], [width * 0.3, width * 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spotlightOpacity = 0.3 + 0.3 * Math.sin(progress * Math.PI * 2);

  return (
    <g>
      {/* Background */}
      <rect width={width} height={height} fill={bgGradient} />

      {/* Spotlight */}
      <circle cx={spotlightX} cy={height * 0.4} r={120} fill={accent1} opacity={spotlightOpacity} />

      {/* Ground */}
      <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill={accent2} opacity={0.3} />

      {/* Decorative elements based on background type */}
      {background === "disco" && (
        <>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
            const rx = 200 + Math.sin(angle) * 100;
            const ry = 150 + Math.cos(angle) * 80;
            return (
              <circle
                key={i}
                cx={width / 2 + rx * Math.cos(angle)}
                cy={height * 0.4 + ry * Math.sin(angle)}
                r={4}
                fill={colors[i % colors.length]}
                opacity={0.6}
              />
            );
          })}
        </>
      )}

      {background === "nature" && (
        <>
          {/* Sun */}
          <circle cx={width * 0.8} cy={height * 0.2} r={40} fill={colors[1]} opacity={0.8} />
          {/* Clouds */}
          {[0.2, 0.5, 0.8].map((x, i) => (
            <g key={i} transform={`translate(${width * x}, ${height * 0.15 + i * 30})`}>
              <ellipse cx="0" cy="0" rx="30" ry="12" fill="#ffffff" opacity={0.7} />
              <ellipse cx="20" cy="-5" rx="20" ry="10" fill="#ffffff" opacity={0.6} />
            </g>
          ))}
        </>
      )}

      {background === "city" && (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const x = (i / 12) * width;
            const bh = 40 + (i * 7) % 80;
            return (
              <rect key={i} x={x + 2} y={height * 0.75 - bh} width={width / 12 - 4} height={bh} fill="#1a1a2e" opacity={0.8} />
            );
          })}
          {/* Neon signs */}
          <rect x={width * 0.3} y={height * 0.5} width={60} height={20} fill={colors[0]} opacity={0.9} />
          <rect x={width * 0.6} y={height * 0.45} width={50} height={18} fill={colors[1]} opacity={0.9} />
        </>
      )}

      {background === "space" && (
        <>
          {Array.from({ length: 30 }, (_, i) => {
            const sx = (i * 137.5) % width;
            const sy = (i * 97.3) % (height * 0.6);
            const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.02 + i));
            return (
              <circle key={i} cx={sx} cy={sy} r={1 + (i % 3)} fill="#ffffff" opacity={twinkle} />
            );
          })}
          {/* Planet */}
          <circle cx={width * 0.75} cy={height * 0.3} r={35} fill={colors[2]} opacity={0.6} />
        </>
      )}

      {background === "fire" && (
        <>
          {Array.from({ length: 15 }, (_, i) => {
            const fx = width * 0.5 + Math.sin(progress * Math.PI * 2 + i * 0.5) * (80 + i * 5);
            const fy = height * 0.7 - i * 3;
            const fh = 20 + i * 4;
            return (
              <ellipse key={i} cx={fx} cy={fy} rx={8 + i * 0.5} ry={fh} fill={colors[i % colors.length]} opacity={0.5} />
            );
          })}
        </>
      )}

      {background === "snow" && (
        <>
          {Array.from({ length: 20 }, (_, i) => {
            const sx = (i * 67.3 + frame * 0.3) % width;
            const sy = (i * 43.7 + frame * 0.8) % height;
            return (
              <circle key={i} cx={sx} cy={sy} r={1.5 + (i % 3)} fill="#ffffff" opacity={0.8} />
            );
          })}
        </>
      )}
    </g>
  );
};
