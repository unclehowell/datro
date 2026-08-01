import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface SceneProps {
  subject?: string;
  text?: string;
  subtitle?: string;
  colors?: string[];
  showTitle?: boolean;
  fontSize?: number;
  density?: number;
}

const DEFAULT_COLORS = ["#667eea", "#764ba2", "#f093fb"];

const THEME_PALETTES: Record<string, string[]> = {
  beach: ["#0077be", "#00c6ff", "#f5d79e"],
  ocean: ["#2193b0", "#6dd5ed", "#e0f7fa"],
  water: ["#2193b0", "#6dd5ed", "#e0f7fa"],
  sea: ["#2193b0", "#6dd5ed", "#e0f7fa"],
  sunset: ["#ff6b6b", "#ffa94d", "#5f27cd"],
  sunrise: ["#ff6b6b", "#ffa94d", "#5f27cd"],
  dawn: ["#ff6b6b", "#ffa94d", "#5f27cd"],
  night: ["#0f0c29", "#302b63", "#24243e"],
  moon: ["#232526", "#414345", "#c9d2d9"],
  space: ["#0f0c29", "#302b63", "#c850c0"],
  galaxy: ["#0f0c29", "#302b63", "#c850c0"],
  stars: ["#0f0c29", "#302b63", "#c850c0"],
  forest: ["#134e5e", "#71b280", "#0b3d2e"],
  nature: ["#134e5e", "#71b280", "#0b3d2e"],
  tree: ["#134e5e", "#71b280", "#0b3d2e"],
  jungle: ["#134e5e", "#71b280", "#0b3d2e"],
  mountain: ["#232526", "#414345", "#71b280"],
  fire: ["#f83600", "#f9d423", "#ff4e50"],
  flame: ["#f83600", "#f9d423", "#ff4e50"],
  lava: ["#f83600", "#f9d423", "#ff4e50"],
  snow: ["#e0eafc", "#cfdef3", "#ffffff"],
  winter: ["#e0eafc", "#cfdef3", "#ffffff"],
  ice: ["#e0eafc", "#cfdef3", "#ffffff"],
  sky: ["#4facfe", "#00f2fe"],
  cloud: ["#4facfe", "#00f2fe"],
  neon: ["#fc466b", "#3f5efb", "#00d2ff"],
  synthwave: ["#fc466b", "#3f5efb", "#00d2ff"],
  cyber: ["#fc466b", "#3f5efb", "#00d2ff"],
  desert: ["#fceabb", "#f8b500", "#d4a373"],
  sand: ["#fceabb", "#f8b500", "#d4a373"],
  city: ["#232526", "#414345", "#fc466b"],
  urban: ["#232526", "#414345", "#fc466b"],
  aurora: ["#00c9ff", "#92fe9d", "#7f00ff"],
  candy: ["#ff9a9e", "#fecfef", "#a18cd1"],
  gold: ["#f7971e", "#ffd200"],
  fruit: ["#ff9a9e", "#fad0c4"],
  garden: ["#43cea2", "#185a9d"],
  flower: ["#ff9a9e", "#fecfef"],
  blood: ["#6a3093", "#a044ff", "#e52d27"],
  dark: ["#0f0c29", "#302b63", "#24243e"],
  purple: ["#7f00ff", "#e100ff"],
  blue: ["#2193b0", "#6dd5ed"],
  green: ["#134e5e", "#71b280"],
  red: ["#f83600", "#f9d423"],
  orange: ["#f83600", "#ffa94d"],
  pink: ["#fc466b", "#fecfef"],
  rainbow: ["#ff9a9e", "#a18cd1", "#fecfef"],
};

const isValidHex = (c: unknown): c is string =>
  typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c);

function paletteFor(subject: string | undefined, colors?: string[]): string[] {
  if (Array.isArray(colors) && colors.filter(isValidHex).length >= 2) {
    return colors.filter(isValidHex).slice(0, 3);
  }
  const key = (subject || "").toLowerCase();
  for (const name of Object.keys(THEME_PALETTES)) {
    if (key.includes(name)) return THEME_PALETTES[name];
  }
  for (const word of key.split(/[\s,_-]+/)) {
    if (THEME_PALETTES[word]) return THEME_PALETTES[word];
  }
  return DEFAULT_COLORS;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  delay: number;
  color: string;
}

export const Scene: React.FC<SceneProps> = ({
  subject = "",
  text = "",
  subtitle = "",
  colors,
  showTitle = true,
  fontSize = 88,
  density = 40,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const palette = paletteFor(subject, colors);
  const color1 = palette[0] || DEFAULT_COLORS[0];
  const color2 = palette[1] || DEFAULT_COLORS[1];
  const color3 = palette[2] || DEFAULT_COLORS[2];

  const loop = frame % durationInFrames;
  const progress = loop / Math.max(durationInFrames - 1, 1);

  const angle = interpolate(loop, [0, durationInFrames], [135, 135 + 360 * 0.5]);
  const shift = 20 + Math.sin(progress * Math.PI * 2) * 12;

  const particles: Particle[] = Array.from({ length: density }, (_, i) => ({
    x: seededRandom(i * 7 + 1),
    y: seededRandom(i * 7 + 2),
    r: 2 + seededRandom(i * 7 + 3) * 6,
    speed: 0.02 + seededRandom(i * 7 + 4) * 0.06,
    drift: 0.5 + seededRandom(i * 7 + 5) * 2,
    delay: seededRandom(i * 7 + 6) * durationInFrames,
    color: palette[i % palette.length],
  }));

  const titleSpring = spring({ frame: loop, fps, config: { damping: 14 } });
  const subtitleSpring = spring({ frame: loop - 12, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${color1} ${shift}%, ${color2} ${50 + shift / 2}%, ${color3} 100%)`,
        overflow: "hidden",
      }}
    >
      {particles.map((p, i) => {
        const rise = (progress * width) / p.speed + p.delay * 0.1;
        const y = (height + 60) - ((rise + p.y * 40) % (height + 120));
        const x = p.x * width + Math.sin((loop + p.delay) * 0.01 * p.drift) * 60;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin((loop + p.delay) * 0.05));
        const scale = spring({
          frame: loop - p.delay % 20,
          fps,
          config: { damping: 10, mass: 0.4 },
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity: twinkle * 0.75,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${p.r * 3}px ${p.color}88`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {showTitle && (text || subject) && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ padding: "0 60px" }}>
            <div
              style={{
                fontSize,
                fontWeight: "bold",
                color: "#ffffff",
                fontFamily: "system-ui, sans-serif",
                textShadow: "0 4px 24px rgba(0,0,0,0.5)",
                transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px) scale(${interpolate(titleSpring, [0, 1], [0.9, 1])})`,
                opacity: titleSpring,
              }}
            >
              {text || subject}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: fontSize * 0.45,
                  color: "#ffffffcc",
                  fontFamily: "system-ui, sans-serif",
                  marginTop: 16,
                  textShadow: "0 3px 16px rgba(0,0,0,0.45)",
                  transform: `translateY(${interpolate(subtitleSpring, [0, 1], [24, 0])}px)`,
                  opacity: Math.max(0, subtitleSpring),
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const sceneComposition = {
  id: "Scene",
  component: Scene,
  durationInFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    subject: "beach",
    text: "",
    subtitle: "",
    showTitle: true,
    fontSize: 88,
    density: 40,
  },
};
