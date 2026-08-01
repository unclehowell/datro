import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface ShapesProps {
  shapeCount?: number;
  colors?: string[];
  backgroundColor?: string;
}

interface Shape {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  type: "circle" | "square" | "triangle";
  delay: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const Shapes: React.FC<ShapesProps> = ({
  shapeCount = 12,
  colors = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe"],
  backgroundColor = "#0a0a1a",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const shapes: Shape[] = Array.from({ length: shapeCount }, (_, i) => ({
    x: seededRandom(i * 3 + 1) * width,
    y: seededRandom(i * 3 + 2) * height,
    size: 40 + seededRandom(i * 3 + 3) * 80,
    color: colors[i % colors.length],
    rotation: seededRandom(i * 3 + 4) * 360,
    type: (["circle", "square", "triangle"] as const)[i % 3],
    delay: seededRandom(i * 3 + 5) * 20,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {shapes.map((shape, i) => {
        const s = spring({
          frame: frame - shape.delay,
          fps,
          config: { damping: 8, mass: 0.3 },
        });
        const rotation = shape.rotation + frame * (i % 2 === 0 ? 2 : -2);
        const float = Math.sin((frame + shape.delay) * 0.05) * 20;

        const getShapeStyle = (): React.CSSProperties => {
          const base: React.CSSProperties = {
            position: "absolute",
            left: shape.x - shape.size / 2,
            top: shape.y - shape.size / 2 + float,
            width: shape.size,
            height: shape.size,
            backgroundColor: shape.color,
            transform: `scale(${s}) rotate(${rotation}deg)`,
            opacity: 0.8,
          };

          if (shape.type === "circle") {
            return { ...base, borderRadius: "50%" };
          }
          if (shape.type === "triangle") {
            return {
              ...base,
              backgroundColor: "transparent",
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid ${shape.color}`,
            };
          }
          return { ...base, borderRadius: "8px" };
        };

        return <div key={i} style={getShapeStyle()} />;
      })}
    </AbsoluteFill>
  );
};

export const shapesComposition = {
  id: "Shapes",
  component: Shapes,
  durationInFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    shapeCount: 12,
    colors: ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe"],
    backgroundColor: "#0a0a1a",
  },
};
